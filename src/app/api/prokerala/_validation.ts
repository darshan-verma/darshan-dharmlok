import {
	PROKERALA_AYANAMSA_VALUES,
	PROKERALA_WESTERN_ASPECT_FILTERS,
	PROKERALA_WESTERN_CHART_TYPES,
	PROKERALA_CHART_FORMATS,
	PROKERALA_CHART_STYLES,
	PROKERALA_CHART_TYPES,
	PROKERALA_WESTERN_HOUSE_SYSTEMS,
	PROKERALA_UPAGRAHA_POSITIONS,
	type ProkeralaAyanamsa,
	type ProkeralaChartFormat,
	type ProkeralaChartStyle,
	type ProkeralaChartType,
	type ProkeralaUpagrahaPosition,
	type ProkeralaWesternAspectFilter,
	type ProkeralaWesternChartType,
	type ProkeralaWesternHouseSystem,
} from "@/types/prokerala";

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

/** Papasamyam la enum: en, ta, ml, hi */
export const PAPASAMYAM_LANGUAGE_CODES = ["en", "ta", "ml", "hi"] as const;

/** Yoga la enum: en, ta, ml, hi */
export const YOGA_LANGUAGE_CODES = ["en", "ta", "ml", "hi"] as const;

/** Planet Position la enum: en, hi, ta, te, ml */
export const PLANET_POSITION_LANGUAGE_CODES = ["en", "hi", "ta", "te", "ml"] as const;

/** Sudharshanachakra chart la enum: en, ta, ml, hi */
export const SUDHARSANACHAKRA_CHART_LANGUAGE_CODES = [
	"en",
	"ta",
	"ml",
	"hi",
] as const;

/** Kundli matching la enum: en, hi */
export const KUNDLI_MATCHING_LANGUAGE_CODES = ["en", "hi"] as const;

/** Porutham system enum: tamil | kerala */
export const PORUTHAM_SYSTEMS = ["tamil", "kerala"] as const;

export type PoruthamSystem = (typeof PORUTHAM_SYSTEMS)[number];

export function validatePoruthamSystem(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly PoruthamSystem[] }
	| { ok: true; value: PoruthamSystem } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: system (tamil or kerala)",
			allowed: PORUTHAM_SYSTEMS,
		};
	}

	const value = raw.trim().toLowerCase() as PoruthamSystem;
	if (!PORUTHAM_SYSTEMS.includes(value)) {
		return { ok: false, error: "Invalid system", allowed: PORUTHAM_SYSTEMS };
	}

	return { ok: true, value };
}

/** Porutham la enum: en, ta, ml */
export const PORUTHAM_LANGUAGE_CODES = ["en", "ta", "ml"] as const;

/** Valid planet IDs for /astrology/planet-position (0-9, 100, 101, 102). */
export const PLANET_POSITION_ALLOWED_IDS = [
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 101, 102,
] as const;

export function validatePlanetIds(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly number[] }
	| { ok: true; value: string | null } {
	if (raw == null || raw.trim() === "") {
		return { ok: true, value: null };
	}
	const tokens = raw.split(",").map((s) => s.trim()).filter(Boolean);
	const allowedSet = new Set<number>(PLANET_POSITION_ALLOWED_IDS);
	for (const token of tokens) {
		const num = Number(token);
		if (Number.isNaN(num) || !allowedSet.has(num)) {
			return {
				ok: false,
				error: "Invalid planets: each ID must be one of 0-9, 100, 101, 102",
				allowed: [...PLANET_POSITION_ALLOWED_IDS],
			};
		}
	}
	return { ok: true, value: raw.trim() };
}

export const HOROSCOPE_SIGNS = [
	"aries",
	"taurus",
	"gemini",
	"cancer",
	"leo",
	"virgo",
	"libra",
	"scorpio",
	"sagittarius",
	"capricorn",
	"aquarius",
	"pisces",
] as const;

export type HoroscopeSign = (typeof HOROSCOPE_SIGNS)[number];

export const HOROSCOPE_SIGNS_WITH_ALL = ["all", ...HOROSCOPE_SIGNS] as const;

export type HoroscopeSignOrAll = (typeof HOROSCOPE_SIGNS_WITH_ALL)[number];

