"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import BalvidhyaTable, {
	Balvidhya,
} from "../components/balvidhya/BalvidhyaTable";
import BalvidhyaForm from "../components/balvidhya/BalvidhyaForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

interface BalvidhyaData {
	id: string;
	name?: string;
	description?: string;
	type?: string;
	category?: string;
	status?: string;
	trending?: boolean;
	thumbnailUrl?: string;
	dateAdded?: string | Date;
	createdAt?: string | Date;
	updatedAt?: string | Date;
}

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
}

export default function BalvidhyaPage() {
	const router = useRouter();
	const [pagination, handlePageChange, updatePagination] = usePagination(1, 12);
	const [balvidhyas, setBalvidhyas] = useState<Balvidhya[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentBalvidhya, setCurrentBalvidhya] =
		useState<Partial<Balvidhya> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [balvidhyaToDelete, setBalvidhyaToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Fetch balvidhya content on component mount
	useEffect(() => {
		const fetchBalvidhyas = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/balvidhya?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Map the data to match Balvidhya structure
				const mappedBalvidhyas = data.content.map((item: BalvidhyaData) => ({
					id: item.id,
					name: item.name || "",
					description: item.description || "",
					type: item.type || "",
					category: item.category || "",
					status: item.status || "Draft",
					trending: item.trending || false,
					thumbnailUrl: item.thumbnailUrl || "",
					dateAdded: item.dateAdded || item.createdAt || new Date(),
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				}));

				setBalvidhyas(mappedBalvidhyas);
				updatePagination(data.total, data.pagination.totalPages);
			} catch {
				toast.error("Failed to load Balvidhya content");
			} finally {
				setLoading(false);
			}
		};

		fetchBalvidhyas();
	}, [pagination.currentPage]);

	const handleAddBalvidhya = () => {
		setCurrentBalvidhya(null);
		setIsFormOpen(true);
	};

	const handleEditBalvidhya = (balvidhya: Balvidhya) => {
		setCurrentBalvidhya(balvidhya);
		setIsFormOpen(true);
	};

	const handleDeleteBalvidhya = (id: string, name: string) => {
		setBalvidhyaToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!balvidhyaToDelete) return;

		try {
			// Call the API to delete the balvidhya content
			const response = await fetch(`/api/balvidhya/${balvidhyaToDelete.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Update local state
			setBalvidhyas(balvidhyas.filter((b) => b.id !== balvidhyaToDelete.id));
			toast.success(`${balvidhyaToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete content");
		} finally {
			setIsDeleteDialogOpen(false);
			setBalvidhyaToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			// Call the API to update content status
			const response = await fetch(`/api/balvidhya/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Update local state
			setBalvidhyas(
				balvidhyas.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
			);
			toast.success("Status updated successfully");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleToggleTrending = async (id: string, currentStatus: boolean) => {
		try {
			// Call the API to update trending status
			const response = await fetch(`/api/balvidhya/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ trending: !currentStatus }),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Update local state
			setBalvidhyas(
				balvidhyas.map((b) =>
					b.id === id ? { ...b, trending: !currentStatus } : b
				)
			);
			toast.success(
				`Content ${currentStatus ? "removed from" : "marked as"} trending`
			);
		} catch {
			toast.error("Failed to update trending status");
		}
	};

	const handleViewBalvidhya = (balvidhya: Balvidhya) => {
		// Navigate to detail page instead of showing toast
		router.push(`/admin/balvidhya/${balvidhya.id}`);
	};

	const handleFormSubmit = async (balvidhyaData: Omit<Balvidhya, "id">) => {
		setIsSubmitting(true);
		try {
			const url = currentBalvidhya?.id
				? `/api/balvidhya/${currentBalvidhya.id}`
				: "/api/balvidhya";

			const method = currentBalvidhya?.id ? "PUT" : "POST";

			// Prepare request data
			const requestData = {
				...(currentBalvidhya?.id && { id: currentBalvidhya.id }),
				...balvidhyaData,
				dateAdded: balvidhyaData.dateAdded || new Date(),
			};

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to save content");
			}

			const savedContent = await response.json();

			// Update local state
			if (currentBalvidhya?.id) {
				// Update existing content
				setBalvidhyas(
					balvidhyas.map((b) =>
						b.id === currentBalvidhya.id ? savedContent : b
					)
				);
			} else {
				// Add new content
				setBalvidhyas([savedContent, ...balvidhyas]);
			}

			toast.success(
				currentBalvidhya?.id
					? "Content updated successfully"
					: "Content created successfully"
			);

			setIsFormOpen(false);
			setCurrentBalvidhya(null);
		} catch (error: unknown) {
			// Type guard for error with 'details'
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
				toast.error(error.message || "Failed to save content");
			} else {
				toast.error("Failed to save content");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Balvidhya Content Management</h1>
				<div className="text-sm text-gray-600">
					Total Content: {pagination.totalItems}
				</div>
			</div>

			<BalvidhyaTable
				balvidhyas={balvidhyas}
				setBalvidhyas={setBalvidhyas}
				onAddBalvidhya={handleAddBalvidhya}
				onEditBalvidhya={handleEditBalvidhya}
				onDeleteBalvidhya={handleDeleteBalvidhya}
				onUpdateStatus={handleUpdateStatus}
				onToggleTrending={handleToggleTrending}
				onViewBalvidhya={handleViewBalvidhya}
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
				<DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{currentBalvidhya?.id ? "Edit Content" : "Add New Content"}
						</DialogTitle>
					</DialogHeader>
					<BalvidhyaForm
						initialData={currentBalvidhya || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => {
							setIsFormOpen(false);
							setCurrentBalvidhya(null);
						}}
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
						<p className="text-sm text-gray-600 mb-4">
							Are you sure you want to delete "{balvidhyaToDelete?.name}"? This
							action cannot be undone.
						</p>
						<div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
							<p className="text-xs text-yellow-800">
								⚠️ This will permanently remove the content and all associated
								data.
							</p>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<button
							className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
							onClick={() => {
								setIsDeleteDialogOpen(false);
								setBalvidhyaToDelete(null);
							}}
						>
							Cancel
						</button>
						<button
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
							onClick={confirmDelete}
						>
							Delete Content
						</button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
