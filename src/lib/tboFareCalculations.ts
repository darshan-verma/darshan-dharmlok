import type { Fare } from "@/types/tbo";

/**
 * Calculates the Published Fare according to TBO's formula:
 * Published Fare = BaseFare + Tax + OtherCharges + ServiceFee + AdditionalTxnFeePub + AirlineTransFee + GST + TDS + Agency Markup
 */
export function calculatePublishedFare(
	fare: Fare,
	agencyMarkup: number = 0
): number {
	const gstAmount =
		(fare.IGSTAmount || 0) +
		(fare.CGSTAmount || 0) +
		(fare.SGSTAmount || 0) +
		(fare.CessAmount || 0);
	const tdsAmount = fare.TdsOnCommission + fare.TdsOnPLB + fare.TdsOnIncentive;

	return (
		fare.BaseFare +
		fare.Tax +
		fare.OtherCharges +
		fare.ServiceFee +
		fare.AdditionalTxnFeePub +
		(fare.AirlineTransFee || 0) +
		gstAmount +
		tdsAmount +
		agencyMarkup
	);
}

/**
 * Calculates the Offered Fare according to TBO's formula:
 * Offered Fare = Published Fare - Commission Earned (Commission + PLB + Incentive) - Agency Markup
 *
 * Note: TDS is already included in Published Fare and should NOT be deducted separately.
 * TDS is not part of offered fare in search response - it's only visible in the breakdown.
 */
export function calculateOfferedFare(
	fare: Fare,
	agencyMarkup: number = 0
): number {
	const publishedFare = calculatePublishedFare(fare, agencyMarkup);
	const commissionTotal =
		fare.CommissionEarned + fare.PLBEarned + fare.IncentiveEarned;

	return publishedFare - commissionTotal - agencyMarkup;
}

/**
 * Calculates the Net Payable according to TBO's formula:
 * Net Payable = Published Fare - (CommissionEarned + IncentiveEarned + PLBEarned + AdditionalTxnFee) + (TdsOnCommission + TdsOnIncentive + TdsOnPLB) + GST(IGSTAmount+CGSTAmount+SGSTAmount+CessAmount)
 *
 * Note: We use the API's Published Fare as the base here because Net Payable is what we pay to TBO.
 * AdditionalTxnFee refers to the earned fee (AdditionalTxnFeeOfrd), not the published fee.
 */
export function calculateNetPayable(fare: Fare): number {
	const commissionTotal =
		fare.CommissionEarned + fare.IncentiveEarned + fare.PLBEarned;
	const tdsTotal = fare.TdsOnCommission + fare.TdsOnIncentive + fare.TdsOnPLB;
	const gstTotal =
		(fare.IGSTAmount || 0) +
		(fare.CGSTAmount || 0) +
		(fare.SGSTAmount || 0) +
		(fare.CessAmount || 0);

	return (
		fare.PublishedFare -
		commissionTotal -
		fare.AdditionalTxnFeeOfrd +
		tdsTotal +
		gstTotal
	);
}

/**
 * Validates if the API-provided values match our calculations
 */
