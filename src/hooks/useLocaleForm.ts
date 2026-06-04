"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
	ContentLang,
	LocaleTranslations,
	TranslationStatus,
} from "@/lib/content-lang";
import { computeTranslationStatus } from "@/lib/content-lang";

type RecordWithTranslations = {
	translations?: unknown;
	translationStatus?: TranslationStatus;
} & Record<string, unknown>;

function parseTranslations(raw: unknown): LocaleTranslations {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
	return raw as LocaleTranslations;
}

function pickSlice(
	record: RecordWithTranslations | undefined,
	fields: string[],
	locale: ContentLang
): Record<string, unknown> {
	if (!record) return {};
	const translations = parseTranslations(record.translations);
	const fromLocale = translations[locale];
	const slice: Record<string, unknown> = {};
	for (const field of fields) {
		if (
			fromLocale &&
			typeof fromLocale === "object" &&
			fromLocale[field] !== undefined &&
			fromLocale[field] !== null
		) {
			slice[field] = fromLocale[field];
		} else if (locale === "en" && record[field] !== undefined) {
			slice[field] = record[field];
		} else {
			slice[field] = locale === "en" ? "" : null;
		}
	}
	return slice;
}

export function useLocaleForm(
	translatableFields: string[],
	initialRecord?: RecordWithTranslations | null
) {
	const searchParams = useSearchParams();
	const initialTab = searchParams.get("tab") === "hi" ? "hi" : "en";

	const [activeLocale, setActiveLocale] = useState<ContentLang>(initialTab);
	const [translations, setTranslations] = useState<LocaleTranslations>(() => {
		const parsed = parseTranslations(initialRecord?.translations);
		const en = {
			...pickSlice(initialRecord ?? undefined, translatableFields, "en"),
			...(parsed.en && typeof parsed.en === "object" ? parsed.en : {}),
		};
		const hi =
			parsed.hi === null
				? null
				: {
						...pickSlice(initialRecord ?? undefined, translatableFields, "hi"),
						...(parsed.hi && typeof parsed.hi === "object" ? parsed.hi : {}),
					};
		return { en, hi };
	});

	const translationStatus = useMemo(
		() => computeTranslationStatus(translations, translatableFields),
		[translations, translatableFields]
	);

	const getField = useCallback(
		(field: string): unknown => {
			const slice = translations[activeLocale];
			if (slice && typeof slice === "object" && field in slice) {
				return (slice as Record<string, unknown>)[field];
			}
			return activeLocale === "en" ? "" : null;
		},
		[translations, activeLocale]
	);

	const setField = useCallback(
		(field: string, value: unknown) => {
			setTranslations((prev) => {
				const next = { ...prev };
				if (activeLocale === "hi") {
					const hi =
						prev.hi && typeof prev.hi === "object"
							? { ...prev.hi }
							: ({} as Record<string, unknown>);
					hi[field] = value;
					next.hi = hi;
				} else {
					const en = {
						...(prev.en && typeof prev.en === "object" ? prev.en : {}),
					} as Record<string, unknown>;
					en[field] = value;
					next.en = en;
				}
				return next;
			});
		},
		[activeLocale]
	);

	const loadFromRecord = useCallback(
		(record: RecordWithTranslations | null | undefined) => {
			if (!record) return;
			const parsed = parseTranslations(record.translations);
			setTranslations({
				en: {
					...pickSlice(record, translatableFields, "en"),
					...(parsed.en && typeof parsed.en === "object" ? parsed.en : {}),
				},
				hi:
					parsed.hi === null
						? null
						: {
								...pickSlice(record, translatableFields, "hi"),
								...(parsed.hi && typeof parsed.hi === "object"
									? parsed.hi
									: {}),
							},
			});
		},
		[translatableFields]
	);

	const toTranslationsPayload = useCallback((): {
		translations: LocaleTranslations;
		translationStatus: TranslationStatus;
	} => {
		const hiEmpty =
			!translations.hi ||
			typeof translations.hi !== "object" ||
			translatableFields.every((f) => {
				const v = (translations.hi as Record<string, unknown>)[f];
				return v == null || (typeof v === "string" && v.trim() === "");
			});
		const normalized: LocaleTranslations = {
			en: translations.en ?? {},
			hi: hiEmpty ? null : translations.hi,
		};
		return {
			translations: normalized,
			translationStatus: computeTranslationStatus(
				normalized,
				translatableFields
			),
		};
	}, [translations, translatableFields]);

	return {
		activeLocale,
		setActiveLocale,
		getField,
		setField,
		translations,
		setTranslations,
		translationStatus,
		loadFromRecord,
		toTranslationsPayload,
	};
}
