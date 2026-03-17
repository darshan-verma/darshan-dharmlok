import { PROKERALA_AYANAMSA_VALUES, type ProkeralaAyanamsa } from "@/types/prokerala";

const ISO_DATETIME_WITH_OFFSET_REGEX =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+ -]\d{2}:\d{2})$/;

const COORDINATES_REGEX =
	/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

export function validateAyanamsa(
	raw: string | null
): { ok: false; error: string; allowed: readonly ProkeralaAyanamsa[] } | {
	ok: true;
	value: ProkeralaAyanamsa;
} {
	if (raw == null || raw === "") {
		return {
			ok: false,
			error:
				"Missing required query parameter: ayanamsa (1 for Lahiri, 3 for Raman, 5 for KP)",
			allowed: PROKERALA_AYANAMSA_VALUES,
		};
	}
	const num = Number(raw);
	if (
		Number.isNaN(num) ||
		!PROKERALA_AYANAMSA_VALUES.includes(
			num as (typeof PROKERALA_AYANAMSA_VALUES)[number]
		)
	) {
		return {
			ok: false,
			error: "Invalid ayanamsa",
			allowed: PROKERALA_AYANAMSA_VALUES,
		};
	}
	return { ok: true, value: num as ProkeralaAyanamsa };
}

export function isValidCoordinates(value: string): boolean {
	const match = value.match(COORDINATES_REGEX);
	if (!match) return false;
	const lat = Number(match[1]);
	const lng = Number(match[2]);
	if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
	return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function normalizeDateTime(raw: string): string {
	// Handle cases where '+' was not URL-encoded and arrived as space.
	// Example: "1970-11-10T06:14:07 05:30" -> "1970-11-10T06:14:07+05:30"
	if (raw.includes(" ") && !raw.includes("+")) {
		return raw.replace(" ", "+");
	}
	return raw;
}

export function isValidDateTime(value: string): boolean {
	if (!ISO_DATETIME_WITH_OFFSET_REGEX.test(value)) return false;
	const d = new Date(value);
	return !Number.isNaN(d.getTime());
}

export function validateLanguage<T extends string>(
	raw: string | null,
	allowed: readonly T[]
): { ok: false; error: string; allowed: readonly T[] } | {
	ok: true;
	value: T | null;
} {
	if (raw == null || raw === "") {
		return { ok: true, value: null };
	}

	const trimmed = raw.trim() as T;
	if (!allowed.includes(trimmed)) {
		return {
			ok: false,
			error: "Invalid language code (la)",
			allowed,
		};
	}

	return { ok: true, value: trimmed };
}

/**
 * Convenience constant for endpoints that only support the subset listed
 * in the Daily Panchang docs (en, hi, ta, te, ml).
 */
export const DAILY_PANCHANG_LANGUAGE_CODES = ["en", "hi", "ta", "te", "ml"] as const;

