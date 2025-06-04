"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import KathavachakTable, {
	Kathavachak,
} from "../components/kathavachak/KathavachakTable";
import KathavachakForm from "../components/kathavachak/KathavachakForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

interface UserData {
	id: string;
	name?: string;
	category?: string;
	phone?: string;
	email?: string;
	status?: string;
	rank?: string;
	kycApproved?: boolean | number;
}
interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
}

export default function KathavachakPage() {
	const [pagination, handlePageChange, updatePagination] = usePagination(1, 12);
	const [kathavachaks, setKathavachaks] = useState<Kathavachak[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentKathavachak, setCurrentKathavachak] =
		useState<Partial<Kathavachak> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [kathavachakToDelete, setKathavachakToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Fetch kathavachaks on component mount
	useEffect(() => {
		const fetchKathavachaks = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/users?userType=Kathavachak&page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Map the user data to match Kathavachak structure
				const mappedKathavachaks = data.users.map((user: UserData) => ({
					id: user.id,
					name: user.name || "",
					category: user.category || "",
					phone: user.phone || "",
					email: user.email || "",
					status: user.status || "Inactive",
					rank: user.rank || "",
					isApproved: user.kycApproved || false,
				}));

				setKathavachaks(mappedKathavachaks);
				updatePagination(data.total, data.pagination.totalPages);
			} catch {
				toast.error("Failed to load kathavachaks");
			} finally {
				setLoading(false);
			}
		};

		fetchKathavachaks();
	}, [pagination.currentPage]);

	const handleAddKathavachak = () => {
		setCurrentKathavachak(null);
		setIsFormOpen(true);
	};

	const handleEditKathavachak = (kathavachak: Kathavachak) => {
		// Ensure rank is properly passed as a string
		const kathavachakWithStringRank = {
			...kathavachak,
			rank: kathavachak.rank || "", // Ensure rank is a string
		};
		setCurrentKathavachak(kathavachakWithStringRank);
		setIsFormOpen(true);
	};

	const handleDeleteKathavachak = (id: string, name: string) => {
		setKathavachakToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!kathavachakToDelete) return;

		try {
			// Call the API to delete the kathavachak
			const response = await fetch(`/api/users/${kathavachakToDelete.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Update local state
			setKathavachaks(
				kathavachaks.filter((k) => k.id !== kathavachakToDelete.id)
			);
			toast.success(`${kathavachakToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete kathavachak");
		} finally {
			setIsDeleteDialogOpen(false);
			setKathavachakToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			// Call the API to update user status
			const response = await fetch(`/api/users/status`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: id, status: newStatus }),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Update local state
			setKathavachaks(
				kathavachaks.map((k) => (k.id === id ? { ...k, status: newStatus } : k))
			);
			toast.success("Status updated successfully");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleToggleApproval = async (id: string, currentStatus: boolean) => {
		try {
			// Call the API to update user KYC approval status
			const response = await fetch(`/api/users/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ kycApproved: !currentStatus }),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Update local state
			setKathavachaks(
				kathavachaks.map((k) =>
					k.id === id ? { ...k, isApproved: !currentStatus } : k
				)
			);
			toast.success(
				`Kathavachak ${currentStatus ? "disapproved" : "approved"} successfully`
			);
		} catch {
			toast.error("Failed to update approval status");
		}
	};

	const handleLoginAsKathavachak = (kathavachak: Kathavachak) => {
		// This would typically involve setting authentication state
		// For now, we'll just show a toast message
		toast.info(
			`Login as ${kathavachak.name} functionality would be implemented here`
		);

		// In a real implementation, you might do something like:
		// router.push(`/admin/impersonate/${kathavachak.id}`);
	};

	const handleFormSubmit = async (kathavachakData: Omit<Kathavachak, "id">) => {
		try {
			const url = currentKathavachak?.id
				? `/api/users/${currentKathavachak.id}`
				: "/api/users";

			const method = currentKathavachak?.id ? "PUT" : "POST";

			// Ensure rank is included in the request data
			const requestData = {
				...(currentKathavachak?.id && { id: currentKathavachak.id }),
				...kathavachakData,
				userType: "Kathavachak",
				isApproved: kathavachakData.isApproved || false,
				rank: kathavachakData.rank || "", // Ensure rank is explicitly set
			};

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				throw new Error("Failed to save kathavachak");
			}

			// const data = await response.json();

			// Refresh the kathavachaks list
			const fetchResponse = await fetch("/api/users?userType=Kathavachak");
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated kathavachaks");
			}
			const { users } = await fetchResponse.json();

			// Map the user data to match Kathavachak structure
			const mappedKathavachaks = users.map((user: UserData) => ({
				id: user.id,
				name: user.name || "",
				category: user.category || "",
				phone: user.phone || "",
				email: user.email || "",
				status: user.status || "Inactive",
				rank: user.rank || "",
				isApproved: user.kycApproved || false,
			}));

			setKathavachaks(mappedKathavachaks);

			toast.success(
				currentKathavachak?.id
					? "Kathavachak updated successfully"
					: "Kathavachak created successfully"
			);

			setIsFormOpen(false);
			toast.success(
				currentKathavachak?.id
					? "Kathavachak updated successfully"
					: "Kathavachak created successfully"
			);
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
				toast.error(error.message || "Failed to save kathavachak");
			} else {
				toast.error("Failed to save kathavachak");
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
			<h1 className="text-2xl font-bold mb-6">Kathavachak Management</h1>

			<KathavachakTable
				kathavachaks={kathavachaks}
				setKathavachaks={setKathavachaks}
				onAddKathavachak={handleAddKathavachak}
				onEditKathavachak={handleEditKathavachak}
				onDeleteKathavachak={handleDeleteKathavachak}
				onUpdateStatus={handleUpdateStatus}
				onToggleApproval={handleToggleApproval}
				onLoginAsKathavachak={handleLoginAsKathavachak}
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
							{currentKathavachak?.id
								? "Edit Kathavachak"
								: "Add New Kathavachak"}
						</DialogTitle>
					</DialogHeader>
					<KathavachakForm
						initialData={currentKathavachak || undefined}
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
							Are you sure you want to delete {kathavachakToDelete?.name}? This
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