export const HOROSCOPE_TYPES_WITH_ALL = [
	"all",
	"general",
	"health",
	"career",
	"love",
] as const;

export type HoroscopeTypeOrAll = (typeof HOROSCOPE_TYPES_WITH_ALL)[number];

export function validateHoroscopeSign(
	raw: string | null,
	options?: { allowAll?: boolean }
):
	| {
			ok: false;
			error: string;
			allowed: readonly string[];
	  }
	| {
			ok: true;
			value: HoroscopeSign | HoroscopeSignOrAll;
	  } {
	const allowAll = options?.allowAll ?? false;
	const allowed = allowAll ? HOROSCOPE_SIGNS_WITH_ALL : HOROSCOPE_SIGNS;

	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: sign",
			allowed,
		};
	}

	const value = raw.trim().toLowerCase();
	if (!(allowed as readonly string[]).includes(value)) {
		return {
			ok: false,
			error: "Invalid sign",
			allowed,
		};
	}

	return {
		ok: true,
		value: value as HoroscopeSign | HoroscopeSignOrAll,
	};
}

export function validateHoroscopeType(
	raw: string | null
):
	| {
			ok: false;
			error: string;
			allowed: readonly HoroscopeTypeOrAll[];
	  }
	| {
			ok: true;
			value: HoroscopeTypeOrAll;
	  } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: type",
			allowed: HOROSCOPE_TYPES_WITH_ALL,
		};
	}

	const value = raw.trim().toLowerCase();
	if (
		!HOROSCOPE_TYPES_WITH_ALL.includes(
			value as (typeof HOROSCOPE_TYPES_WITH_ALL)[number]
		)
	) {
		return {
			ok: false,
			error: "Invalid type",
			allowed: HOROSCOPE_TYPES_WITH_ALL,
		};
	}

	return { ok: true, value: value as HoroscopeTypeOrAll };
}

/**
 * Chart API validators (GET /api/prokerala/chart)
 */

export function validateChartType(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly ProkeralaChartType[] }
	| { ok: true; value: ProkeralaChartType } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: chart_type",
			allowed: PROKERALA_CHART_TYPES,
		};
	}
	const value = raw.trim().toLowerCase() as ProkeralaChartType;
	if (!PROKERALA_CHART_TYPES.includes(value)) {
		return {
			ok: false,
			error: "Invalid chart_type",
			allowed: PROKERALA_CHART_TYPES,
		};
	}
	return { ok: true, value };
}

export function validateChartStyle(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly ProkeralaChartStyle[] }
	| { ok: true; value: ProkeralaChartStyle } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: chart_style",
			allowed: PROKERALA_CHART_STYLES,
		};
	}
	const value = raw.trim().toLowerCase() as ProkeralaChartStyle;
	if (!PROKERALA_CHART_STYLES.includes(value)) {
		return {
			ok: false,
			error: "Invalid chart_style",
			allowed: PROKERALA_CHART_STYLES,
		};
	}
	return { ok: true, value };
}

export function validateChartFormat(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly ProkeralaChartFormat[] }
	| { ok: true; value: ProkeralaChartFormat } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: format (only svg is supported)",
			allowed: PROKERALA_CHART_FORMATS,
		};
	}
	const value = raw.trim().toLowerCase() as ProkeralaChartFormat;
	if (!PROKERALA_CHART_FORMATS.includes(value)) {
		return {
			ok: false,
			error: "Invalid format; only svg is supported",
			allowed: PROKERALA_CHART_FORMATS,
		};
	}
	return { ok: true, value };
}

/**
 * Divisional Planet Position API validators
 * chart_type: required
 */
export const DIVISIONAL_CHART_TYPES = [
	"lagna",
	"navamsa",
	"trimsamsa",
	"drekkana",
	"chaturthamsa",
	"dasamsa",
	"ashtamsa",
	"dwadasamsa",
	"shodasamsa",
	"hora",
	"akshavedamsa",
	"shashtyamsa",
	"panchamsa",
	"khavedamsa",
	"saptavimsamsa",
	"shashtamsa",
	"chaturvimsamsa",
	"saptamsa",
	"vimsamsa",
] as const;

export type DivisionalChartType = (typeof DIVISIONAL_CHART_TYPES)[number];

