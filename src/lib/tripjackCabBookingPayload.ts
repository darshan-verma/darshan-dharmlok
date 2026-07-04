import type {
	TripjackBookingRequest,
	TripjackFareBreakup,
	TripjackJourneyInfo,
	TripjackPassengerDetail,
	TripjackQuoteItem,
	TripjackQuotesGroup,
	TripjackRouteDetails,
} from "@/types/tripjack";

/** Mirrors `scripts/tripjack-cabs-uat-client.mjs` fare + booking assembly. */
export interface ComputedCabFare {
	netAmount: number;
	taxes: number;
	tjManagementFee: number;
	grossAmount: number;
}

function formatMoney(value: number): string {
	if (!Number.isFinite(value)) return "0.00";
	return value.toFixed(2);
}

export function computeCabFareFromBreakup(
	fareBreakup: TripjackFareBreakup,
): ComputedCabFare {
	const onward = Number(fareBreakup.onwardFare) || 0;
	const backward = Number(fareBreakup.backwardFare) || 0;
	const netAmount =
		onward > 0 || backward > 0
			? onward + backward
			: Number(fareBreakup.totalFare) || 0;

	const onwardTax = Number(fareBreakup.onwardTax) || 0;
	const backwardTax = Number(fareBreakup.backwardTax) || 0;
	const taxes =
		onwardTax > 0 || backwardTax > 0
			? onwardTax + backwardTax
			: Number(fareBreakup.totalTax) || 0;

	const mf = Number(fareBreakup.tjManagementFee);
	const tjManagementFee = Number.isFinite(mf) && mf > 0 ? mf : 0;

	return {
		netAmount,
		taxes,
		tjManagementFee,
		grossAmount: netAmount + taxes,
	};
}

/** Search passenger count wins (UAT uses travellers from each case). */
export function resolveCabPaxCount(
	passengers: number,
	quote: TripjackQuoteItem,
	group: TripjackQuotesGroup,
): number {
	if (passengers > 0) return passengers;
	if (typeof quote.paxCount === "number" && quote.paxCount > 0) {
		return quote.paxCount;
	}
	const parsed = Number(group.paxCapacity || "1");
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function resolveCabLuggageCount(
	passengers: number,
	quote: TripjackQuoteItem,
	group: TripjackQuotesGroup,
): number {
	if (typeof quote.luggageCount === "number") {
		return quote.luggageCount;
	}
	const fromGroup = Number(group.luggageCapacity);
	if (Number.isFinite(fromGroup) && fromGroup > 0) {
		return fromGroup;
	}
	return passengers > 0 ? passengers : 1;
}

export interface BuildCabBookingPayloadInput {
	journeyInfo: TripjackJourneyInfo;
	routeDetail: TripjackRouteDetails;
	group: TripjackQuotesGroup;
	quote: TripjackQuoteItem;
	passengers: number;
	passengerDetail: TripjackPassengerDetail;
	agentEmail: string;
	agentPhone: string;
	agentId: number | string;
	serviceRequest?: string;
}

export function buildTripjackCabBookingPayload(
	input: BuildCabBookingPayloadInput,
): TripjackBookingRequest {
	const { netAmount, taxes, tjManagementFee, grossAmount } =
		computeCabFareFromBreakup(input.quote.fareBreakup);
	const paxCount = resolveCabPaxCount(
		input.passengers,
		input.quote,
		input.group,
	);
	const luggageCount = resolveCabLuggageCount(
		input.passengers,
		input.quote,
		input.group,
	);

	return {
		journeyInfo: input.journeyInfo,
		routeDetail: input.routeDetail,
		addons: [],
		quotationInfo: {
			vehicleType: input.group.vehicleType,
			vehicleCategory: input.group.vehicleCategory,
			quoteId: input.quote.quotationId,
			childQuoteId: input.quote.quoteChildId,
			paxCount,
			luggageCount,
			vendorId: input.quote.vendorId,
		},
		pricingInfo: {
			netAmount: formatMoney(netAmount),
			addonsPrice: "0.00",
			tjTaxAmount: formatMoney(taxes),
			tjManagementFee: formatMoney(tjManagementFee),
			agentMarkup: 0,
			agentMarkupSplitup: {
				onwardJourneyMarkup: 0,
				returnJourneyMarkup: 0,
			},
			grossAmount: formatMoney(grossAmount),
		},
		passengerDetail: input.passengerDetail,
		serviceRequest: input.serviceRequest,
		consent: "yes",
		agentEmail: input.agentEmail,
		agentPhone: input.agentPhone,
		agentId: input.agentId,
		vendorId: input.quote.vendorId,
	};
}
