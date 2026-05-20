"use client";

import type { ReferenceCodeWarning } from "@/lib/reference-code-validation";
import {
	extractAirportCodesFromFlight,
	validateAirlineCodeClient,
	validateAirportCodeClient,
} from "@/lib/reference-data-client";
import type { FlightResult } from "@/types/tbo";

/** Client-side reference warnings via /api/airports and /api/airlines (does not block submit). */
export async function collectFlightReferenceWarningsClient(
	flight: FlightResult,
): Promise<ReferenceCodeWarning[]> {
	const { origin, destination, airlineCodes } =
		extractAirportCodesFromFlight(flight);
	const warnings: ReferenceCodeWarning[] = [];

	for (const [field, code] of [
		["origin", origin],
		["destination", destination],
	] as const) {
		const trimmed = code?.trim();
		if (!trimmed) continue;
		const ok = await validateAirportCodeClient(trimmed);
		if (!ok) {
			const upper = trimmed.toUpperCase();
			console.warn(`Unknown airport/airline code: ${upper}`);
			warnings.push({
				field,
				code: upper,
				message: `Unrecognised code: ${upper}`,
			});
		}
	}

	for (const code of airlineCodes) {
		const ok = await validateAirlineCodeClient(code);
		if (!ok) {
			console.warn(`Unknown airport/airline code: ${code}`);
			warnings.push({
				field: "airline",
				code,
				message: `Unrecognised code: ${code}`,
			});
		}
	}

	return warnings;
}