export function validateDivisionalChartType(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly DivisionalChartType[] }
	| { ok: true; value: DivisionalChartType } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: chart_type",
			allowed: DIVISIONAL_CHART_TYPES,
		};
	}
	const value = raw.trim().toLowerCase() as DivisionalChartType;
	if (!DIVISIONAL_CHART_TYPES.includes(value)) {
		return {
			ok: false,
			error: "Invalid chart_type",
			allowed: DIVISIONAL_CHART_TYPES,
		};
	}
	return { ok: true, value };
}

/**
 * Chandrashtama Periods validators
 */
export const CHANDRASHTAMA_RASI_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export function validateChandrashtamaYear(
	raw: string | null
):
	| { ok: false; error: string }
	| { ok: true; value: string } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: year (e.g. 2022)",
		};
	}
	const value = raw.trim();
	if (!/^\d{4}$/.test(value)) {
		return { ok: false, error: "Invalid year: expected 4-digit year (e.g. 2022)" };
	}
	return { ok: true, value };
}

export function validateChandrashtamaRasiId(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly number[] }
	| { ok: true; value: string | null } {
	if (raw == null || raw.trim() === "") {
		return { ok: true, value: null };
	}
	const num = Number(raw.trim());
	if (
		Number.isNaN(num) ||
		!CHANDRASHTAMA_RASI_IDS.includes(num as (typeof CHANDRASHTAMA_RASI_IDS)[number])
	) {
		return {
			ok: false,
			error: "Invalid rasi: expected an id from 0 to 11",
			allowed: [...CHANDRASHTAMA_RASI_IDS],
		};
	}
	return { ok: true, value: String(num) };
}

export function validateIanaTimeZone(
	raw: string | null
):
	| { ok: false; error: string }
	| { ok: true; value: string | null } {
	if (raw == null || raw.trim() === "") {
		return { ok: true, value: null };
	}
	const value = raw.trim();
	try {
		// Throws RangeError for invalid IANA zone identifiers
		Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
	} catch {
		return {
			ok: false,
			error:
				"Invalid output_timezone: must be a valid IANA timezone identifier (e.g. Asia/Kolkata)",
		};
	}
	return { ok: true, value };
}

export function validateUpagrahaPosition(
	raw: string | null
):
	| {
			ok: false;
			error: string;
			allowed: readonly ProkeralaUpagrahaPosition[];
	  }
	| { ok: true; value: ProkeralaUpagrahaPosition | null } {
	if (raw == null || raw.trim() === "") {
		return { ok: true, value: null };
	}
	const value = raw.trim().toLowerCase() as ProkeralaUpagrahaPosition;
	if (!PROKERALA_UPAGRAHA_POSITIONS.includes(value)) {
		return {
			ok: false,
			error: "Invalid upagraha_position",
			allowed: PROKERALA_UPAGRAHA_POSITIONS,
		};
	}
	return { ok: true, value };
}

/**
 * Ashtakavarga API validators
 * Planet: required, accepts numeric id 0-6 or name (sun, moon, mercury, venus, mars, jupiter, saturn).
 * Chart type: optional, prastara | trikona | ekaadhipatya, default prastara.
 */

export const ASHTAKAVARGA_PLANET_IDS = [0, 1, 2, 3, 4, 5, 6] as const;
const ASHTAKAVARGA_PLANET_NAMES: Record<string, number> = {
	sun: 0,
	moon: 1,
	mercury: 2,
	venus: 3,
	mars: 4,
	jupiter: 5,
	saturn: 6,
};

export function validateAshtakavargaPlanet(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly number[] }
	| { ok: true; value: string } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error:
				"Missing required query parameter: planet (0-6 or sun, moon, mercury, venus, mars, jupiter, saturn)",
			allowed: [...ASHTAKAVARGA_PLANET_IDS],
		};
	}
	const value = raw.trim().toLowerCase();
	const byName = ASHTAKAVARGA_PLANET_NAMES[value];
	if (byName !== undefined) {
		return { ok: true, value: String(byName) };
	}
	const num = Number(value);
	if (
		Number.isNaN(num) ||
		!ASHTAKAVARGA_PLANET_IDS.includes(num as (typeof ASHTAKAVARGA_PLANET_IDS)[number])
	) {
		return {
			ok: false,
			error: "Invalid planet: use 0-6 or sun, moon, mercury, venus, mars, jupiter, saturn",
			allowed: [...ASHTAKAVARGA_PLANET_IDS],
		};
	}
	return { ok: true, value: String(num) };
}

