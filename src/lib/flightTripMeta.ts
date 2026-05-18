import type { FlightResult } from "@/types/tbo";

/** Human-readable route for My Trips / confirmations (TBO-shaped segment layout). */
export function flightRouteSummary(
	flight: FlightResult,
	returnFlight?: FlightResult | null
): string {
	const groups = flight.Segments ?? [];
	if (!groups.length) return "Flight booking";
	const first = groups[0]?.[0];
	const outboundLastGroup = groups[groups.length - 1];
	const outboundLast = outboundLastGroup?.[outboundLastGroup.length - 1];

	let last = outboundLast;
	if (returnFlight?.Segments?.length) {
		const retGroups = returnFlight.Segments;
		const retLastGroup = retGroups[retGroups.length - 1];
		last = retLastGroup?.[retLastGroup.length - 1] ?? last;
	}

	const from =
		first?.Origin?.Airport?.CityName ||
		first?.Origin?.Airport?.AirportCode ||
		"";
	const to =
		last?.Destination?.Airport?.CityName ||
		last?.Destination?.Airport?.AirportCode ||
		"";
	if (from && to) return `${from} → ${to}`;
	return "Flight booking";
}

export function flightLegDates(
	flight: FlightResult,
	returnFlight?: FlightResult | null
): {
	travelDateIso: string;
	returnDateIso: string | undefined;
	departureTimeLabel: string | undefined;
} {
	const groups = flight.Segments ?? [];
	const first = groups[0]?.[0];
	const depRaw = first?.Origin?.DepTime || first?.DepartureTime;
	const travel = depRaw ? new Date(depRaw) : new Date();
	const travelDateIso = Number.isNaN(travel.getTime())
		? new Date().toISOString()
		: travel.toISOString();

	let returnDateIso: string | undefined;
	if (returnFlight?.Segments?.length) {
		const retFirst = returnFlight.Segments[0]?.[0];
		const retDep = retFirst?.Origin?.DepTime || retFirst?.DepartureTime;
		if (retDep) {
			const ret = new Date(retDep);
			if (!Number.isNaN(ret.getTime())) returnDateIso = ret.toISOString();
		}
	} else {
		const lastGroup = groups[groups.length - 1];
		const last = lastGroup?.[lastGroup.length - 1];
		const arrRaw = last?.Destination?.ArrTime || last?.ArrivalTime;
		if (arrRaw) {
			const end = new Date(arrRaw);
			if (!Number.isNaN(end.getTime())) returnDateIso = end.toISOString();
		}
	}

	let departureTimeLabel: string | undefined;
	if (depRaw) {
		const d = new Date(depRaw);
		if (!Number.isNaN(d.getTime())) {
			departureTimeLabel = d.toLocaleTimeString(undefined, {
				hour: "2-digit",
				minute: "2-digit",
			});
		}
	}

	return { travelDateIso, returnDateIso, departureTimeLabel };
}
