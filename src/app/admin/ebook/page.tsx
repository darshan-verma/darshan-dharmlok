"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import EbookTable, { Ebook } from "../components/ebook/EbookTable";
import EbookForm, { EbookFormData } from "../components/ebook/EbookForm";
import { resolveReligiousCategories } from "@/lib/religious-categories";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

interface EbookApiData {
	id: string;
	title?: string;
	date?: string;
	description?: string;
	type?: string;
	category?: string;
	religiousCategories?: string[];
	detail?: string;
	status?: string;
	bookFile?: string;
	createdAt?: string;
	updatedAt?: string;
}
interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
}

export default function EbookPage() {
	const [ebooks, setEbooks] = useState<Ebook[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentEbook, setCurrentEbook] = useState<Partial<Ebook> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [ebookToDelete, setEbookToDelete] = useState<{
		id: string;
		title: string;
	} | null>(null);
	const [pagination, handlePageChange, updatePagination] = usePagination(1, 12);

	// Fetch ebooks on component mount
	useEffect(() => {
		const fetchEbooks = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/ebook?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Map the API data to match Ebook structure
				const mappedEbooks = data.content.map((item: EbookApiData) => ({
					id: item.id,
					title: item.title || "",
					date: item.date || "",
					description: item.description || "",
					type: item.type || "",
					category: item.category || "",
					religiousCategories: resolveReligiousCategories(item),
					detail: item.detail || "",
					status: item.status || "Active",
					bookFile: item.bookFile,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				}));

				setEbooks(mappedEbooks);
				updatePagination(data.total, data.pagination.totalPages);
			} catch {
				toast.error("Failed to load ebooks");
			} finally {
				setLoading(false);
			}
		};

		fetchEbooks();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, pagination.itemsPerPage]);

	const handleAddEbook = () => {
		setCurrentEbook(null);
		setIsFormOpen(true);
	};

	const handleEditEbook = (ebook: Ebook) => {
		setCurrentEbook(ebook);
		setIsFormOpen(true);
	};

	const handleDeleteEbook = (id: string, title: string) => {
		setEbookToDelete({ id, title });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!ebookToDelete) return;

		try {
			const response = await fetch(`/api/ebook/${ebookToDelete.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			setEbooks(ebooks.filter((e) => e.id !== ebookToDelete.id));
			toast.success(`${ebookToDelete.title} has been deleted`);
		} catch {
			toast.error("Failed to delete ebook");
		} finally {
			setIsDeleteDialogOpen(false);
			setEbookToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/ebook/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			setEbooks(
				ebooks.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
			);
			toast.success("Status updated successfully");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleViewEbook = (ebook: Ebook) => {
		window.location.href = `/admin/ebook/${ebook.id}`;
	};

	const handleFormSubmit = async (ebookData: EbookFormData) => {
		setIsSubmitting(true);
		const loadingToastId = toast.loading(
			currentEbook?.id ? "Updating ebook..." : "Creating ebook..."
		);
		try {
			const url = currentEbook?.id
				? `/api/ebook/${currentEbook.id}`
				: "/api/ebook";

			const method = currentEbook?.id ? "PUT" : "POST";

			const requestData = {
				...ebookData,
			};

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: "Failed to save ebook" }));
				throw new Error(
					errorData.error || errorData.message || "Failed to save ebook"
				);
			}

			const savedEbook = await response.json();

			if (currentEbook?.id) {
				setEbooks(
					ebooks.map((e) => (e.id === currentEbook.id ? savedEbook : e))
				);
			} else {
				setEbooks([savedEbook, ...ebooks]);
			}

			toast.dismiss(loadingToastId);
			toast.success(
				currentEbook?.id
					? "Ebook updated successfully"
					: "Ebook created successfully"
			);

			setIsFormOpen(false);
			setCurrentEbook(null);
		} catch (error: unknown) {
			toast.dismiss(loadingToastId);
			if (typeof error === "object" && error !== null && "details" in error) {
				const err = error as ApiErrorResponse;
				if (Array.isArray(err.details)) {
					err.details.forEach((message) => {
						toast.error(String(message));
					});
				} else if (err.details && typeof err.details === "object") {
					Object.values(err.details).forEach((message) => {
						toast.error(String(message));
					});
				}
			} else if (error instanceof Error) {
				toast.error(error.message || "Failed to save ebook");
			} else {
				toast.error("Failed to save ebook");
			}
		} finally {
			setIsSubmitting(false);
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
			<h1 className="text-2xl font-bold mb-6">Ebook Management</h1>

			<EbookTable
				ebooks={ebooks}
				setEbooks={setEbooks}
				onAddEbook={handleAddEbook}
				onEditEbook={handleEditEbook}
				onDeleteEbook={handleDeleteEbook}
				onUpdateStatus={handleUpdateStatus}
				onViewEbook={handleViewEbook}
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
							{currentEbook?.id ? "Edit Ebook" : "Add New Ebook"}
						</DialogTitle>
					</DialogHeader>
					<EbookForm
						initialData={currentEbook || undefined}
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
							Are you sure you want to delete {ebookToDelete?.title}? This
							action cannot be undone.
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