export const ASHTAKAVARGA_CHART_TYPES = [
	"prastara",
	"trikona",
	"ekaadhipatya",
] as const;

export type AshtakavargaChartType =
	(typeof ASHTAKAVARGA_CHART_TYPES)[number];

export function validateAshtakavargaChartType(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly AshtakavargaChartType[] }
	| { ok: true; value: AshtakavargaChartType } {
	if (raw == null || raw.trim() === "") {
		return { ok: true, value: "prastara" };
	}
	const value = raw.trim().toLowerCase() as AshtakavargaChartType;
	if (!ASHTAKAVARGA_CHART_TYPES.includes(value)) {
		return {
			ok: false,
			error: "Invalid type: use prastara, trikona, or ekaadhipatya",
			allowed: ASHTAKAVARGA_CHART_TYPES,
		};
	}
	return { ok: true, value };
}

type ValidationFailure = { ok: false; error: string };

export function validateKundliMatchingCoordinates(
	raw: string | null,
	label: "girl_coordinates" | "boy_coordinates"
): ValidationFailure | { ok: true; value: string } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: `Missing required query parameter: ${label} (lat,lng, e.g. 10.214747,78.097626)`,
		};
	}

	const value = raw.trim();
	if (!isValidCoordinates(value)) {
		return {
			ok: false,
			error: `Invalid ${label}: expected lat,lng within valid latitude/longitude ranges`,
		};
	}

	return { ok: true, value };
}

export function validateKundliMatchingDateTime(
	raw: string | null,
	label: "girl_dob" | "boy_dob"
): ValidationFailure | { ok: true; value: string } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: `Missing required query parameter: ${label} (ISO-8601 with offset, e.g. 2004-02-12T15:19:21+05:30)`,
		};
	}

	const value = normalizeDateTime(raw.trim());
	if (!isValidDateTime(value)) {
		return {
			ok: false,
			error: `Invalid ${label}: must be ISO-8601 with timezone offset (YYYY-MM-DDTHH:MM:SS±HH:MM or ...Z)`,
		};
	}

	return { ok: true, value };
}

export function validateNakshatraId(
	raw: string | null,
	label: "girl_nakshatra" | "boy_nakshatra"
): ValidationFailure | { ok: true; value: number } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: `Missing required query parameter: ${label} (integer from 0 to 26)`,
		};
	}

	const value = Number(raw.trim());
	if (!Number.isInteger(value) || value < 0 || value > 26) {
		return {
			ok: false,
			error: `Invalid ${label}: expected an integer from 0 to 26`,
		};
	}

	return { ok: true, value };
}

export function validateNakshatraPada(
	raw: string | null,
	label: "girl_nakshatra_pada" | "boy_nakshatra_pada"
): ValidationFailure | { ok: true; value: number } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: `Missing required query parameter: ${label} (integer from 1 to 4)`,
		};
	}

	const value = Number(raw.trim());
	if (!Number.isInteger(value) || value < 1 || value > 4) {
		return {
			ok: false,
			error: `Invalid ${label}: expected an integer from 1 to 4`,
		};
	}

	return { ok: true, value };
}

export function validateRequiredNameParam(
	raw: string | null,
	label: "first_name" | "last_name"
): ValidationFailure | { ok: true; value: string } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: `Missing required query parameter: ${label}`,
		};
	}

	return { ok: true, value: raw.trim() };
}

export function validateOptionalMiddleName(
	raw: string | null
): { ok: true; value: string | null } {
	if (raw == null || raw.trim() === "") {
		return { ok: true, value: null };
	}

	return { ok: true, value: raw.trim() };
}

export function validateReferenceYear(
	raw: string | null
): ValidationFailure | { ok: true; value: number } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error:
				"Missing required query parameter: reference_year (integer, e.g. 2022)",
		};
	}

	const value = Number(raw.trim());
	if (!Number.isInteger(value) || value < 1900 || value > 2100) {
		return {
			ok: false,
			error: "Invalid reference_year: expected an integer from 1900 to 2100",
		};
	}

	return { ok: true, value };
}

