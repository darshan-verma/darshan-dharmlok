import {
	validateAirlineCode,
	validateAirportCode,
} from "@/lib/reference-data";

export type ReferenceCodeWarning = {
	field: string;
	code: string;
	message: string;
};

/** Non-blocking warnings for unknown IATA codes (server-side). */
export function collectFlightReferenceWarnings(input: {
	origin?: string;
	destination?: string;
	airlineCodes?: string[];
}): ReferenceCodeWarning[] {
	const warnings: ReferenceCodeWarning[] = [];

	if (input.origin?.trim() && !validateAirportCode(input.origin)) {
		console.warn(`Unknown airport/airline code: ${input.origin.trim()}`);
		warnings.push({
			field: "origin",
			code: input.origin.trim().toUpperCase(),
			message: `Unrecognised code: ${input.origin.trim().toUpperCase()}`,
		});
	}
	if (input.destination?.trim() && !validateAirportCode(input.destination)) {
		console.warn(`Unknown airport/airline code: ${input.destination.trim()}`);
		warnings.push({
			field: "destination",
			code: input.destination.trim().toUpperCase(),
			message: `Unrecognised code: ${input.destination.trim().toUpperCase()}`,
		});
	}

	for (const raw of input.airlineCodes ?? []) {
		const code = raw?.trim();
		if (!code) continue;
		if (!validateAirlineCode(code)) {
			console.warn(`Unknown airport/airline code: ${code}`);
			warnings.push({
				field: "airline",
				code: code.toUpperCase(),
				message: `Unrecognised code: ${code.toUpperCase()}`,
			});
		}
	}

	return warnings;
}
