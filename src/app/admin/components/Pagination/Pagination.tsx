"use client";

import { Button } from "@/components/ui/button";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	onPageChange: (page: number) => void;
}

export default function Pagination({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
}: PaginationProps) {
	return (
		<div className="flex items-center justify-between mt-4">
			<p className="text-sm text-gray-500">
				Showing {itemsPerPage} of {totalItems} items
			</p>
			<div className="flex items-center gap-4">
				<p className="text-sm text-gray-500">
					Page {currentPage} of {totalPages}
				</p>
				<div className="flex items-center gap-2">
					<Button
						onClick={() => onPageChange(1)}
						disabled={currentPage === 1}
						variant="outline"
						size="sm"
					>
						←←
					</Button>
					<Button
						onClick={() => onPageChange(currentPage - 1)}
						disabled={currentPage === 1}
						variant="outline"
						size="sm"
					>
						←
					</Button>
					<Button
						onClick={() => onPageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						variant="outline"
						size="sm"
					>
						→
					</Button>
					<Button
						onClick={() => onPageChange(totalPages)}
						disabled={currentPage === totalPages}
						variant="outline"
						size="sm"
					>
						→→
					</Button>
				</div>
			</div>
		</div>
	);
}