export function validateAdditionalVowel(
	raw: string | null
): ValidationFailure | { ok: true; value: "true" | "false" | null } {
	if (raw == null || raw.trim() === "") {
		return { ok: true, value: null };
	}

	const normalized = raw.trim().toLowerCase();
	if (normalized === "true") {
		return { ok: true, value: "true" };
	}
	if (normalized === "false") {
		return { ok: true, value: "false" };
	}

	return {
		ok: false,
		error: "Invalid additional_vowel: expected true or false",
	};
}

export function validateWesternProfile(
	raw: string | null,
	label: "profile" | "primary_profile" | "secondary_profile"
): ValidationFailure | { ok: true; value: string } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: `Missing required query parameter: ${label}`,
		};
	}
	return { ok: true, value: raw.trim() };
}

export function validateWesternHouseSystem(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly ProkeralaWesternHouseSystem[] }
	| { ok: true; value: ProkeralaWesternHouseSystem } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: house_system",
			allowed: PROKERALA_WESTERN_HOUSE_SYSTEMS,
		};
	}
	const value = raw.trim().toLowerCase() as ProkeralaWesternHouseSystem;
	if (!PROKERALA_WESTERN_HOUSE_SYSTEMS.includes(value)) {
		return {
			ok: false,
			error: "Invalid house_system",
			allowed: PROKERALA_WESTERN_HOUSE_SYSTEMS,
		};
	}
	return { ok: true, value };
}

export function validateWesternChartType(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly ProkeralaWesternChartType[] }
	| { ok: true; value: ProkeralaWesternChartType } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: chart_type",
			allowed: PROKERALA_WESTERN_CHART_TYPES,
		};
	}
	const value = raw.trim().toLowerCase() as ProkeralaWesternChartType;
	if (!PROKERALA_WESTERN_CHART_TYPES.includes(value)) {
		return {
			ok: false,
			error: "Invalid chart_type",
			allowed: PROKERALA_WESTERN_CHART_TYPES,
		};
	}
	return { ok: true, value };
}

export const WESTERN_RELATIONSHIP_CHART_TYPES = [
	"zodiac-contact-chart",
	"house-contact-chart",
] as const;

export type WesternRelationshipChartType =
	(typeof WESTERN_RELATIONSHIP_CHART_TYPES)[number];

export function validateWesternRelationshipChartType(
	raw: string | null
):
	| {
			ok: false;
			error: string;
			allowed: readonly WesternRelationshipChartType[];
	  }
	| { ok: true; value: WesternRelationshipChartType } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: chart_type",
			allowed: WESTERN_RELATIONSHIP_CHART_TYPES,
		};
	}
	const value = raw.trim().toLowerCase() as WesternRelationshipChartType;
	if (!WESTERN_RELATIONSHIP_CHART_TYPES.includes(value)) {
		return {
			ok: false,
			error: "Invalid chart_type",
			allowed: WESTERN_RELATIONSHIP_CHART_TYPES,
		};
	}
	return { ok: true, value };
}

export function validateWesternAspectFilter(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly ProkeralaWesternAspectFilter[] }
	| { ok: true; value: ProkeralaWesternAspectFilter | null } {
	if (raw == null || raw.trim() === "") {
		return { ok: true, value: null };
	}
	const value = raw.trim().toLowerCase() as ProkeralaWesternAspectFilter;
	if (!PROKERALA_WESTERN_ASPECT_FILTERS.includes(value)) {
		return {
			ok: false,
			error: "Invalid aspect_filter",
			allowed: PROKERALA_WESTERN_ASPECT_FILTERS,
		};
	}
	return { ok: true, value };
}

export function validateWesternOrb(
	raw: string | null
): ValidationFailure | { ok: true; value: string } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: orb",
		};
	}
	const value = raw.trim().toLowerCase();
	if (value !== "default" && value !== "exact") {
		return {
			ok: false,
			error: "Invalid orb: expected default or exact",
		};
	}
	return { ok: true, value };
}

