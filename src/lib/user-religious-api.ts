import type { Prisma } from "@prisma/client";
import {
	applyReligiousCategoryFilter,
	buildDualWriteReligiousFields,
	mapWithReligiousCategories,
} from "@/lib/religious-categories";

export function parseReligiousCategoriesFromFormData(
	formData: FormData
): Pick<Prisma.UserUpdateInput, "category" | "religiousCategories"> | null {
	const religiousCategoriesRaw = formData.get("religiousCategories");
	const categoryRaw = formData.get("category");
	if (!religiousCategoriesRaw && !categoryRaw) return null;

	let religiousCategoriesInput: unknown;
	if (religiousCategoriesRaw) {
		try {
			religiousCategoriesInput = JSON.parse(
				religiousCategoriesRaw as string
			);
		} catch {
			religiousCategoriesInput = religiousCategoriesRaw;
		}
	}

	return buildDualWriteReligiousFields({
		religiousCategories: religiousCategoriesInput,
		category: (categoryRaw as string) || undefined,
	});
}

export function applyUserReligiousFilter(
	where: Prisma.UserWhereInput,
	religiousCategory: string | null
): Prisma.UserWhereInput {
	return applyReligiousCategoryFilter(where, religiousCategory);
}

export function resolveUserReligiousUpdate(
	data: Record<string, unknown>
): Pick<Prisma.UserUpdateInput, "category" | "religiousCategories"> | null {
	if (
		data.religiousCategories === undefined &&
		data.category === undefined
	) {
		return null;
	}
	const { religiousCategories, category } = buildDualWriteReligiousFields({
		religiousCategories: data.religiousCategories,
		category: data.category as string | null,
	});
	return { religiousCategories, category };
}

export { mapWithReligiousCategories };
