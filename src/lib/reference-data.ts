import airports from "@/data/airports.json";
import airlines from "@/data/airlines.json";

export type Airport = {
	code: string;
	name: string;
	city: string;
	country: string;
	countryCode: string;
};

// TODO: Confirm LCC flags — airlines.json sets isLcc: false for all rows (Excel has no LCC column).
// TripJack/AIRiQ search responses still supply isLcc at booking time from the provider API.

export type Airline = {
	code: string;
	name: string;
	isLcc: boolean;
};

export function getAirport(code: string): Airport | undefined {
	return (airports as Airport[]).find(
		(a) => a.code === code.toUpperCase(),
	);
}

export function getAirline(code: string): Airline | undefined {
	return (airlines as Airline[]).find(
		(a) => a.code === code.toUpperCase(),
	);
}

export function getAirportCity(code: string): string {
	return getAirport(code)?.city ?? code;
}

export function getAirportLabel(code: string): string {
	const a = getAirport(code);
	return a ? `${a.city} (${a.code})` : code;
}

export function getAirlineName(code: string): string {
	return getAirline(code)?.name ?? code;
}

export function isLcc(airlineCode: string): boolean {
	return getAirline(airlineCode)?.isLcc ?? false;
}

export function searchAirports(query: string, limit = 10): Airport[] {
	if (query.length < 2) return [];
	const q = query.toLowerCase();
	const exact = (airports as Airport[]).filter(
		(a) => a.code.toLowerCase() === q,
	);
	const cityStart = (airports as Airport[]).filter(
		(a) =>
			a.code.toLowerCase() !== q &&
			a.city.toLowerCase().startsWith(q),
	);
	const rest = (airports as Airport[]).filter(
		(a) =>
			a.code.toLowerCase() !== q &&
			!a.city.toLowerCase().startsWith(q) &&
			(a.city.toLowerCase().includes(q) ||
				a.name.toLowerCase().includes(q)),
	);
	return [...exact, ...cityStart, ...rest].slice(0, limit);
}

export function validateAirportCode(code: string): boolean {
	return !!getAirport(code);
}

export function validateAirlineCode(code: string): boolean {
	return !!getAirline(code);
}