export function validateWesternDateTime(
	raw: string | null,
	label: "transit_datetime"
): ValidationFailure | { ok: true; value: string } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: `Missing required query parameter: ${label} (ISO-8601 with offset, e.g. 2004-02-12T15:19:21+05:30)`,
		};
	}
	const value = normalizeDateTime(raw.trim());
	if (!isValidDateTime(value)) {
		return {
			ok: false,
			error: `Invalid ${label}: must be ISO-8601 with timezone offset (YYYY-MM-DDTHH:MM:SS±HH:MM or ...Z)`,
		};
	}
	return { ok: true, value };
}

export function validateWesternCurrentCoordinates(
	raw: string | null
): ValidationFailure | { ok: true; value: string } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error:
				"Missing required query parameter: current_coordinates (lat,lng, e.g. 10.214747,78.097626)",
		};
	}
	const value = raw.trim();
	if (!isValidCoordinates(value)) {
		return {
			ok: false,
			error:
				"Invalid current_coordinates: expected lat,lng within valid latitude/longitude ranges",
		};
	}
	return { ok: true, value };
}

export function validateWesternProgressionYear(
	raw: string | null
): ValidationFailure | { ok: true; value: string } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: progression_year",
		};
	}
	const value = Number(raw.trim());
	if (!Number.isInteger(value) || value < 1900 || value > 2100) {
		return {
			ok: false,
			error: "Invalid progression_year: expected an integer between 1900 and 2100",
		};
	}
	return { ok: true, value: String(value) };
}

export function validateWesternSolarReturnYear(
	raw: string | null
): ValidationFailure | { ok: true; value: string } {
	if (raw == null || raw.trim() === "") {
		return {
			ok: false,
			error: "Missing required query parameter: solar_return_year",
		};
	}
	const value = Number(raw.trim());
	if (!Number.isInteger(value) || value < 1900 || value > 2100) {
		return {
			ok: false,
			error: "Invalid solar_return_year: expected an integer between 1900 and 2100",
		};
	}
	return { ok: true, value: String(value) };
}

export function validateWesternBirthTimeRectification(
	raw: string | null
): ValidationFailure | { ok: true; value: "true" | "false" | null } {
	if (raw == null || raw.trim() === "") {
		return { ok: true, value: null };
	}
	const value = raw.trim().toLowerCase();
	if (value !== "true" && value !== "false") {
		return {
			ok: false,
			error: "Invalid birth_time_rectification: expected true or false",
		};
	}
	return { ok: true, value: value as "true" | "false" };
}

/**
 * Report API validators
 * See: /report/personal-reading/instant and /report/compatibility-reading/instant
 */
export const PROKERALA_REPORT_CHART_STYLES = [
	"north-indian",
	"south-indian",
	"east-indian",
] as const;
export type ProkeralaReportChartStyle =
	(typeof PROKERALA_REPORT_CHART_STYLES)[number];

export const PROKERALA_REPORT_HOUSE_SYSTEM_IDS = [
	0, 1, 2, 3, 4, 5, 6, 7,
] as const;
export type ProkeralaReportHouseSystemId =
	(typeof PROKERALA_REPORT_HOUSE_SYSTEM_IDS)[number];

export const PROKERALA_REPORT_PLANET_IDS = [
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 100,
] as const;
export type ProkeralaReportPlanetId = (typeof PROKERALA_REPORT_PLANET_IDS)[number];

export const PROKERALA_REPORT_HOUSE_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
export type ProkeralaReportHouseId = (typeof PROKERALA_REPORT_HOUSE_IDS)[number];

export const PROKERALA_REPORT_YEAR_LENGTH_IDS = [0, 1] as const;
export type ProkeralaReportYearLengthId = (typeof PROKERALA_REPORT_YEAR_LENGTH_IDS)[number];

export const PROKERALA_REPORT_ANTARDASHA_VALUES = [
	"all",
	"current_mahadasha",
	"none",
] as const;
export type ProkeralaReportAntardasha =
	(typeof PROKERALA_REPORT_ANTARDASHA_VALUES)[number];

export const PROKERALA_REPORT_PRATYANTARDASHA_VALUES = [
	"all",
	"current_mahadasha",
	"current_antardasha",
	"none",
] as const;
export type ProkeralaReportPratyantardasha =
	(typeof PROKERALA_REPORT_PRATYANTARDASHA_VALUES)[number];

