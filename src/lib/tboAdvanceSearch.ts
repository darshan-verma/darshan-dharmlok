import type { FlightResult, PriceRBDResponse } from "@/types/tbo";
import { isAdvanceSearchJourneyType } from "@/lib/tboFlightSearch";

export type RbdAvailability = { Class: string; Seats: string };

export { isAdvanceSearchJourneyType };

export function isPricedTboResultIndex(resultIndex: string): boolean {
	return resultIndex.includes("+P+");
}

export function getFlightRbdAvailability(flight: FlightResult): RbdAvailability[] {
	const seg = flight.Segments?.[0]?.[0] as
		| (FlightResult["Segments"][0][0] & { Availability?: RbdAvailability[] })
		| undefined;
	const list = seg?.Availability ?? [];
	return list.filter((row) => {
		if (!row?.Class?.trim()) return false;
		const seats = parseInt(String(row.Seats), 10);
		return Number.isNaN(seats) || seats > 0;
	});
}

export function applyFareClassToFlight(
	flight: FlightResult,
	fareClass: string,
): FlightResult {
	return {
		...flight,
		Segments: flight.Segments.map((leg) =>
			leg.map((segment) => ({
				...segment,
				Airline: {
					...segment.Airline,
					FareClass: fareClass,
				},
			})),
		),
	};
}

export function resolveSelectedAdvanceSearchFlight(
	flight: FlightResult,
	selectedFareClass?: string,
): FlightResult {
	const existing =
		flight.Segments?.[0]?.[0]?.Airline?.FareClass?.trim() || "";
	const fareClass = selectedFareClass?.trim() || existing;
	if (!fareClass) {
		const options = getFlightRbdAvailability(flight);
		if (options.length === 1) {
			return applyFareClassToFlight(flight, options[0].Class);
		}
		throw new Error("Please select a fare class (RBD) before continuing.");
	}
	return applyFareClassToFlight(flight, fareClass);
}

export function extractPriceRbdResultIndex(
	response?: PriceRBDResponse,
): string | undefined {
	const results = response?.Response?.Results;
	if (!results) return undefined;

	if (Array.isArray(results)) {
		const firstLeg = results[0];
		if (Array.isArray(firstLeg)) {
			return firstLeg[0]?.ResultIndex;
		}
		return (firstLeg as FlightResult | undefined)?.ResultIndex;
	}

	return (results as FlightResult).ResultIndex;
}

export function extractPriceRbdPricedFlight(
	response?: PriceRBDResponse,
): FlightResult | undefined {
	const results = response?.Response?.Results;
	if (!results || !Array.isArray(results)) return undefined;
	const firstLeg = results[0];
	if (Array.isArray(firstLeg)) return firstLeg[0];
	return firstLeg as FlightResult;
}
