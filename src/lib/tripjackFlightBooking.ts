import type { Fare, FlightResult, FlightSegmentDetail } from "@/types/tbo";
import { calculateNetPayable } from "@/lib/tboFareCalculations";
import { aggregateFareFromFd } from "@/lib/tripjackFlightSearch";
import type {
	TripjackBookResponse,
	TripjackBookingDetailResponse,
	TripjackReviewResponse,
	TripjackSegmentInfo,
	TripjackTripInfo,
	TripjackTripInfos,
} from "@/types/tripjackFlight";

const ERROR_MESSAGE_MAP: Record<string, string> = {
	"1015": "Total amount mismatched with supplier fare.",
	"1059": "Hold time limit expired. Please re-review and book again.",
	"1071": "Fare is no longer available. Please re-search.",
	"1087": "Hold booking is not allowed for this itinerary.",
	"1090": "Passport nationality is required for one or more travellers.",
	"2024": "Session expired. Please start again from search.",
	"2501": "Invalid booking id.",
};

function firstErrorMessage(
	errors?: Array<{ code?: string; message?: string }>,
): string | null {
	if (!errors?.length) return null;
	const e = errors[0];
	if (e?.code && ERROR_MESSAGE_MAP[e.code]) return ERROR_MESSAGE_MAP[e.code];
	return e?.message || null;
}

function mapSeg(
	seg: TripjackSegmentInfo,
	index: number,
	tripIndicator: number = 1,
): FlightSegmentDetail {
	const depIso = new Date(seg.dt).toISOString();
	const arrIso = new Date(seg.at).toISOString();
	return {
		TripIndicator: tripIndicator,
		SegmentIndicator: index + 1,
		Airline: {
			AirlineCode: seg.fD?.aI?.code || "",
			AirlineName: seg.fD?.aI?.name || "",
			FlightNumber: String(seg.fD?.fN ?? ""),
			FareClass: "",
			OperatingCarrier: seg.fD?.aI?.code || "",
		},
		Origin: {
			Airport: {
				AirportCode: seg.da?.code || "",
				AirportName: seg.da?.name || "",
				Terminal: seg.da?.terminal || "",
				CityCode: seg.da?.cityCode || seg.da?.code || "",
				CityName: seg.da?.city || "",
				CountryCode: seg.da?.countryCode || "",
				CountryName: seg.da?.country || "",
			},
			DepTime: depIso,
		},
		Destination: {
			Airport: {
				AirportCode: seg.aa?.code || "",
				AirportName: seg.aa?.name || "",
				Terminal: seg.aa?.terminal || "",
				CityCode: seg.aa?.cityCode || seg.aa?.code || "",
				CityName: seg.aa?.city || "",
				CountryCode: seg.aa?.countryCode || "",
				CountryName: seg.aa?.country || "",
			},
			ArrTime: arrIso,
		},
		Duration: seg.duration ?? 0,
		GroundTime: 0,
		Mile: 0,
		StopOver: (seg.stops ?? 0) > 0,
		DepartureTime: seg.dt,
		ArrivalTime: seg.at,
		FlightStatus: "",
		StopPoint: "",
		StopPointArrivalTime: "",
		StopPointDepartureTime: "",
		Craft: seg.fD?.eT || "",
		Remark: null,
		IsETicketEligible: true,
		FlightInfoIndex: seg.id || String(index),
		AirlineRemark: "",
		Status: "",
	};
}

function isTripjackTripInfoLeg(x: unknown): x is TripjackTripInfo {
	return (
		typeof x === "object" &&
		x !== null &&
		Array.isArray((x as TripjackTripInfo).sI) &&
		(x as TripjackTripInfo).sI!.length > 0
	);
}

/**
 * TripJack `/fms/v1/review` returns `tripInfos` as an array of legs (onward, return, …).
 * Search (`air-search-all`) uses `{ ONWARD, RETURN, COMBO }` with alternate itineraries.
 */