export const PROKERALA_REPORT_PLANET_ASHTAKAVARGA_VALUES = ["all", "none"] as const;
export type ProkeralaReportPlanetAshtakavarga =
	(typeof PROKERALA_REPORT_PLANET_ASHTAKAVARGA_VALUES)[number];

export const PROKERALA_REPORT_PERIOD_TYPE_VALUES = ["marriage"] as const;
export type ProkeralaReportPeriodType =
	(typeof PROKERALA_REPORT_PERIOD_TYPE_VALUES)[number];

export const PROKERALA_REPORT_TRANSIT_PLANET_IDS = [5] as const;
export type ProkeralaReportTransitPlanetId =
	(typeof PROKERALA_REPORT_TRANSIT_PLANET_IDS)[number];

export const PROKERALA_REPORT_COMPATIBILITY_SYSTEM_VALUES = [
	"kerala",
	"tamil",
	"guna-milan",
] as const;
export type ProkeralaReportCompatibilitySystem =
	(typeof PROKERALA_REPORT_COMPATIBILITY_SYSTEM_VALUES)[number];

export const PROKERALA_REPORT_CHART_TYPE_VALUES = ["zodiac", "house"] as const;
export type ProkeralaReportChartType =
	(typeof PROKERALA_REPORT_CHART_TYPE_VALUES)[number];

export const PROKERALA_REPORT_TEMPLATE_STYLES = [
	"basic",
	"vedic-astro-green",
	"western-astro-blue",
] as const;
export type ProkeralaReportTemplateStyle =
	(typeof PROKERALA_REPORT_TEMPLATE_STYLES)[number];

export const PROKERALA_REPORT_PERSONAL_MODULE_CODES = [
	"birth-details",
	"chart",
	"planet-position",
	"mangal-dosha",
	"yoga-details",
	"kaal-sarp-dosha",
	"sade-sati",
	"shodashvarga-chart",
	"dasa-periods",
	"papa-dosha",
	"planet-relationship",
	"ashtakavarga-chart",
	"sarvashtakavarga-chart",
	"sudharshanachakra-chart",
	"shodashvarga-table",
	"shadbala-table",
	"nabhasa-yogas",
	"chandra-yogas",
	"surya-yogas",
	"favourable-periods",
	"transit-planet-kakshya",
	"transit-planet-nakshatra",
	"transit-planet-prediction",
	"natal-chart",
	"western-planet-position",
	"natal-aspect-details",
	"planet-sign-interpretation",
	"basic-house-interpretation",
	"saturn-transit",
	"rahu-ketu-transit",
	"jupiter-transit",
	"year-guide",
	"single-page-horoscope",
	"basic-natal-report",
] as const;
export type ProkeralaReportPersonalModuleCode =
	(typeof PROKERALA_REPORT_PERSONAL_MODULE_CODES)[number];

export const PROKERALA_REPORT_COMPATIBILITY_MODULE_CODES = [
	"kundli-matching",
	"porutham-kerala",
	"porutham-tamil",
	"birth-details",
	"mangal-dosha",
	"papa-samaya",
	"dasha-sandi",
	"synastry-report",
	"guna-milan-report",
	"porutham-report",
] as const;
export type ProkeralaReportCompatibilityModuleCode =
	(typeof PROKERALA_REPORT_COMPATIBILITY_MODULE_CODES)[number];

function validateEnumValue<T extends string>(
	raw: string | null,
	allowed: readonly T[]
): { ok: false; error: string; allowed: readonly T[] } | { ok: true; value: T } {
	if (raw == null || raw.trim() === "") {
		return { ok: false, error: "Missing required value", allowed };
	}
	const value = raw.trim().toLowerCase() as T;
	if (!allowed.includes(value)) {
		return { ok: false, error: "Invalid value", allowed };
	}
	return { ok: true, value };
}

function validateNumericId<T extends number>(
	raw: number | string | null | undefined,
	allowed: readonly T[]
): { ok: false; error: string; allowed: readonly T[] } | { ok: true; value: T } {
	if (raw == null || raw === "") {
		return { ok: false, error: "Missing required value", allowed };
	}
	const n = typeof raw === "number" ? raw : Number(String(raw).trim());
	if (Number.isNaN(n) || !allowed.includes(n as T)) {
		return { ok: false, error: "Invalid value", allowed };
	}
	return { ok: true, value: n as T };
}

