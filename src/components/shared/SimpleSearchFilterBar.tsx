"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReligiousCategoryFilter } from "@/components/shared/ReligiousCategoryFilter";

const FRONTEND_SELECT_CLASS =
	"h-11 w-full rounded-xl border-white/60 bg-white/55 text-[#243142] data-[placeholder]:text-[#738295]";

interface SimpleSearchFilterBarProps {
	page: string;
	searchQuery: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder: string;
	religiousValue: string;
	onReligiousChange: (value: string) => void;
	onClear: () => void;
	resultText?: string;
}

export function SimpleSearchFilterBar({
	page,
	searchQuery,
	onSearchChange,
	searchPlaceholder,
	religiousValue,
	onReligiousChange,
	onClear,
	resultText,
}: SimpleSearchFilterBarProps) {
	const hasActiveFilters =
		searchQuery.trim() !== "" || religiousValue !== "all";

	return (
		<div className="mb-8 rounded-2xl border border-white/50 bg-white/35 p-3 md:p-4 backdrop-blur-xl shadow-[0_10px_28px_rgba(40,32,20,0.12)]">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
				<div className="relative w-full lg:flex-[1.2]">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8b9c]" />
					<Input
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={searchPlaceholder}
						className="h-11 rounded-xl border-white/60 bg-white/55 pl-10 text-[#243142] placeholder:text-[#738295] focus-visible:border-white/80 focus-visible:ring-white/70"
						aria-label={searchPlaceholder}
					/>
				</div>

				<ReligiousCategoryFilter
					variant="select"
					hideLabel
					allLabel="All traditions"
					value={religiousValue}
					onChange={onReligiousChange}
					page={page}
					className="w-full sm:w-[200px]"
					selectClassName={FRONTEND_SELECT_CLASS}
				/>

				{hasActiveFilters && (
					<Button
						type="button"
						variant="outline"
						className="h-11 rounded-xl border-white/65 bg-white/60 text-[#2c3a4e] hover:bg-white/75 hover:text-[#1f2b3d] lg:ml-auto"
						onClick={onClear}
					>
						<X className="h-4 w-4" />
						Clear filters
					</Button>
				)}
			</div>

			{resultText && (
				<p className="mt-3 text-sm text-[#65778f]">{resultText}</p>
			)}
		</div>
	);
}
