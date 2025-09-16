"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import PanditjiTable, { Panditji } from "../components/panditji/PanditjiTable";
import PanditjiForm from "../components/panditji/PanditjiForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

interface PanditjiApiResponse {
	id: string;
	name: string;
	category?: string;
	phone: string;
	email: string;
	status: string;
	rank?: string;
	kycApproved: number | boolean;
}

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
	error?: string;
}

export default function PanditjiPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Read page from URL query, default to 1
	const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
	const [pagination, handlePageChangeRaw, updatePagination] = usePagination(
		pageFromUrl,
		12
	);

	// When page changes, update the URL
	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(Array.from(searchParams.entries()));
		params.set("page", String(page));
		router.replace(`?${params.toString()}`);
		handlePageChangeRaw(page);
	};

	// Keep pagination in sync if URL changes (e.g., browser navigation)
	useEffect(() => {
		const urlPage = parseInt(searchParams.get("page") || "1", 10);
		if (urlPage !== pagination.currentPage) {
			handlePageChangeRaw(urlPage);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	const [panditjis, setPanditjis] = useState<Panditji[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentPanditji, setCurrentPanditji] =
		useState<Partial<Panditji> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch panditjis on component mount
	useEffect(() => {
		const fetchPanditjis = async () => {
			setLoading(true);
			try {
				// Use the new optimized panditji-specific API endpoint
				const response = await fetch(
					`/api/users/panditji?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Transform the optimized API response to match Panditji structure
				const mappedPanditjis = data.data.map((user: PanditjiApiResponse) => ({
					id: user.id,
					name: user.name || "",
					category: user.category || "",
					phone: user.phone || "",
					email: user.email || "",
					status: user.status || "Active",
					rank: user.rank || "",
					isApproved: user.kycApproved === 1 || user.kycApproved === true,
				}));

				setPanditjis(mappedPanditjis);

				// Update pagination with the new API response structure
				if (data.pagination) {
					updatePagination(
						data.pagination.totalCount,
						data.pagination.totalPages
					);
				}
			} catch (error) {
				console.error("Error fetching panditjis:", error);
				toast.error("Failed to load panditjis");
			} finally {
				setLoading(false);
			}
		};

		fetchPanditjis();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, pagination.itemsPerPage]);

	const handleAddPanditji = () => {
		setCurrentPanditji(null);
		setIsFormOpen(true);
	};

	const handleEditPanditji = (panditji: Panditji) => {
		// Ensure rank is properly passed as a string
		const panditjiWithStringRank = {
			...panditji,
			rank: panditji.rank || "", // Ensure rank is a string
		};
		setCurrentPanditji(panditjiWithStringRank);
		setIsFormOpen(true);
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			// Use the new panditji-specific API endpoint for updates
			const response = await fetch(`/api/users/panditji/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API error: ${response.status}`);
			}

			// Update local state
			setPanditjis(
				panditjis.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
			);
			toast.success("Status updated successfully");
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update status"
			);
		}
	};

	const handleToggleApproval = async (id: string, currentStatus: boolean) => {
		try {
			// Use the new panditji-specific API endpoint for KYC approval updates
			const response = await fetch(`/api/users/panditji/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ kycApproved: !currentStatus ? 1 : 0 }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API error: ${response.status}`);
			}

			// Update local state
			setPanditjis(
				panditjis.map((p) =>
					p.id === id ? { ...p, isApproved: !currentStatus } : p
				)
			);
			toast.success(
				`Panditji ${currentStatus ? "disapproved" : "approved"} successfully`
			);
		} catch (error) {
			console.error("Error updating approval status:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update approval status"
			);
		}
	};

	const handleLoginAsPanditji = (panditji: Panditji) => {
		// This would typically involve setting authentication state
		// For now, we'll just show a toast message
		toast.info(
			`Login as ${panditji.name} functionality would be implemented here`
		);
	};

	const handleFormSubmit = async (panditjiData: Omit<Panditji, "id">) => {
		try {
			setIsSubmitting(true);

			const url = currentPanditji?.id
				? `/api/users/panditji/${currentPanditji.id}`
				: "/api/users/panditji";

			const method = currentPanditji?.id ? "PUT" : "POST";

			// Prepare FormData for the API
			const formData = new FormData();
			formData.append("name", panditjiData.name);
			formData.append("email", panditjiData.email);
			formData.append("phone", panditjiData.phone);
			formData.append("category", panditjiData.category || "");
			formData.append("status", panditjiData.status || "Active");
			formData.append("rank", panditjiData.rank || "");
			formData.append("kycApproved", panditjiData.isApproved ? "1" : "0");
			formData.append("userType", "panditji");

			// Add password only if it's a new user or if password is being updated
			if (
				!currentPanditji?.id ||
				(panditjiData as Record<string, unknown>).password
			) {
				formData.append(
					"password",
					((panditjiData as Record<string, unknown>).password as string) ||
						"tempPassword123"
				);
			}

			const response = await fetch(url, {
				method,
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save panditji");
			}

			// Refresh the panditjis list using the new API
			const fetchResponse = await fetch(
				`/api/users/panditji?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
			);
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated panditjis");
			}
			const { data } = await fetchResponse.json();

			// Transform the optimized API response
			const mappedPanditjis = data.map((user: PanditjiApiResponse) => ({
				id: user.id,
				name: user.name || "",
				category: user.category || "",
				phone: user.phone || "",
				email: user.email || "",
				status: user.status || "Active",
				rank: user.rank || "",
				isApproved: user.kycApproved === 1 || user.kycApproved === true,
			}));

			setPanditjis(mappedPanditjis);

			toast.success(
				currentPanditji?.id
					? "Panditji updated successfully"
					: "Panditji created successfully"
			);

			setIsFormOpen(false);
		} catch (error: unknown) {
			console.error("Error saving panditji:", error);
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
				toast.error(error.message || "Failed to save panditji");
			} else {
				toast.error("Failed to save panditji");
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
			<h1 className="text-2xl font-bold mb-6">Panditji Management</h1>

			<PanditjiTable
				panditjis={panditjis}
				setPanditjis={setPanditjis}
				onAddPanditji={handleAddPanditji}
				onEditPanditji={handleEditPanditji}
				onDeletePanditji={() => {}} // No-op, handled in table
				onUpdateStatus={handleUpdateStatus}
				onToggleApproval={handleToggleApproval}
				onLoginAsPanditji={handleLoginAsPanditji}
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
							{currentPanditji?.id ? "Edit Panditji" : "Add New Panditji"}
						</DialogTitle>
					</DialogHeader>
					<PanditjiForm
						initialData={currentPanditji || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