export function validateFareCalculations(
	fare: Fare,
	agencyMarkup: number = 0
): {
	isValid: boolean;
	issues: string[];
	calculatedValues: {
		publishedFare: number;
		offeredFare: number;
		netPayable: number;
	};
} {
	const issues: string[] = [];
	const calculatedPublishedFare = calculatePublishedFare(fare, agencyMarkup);
	const calculatedOfferedFare = calculateOfferedFare(fare, agencyMarkup);
	const calculatedNetPayable = calculateNetPayable(fare);
	const tdsAmount = fare.TdsOnCommission + fare.TdsOnPLB + fare.TdsOnIncentive;

	// Validate Published Fare
	// Note: API Published Fare usually excludes TDS, while our formula includes it.
	// So we check if the difference is exactly TDS.
	const publishedFareDiff = Math.abs(
		fare.PublishedFare - calculatedPublishedFare
	);

	// If API fare is significantly higher (e.g. round trip mismatch), we accept it as valid
	// because we handle it in getFareBreakdown by adding to "Other Charges"
	const isPublishedFareMismatch =
		publishedFareDiff > 1 &&
		Math.abs(publishedFareDiff - tdsAmount) > 1 &&
		fare.PublishedFare < calculatedPublishedFare; // Only flag if API is LOWER than calculated (undercharging)

	if (isPublishedFareMismatch) {
		issues.push(
			`Published Fare mismatch: API=${
				fare.PublishedFare
			}, Calculated=${calculatedPublishedFare} (Diff=${publishedFareDiff.toFixed(
				2
			)}, TDS=${tdsAmount.toFixed(2)})`
		);
	}

	// Validate Offered Fare
	// If API Offered Fare is higher than calculated, it's usually due to the same hidden charges
	const offeredFareDiff = fare.OfferedFare - calculatedOfferedFare;
	if (Math.abs(offeredFareDiff) > 1 && offeredFareDiff < 0) {
		// Only flag if API is LOWER (undercharging)
		issues.push(
			`Offered Fare mismatch: API=${fare.OfferedFare}, Calculated=${calculatedOfferedFare}`
		);
	}

	return {
		isValid: issues.length === 0,
		issues,
		calculatedValues: {
			publishedFare: calculatedPublishedFare,
			offeredFare: calculatedOfferedFare,
			netPayable: calculatedNetPayable,
		},
	};
}

/**
 * Gets a detailed fare breakdown for display
 */
export function getFareBreakdown(fare: Fare, agencyMarkup: number = 0) {
	const gstBreakdown = {
		IGST: fare.IGSTAmount || 0,
		CGST: fare.CGSTAmount || 0,
		SGST: fare.SGSTAmount || 0,
		Cess: fare.CessAmount || 0,
		total:
			(fare.IGSTAmount || 0) +
			(fare.CGSTAmount || 0) +
			(fare.SGSTAmount || 0) +
			(fare.CessAmount || 0),
	};

	const commissionBreakdown = {
		commission: fare.CommissionEarned,
		plb: fare.PLBEarned,
		incentive: fare.IncentiveEarned,
		total: fare.CommissionEarned + fare.PLBEarned + fare.IncentiveEarned,
	};

	const tdsBreakdown = {
		onCommission: fare.TdsOnCommission,
		onPLB: fare.TdsOnPLB,
		onIncentive: fare.TdsOnIncentive,
		total: fare.TdsOnCommission + fare.TdsOnPLB + fare.TdsOnIncentive,
	};

	const feesBreakdown = {
		serviceFee: fare.ServiceFee,
		additionalTxnFeePub: fare.AdditionalTxnFeePub,
		additionalTxnFeeOfrd: fare.AdditionalTxnFeeOfrd,
		airlineTransFee: fare.AirlineTransFee || 0,
		pgCharge: fare.PGCharge,
		total:
			fare.ServiceFee +
			fare.AdditionalTxnFeePub +
			fare.AdditionalTxnFeeOfrd +
			(fare.AirlineTransFee || 0) +
			fare.PGCharge,
	};

	// We use the calculated Published Fare as the "Agency Published Fare"
	let calculatedPublishedFare = calculatePublishedFare(fare, agencyMarkup);
	let otherCharges = fare.OtherCharges;

	// If API Published Fare is significantly higher than calculated, it means there are hidden charges
	// (common in round-trip LCC fares where breakdown is partial but total is full)
	if (fare.PublishedFare > calculatedPublishedFare + 100) {
		const difference = fare.PublishedFare - calculatedPublishedFare;
		otherCharges += difference;
		calculatedPublishedFare = fare.PublishedFare;
	}

	const calculatedOfferedFare = calculateOfferedFare(fare, agencyMarkup);

	return {
		baseFare: fare.BaseFare,
		tax: fare.Tax,
		yqTax: fare.YQTax,
		otherCharges: otherCharges,
		gst: gstBreakdown,
		commission: commissionBreakdown,
		tds: tdsBreakdown,
		fees: feesBreakdown,
		discount: fare.Discount,
		agencyMarkup,
		publishedFare: calculatedPublishedFare, // Use adjusted value
		apiPublishedFare: fare.PublishedFare, // Keep API value for reference
		offeredFare: calculatedOfferedFare, // Use calculated value for consistency
		apiOfferedFare: fare.OfferedFare, // Keep API value for reference
		netPayable: calculateNetPayable(fare),
	};
}
