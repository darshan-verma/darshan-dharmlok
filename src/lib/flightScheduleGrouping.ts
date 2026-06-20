import type { FlightResult } from "@/types/tbo";
import { getNetPayable, sortByNetPayable } from "@/lib/flightSearchMerge";

export interface ScheduleFlightGroup {
	key: string;
	flights: FlightResult[];
	/** Cheapest flight in the group (used as default selection). */
	representative: FlightResult;
}

function normalizeScheduleTime(dateString: string | undefined): string {
	if (!dateString) return "";
	const cleaned = dateString.replace(/\.\d+/, "");
	const date = new Date(cleaned);
	if (Number.isNaN(date.getTime())) return dateString;
	return date.toISOString().slice(0, 16);
}

function airportCode(
	segment: FlightResult["Segments"][0][0] | undefined,
	kind: "origin" | "destination",
): string {
	if (!segment) return "";
	if (kind === "origin") {
		return (
			segment.Origin?.Airport?.AirportCode ||
			segment.Origin?.Airport?.CityCode ||
			""
		);
	}
	return (
		segment.Destination?.Airport?.AirportCode ||
		segment.Destination?.Airport?.CityCode ||
		""
	);
}

/** Group only single-leg results (one-way, advance-return leg pick, domestic multicity leg). */
export function shouldGroupFlightResult(flight: FlightResult): boolean {
	return (flight.Segments?.length ?? 0) === 1;
}

export function getFlightScheduleKey(flight: FlightResult): string {
	const leg = flight.Segments?.[0];
	if (!leg?.length) return flight.ResultIndex;

	const first = leg[0];
	const last = leg[leg.length - 1];
	const depTime = normalizeScheduleTime(
		first.Origin?.DepTime || first.DepartureTime,
	);
	const arrTime = normalizeScheduleTime(
		last.Destination?.ArrTime || last.ArrivalTime,
	);
	const origin = airportCode(first, "origin");
	const destination = airportCode(last, "destination");
	const stops = leg.length - 1;

	return `${origin}|${destination}|${depTime}|${arrTime}|${stops}`;
}

export function groupFlightsBySchedule(
	flights: FlightResult[],
): ScheduleFlightGroup[] {
	const map = new Map<string, FlightResult[]>();

	for (const flight of flights) {
		if (!shouldGroupFlightResult(flight)) {
			map.set(`solo:${flight.ResultIndex}`, [flight]);
			continue;
		}

		const key = getFlightScheduleKey(flight);
		const list = map.get(key) ?? [];
		list.push(flight);
		map.set(key, list);
	}

	const groups: ScheduleFlightGroup[] = [];

	for (const [key, list] of map) {
		const sorted = sortByNetPayable(list);
		groups.push({
			key,
			flights: sorted,
			representative: sorted[0],
		});
	}

	groups.sort(
		(a, b) => getNetPayable(a.representative) - getNetPayable(b.representative),
	);

	return groups;
}

export function formatFlightTime(dateString: string | undefined): string {
	if (!dateString) return "--:--";

	const tryParse = (value: string) => {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return null;
		return date.toLocaleTimeString("en-IN", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	};

	return (
		tryParse(dateString) ??
		tryParse(dateString.replace(/\.\d+/, "")) ??
		"--:--"
	);
}

export function formatFlightDate(dateString: string | undefined): string {
	if (!dateString) return "";
	const date = new Date(dateString.replace(/\.\d+/, ""));
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
	});
}

export function formatFlightDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (hours <= 0) return `${mins}min`;
	if (mins <= 0) return `${hours}hr`;
	return `${hours}hr ${mins}min`;
}

export function getTotalSeatsAvailable(flight: FlightResult): number | null {
	const seg = flight.Segments?.[0]?.[0];
	const availability = seg?.Availability ?? [];
	if (availability.length === 0) return null;

	let total = 0;
	for (const row of availability) {
		const seats = parseInt(String(row.Seats), 10);
		if (!Number.isNaN(seats)) total += seats;
	}
	return total > 0 ? total : null;
}

export function getFareRowLabel(flight: FlightResult): string {
	const seg = flight.Segments?.[0]?.[0];
	return (
		flight.ResultFareType ||
		flight.FareClassification?.Type ||
		seg?.SupplierFareClass ||
		seg?.Airline?.FareClass ||
		"Standard"
	);
}
