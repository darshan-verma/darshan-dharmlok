import type { FareQuoteResponse, FlightResult, FlightSegment } from "@/types/tbo";

/** TBO FlightCabinClass: 1=All, 2=Economy, 3=PremiumEconomy, 4=Business, 5=PremiumBusiness, 6=First */
export const TBO_CABIN_CLASS = {
	ALL: "1",
	ECONOMY: "2",
	PREMIUM_ECONOMY: "3",
	BUSINESS: "4",
	PREMIUM_BUSINESS: "5",
	FIRST: "6",
} as const;

export const TBO_UI_CABIN_TO_API: Record<string, string> = {
	Economy: TBO_CABIN_CLASS.ECONOMY,
	"Premium Economy": TBO_CABIN_CLASS.PREMIUM_ECONOMY,
	Business: TBO_CABIN_CLASS.BUSINESS,
	"Premium Business": TBO_CABIN_CLASS.PREMIUM_BUSINESS,
	First: TBO_CABIN_CLASS.FIRST,
};

export const TBO_API_CABIN_TO_UI: Record<string, string> = {
	[TBO_CABIN_CLASS.ALL]: "Economy",
	[TBO_CABIN_CLASS.ECONOMY]: "Economy",
	[TBO_CABIN_CLASS.PREMIUM_ECONOMY]: "Premium Economy",
	[TBO_CABIN_CLASS.BUSINESS]: "Business",
	[TBO_CABIN_CLASS.PREMIUM_BUSINESS]: "Premium Business",
	[TBO_CABIN_CLASS.FIRST]: "First",
};

export const TBO_MAX_PASSENGERS = 9;

export const TBO_JOURNEY = {
	ONEWAY: "1",
	RETURN: "2",
	MULTICITY: "3",
	ADVANCE_SEARCH: "4",
	SPECIAL_RETURN: "5",
} as const;

export type TboSpecialReturnChannel = "LCC" | "GDS";

export function normalizeTboCabinClass(value: string | undefined): string {
	if (!value) return TBO_CABIN_CLASS.ECONOMY;
	const trimmed = value.trim();
	if (TBO_UI_CABIN_TO_API[trimmed]) return TBO_UI_CABIN_TO_API[trimmed];
	if (Object.values(TBO_CABIN_CLASS).includes(trimmed as (typeof TBO_CABIN_CLASS)[keyof typeof TBO_CABIN_CLASS])) {
		return trimmed;
	}
	return TBO_CABIN_CLASS.ECONOMY;
}

export function isReturnJourneyType(journeyType: string): boolean {
	return (
		journeyType === TBO_JOURNEY.RETURN ||
		journeyType === TBO_JOURNEY.SPECIAL_RETURN ||
		journeyType === TBO_JOURNEY.ADVANCE_SEARCH
	);
}

export function isAdvanceSearchJourneyType(journeyType: string): boolean {
	return journeyType === TBO_JOURNEY.ADVANCE_SEARCH;
}

export function isSpecialReturnJourneyType(journeyType: string): boolean {
	return journeyType === TBO_JOURNEY.SPECIAL_RETURN;
}

/** Per TBO Search doc — LCC Spl Return: SG, 6E, G8; GDS Spl Return: GDS */
export function tboSourcesForSearch(
	journeyType: string,
	options?: {
		sources?: string[] | null;
		specialReturnChannel?: TboSpecialReturnChannel;
	},
): string[] | null {
	if (options?.sources?.length) return options.sources;
	if (journeyType === TBO_JOURNEY.ADVANCE_SEARCH) return [""];
	if (!isSpecialReturnJourneyType(journeyType)) return null;
	return options?.specialReturnChannel === "GDS"
		? ["GDS"]
		: ["6E", "SG", "G8"];
}

