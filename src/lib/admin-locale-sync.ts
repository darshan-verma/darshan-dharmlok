import type { ContentLang, LocaleTranslations } from "@/lib/content-lang";
import type { LocalizableModel } from "@/lib/localize-document";
import { TRANSLATABLE_FIELDS } from "@/lib/localize-document";

/** Fields edited inside admin LocaleTabs (shared fields like address stay outside). */
export const ADMIN_LOCALE_TAB_FIELDS: Partial<
	Record<LocalizableModel, readonly string[]>
> = {
	temple: [
		"description",
		"history",
		"additionalInfo",
		"rituals",
		"timings",
		"travelByAir",
		"travelByTrain",
		"travelByBus",
		"travelByRoad",
		"amenities",
	],
	dharamshala: [
		"description",
		"additionalInfo",
		"timings",
		"travelByAir",
		"travelByTrain",
		"travelByBus",
		"travelByRoad",
		"amenities",
	],
};

function resolveTabFields(
	model: LocalizableModel,
	fields?: readonly string[]
): string[] {
	if (fields?.length) return [...fields];
	const tab = ADMIN_LOCALE_TAB_FIELDS[model];
	if (tab?.length) return [...tab];
	return [...TRANSLATABLE_FIELDS[model]];
}

function parseTranslations(raw: unknown): LocaleTranslations {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		return { en: {}, hi: null };
	}
	return raw as LocaleTranslations;
}

export function pickTranslatableSlice(
	record: Record<string, unknown>,
	model: LocalizableModel,
	fields?: readonly string[]
): Record<string, unknown> {
	const fieldList = resolveTabFields(model, fields);
	const slice: Record<string, unknown> = {};
	for (const f of fieldList) {
		if (record[f] !== undefined) slice[f] = record[f];
	}
	return slice;
}

export function overlayTranslatable(
	record: Record<string, unknown>,
	slice: Record<string, unknown>,
	model: LocalizableModel,
	fields?: readonly string[]
): Record<string, unknown> {
	const next = { ...record };
	for (const f of resolveTabFields(model, fields)) {
		// Always replace flat fields from the target locale slice.
		// Missing keys must clear (not keep the previous locale's value),
		// otherwise Hindi/English content cross-contaminates on tab switch.
		if (slice[f] !== undefined && slice[f] !== null) {
			next[f] = slice[f];
		} else {
			next[f] = "";
		}
	}
	return next;
}

/** Persist active tab fields into translations, then load another locale into flat fields. */
export function switchContentLocale<T extends Record<string, unknown>>(
	record: T,
	model: LocalizableModel,
	fromLocale: ContentLang,
	toLocale: ContentLang,
	fields?: readonly string[]
): T {
	const translations = parseTranslations(record.translations);
	const slice = pickTranslatableSlice(record, model, fields);
	if (fromLocale === "hi") {
		translations.hi = { ...(translations.hi ?? {}), ...slice };
	} else {
		translations.en = { ...(translations.en ?? {}), ...slice };
	}

	const target =
		toLocale === "hi"
			? (translations.hi ?? {})
			: (translations.en ?? {});

	return {
		...overlayTranslatable(
			record,
			target as Record<string, unknown>,
			model,
			fields
		),
		translations,
	} as unknown as T;
}

function isLocaleObjectEmpty(
	slice: Record<string, unknown> | null | undefined
): boolean {
	if (!slice || typeof slice !== "object") return true;
	return Object.values(slice).every((v) => {
		if (v == null) return true;
		if (typeof v === "string") return v.trim() === "";
		if (Array.isArray(v)) return v.length === 0;
		return false;
	});
}

export function finalizeTranslationsPayload(
	record: Record<string, unknown>,
	model: LocalizableModel,
	activeLocale: ContentLang,
	fields?: readonly string[]
): LocaleTranslations {
	const translations = parseTranslations(record.translations);
	const slice = pickTranslatableSlice(record, model, fields);
	if (activeLocale === "hi") {
		translations.hi = { ...(translations.hi ?? {}), ...slice };
	} else {
		translations.en = { ...(translations.en ?? {}), ...slice };
	}
	const hi = translations.hi;
	return {
		en: translations.en ?? {},
		hi:
			!hi || typeof hi !== "object" || isLocaleObjectEmpty(hi)
				? null
				: translations.hi,
	};
}
