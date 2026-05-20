/**
 * Client-safe airport/airline display helpers.
 * Does not import JSON — use /api/airports for autocomplete and label resolution.
 */

export type AirportSearchResult = {
	code: string;
	name: string;
	city: string;
	country: string;
	countryCode: string;
};

const airportLabelCache = new Map<string, string>();

/** Prefer segment/API city name; otherwise resolve via airports API (cached). */
export async function resolveAirportLabel(
	code: string,
	cityFromApi?: string | null,
): Promise<string> {
	const upper = code.toUpperCase();
	if (cityFromApi?.trim()) {
		return `${cityFromApi.trim()} (${upper})`;
	}
	if (airportLabelCache.has(upper)) {
		return airportLabelCache.get(upper)!;
	}
	try {
		const res = await fetch(
			`/api/airports?q=${encodeURIComponent(upper)}`,
		);
		if (res.ok) {
			const list = (await res.json()) as AirportSearchResult[];
			const hit = list.find((a) => a.code === upper);
			if (hit) {
				const label = `${hit.city} (${hit.code})`;
				airportLabelCache.set(upper, label);
				return label;
			}
		}
	} catch {
		// fall through
	}
	airportLabelCache.set(upper, upper);
	return upper;
}

export function airportLabelFromFields(
	code: string,
	city?: string | null,
): string {
	const upper = code.toUpperCase();
	return city?.trim() ? `${city.trim()} (${upper})` : upper;
}

export function airlineLabelFromFields(
	code: string,
	name?: string | null,
): string {
	return name?.trim() || code;
}

export async function validateAirportCodeClient(
	code: string,
): Promise<boolean> {
	const upper = code.trim().toUpperCase();
	if (!upper) return false;
	try {
		const res = await fetch(
			`/api/airports?q=${encodeURIComponent(upper)}`,
		);
		if (!res.ok) return false;
		const list = (await res.json()) as AirportSearchResult[];
		return list.some((a) => a.code === upper);
	} catch {
		return false;
	}
}

export async function validateAirlineCodeClient(
	code: string,
): Promise<boolean> {
	const upper = code.trim().toUpperCase();
	if (!upper) return false;
	try {
		const res = await fetch(
			`/api/airlines?code=${encodeURIComponent(upper)}`,
		);
		if (!res.ok) return false;
		const body = (await res.json()) as { valid?: boolean };
		return body.valid === true;
	} catch {
		return false;
	}
}

export function extractAirportCodesFromFlight(flight: {
	Segments?: Array<
		Array<{
			Origin?: { Airport?: { AirportCode?: string; CityCode?: string } };
			Destination?: { Airport?: { AirportCode?: string; CityCode?: string } };
		}>
	>;
}): { origin?: string; destination?: string; airlineCodes: string[] } {
	const groups = flight.Segments ?? [];
	const first = groups[0]?.[0];
	const lastGroup = groups[groups.length - 1];
	const last = lastGroup?.[lastGroup.length - 1];
	const origin =
		first?.Origin?.Airport?.AirportCode ||
		first?.Origin?.Airport?.CityCode;
	const destination =
		last?.Destination?.Airport?.AirportCode ||
		last?.Destination?.Airport?.CityCode;

	const airlineSet = new Set<string>();
	for (const group of groups) {
		for (const seg of group) {
			const air = (
				seg as { Airline?: { AirlineCode?: string } }
			).Airline;
			const c = air?.AirlineCode;
			if (c?.trim()) airlineSet.add(c.trim().toUpperCase());
		}
	}

	return {
		origin,
		destination,
		airlineCodes: [...airlineSet],
	};
}