export function validateTboPassengerCounts(
	adults: number,
	children: number,
	infants: number,
): string | null {
	if (adults < 1) return "At least 1 adult is required";
	const total = adults + children + infants;
	if (total > TBO_MAX_PASSENGERS) {
		return `Maximum ${TBO_MAX_PASSENGERS} passengers allowed (adults + children + infants)`;
	}
	if (infants > adults) {
		return "Number of infants cannot exceed number of adults";
	}
	return null;
}

/** TBO doc: PreferredArrivalTime mandatory — default to same calendar day as departure */
export function defaultPreferredArrivalTime(departureIso: string): string {
	if (!departureIso) return "";
	const datePart = departureIso.slice(0, 10);
	return `${datePart}T00:00:00`;
}

export function buildTboFlightSegment(
	origin: string,
	destination: string,
	departureTime: string,
	cabinClass: string,
	arrivalTime?: string,
): FlightSegment {
	const dep = departureTime || "";
	return {
		Origin: origin,
		Destination: destination,
		FlightCabinClass: normalizeTboCabinClass(cabinClass),
		PreferredDepartureTime: dep,
		PreferredArrivalTime:
			arrivalTime?.trim() || defaultPreferredArrivalTime(dep),
	};
}

function airlineCode(flight: FlightResult): string {
	return (
		flight.AirlineCode ||
		flight.Segments?.[0]?.[0]?.Airline?.AirlineCode ||
		""
	).toUpperCase();
}

/**
 * Domestic Special Return (JourneyType 5): pair OB (TripIndicator 1) + IB (TripIndicator 2)
 * on same airline; FareQuote/Book use comma-separated ResultIndex per TBO doc.
 */
function pickSpecialReturnInbound(ob: FlightResult, inbound: FlightResult[]): FlightResult | undefined {
	if (!ob?.ResultIndex || !inbound.length) return undefined;
	const comboId = (ob as FlightResult & { FareCombinationId?: string }).FareCombinationId;
	if (comboId) {
		const byCombo = inbound.find(
			(f) =>
				(f as FlightResult & { FareCombinationId?: string }).FareCombinationId ===
				comboId,
		);
		if (byCombo) return byCombo;
	}
	const air = airlineCode(ob);
	return inbound.find((f) => airlineCode(f) === air) || inbound[0];
}

export function pairTboSpecialReturnFlights(
	flights: FlightResult[],
): FlightResult[] {
	const outbound = flights.filter(
		(f) => f?.ResultIndex && f.Segments?.[0]?.[0]?.TripIndicator === 1,
	);
	const inbound = flights.filter(
		(f) => f?.ResultIndex && f.Segments?.[0]?.[0]?.TripIndicator === 2,
	);

	const paired: FlightResult[] = [];

	if (outbound.length && inbound.length) {
		for (const ob of outbound) {
			const ib = pickSpecialReturnInbound(ob, inbound);
			if (!ib) continue;
			paired.push({
				...ob,
				ResultIndex: `${ob.ResultIndex},${ib.ResultIndex}`,
				ReturnResultIndex: ib.ResultIndex,
				Segments: [ob.Segments[0], ib.Segments[0]],
				_tboSpecialReturn: true,
			});
		}
	}

	if (paired.length) return paired;

	// GDS special return may return only OB rows with combined pricing — expose as-is
	return outbound.map((f) => ({
		...f,
		_tboSpecialReturn: true,
	}));
}

export function isCombinedSpecialReturnResultIndex(resultIndex: string): boolean {
	return resultIndex.includes(",");
}

export function fareQuoteResultIndexes(
	resultIndex: string,
	returnResultIndex?: string,
	journeyType?: string,
): { primary: string; secondary?: string } {
	if (
		isSpecialReturnJourneyType(journeyType || "") ||
		isCombinedSpecialReturnResultIndex(resultIndex)
	) {
		return { primary: resultIndex };
	}
	if (returnResultIndex) {
		return { primary: resultIndex, secondary: returnResultIndex };
	}
	return { primary: resultIndex };
}

