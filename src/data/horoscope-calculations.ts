import type { ProkeralaChartType } from "@/types/prokerala";
import { PROKERALA_CHART_TYPES, PROKERALA_CHART_STYLES } from "@/types/prokerala";
import { ASHTAKAVARGA_CHART_TYPES } from "@/app/api/prokerala/_validation";

const EXCLUDED_CHART = new Set<string>(["upagraha", "bhava", "sun", "moon"]);

/** Divisional chart types for birth chart (excludes upagraha, bhava, sun, moon). */
export const BIRTH_CHART_TYPE_OPTIONS: ProkeralaChartType[] =
	PROKERALA_CHART_TYPES.filter((t): t is ProkeralaChartType => !EXCLUDED_CHART.has(t));

export const CHART_STYLE_OPTIONS = PROKERALA_CHART_STYLES.map((value) => ({
	value,
	label:
		value === "north-indian"
			? "North Indian"
			: value === "south-indian"
				? "South Indian"
				: "East Indian",
}));

export const ASHTAKAVARGA_LAYOUT_OPTIONS = ASHTAKAVARGA_CHART_TYPES.map((value) => ({
	value,
	label:
		value === "prastara"
			? "Prastara"
			: value === "trikona"
				? "Trikona"
				: "Ekaadhipatya",
}));

export const STANDARD_LANG_4 = [
	{ value: "en" as const, label: "English" },
	{ value: "hi" as const, label: "Hindi" },
	{ value: "ta" as const, label: "Tamil" },
	{ value: "ml" as const, label: "Malayalam" },
];

export const PLANET_POSITION_LANG_OPTIONS = [
	{ value: "en" as const, label: "English" },
	{ value: "hi" as const, label: "Hindi" },
	{ value: "ta" as const, label: "Tamil" },
	{ value: "te" as const, label: "Telugu" },
	{ value: "ml" as const, label: "Malayalam" },
];

export const SUDHARSHANA_LANG_OPTIONS = [
	{ value: "en" as const, label: "English" },
	{ value: "hi" as const, label: "Hindi" },
	{ value: "ta" as const, label: "Tamil" },
	{ value: "ml" as const, label: "Malayalam" },
];

/* ─── Western Astrology dropdown options ─── */
export const WESTERN_HOUSE_SYSTEM_OPTIONS = [
	{ value: "placidus", label: "Placidus" },
	{ value: "koch", label: "Koch" },
	{ value: "whole_sign", label: "Whole Sign" },
	{ value: "equal", label: "Equal House" },
	{ value: "porphyrius", label: "Porphyrius" },
	{ value: "regiomontanus", label: "Regiomontanus" },
	{ value: "campanus", label: "Campanus" },
];

export const WESTERN_ASPECT_FILTER_OPTIONS = [
	{ value: "major", label: "Show major aspects" },
	{ value: "all", label: "Show all" },
	{ value: "minor", label: "Show all minor" },
];

export const WESTERN_LANGUAGE_OPTIONS = [
	{ value: "en", label: "English" },
	{ value: "hi", label: "Hindi" },
	{ value: "ta", label: "Tamil" },
	{ value: "te", label: "Telugu" },
	{ value: "ml", label: "Malayalam" },
];

export const WESTERN_SYNASTRY_CHART_TYPE_OPTIONS = [
	{ value: "zodiac-contact-chart", label: "Zodiacal Contact Chart" },
	{ value: "house-contact-chart", label: "House Contact Chart" },
];

/** Slugs handled by HoroscopeCalculatorsRouter */
export const HOROSCOPE_CALCULATOR_SLUGS = [
	"birth-details",
	"kundli",
	"mangal-dosha",
	"kaal-sarp-dosha",
	"sade-sati",
	"papa-dosham",
	"planet-position",
	"birth-chart",
	"dasha-periods",
	"yoga-details",
	"sudarshana-chakra",
	"planet-relationship",
	"ashtakavarga-sarvashtakavarga",
	"chandrashtama-periods",
	"gowri-nalla-neram",
	"kundli-matching",
	"nakshatra-porutham",
	"thirumana-porutham",
	"porutham",
	"papasamyam-check",
	"natal-chart",
	"transit-chart",
	"progression-chart",
	"solar-return-chart",
	"synastry-chart",
	"composite-chart",
] as const;

export type HoroscopeCalculatorSlug = (typeof HOROSCOPE_CALCULATOR_SLUGS)[number];

export function isHoroscopeCalculatorSlug(
	s: string
): s is HoroscopeCalculatorSlug {
	return (HOROSCOPE_CALCULATOR_SLUGS as readonly string[]).includes(s);
}
