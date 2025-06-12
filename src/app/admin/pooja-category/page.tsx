"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import PoojaCategoryTable, {
	PoojaCategory,
} from "../components/pooja_category/PoojaCategoryTable";
import PoojaCategoryForm from "../components/pooja_category/PoojaCategoryForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
}

export default function PoojaCategoryPage() {
	const [poojaCategories, setPoojaCategories] = useState<PoojaCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentPooja, setCurrentPooja] =
		useState<Partial<PoojaCategory> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [poojaToDelete, setPoojaToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [pagination, handlePageChange, updatePagination] = usePagination(1, 12);

	// Fetch pooja categories on component mount and page change
	useEffect(() => {
		const fetchCategories = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/pooja-categories?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);
				if (!response.ok) throw new Error(`API error: ${response.status}`);
				const data = await response.json();

				// Map API response to PoojaCategory structure
				type ApiPoojaCategory = {
					id: string;
					name?: string;
					description?: string;
					date?: string;
					price?: number;
					details?: string;
					status?: string;
				};
				const mapped = data.categories.map((item: ApiPoojaCategory) => ({
					id: item.id,
					name: item.name || "",
					description: item.description || "",
					date: item.date || "",
					price: item.price ?? undefined,
					details: item.details || "",
					status: item.status || "Inactive", // add status mapping
				}));
				setPoojaCategories(mapped);
				updatePagination(data.total, data.pagination.totalPages);
			} catch {
				toast.error("Failed to load pooja categories");
			} finally {
				setLoading(false);
			}
		};
		fetchCategories();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage]);

	const handleAddPoojaCategory = () => {
		setCurrentPooja(null);
		setIsFormOpen(true);
	};

	const handleEditPoojaCategory = (pooja: PoojaCategory) => {
		setCurrentPooja({ ...pooja });
		setIsFormOpen(true);
	};

	const handleDeletePoojaCategory = (id: string, name: string) => {
		setPoojaToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!poojaToDelete) return;
		try {
			const response = await fetch(
				`/api/pooja-categories/${poojaToDelete.id}`,
				{
					method: "DELETE",
				}
			);
			if (!response.ok) throw new Error(`API error: ${response.status}`);
			setPoojaCategories(
				poojaCategories.filter((p) => p.id !== poojaToDelete.id)
			);
			toast.success(`${poojaToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete pooja category");
		} finally {
			setIsDeleteDialogOpen(false);
			setPoojaToDelete(null);
		}
	};

	const handleFormSubmit = async (formData: Omit<PoojaCategory, "id">) => {
		setIsSubmitting(true);
		try {
			const url = currentPooja?.id
				? `/api/pooja-categories/${currentPooja.id}`
				: "/api/pooja-categories";
			const method = currentPooja?.id ? "PUT" : "POST";

			const requestData = {
				...(currentPooja?.id && { id: currentPooja.id }),
				...formData,
			};

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				throw new Error("Failed to save pooja category");
			}

			// Refresh list
			const fetchResponse = await fetch(
				`/api/pooja-categories?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
			);
			if (!fetchResponse.ok)
				throw new Error("Failed to fetch updated pooja categories");
			const { categories } = await fetchResponse.json();

			setPoojaCategories(
				categories.map((item: PoojaCategory) => ({
					id: item.id,
					name: item.name || "",
					description: item.description || "",
					date: item.date || "",
					price: item.price ?? undefined,
					details: item.details || "",
				}))
			);

			toast.success(
				currentPooja?.id
					? "Pooja Category updated successfully"
					: "Pooja Category created successfully"
			);
			setIsFormOpen(false);
		} catch (error: unknown) {
			if (typeof error === "object" && error !== null && "details" in error) {
				const err = error as ApiErrorResponse;
				if (Array.isArray(err.details)) {
					err.details.forEach((message) => toast.error(String(message)));
				} else if (err.details && typeof err.details === "object") {
					Object.values(err.details).forEach((message) =>
						toast.error(String(message))
					);
				}
			} else if (error instanceof Error) {
				toast.error(error.message || "Failed to save pooja category");
			} else {
				toast.error("Failed to save pooja category");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/pooja-categories/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!response.ok) throw new Error("Failed to update status");
			setPoojaCategories((prev) =>
				prev.map((cat) => (cat.id === id ? { ...cat, status: newStatus } : cat))
			);
			toast.success("Status updated");
		} catch {
			toast.error("Failed to update status");
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				Loading...
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6">
			<h1 className="text-2xl font-bold mb-6">Pooja Category Management</h1>

			<PoojaCategoryTable
				poojaCategories={poojaCategories}
				onAddPoojaCategory={handleAddPoojaCategory}
				onEditPoojaCategory={handleEditPoojaCategory}
				onDeletePoojaCategory={handleDeletePoojaCategory}
				onUpdateStatus={handleUpdateStatus}
			/>

			<Pagination
				currentPage={pagination.currentPage}
				totalPages={pagination.totalPages}
				totalItems={pagination.totalItems}
				itemsPerPage={pagination.itemsPerPage}
				onPageChange={handlePageChange}
			/>

			{/* Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentPooja?.id
								? "Edit Pooja Category"
								: "Add New Pooja Category"}
						</DialogTitle>
					</DialogHeader>
					<PoojaCategoryForm
						initialData={currentPooja || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Confirm Deletion</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete {poojaToDelete?.name}? This action
							cannot be undone.
						</p>
					</div>
					<div className="flex justify-end gap-2">
						<button
							className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
							onClick={() => setIsDeleteDialogOpen(false)}
						>
							Cancel
						</button>
						<button
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
							onClick={confirmDelete}
						>
							Delete
						</button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