export function legsFromTripjackReviewTripInfos(
	tripInfos: TripjackReviewResponse["tripInfos"],
): TripjackTripInfo[] {
	if (!tripInfos) return [];
	if (Array.isArray(tripInfos)) {
		return tripInfos.filter(isTripjackTripInfoLeg);
	}
	const obj = tripInfos as TripjackTripInfos;
	const legs: TripjackTripInfo[] = [];
	if (obj.ONWARD?.[0] && isTripjackTripInfoLeg(obj.ONWARD[0])) legs.push(obj.ONWARD[0]);
	if (obj.RETURN?.[0] && isTripjackTripInfoLeg(obj.RETURN[0])) legs.push(obj.RETURN[0]);
	if (!legs.length && obj.COMBO?.length) {
		for (const t of obj.COMBO) {
			if (isTripjackTripInfoLeg(t)) legs.push(t);
		}
	}
	return legs;
}

function fareFromReviewTotalPrice(review: TripjackReviewResponse): Fare | null {
	const fc = review.totalPriceInfo?.totalFareDetail?.fc;
	if (!fc || (fc.TF == null && fc.NF == null && fc.BF == null)) return null;
	const tf = fc.TF ?? fc.NF ?? 0;
	const bf = fc.BF ?? 0;
	const taf = fc.TAF ?? 0;
	return {
		Currency: "INR",
		BaseFare: bf,
		Tax: taf,
		TaxBreakup: [],
		YQTax: 0,
		AdditionalTxnFeeOfrd: 0,
		AdditionalTxnFeePub: 0,
		PGCharge: 0,
		OtherCharges: 0,
		ChargeBU: [],
		Discount: 0,
		PublishedFare: tf,
		CommissionEarned: 0,
		PLBEarned: 0,
		IncentiveEarned: 0,
		OfferedFare: tf,
		TdsOnCommission: 0,
		TdsOnPLB: 0,
		TdsOnIncentive: 0,
		ServiceFee: 0,
		TotalBaggageCharges: 0,
		TotalMealCharges: 0,
		TotalSeatCharges: 0,
		TotalSpecialServiceCharges: 0,
		NetPayable: tf,
	};
}

function fareTboShapeFromAggregates(agg: {
	baseFare: number;
	tax: number;
	publishedFare: number;
	commission: number;
	tds: number;
	taxBreakup: Array<{ key: string; value: number }>;
}): Fare {
	const fare: Fare = {
		Currency: "INR",
		BaseFare: agg.baseFare,
		Tax: agg.tax,
		TaxBreakup: agg.taxBreakup,
		YQTax: 0,
		AdditionalTxnFeeOfrd: 0,
		AdditionalTxnFeePub: 0,
		PGCharge: 0,
		OtherCharges: 0,
		ChargeBU: [],
		Discount: 0,
		PublishedFare: agg.publishedFare,
		CommissionEarned: agg.commission,
		PLBEarned: 0,
		IncentiveEarned: 0,
		OfferedFare: agg.publishedFare,
		TdsOnCommission: agg.tds,
		TdsOnPLB: 0,
		TdsOnIncentive: 0,
		ServiceFee: 0,
		TotalBaggageCharges: 0,
		TotalMealCharges: 0,
		TotalSeatCharges: 0,
		TotalSpecialServiceCharges: 0,
		NetPayable: 0,
	};
	fare.NetPayable = calculateNetPayable(fare);
	return fare;
}

/**
 * Build fare like round-trip search: sum each leg's selected `totalPriceList` row using pax counts.
 * Matches `FlightSearch` combined PublishedFare for TripJack.
 */
function fareFromReviewLegs(
	legs: TripjackTripInfo[],
	priceIds: string[],
	adults: number,
	children: number,
	infants: number,
): Fare | null {
	if (!legs.length) return null;

	let baseFare = 0;
	let tax = 0;
	let publishedFare = 0;
	let commission = 0;
	let tds = 0;
	const taxBreakup: Array<{ key: string; value: number }> = [];

	for (let i = 0; i < legs.length; i++) {
		const leg = legs[i];
		const wantId = priceIds[i]?.trim();
		const pls = leg.totalPriceList;
		if (!pls?.length) return null;

		const pl =
			wantId && pls.some((p) => p.id === wantId)
				? pls.find((p) => p.id === wantId)!
				: pls[0];
		if (!pl?.fd) return null;

		const agg = aggregateFareFromFd(pl.fd, adults, children, infants);
		baseFare += agg.baseFare;
		tax += agg.tax;
		publishedFare += agg.publishedFare;
		commission += agg.commission;
		tds += agg.tds;
		taxBreakup.push(...agg.taxBreakup);
	}

	return fareTboShapeFromAggregates({
		baseFare,
		tax,
		publishedFare,
		commission,
		tds,
		taxBreakup,
	});
}