export function extractFareQuoteResultIndex(
	fareQuoteResponse?: FareQuoteResponse,
): string | undefined {
	const results = fareQuoteResponse?.Response?.Results;
	const row = Array.isArray(results) ? results[0] : results;
	return row?.ResultIndex;
}

export type ResolveTboSpecialReturnResultIndexOptions = {
	journeyType?: string;
	isInternational?: boolean;
	isLCC?: boolean;
	outboundResultIndex?: string;
	inboundResultIndex?: string;
	fareQuoteRequestIndex?: string;
};

/**
 * Domestic LCC Special Return (JT=5): FareQuote/SSR/Book/Ticket must keep the
 * combined OB…,IB… index from search or the successful FareQuote request.
 * Do not replace it with FareQuoteResponse.Results.ResultIndex when that value
 * is OB-only after a combined FareQuote succeeded.
 */
export function resolveTboSpecialReturnResultIndex(
	originalIndex: string,
	fareQuoteResponse?: FareQuoteResponse,
	options?: ResolveTboSpecialReturnResultIndexOptions,
): string {
	if (
		options?.isInternational ||
		!isSpecialReturnJourneyType(options?.journeyType || "")
	) {
		return originalIndex;
	}

	const needsCombined = options?.isLCC === true;
	if (!needsCombined) {
		return (
			options?.fareQuoteRequestIndex ||
			originalIndex ||
			extractFareQuoteResultIndex(fareQuoteResponse) ||
			""
		);
	}

	if (options?.outboundResultIndex && options?.inboundResultIndex) {
		return `${options.outboundResultIndex},${options.inboundResultIndex}`;
	}

	const fromFareQuoteRequest = options?.fareQuoteRequestIndex;
	if (fromFareQuoteRequest?.includes(",")) {
		return fromFareQuoteRequest;
	}

	if (isCombinedSpecialReturnResultIndex(originalIndex)) {
		return originalIndex;
	}

	const fareQuoteOb = extractFareQuoteResultIndex(fareQuoteResponse);
	const inbound =
		options?.inboundResultIndex ||
		(isCombinedSpecialReturnResultIndex(originalIndex)
			? originalIndex.split(",").slice(1).join(",")
			: undefined);
	if (fareQuoteOb && inbound && !fareQuoteOb.includes(",")) {
		return `${fareQuoteOb},${inbound}`;
	}

	return originalIndex || fromFareQuoteRequest || "";
}

/**
 * LCC Special Return Ticket: after a successful combined FareQuote, TBO keys the
 * booking session on FareQuoteResponse.Results.ResultIndex (OB-only). SSR/FareQuote
 * still use the combined index; Ticket uses the quoted OB index when present.
 */
export function resolveTboSpecialReturnTicketResultIndex(
	combinedIndex: string,
	fareQuoteResponse?: FareQuoteResponse,
	options?: ResolveTboSpecialReturnResultIndexOptions,
): string {
	if (
		options?.isInternational ||
		!isSpecialReturnJourneyType(options?.journeyType || "") ||
		options?.isLCC !== true
	) {
		return combinedIndex;
	}

	const fareQuoteOb = extractFareQuoteResultIndex(fareQuoteResponse);
	if (fareQuoteOb && !fareQuoteOb.includes(",")) {
		return fareQuoteOb;
	}

	return resolveTboSpecialReturnResultIndex(
		combinedIndex,
		fareQuoteResponse,
		options,
	);
}

/** TBO FareUpsell/FareRules/SSR: omit separate ReturnResultIndex when index is already paired */
export function tboSeparateReturnResultIndex(
	resultIndex: string,
	returnResultIndex?: string,
	journeyType?: string,
): string | undefined {
	if (
		isSpecialReturnJourneyType(journeyType || "") ||
		isCombinedSpecialReturnResultIndex(resultIndex)
	) {
		return undefined;
	}
	return returnResultIndex;
}
