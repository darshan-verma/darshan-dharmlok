import type { LocalizableModel } from "@/lib/localize-document";
import { TRANSLATABLE_FIELDS } from "@/lib/localize-document";

export type TranslationSearchField =
	| "name"
	| "title"
	| "address"
	| "description"
	| "location"
	| "place";

const DEFAULT_SEARCH_FIELDS: Record<LocalizableModel, TranslationSearchField[]> =
	{
		temple: ["name", "address", "location"],
		templeFaq: [],
		dharamshala: ["name", "address", "location"],
		dharamshalaFaq: [],
		blog: ["title"],
		event: ["title", "place", "location", "address"],
		poojaCategory: ["name", "description"],
		panditji: ["name", "description"],
	};

function escapeRegex(term: string): string {
	return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build Mongo $or clauses for translation path search. */
export function buildTranslationSearchOr(
	model: LocalizableModel,
	term: string,
	fields?: TranslationSearchField[]
): Record<string, unknown>[] {
	const searchable =
		fields ??
		DEFAULT_SEARCH_FIELDS[model].filter((f) =>
			TRANSLATABLE_FIELDS[model].includes(f)
		);

	if (!term.trim() || searchable.length === 0) return [];

	const regex = { $regex: escapeRegex(term.trim()), $options: "i" };
	const clauses: Record<string, unknown>[] = [];

	for (const field of searchable) {
		clauses.push({ [`translations.en.${field}`]: regex });
		clauses.push({ [`translations.hi.${field}`]: regex });
		// Pre-migration documents may still store text at the document root.
		clauses.push({ [field]: regex });
	}

	return clauses;
}

export function mergeSearchIntoFilter(
	baseFilter: Record<string, unknown>,
	searchOr: Record<string, unknown>[]
): Record<string, unknown> {
	if (searchOr.length === 0) return baseFilter;
	if (Object.keys(baseFilter).length === 0) {
		return { $or: searchOr };
	}
	return { $and: [baseFilter, { $or: searchOr }] };
}
