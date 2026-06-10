import type { Prisma } from "@prisma/client";

/** Canonical religious tradition values for filtering and tagging. */
export const RELIGIOUS_CATEGORIES = [
	"Sanatan",
	"Jain",
	"Buddhist",
	"Sikh",
] as const;

export type ReligiousCategory = (typeof RELIGIOUS_CATEGORIES)[number];

/** Empty array means uncategorized — no tradition assigned. */
export const UNCATEGORIZED: readonly ReligiousCategory[] = [];

const LEGACY_CATEGORY_MAP: Record<string, ReligiousCategory> = {
	Sanatan: "Sanatan",
	Jain: "Jain",
	Sikh: "Sikh",
	Buddhism: "Buddhist",
	Buddhist: "Buddhist",
};

const RELIGIOUS_SET = new Set<string>(RELIGIOUS_CATEGORIES);

export function isUncategorized(
	categories: string[] | null | undefined
): boolean {
	return !categories || categories.length === 0;
}

export function normalizeReligiousCategory(
	value: string | null | undefined
): ReligiousCategory | null {
	if (!value || typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	const mapped = LEGACY_CATEGORY_MAP[trimmed] ?? trimmed;
	return RELIGIOUS_SET.has(mapped) ? (mapped as ReligiousCategory) : null;
}

export function normalizeReligiousCategories(
	input: unknown
): ReligiousCategory[] {
	if (!input) return [];
	const raw: unknown[] = Array.isArray(input)
		? input
		: typeof input === "string"
			? input.split(",")
			: [];
	const seen = new Set<ReligiousCategory>();
	const result: ReligiousCategory[] = [];
	for (const item of raw) {
		const normalized = normalizeReligiousCategory(String(item));
		if (normalized && !seen.has(normalized)) {
			seen.add(normalized);
			result.push(normalized);
		}
	}
	return result;
}

/** Release 1 dual-write: primary legacy category from first tradition. */
export function syncLegacyCategory(
	religiousCategories: ReligiousCategory[]
): string | null {
	return religiousCategories[0] ?? null;
}

export function legacyCategoryToReligiousCategories(
	category: string | null | undefined
): ReligiousCategory[] {
	const normalized = normalizeReligiousCategory(category);
	return normalized ? [normalized] : [];
}

/** Resolve categories for API responses (array preferred, legacy fallback). */
export function resolveReligiousCategories(record: {
	religiousCategories?: string[] | null;
	category?: string | null;
}): ReligiousCategory[] {
	if (record.religiousCategories && record.religiousCategories.length > 0) {
		return normalizeReligiousCategories(record.religiousCategories);
	}
	return legacyCategoryToReligiousCategories(record.category);
}

export function parseReligiousCategoryParam(
	param: string | null | undefined
): ReligiousCategory[] {
	if (!param || param.trim() === "" || param.trim().toLowerCase() === "all") {
		return [];
	}
	return normalizeReligiousCategories(param.split(","));
}

/** Prisma where clause for religiousCategory query param. Empty param = no filter. */
export function buildReligiousCategoryWhere(
	param: string | null | undefined
): Prisma.UserWhereInput["religiousCategories"] extends never
	? Record<string, unknown>
	: Record<string, unknown> {
	const categories = parseReligiousCategoryParam(param);
	if (categories.length === 0) {
		return {};
	}
	if (categories.length === 1) {
		return { religiousCategories: { has: categories[0] } };
	}
	return { religiousCategories: { hasSome: categories } };
}

/** Merge religious filter into an existing Prisma where object. */
export function applyReligiousCategoryFilter<T extends Record<string, unknown>>(
	where: T,
	param: string | null | undefined
): T {
	const filter = buildReligiousCategoryWhere(param);
	if (Object.keys(filter).length === 0) return where;
	return { ...where, ...filter };
}

/** Mongo raw filter — document array must contain any selected tradition. */
export function buildReligiousCategoryMongoFilter(
	param: string | null | undefined
): Record<string, unknown> {
	const categories = parseReligiousCategoryParam(param);
	if (categories.length === 0) return {};
	if (categories.length === 1) {
		return { religiousCategories: categories[0] };
	}
	return { religiousCategories: { $in: categories } };
}

export function mergeMongoReligiousFilter(
	base: Record<string, unknown>,
	param: string | null | undefined
): Record<string, unknown> {
	const religious = buildReligiousCategoryMongoFilter(param);
	if (Object.keys(religious).length === 0) return base;
	return Object.keys(base).length === 0
		? religious
		: { $and: [base, religious] };
}

/** Dual-write payload for User/Event Release 1. */
export function buildDualWriteReligiousFields(input: {
	religiousCategories?: unknown;
	category?: string | null;
}): { religiousCategories: ReligiousCategory[]; category: string | null } {
	const hasArrayInput =
		input.religiousCategories !== undefined &&
		input.religiousCategories !== null;
	const religiousCategories = hasArrayInput
		? normalizeReligiousCategories(input.religiousCategories)
		: legacyCategoryToReligiousCategories(input.category);
	const category =
		syncLegacyCategory(religiousCategories) ??
		(input.category?.trim() ? input.category.trim() : null);
	return { religiousCategories, category };
}

export function hasReligiousCategoryInput(input: {
	religiousCategories?: unknown;
	category?: string | null;
}): boolean {
	if (
		Array.isArray(input.religiousCategories) &&
		input.religiousCategories.length > 0
	) {
		return true;
	}
	return Boolean(input.category?.trim());
}

/** Attach resolved religiousCategories to API records. */
export function mapWithReligiousCategories<
	T extends { category?: string | null; religiousCategories?: string[] | null },
>(record: T): T & { religiousCategories: ReligiousCategory[] } {
	return {
		...record,
		religiousCategories: resolveReligiousCategories(record),
	};
}

/** Tailwind badge classes for a religious tradition label. */
export function getReligiousCategoryColor(category: string): string {
	const normalized = category === "Buddhism" ? "Buddhist" : category;
	switch (normalized) {
		case "Sanatan":
			return "bg-orange-100 text-orange-800";
		case "Jain":
			return "bg-rose-100 text-rose-800";
		case "Sikh":
			return "bg-indigo-100 text-indigo-800";
		case "Buddhist":
			return "bg-emerald-100 text-emerald-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

/** Client-side filter: item matches if any selected tradition overlaps. */
export function matchesReligiousFilter(
	itemCategories: string[] | null | undefined,
	filterParam: string | null | undefined
): boolean {
	const filter = parseReligiousCategoryParam(filterParam);
	if (filter.length === 0) return true;
	const item = normalizeReligiousCategories(itemCategories ?? []);
	if (item.length === 0) return false;
	return filter.some((f) => item.includes(f));
}
