import { getTranslationValue, type ContentLang } from "@/lib/content-lang";

export type LocalizableModel =
	| "temple"
	| "templeFaq"
	| "dharamshala"
	| "dharamshalaFaq"
	| "blog"
	| "event"
	| "poojaCategory"
	| "panditji";

export const TRANSLATABLE_FIELDS: Record<LocalizableModel, string[]> = {
	temple: [
		"name",
		"description",
		"history",
		"additionalInfo",
		"rituals",
		"address",
		"location",
		"travelByAir",
		"travelByTrain",
		"travelByBus",
		"travelByRoad",
		"timings",
		"amenities",
	],
	templeFaq: ["question", "answer"],
	dharamshala: [
		"name",
		"description",
		"additionalInfo",
		"address",
		"location",
		"travelByAir",
		"travelByTrain",
		"travelByBus",
		"travelByRoad",
		"timings",
		"amenities",
	],
	dharamshalaFaq: ["question", "answer"],
	blog: ["title", "content"],
	event: [
		"title",
		"description",
		"address",
		"place",
		"location",
		"fromTime",
		"toTime",
	],
	poojaCategory: ["name", "description", "details"],
	panditji: ["name", "bio", "description", "category"],
};

const MODEL_ALIASES: Record<string, LocalizableModel> = {
	Temple: "temple",
	TempleFaq: "templeFaq",
	Dharamshala: "dharamshala",
	DharamshalaFaq: "dharamshalaFaq",
	Blog: "blog",
	Event: "event",
	PoojaCategory: "poojaCategory",
	User: "panditji",
};

export function getTranslatableFields(model: LocalizableModel): string[] {
	return TRANSLATABLE_FIELDS[model];
}

export function flattenDocument<T extends Record<string, unknown>>(
	doc: T,
	model: LocalizableModel,
	locale: ContentLang
): T {
	const fields = TRANSLATABLE_FIELDS[model];
	const out = { ...doc } as T;

	for (const field of fields) {
		// locale → en → root (pre-migration) via getTranslationValue
		const value = getTranslationValue(doc, locale, field);
		(out as Record<string, unknown>)[field] =
			value !== null && value !== undefined
				? value
				: locale === "en"
					? ""
					: null;
	}

	return out;
}

export function flattenFaqList<T extends Record<string, unknown>>(
	faqs: T[],
	model: "templeFaq" | "dharamshalaFaq",
	locale: ContentLang
): T[] {
	return faqs.map((faq) => flattenDocument(faq, model, locale));
}

export function flattenTempleWithFaqs<
	T extends Record<string, unknown> & {
		templeFaq?: Record<string, unknown>[];
	},
>(temple: T, locale: ContentLang): T {
	const flat = flattenDocument(temple, "temple", locale);
	if (Array.isArray(temple.templeFaq)) {
		(flat as T & { templeFaq: Record<string, unknown>[] }).templeFaq =
			flattenFaqList(temple.templeFaq, "templeFaq", locale);
	}
	return flat;
}

export function flattenDharamshalaWithFaqs<
	T extends Record<string, unknown> & {
		dharamshalaFaqs?: Record<string, unknown>[];
	},
>(dharamshala: T, locale: ContentLang): T {
	const flat = flattenDocument(dharamshala, "dharamshala", locale);
	if (Array.isArray(dharamshala.dharamshalaFaqs)) {
		(flat as T & { dharamshalaFaqs: Record<string, unknown>[] }).dharamshalaFaqs =
			flattenFaqList(dharamshala.dharamshalaFaqs, "dharamshalaFaq", locale);
	}
	return flat;
}

export function modelFromCollection(collection: string): LocalizableModel | null {
	return MODEL_ALIASES[collection] ?? null;
}
