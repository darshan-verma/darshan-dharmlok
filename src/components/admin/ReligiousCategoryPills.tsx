"use client";

import { cn } from "@/lib/utils";
import {
	RELIGIOUS_CATEGORIES,
	type ReligiousCategory,
} from "@/lib/religious-categories";

interface ReligiousCategoryPillsProps {
	value: ReligiousCategory[];
	onChange: (value: ReligiousCategory[]) => void;
	label?: string;
	className?: string;
	allowEmpty?: boolean;
}

export function ReligiousCategoryPills({
	value,
	onChange,
	label = "Religious Category",
	className,
	allowEmpty = true,
}: ReligiousCategoryPillsProps) {
	const toggle = (category: ReligiousCategory) => {
		if (value.includes(category)) {
			const next = value.filter((c) => c !== category);
			if (!allowEmpty && next.length === 0) return;
			onChange(next);
		} else {
			onChange([...value, category]);
		}
	};

	return (
		<div className={cn("space-y-2", className)}>
			<p className="text-sm font-medium text-foreground">{label}</p>
			<div className="flex flex-wrap gap-2">
				{RELIGIOUS_CATEGORIES.map((category) => {
					const active = value.includes(category);
					return (
						<button
							key={category}
							type="button"
							onClick={() => toggle(category)}
							className={cn(
								"rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
								active
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
							)}
						>
							{category}
						</button>
					);
				})}
			</div>
			{value.length === 0 && (
				<p className="text-xs text-muted-foreground">Uncategorized</p>
			)}
		</div>
	);
}
