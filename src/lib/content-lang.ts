export const DEVANAGARI_RE = /[\u0900-\u097F]/;

export type ContentLang = "en" | "hi";
export type DetectedLang = ContentLang | "skip";
export type TranslationStatus = "none" | "partial" | "complete";

export type LocaleTranslations = Partial<
	Record<ContentLang, Record<string, unknown> | null>
>;

export function hasDevanagari(value: string): boolean {
	return DEVANAGARI_RE.test(value);
}

/** Recursively collect string values from a document field (including JSON blobs). */
export function collectStrings(value: unknown, out: string[] = []): string[] {
	if (value == null) return out;

	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed) return out;
		out.push(trimmed);
		if (
			(trimmed.startsWith("[") && trimmed.endsWith("]")) ||
			(trimmed.startsWith("{") && trimmed.endsWith("}"))
		) {
			try {
				collectStrings(JSON.parse(trimmed), out);
			} catch {
				/* use raw string only */
			}
		}
		return out;
	}

	if (Array.isArray(value)) {
		for (const item of value) collectStrings(item, out);
		return out;
	}

	if (typeof value === "object") {
		for (const v of Object.values(value as Record<string, unknown>)) {
			collectStrings(v, out);
		}
	}

	return out;
}

/** Scan all fields of a plain object (e.g. Mongo document). Skips _id. */
export function detectLang(doc: Record<string, unknown>): DetectedLang {
	const strings: string[] = [];
	for (const [key, value] of Object.entries(doc)) {
		if (key === "_id" || key === "id") continue;
		collectStrings(value, strings);
	}
	if (strings.length === 0) return "skip";
	if (strings.some(hasDevanagari)) return "hi";
	return "en";
}

export function parseLangQuery(param: string | null): ContentLang | null {
	if (param === null || param === undefined || param === "") return null;
	const normalized = param.trim().toLowerCase();
	if (normalized === "en" || normalized === "hi") return normalized;
	return null;
}

/** Alias for query ?lang= parsing */
export const parseLangParam = parseLangQuery;

export function parseLangBody(value: unknown): ContentLang | null {
	if (typeof value !== "string") return null;
	return parseLangQuery(value);
}

/** @deprecated Use parseLangParam for locale; do not filter DB by lang */
export function langFilterFromSearchParams(
	params: URLSearchParams
): { lang: ContentLang } | undefined {
	if (!params.has("lang")) return undefined;
	const lang = parseLangQuery(params.get("lang"));
	if (!lang) return undefined;
	return { lang };
}

function parseTranslations(raw: unknown): LocaleTranslations {
	if (!raw) return {};
	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw) as unknown;
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				return parsed as LocaleTranslations;
			}
		} catch {
			return {};
		}
		return {};
	}
	if (typeof raw !== "object" || Array.isArray(raw)) return {};
	return raw as LocaleTranslations;
}

function isEmptyTranslationValue(value: unknown): boolean {
	if (value == null) return true;
	if (typeof value === "string") return value.trim() === "";
	if (Array.isArray(value)) return value.length === 0;
	return false;
}

/** First defined, non-empty candidate (empty translation slots fall through to legacy root). */
function firstResolvableField(...candidates: unknown[]): unknown | undefined {
	for (const candidate of candidates) {
		if (!isEmptyTranslationValue(candidate)) return candidate;
	}
	return undefined;
}

function fieldToString(value: unknown): string {
	if (value == null) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	try {
		return JSON.stringify(value);
	} catch {
		return "";
	}
}

/** Resolve a translatable field: locale → en → root (pre-migration) → default. */
function resolveTranslationField(
	doc: { translations?: unknown } & Record<string, unknown>,
	locale: ContentLang,
	field: string
): unknown {
	const translations = parseTranslations(doc.translations);
	const resolved = firstResolvableField(
		translations[locale]?.[field],
		translations.en?.[field],
		doc[field]
	);
	if (resolved !== undefined) return resolved;
	return locale === "en" ? "" : null;
}

/** Read localized field with silent fallback to English and root-level legacy fields. */
export function getTranslation(
	doc: { translations?: unknown } & Record<string, unknown>,
	locale: ContentLang,
	field: string
): string {
	return fieldToString(resolveTranslationField(doc, locale, field));
}

/** Get raw translation value (preserves Json/array types). */
export function getTranslationValue(
	doc: { translations?: unknown } & Record<string, unknown>,
	locale: ContentLang,
	field: string
): unknown {
	return resolveTranslationField(doc, locale, field);
}

export function mergeTranslation(
	existing: unknown,
	locale: ContentLang,
	fields: Record<string, unknown>
): LocaleTranslations {
	const base = parseTranslations(existing);
	const currentLocale = { ...(base[locale] ?? {}), ...fields };
	const next: LocaleTranslations = {
		...base,
		[locale]: currentLocale,
	};
	return next;
}

export function computeTranslationStatus(
	translations: unknown,
	translatableFields: string[]
): TranslationStatus {
	const parsed = parseTranslations(translations);
	const hi = parsed.hi;
	if (!hi || typeof hi !== "object") return "none";

	let filled = 0;
	for (const field of translatableFields) {
		if (!isEmptyTranslationValue(hi[field])) filled++;
	}
	if (filled === 0) return "none";
	if (filled >= translatableFields.length) return "complete";
	return "partial";
}

export function updateTranslationStatus(
	translations: unknown,
	translatableFields: string[]
): { translationStatus: TranslationStatus } {
	return {
		translationStatus: computeTranslationStatus(
			translations,
			translatableFields
		),
	};
}

/** Build translations from flat body + optional existing doc (back-compat). */
export function buildTranslationsFromBody(
	body: Record<string, unknown>,
	translatableFields: string[],
	existing?: { translations?: unknown }
): LocaleTranslations {
	const existingTranslations = parseTranslations(existing?.translations);
	const fromNested = parseTranslations(body.translations);

	let result: LocaleTranslations = {
		en: { ...(existingTranslations.en ?? {}) },
		hi: existingTranslations.hi ?? null,
	};

	if (fromNested.en && typeof fromNested.en === "object") {
		result.en = { ...result.en, ...fromNested.en };
	}
	if (fromNested.hi === null) {
		result.hi = null;
	} else if (fromNested.hi && typeof fromNested.hi === "object") {
		result.hi = { ...(result.hi ?? {}), ...fromNested.hi };
	}

	const locale = parseLangBody(body.locale);
	if (locale) {
		const slice: Record<string, unknown> = {};
		for (const field of translatableFields) {
			if (body[field] !== undefined) slice[field] = body[field];
		}
		if (Object.keys(slice).length > 0) {
			result = mergeTranslation(result, locale, slice);
		}
	}

	return result;
}

export function isHiLocaleEmpty(
	translations: LocaleTranslations,
	translatableFields: string[]
): boolean {
	const hi = translations.hi;
	if (!hi || typeof hi !== "object") return true;
	return translatableFields.every((f) => isEmptyTranslationValue(hi[f]));
}

export function finalizeTranslations(
	translations: LocaleTranslations,
	translatableFields: string[]
): { translations: LocaleTranslations; translationStatus: TranslationStatus } {
	const next = { ...translations };
	if (isHiLocaleEmpty(next, translatableFields)) {
		next.hi = null;
	}
	return {
		translations: next,
		translationStatus: computeTranslationStatus(next, translatableFields),
	};
}
