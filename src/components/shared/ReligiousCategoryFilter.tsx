"use client";

import { cn } from "@/lib/utils";
import {
	RELIGIOUS_CATEGORIES,
	type ReligiousCategory,
} from "@/lib/religious-categories";
import {
	trackReligiousFilterApplied,
	trackReligiousFilterCleared,
} from "@/lib/analytics";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface ReligiousCategoryFilterProps {
	value: string;
	onChange: (value: string) => void;
	page: string;
	className?: string;
	label?: string;
	variant?: "pills" | "select";
	/** Classes for the select trigger when variant is "select". */
	selectClassName?: string;
	hideLabel?: boolean;
	allLabel?: string;
}

export function ReligiousCategoryFilter({
	value,
	onChange,
	page,
	className,
	label = "Religious Category",
	variant = "pills",
	selectClassName,
	hideLabel = false,
	allLabel = "All",
}: ReligiousCategoryFilterProps) {
	const handleSelect = (next: string) => {
		onChange(next);
		if (next === "all") {
			trackReligiousFilterCleared(page);
		} else {
			trackReligiousFilterApplied(page, next);
		}
	};

	if (variant === "select") {
		return (
			<div className={cn(className)}>
				{!hideLabel && (
					<p className="mb-2 text-sm font-medium text-foreground">{label}</p>
				)}
				<Select value={value} onValueChange={handleSelect}>
					<SelectTrigger
						className={cn("h-8", selectClassName)}
						aria-label={hideLabel ? label : undefined}
					>
						<SelectValue placeholder={label} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{allLabel}</SelectItem>
						{RELIGIOUS_CATEGORIES.map((category: ReligiousCategory) => (
							<SelectItem key={category} value={category}>
								{category}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		);
	}

	return (
		<div className={cn("space-y-2", className)}>
			<p className="text-sm font-medium text-foreground">{label}</p>
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => handleSelect("all")}
					className={cn(
						"rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
						value === "all"
							? "border-primary bg-primary text-primary-foreground"
							: "border-border bg-background text-muted-foreground hover:border-primary/50"
					)}
				>
					All
				</button>
				{RELIGIOUS_CATEGORIES.map((category: ReligiousCategory) => (
					<button
						key={category}
						type="button"
						onClick={() => handleSelect(category)}
						className={cn(
							"rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
							value === category
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-background text-muted-foreground hover:border-primary/50"
						)}
					>
						{category}
					</button>
				))}
			</div>
		</div>
	);
}
