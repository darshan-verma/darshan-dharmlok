import { useState} from "react";

interface PaginationState {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
}

export function usePagination(
	initialPage: number = 1,
	initialItemsPerPage: number = 12
): [
	PaginationState,
	(page: number) => void,
	(totalItems: number, totalPages: number) => void
] {
	const [state, setState] = useState<PaginationState>({
		currentPage: initialPage,
		totalPages: 1,
		totalItems: 0,
		itemsPerPage: initialItemsPerPage,
	});

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= state.totalPages) {
			setState((prev) => ({ ...prev, currentPage: newPage }));
		}
	};

	const updatePagination = (totalItems: number, totalPages: number) => {
		setState((prev) => ({
			...prev,
			totalItems,
			totalPages,
		}));
	};

	return [state, handlePageChange, updatePagination];
}
