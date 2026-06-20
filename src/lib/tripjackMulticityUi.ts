import { isAdvanceSearchJourneyType } from "@/lib/tboFlightSearch";
import type { FlightResult } from "@/types/tbo";

export type TripjackMulticitySearchView = {
	/** Flights shown in the main list (active leg or COMBO) */
	displayFlights: FlightResult[];
	/** Per-leg options when TripJack returns domestic multicity ONWARD buckets */
	domesticLegs: FlightResult[][] | null;
};

export function nonEmptyResultLegs(
	results: FlightResult[][] | undefined | null,
): FlightResult[][] {
	if (!results?.length) return [];
	return results.filter((leg) => Array.isArray(leg) && leg.length > 0);
}

export function isTripjackDomesticMulticityLegs(
	legs: FlightResult[][],
): boolean {
	if (legs.length < 2) return false;
	return legs.every(
		(leg) => leg[0]?._tripjackMulticityMode === "DOMESTIC_LEGS",
	);
}

/**
 * Normalize API `Response.Results` for multicity (journey type 3) display.
 */
export function resolveMulticitySearchView(
	results: FlightResult[][] | undefined | null,
	journeyType: string,
): TripjackMulticitySearchView {
	const legs = nonEmptyResultLegs(results);

	if (isAdvanceSearchJourneyType(journeyType) && legs.length >= 2) {
		return {
			displayFlights: legs[0] || [],
			domesticLegs: [legs[0], legs[1]],
		};
	}

	if (journeyType !== "3" || legs.length === 0) {
		return {
			displayFlights: legs[0] || [],
			domesticLegs: null,
		};
	}

	if (isTripjackDomesticMulticityLegs(legs)) {
		return {
			displayFlights: legs[0] || [],
			domesticLegs: legs,
		};
	}

	const comboLeg =
		legs.find((leg) => leg[0]?._tripjackMulticityMode === "COMBO") || legs[0];
	return {
		displayFlights: comboLeg || [],
		domesticLegs: null,
	};
}

export function multicityLegLabel(flight: FlightResult): string {
	const seg = flight.Segments?.[0]?.[0];
	const from =
		seg?.Origin?.Airport?.AirportCode ||
		seg?.Origin?.Airport?.CityCode ||
		"";
	const lastGroup = flight.Segments?.[flight.Segments.length - 1];
	const lastSeg = lastGroup?.[lastGroup.length - 1];
	const to =
		lastSeg?.Destination?.Airport?.AirportCode ||
		lastSeg?.Destination?.Airport?.CityCode ||
		"";
	if (from && to) return `${from} → ${to}`;
	return "Leg";
}

export function allDomesticMulticityLegsSelected(
	selections: (FlightResult | null)[],
	legCount: number,
): boolean {
	if (legCount < 2) return false;
	if (selections.length < legCount) return false;
	for (let i = 0; i < legCount; i++) {
		if (!selections[i]?.ResultIndex) return false;
	}
	return true;
}

export function buildTripjackMulticityBookSearchParams(input: {
	traceId: string;
	selections: FlightResult[];
	adultCount: number;
	childCount: number;
	infantCount: number;
}): URLSearchParams {
	const params = new URLSearchParams({
		traceId: input.traceId,
		resultIndex: input.selections[0]!.ResultIndex,
		adultCount: String(input.adultCount),
		childCount: String(input.childCount),
		infantCount: String(input.infantCount),
		apiSource: "TRIPJACK",
		priceIds: input.selections.map((s) => s.ResultIndex).join(","),
	});
	if (input.selections[1]) {
		params.set("returnResultIndex", input.selections[1].ResultIndex);
	}
	return params;
}