function fareFallbackFirstLegWithPax(
	trip: TripjackTripInfo,
	adults: number,
	children: number,
	infants: number,
): Fare | null {
	const pl = trip.totalPriceList?.[0];
	if (!pl?.fd) return null;
	const agg = aggregateFareFromFd(pl.fd, adults, children, infants);
	return fareTboShapeFromAggregates(agg);
}

export type ExtractTripjackReviewFlightOptions = {
	returnPriceId?: string;
	adultCount?: number;
	childCount?: number;
	infantCount?: number;
};

export function extractTripjackReviewFlight(
	review: TripjackReviewResponse,
	priceIdFallback?: string,
	options?: ExtractTripjackReviewFlightOptions,
): FlightResult | null {
	const legs = legsFromTripjackReviewTripInfos(review.tripInfos);
	if (!legs.length) return null;
	const firstSegs = legs[0].sI;
	if (!firstSegs?.length) return null;
	const firstSeg = firstSegs[0];

	const segmentGroups = legs.map((leg, legIdx) =>
		(leg.sI || []).map((s, i) => mapSeg(s, i, legIdx + 1)),
	);

	const adults = options?.adultCount ?? 1;
	const children = options?.childCount ?? 0;
	const infants = options?.infantCount ?? 0;

	const priceIdsForLegs = legs.map((_, i) => {
		if (i === 0) return priceIdFallback?.trim() || "";
		return options?.returnPriceId?.trim() || "";
	});

	const fromLegs = fareFromReviewLegs(
		legs,
		priceIdsForLegs,
		adults,
		children,
		infants,
	);
	const fromTotal = fareFromReviewTotalPrice(review);
	const fromFallback = fareFallbackFirstLegWithPax(legs[0], adults, children, infants);
	// Per-leg + pax aggregation matches `FlightSearch` (esp. round-trip sum). Fallback to supplier total, then first leg.
	const fare = fromLegs ?? fromTotal ?? fromFallback;

	if (!fare) return null;

	const resultIndex =
		priceIdFallback?.trim() ||
		legs[0].totalPriceList?.[0]?.id ||
		legs.find((l) => l.totalPriceList?.[0]?.id)?.totalPriceList?.[0]?.id ||
		"";

	const firstPl = legs[0].totalPriceList?.[0];
	return {
		ResultIndex: resultIndex,
		Source: 3,
		IsLCC: firstSeg.fD?.aI?.isLcc === true,
		IsRefundable: true,
		IsUpsellAllowed: false,
		AirlineCode: firstSeg.fD?.aI?.code || "",
		ValidatingAirlineCode: firstSeg.fD?.aI?.code || "",
		ValidatingAirline: firstSeg.fD?.aI?.name || "",
		AirlineRemark: firstPl?.fareIdentifier || "",
		ApiSource: "TRIPJACK",
		Fare: fare,
		FareBreakdown: [],
		Segments: segmentGroups,
	};
}

export function resolveTripjackBookError(response: TripjackBookResponse): string | null {
	return firstErrorMessage(response.errors) || null;
}

export function extractTripjackPnrFromBookingDetail(
	details: TripjackBookingDetailResponse,
): string | undefined {
	const travellerSource = details.itemInfos?.AIR?.travellerInfos ?? details.travellerInfos ?? [];
	for (const t of travellerSource) {
		if (!t?.pnrDetails) continue;
		const pnr = Object.values(t.pnrDetails).find((x) => typeof x === "string" && x.trim());
		if (typeof pnr === "string") return pnr;
	}
	return undefined;
}

export function extractTripjackTicketNumbers(
	details: TripjackBookingDetailResponse,
): Record<string, string> {
	const result: Record<string, string> = {};
	const travellerSource = details.itemInfos?.AIR?.travellerInfos ?? details.travellerInfos ?? [];
	for (const t of travellerSource) {
		if (!t?.ticketNumberDetails) continue;
		const name = [t.fN, t.lN].filter(Boolean).join(" ");
		for (const [, ticketNo] of Object.entries(t.ticketNumberDetails)) {
			if (typeof ticketNo === "string" && ticketNo.trim()) {
				result[name || ticketNo] = ticketNo;
			}
		}
	}
	return result;
}

