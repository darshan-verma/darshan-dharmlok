import type { ProkeralaReportChartStyle } from "@/app/api/prokerala/_validation";
import type { ProkeralaReportModule } from "@/types/prokerala";

/** Mangal Dosha Report — modules from product screenshots */
export function buildPersonalMangalDoshaModules(
	chartStyle: ProkeralaReportChartStyle
): ProkeralaReportModule[] {
	return [
		{ code: "birth-details" },
		{ code: "chart", options: { chart_style: chartStyle } },
		{ code: "planet-position" },
		{ code: "mangal-dosha" },
	];
}

/** Full Personal Report — extended module list */
export function buildPersonalFullReportModules(
	chartStyle: ProkeralaReportChartStyle
): ProkeralaReportModule[] {
	return [
		{ code: "birth-details" },
		{ code: "chart", options: { chart_style: chartStyle } },
		{ code: "planet-position" },
		{ code: "mangal-dosha" },
		{ code: "yoga-details" },
		{ code: "kaal-sarp-dosha" },
		{ code: "sade-sati" },
		{ code: "shodashvarga-chart" },
		{
			code: "dasa-periods",
			options: {
				antardasha: "all",
				pratyantardasha: "none",
				year_length: 1,
			},
		},
		{ code: "planet-relationship" },
	];
}

export function buildCompatibilityKundliMatchingModules(): ProkeralaReportModule[] {
	return [
		{ code: "birth-details" },
		{ code: "mangal-dosha" },
		{ code: "kundli-matching" },
	];
}

export function buildCompatibilityKeralaPoruthamModules(): ProkeralaReportModule[] {
	return [
		{ code: "birth-details" },
		{ code: "mangal-dosha" },
		{ code: "porutham-kerala" },
	];
}

export function buildCompatibilityTamilPoruthamModules(): ProkeralaReportModule[] {
	return [
		{ code: "birth-details" },
		{ code: "mangal-dosha" },
		{ code: "porutham-tamil" },
	];
}

export const PERSONAL_PRESET_LABELS = {
	mangal: "Mangal Dosha Report",
	full: "Personal Report",
} as const;

export const COMPAT_PRESET_LABELS = {
	kundli: "Kundli Matching",
	kerala: "Kerala Porutham",
	tamil: "Tamil Porutham",
} as const;

/** Read-only module tags for UI (space-separated for display) */
export const PERSONAL_PRESET_MODULE_TAGS: Record<keyof typeof PERSONAL_PRESET_LABELS, string> =
	{
		mangal: "birth-details chart planet-position mangal-dosha",
		full: "birth-details chart planet-position mangal-dosha yoga-details kaal-sarp-dosha sade-sati shodashvarga-chart dasa-periods planet-relationship",
	};

export const COMPAT_PRESET_MODULE_TAGS: Record<keyof typeof COMPAT_PRESET_LABELS, string> = {
	kundli: "birth-details mangal-dosha kundli-matching",
	kerala: "birth-details mangal-dosha porutham-kerala",
	tamil: "birth-details mangal-dosha porutham-tamil",
};
