"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CARDS_PER_PAGE = 9;

interface CardsPaginationProps {
	currentPage: number;
	totalPages: number;
	totalCount: number;
	onPageChange: (page: number) => void;
	className?: string;
}

export function CardsPagination({
	currentPage,
	totalPages,
	totalCount,
	onPageChange,
	className,
}: CardsPaginationProps) {
	if (totalPages <= 1) return null;

	const start = (currentPage - 1) * CARDS_PER_PAGE + 1;
	const end = Math.min(currentPage * CARDS_PER_PAGE, totalCount);

	// Show page numbers around current, with ellipsis when needed
	const getPageNumbers = (): (number | "ellipsis")[] => {
		if (totalPages <= 5) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}
		const pages: (number | "ellipsis")[] = [];
		const showStart = currentPage > 2;
		const showEnd = currentPage < totalPages - 1;
		if (showStart) pages.push(1, "ellipsis");
		const from = showStart ? Math.max(2, currentPage - 1) : 1;
		const to = showEnd ? Math.min(totalPages - 1, currentPage + 1) : totalPages;
		for (let i = from; i <= to; i++) pages.push(i);
		if (showEnd) pages.push("ellipsis", totalPages);
		return pages;
	};

	return (
		<div
			className={cn(
				"flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-gray-200",
				className
			)}
		>
			<p className="text-sm text-gray-500 order-2 sm:order-1">
				Showing {start}–{end} of {totalCount}
			</p>
			<div className="flex items-center gap-1 order-1 sm:order-2">
				<Button
					variant="outline"
					size="icon"
					className="h-9 w-9 rounded-lg"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage <= 1}
					aria-label="Previous page"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<div className="flex items-center gap-1 mx-1">
					{getPageNumbers().map((p, i) =>
						p === "ellipsis" ? (
							<span key={`ellipsis-${i}`} className="px-2 text-gray-400">
								…
							</span>
						) : (
							<Button
								key={p}
								variant={currentPage === p ? "default" : "outline"}
								size="sm"
								className="h-9 w-9 rounded-lg p-0"
								onClick={() => onPageChange(p)}
								aria-label={`Page ${p}`}
								aria-current={currentPage === p ? "page" : undefined}
							>
								{p}
							</Button>
						)
					)}
				</div>
				<Button
					variant="outline"
					size="icon"
					className="h-9 w-9 rounded-lg"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage >= totalPages}
					aria-label="Next page"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

export { CARDS_PER_PAGE };
