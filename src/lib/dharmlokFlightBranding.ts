export const DHARMLOK_FLIGHT_BRAND = "Dharmlok";

/** Vendor tokens we never show to travellers (internal routing may still use these). */
export const FLIGHT_VENDOR_SOURCES = ["TBO", "AIRiQ", "TRIPJACK"] as const;
export type FlightVendorSource = (typeof FLIGHT_VENDOR_SOURCES)[number];

const VENDOR_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
	[/\bTBO\s*Mark\s*Up\b/gi, `${DHARMLOK_FLIGHT_BRAND} markup`],
	[/\bTBOMARKUP\b/gi, `${DHARMLOK_FLIGHT_BRAND} markup`],
	[/\bTBO\s*pricing\b/gi, `${DHARMLOK_FLIGHT_BRAND} pricing`],
	[/\bTBO\s*fare\b/gi, `${DHARMLOK_FLIGHT_BRAND} fare`],
	[/\bAIRiQ\s*fare\b/gi, `${DHARMLOK_FLIGHT_BRAND} fare`],
	[/\bTripJack\s*fee\b/gi, `${DHARMLOK_FLIGHT_BRAND} fee`],
	[/\bTripJack\s*order\b/gi, `${DHARMLOK_FLIGHT_BRAND} booking`],
	[/\bTripJack\b/g, DHARMLOK_FLIGHT_BRAND],
	[/\bTRIPJACK\b/g, DHARMLOK_FLIGHT_BRAND],
	[/\btripjack\b/g, DHARMLOK_FLIGHT_BRAND],
	[/\bAIRiQ\b/g, DHARMLOK_FLIGHT_BRAND],
	[/\bAirIQ\b/g, DHARMLOK_FLIGHT_BRAND],
	[/\bairiq\b/g, DHARMLOK_FLIGHT_BRAND],
	[/\bTBO\b/g, DHARMLOK_FLIGHT_BRAND],
];

const PRESERVED_STRUCTURE_KEYS = new Set([
	"ApiSource",
	"apiSource",
	"source",
	"provider",
	"ResultIndex",
	"ReturnResultIndex",
	"TraceId",
	"priceId",
	"bookingId",
]);

function isPreservedRoutingFieldKey(key: string): boolean {
	return PRESERVED_STRUCTURE_KEYS.has(key);
}

/** Reverse accidental vendor branding in routing tokens (e.g. stale URLs). */
export function restoreVendorRoutingString(value: string): string {
	return value.replaceAll(`[${DHARMLOK_FLIGHT_BRAND}]`, "[TBO]");
}

/** Map branded apiSource back to a TBO index when search metadata was scrubbed. */
export function resolveFlightApiSource(
	apiSource: string | undefined | null,
	resultIndex?: string,
): string {
	if (!apiSource || apiSource === DHARMLOK_FLIGHT_BRAND) {
		if (resultIndex && /^(OB|IB)\d/i.test(resultIndex)) return "TBO";
		return apiSource || "TBO";
	}
	return apiSource;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Replace vendor names in user-visible copy. */
export function sanitizeVendorDisplayText(text: string): string {
	let out = text;
	for (const [pattern, replacement] of VENDOR_TEXT_REPLACEMENTS) {
		out = out.replace(pattern, replacement);
	}
	return out;
}

function sanitizeObjectKey(key: string): string {
	if (PRESERVED_STRUCTURE_KEYS.has(key)) return key;
	return sanitizeVendorDisplayText(key);
}

function stripVendorSearchMetadata(value: Record<string, unknown>): void {
	delete value.sources;
	delete value.providerStates;

	const stats = value.stats;
	if (!isRecord(stats)) return;

	const total =
		typeof stats.totalFlightCount === "number"
			? stats.totalFlightCount
			: undefined;

	delete stats.tboFlightCount;
	delete stats.airiqFlightCount;
	delete stats.tripjackFlightCount;
	delete stats.tboResults;
	delete stats.airiqResults;
	delete stats.tripjackResults;

	if (total != null) {
		stats.flightCount = total;
	}
	delete stats.totalFlightCount;
}

/**
 * Deep-sanitize flight API payloads before they reach the browser.
 * Preserves routing fields (ApiSource, ResultIndex, etc.) while scrubbing
 * vendor names from strings and response metadata.
 */
export function sanitizeFlightClientResponse<T>(payload: T): T {
	if (payload == null) return payload;

	if (typeof payload === "string") {
		return sanitizeVendorDisplayText(payload) as T;
	}

	if (Array.isArray(payload)) {
		return payload.map((item) => sanitizeFlightClientResponse(item)) as T;
	}

	if (!isRecord(payload)) return payload;

	const out: Record<string, unknown> = {};
	stripVendorSearchMetadata(payload);

	for (const [rawKey, rawValue] of Object.entries(payload)) {
		const key = sanitizeObjectKey(rawKey);

		if (isPreservedRoutingFieldKey(rawKey) && typeof rawValue === "string") {
			out[key] = rawValue;
			continue;
		}

		if (
			(rawKey === "error" ||
				rawKey === "message" ||
				rawKey === "remarks" ||
				rawKey === "ErrorMessage" ||
				rawKey === "Details" ||
				rawKey === "FareRuleDetail" ||
				rawKey === "policyInfo") &&
			typeof rawValue === "string"
		) {
			out[key] = sanitizeVendorDisplayText(rawValue);
			continue;
		}

		out[key] = sanitizeFlightClientResponse(rawValue);
	}

	return out as T;
}

/** Unified label for my-trips / confirmation surfaces. */
export function getDharmlokFlightProviderLabel(
	_source?: string | null,
): string {
	return DHARMLOK_FLIGHT_BRAND;
}
