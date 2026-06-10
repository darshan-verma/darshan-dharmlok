"use client";

import {
	getReligiousCategoryColor,
	resolveReligiousCategories,
} from "@/lib/religious-categories";

interface ReligiousCategoryBadgesProps {
	religiousCategories?: string[] | null;
	category?: string | null;
	emptyLabel?: string;
}

export function ReligiousCategoryBadges({
	religiousCategories,
	category,
	emptyLabel = "Uncategorized",
}: ReligiousCategoryBadgesProps) {
	const categories = resolveReligiousCategories({
		religiousCategories,
		category,
	});

	if (categories.length === 0) {
		return (
			<span className="text-xs text-muted-foreground">{emptyLabel}</span>
		);
	}

	return (
		<div className="flex flex-wrap gap-1">
			{categories.map((cat) => (
				<span
					key={cat}
					className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getReligiousCategoryColor(cat)}`}
				>
					{cat}
				</span>
			))}
		</div>
	);
}