export function validateReportChartStyle(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly ProkeralaReportChartStyle[] }
	| { ok: true; value: ProkeralaReportChartStyle } {
	return validateEnumValue(raw, PROKERALA_REPORT_CHART_STYLES);
}

export function validateReportHouseSystemId(
	raw: number | string | null | undefined
):
	| { ok: false; error: string; allowed: readonly ProkeralaReportHouseSystemId[] }
	| { ok: true; value: ProkeralaReportHouseSystemId } {
	return validateNumericId(raw, PROKERALA_REPORT_HOUSE_SYSTEM_IDS);
}

export function validateReportPlanetId(
	raw: number | string | null | undefined
):
	| { ok: false; error: string; allowed: readonly ProkeralaReportPlanetId[] }
	| { ok: true; value: ProkeralaReportPlanetId } {
	return validateNumericId(raw, PROKERALA_REPORT_PLANET_IDS);
}

export function validateReportHouseId(
	raw: number | string | null | undefined
):
	| { ok: false; error: string; allowed: readonly ProkeralaReportHouseId[] }
	| { ok: true; value: ProkeralaReportHouseId } {
	return validateNumericId(raw, PROKERALA_REPORT_HOUSE_IDS);
}

export function validateReportYearLength(
	raw: number | string | null | undefined
):
	| { ok: false; error: string; allowed: readonly ProkeralaReportYearLengthId[] }
	| { ok: true; value: ProkeralaReportYearLengthId } {
	return validateNumericId(raw, PROKERALA_REPORT_YEAR_LENGTH_IDS);
}

export function validateReportAntardasha(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly ProkeralaReportAntardasha[] }
	| { ok: true; value: ProkeralaReportAntardasha } {
	return validateEnumValue(raw, PROKERALA_REPORT_ANTARDASHA_VALUES);
}

export function validateReportPratyantardasha(
	raw: string | null
):
	| {
			ok: false;
			error: string;
			allowed: readonly ProkeralaReportPratyantardasha[];
	  }
	| { ok: true; value: ProkeralaReportPratyantardasha } {
	return validateEnumValue(raw, PROKERALA_REPORT_PRATYANTARDASHA_VALUES);
}

export function validateReportPlanetAshtakavarga(
	raw: string | null
):
	| {
			ok: false;
			error: string;
			allowed: readonly ProkeralaReportPlanetAshtakavarga[];
	  }
	| { ok: true; value: ProkeralaReportPlanetAshtakavarga } {
	return validateEnumValue(raw, PROKERALA_REPORT_PLANET_ASHTAKAVARGA_VALUES);
}

export function validateReportPeriodType(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly ProkeralaReportPeriodType[] }
	| { ok: true; value: ProkeralaReportPeriodType } {
	return validateEnumValue(raw, PROKERALA_REPORT_PERIOD_TYPE_VALUES);
}

export function validateReportTransitPlanetId(
	raw: number | string | null | undefined
):
	| {
			ok: false;
			error: string;
			allowed: readonly ProkeralaReportTransitPlanetId[];
	  }
	| { ok: true; value: ProkeralaReportTransitPlanetId } {
	return validateNumericId(raw, PROKERALA_REPORT_TRANSIT_PLANET_IDS);
}

export function validateReportCompatibilitySystem(
	raw: string | null
):
	| {
			ok: false;
			error: string;
			allowed: readonly ProkeralaReportCompatibilitySystem[];
	  }
	| { ok: true; value: ProkeralaReportCompatibilitySystem } {
	return validateEnumValue(raw, PROKERALA_REPORT_COMPATIBILITY_SYSTEM_VALUES);
}

export function validateReportChartType(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly ProkeralaReportChartType[] }
	| { ok: true; value: ProkeralaReportChartType } {
	return validateEnumValue(raw, PROKERALA_REPORT_CHART_TYPE_VALUES);
}

export function validateReportTemplateStyle(
	raw: string | null
):
	| { ok: false; error: string; allowed: readonly ProkeralaReportTemplateStyle[] }
	| { ok: true; value: ProkeralaReportTemplateStyle } {
	return validateEnumValue(raw, PROKERALA_REPORT_TEMPLATE_STYLES);
}

