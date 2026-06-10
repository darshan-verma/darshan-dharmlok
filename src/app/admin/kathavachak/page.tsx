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
import { resolveReligiousCategories } from "@/lib/religious-categories";
import KathavachakTable, {
	Kathavachak,
} from "../components/kathavachak/KathavachakTable";
import KathavachakForm from "../components/kathavachak/KathavachakForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

interface KathavachakApiResponse {
	id: string;
	name: string;
	category?: string;
	religiousCategories?: string[];
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

export default function KathavachakPage() {
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
	const [kathavachaks, setKathavachaks] = useState<Kathavachak[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentKathavachak, setCurrentKathavachak] =
		useState<Partial<Kathavachak> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch kathavachaks on component mount
	useEffect(() => {
		const fetchKathavachaks = async () => {
			setLoading(true);
			try {
				// Use the new optimized kathavachak-specific API endpoint
				const response = await fetch(
					`/api/users/kathavachak?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Transform the optimized API response to match Kathavachak structure
				const mappedKathavachaks = data.data.map(
					(user: KathavachakApiResponse) => {
						const religiousCategories = resolveReligiousCategories(user);
						return {
							id: user.id,
							name: user.name || "",
							category: user.category || religiousCategories[0] || "",
							religiousCategories,
							phone: user.phone || "",
							email: user.email || "",
							status: user.status || "Inactive",
							rank: user.rank || "",
							isApproved:
								user.kycApproved === 1 || user.kycApproved === true,
						};
					}
				);

				setKathavachaks(mappedKathavachaks);

				// Update pagination with the new API response structure
				if (data.pagination) {
					updatePagination(
						data.pagination.totalCount,
						data.pagination.totalPages
					);
				}
			} catch (error) {
				console.error("Error fetching kathavachaks:", error);
				toast.error("Failed to load kathavachaks");
			} finally {
				setLoading(false);
			}
		};

		fetchKathavachaks();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, pagination.itemsPerPage]);

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

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			// Use FormData to match the API endpoint expectations
			const formData = new FormData();
			formData.append("status", newStatus);

			const response = await fetch(`/api/users/kathavachak/${id}`, {
				method: "PUT",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API error: ${response.status}`);
			}

			// Update local state
			setKathavachaks(
				kathavachaks.map((k) => (k.id === id ? { ...k, status: newStatus } : k))
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
			// Use FormData to match the API endpoint expectations
			const formData = new FormData();
			formData.append("kycApproved", (!currentStatus ? 1 : 0).toString());

			const response = await fetch(`/api/users/kathavachak/${id}`, {
				method: "PUT",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API error: ${response.status}`);
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
		} catch (error) {
			console.error("Error updating approval status:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update approval status"
			);
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
			setIsSubmitting(true);

			const url = currentKathavachak?.id
				? `/api/users/kathavachak/${currentKathavachak.id}`
				: "/api/users/kathavachak";

			const method = currentKathavachak?.id ? "PUT" : "POST";

			// Prepare form data for multipart/form-data
			const formData = new FormData();
			formData.append("name", kathavachakData.name);
			formData.append("email", kathavachakData.email);
			formData.append("phone", kathavachakData.phone);
			formData.append("category", kathavachakData.category || "");
			formData.append("status", kathavachakData.status || "Inactive");
			formData.append("rank", kathavachakData.rank || "");
			formData.append("kycApproved", kathavachakData.isApproved ? "1" : "0");

			// Add password only if it's a new user or if password is being updated
			if (
				!currentKathavachak?.id ||
				(kathavachakData as Record<string, unknown>).password
			) {
				formData.append(
					"password",
					((kathavachakData as Record<string, unknown>).password as string) ||
						"tempPassword123"
				);
			}

			const response = await fetch(url, {
				method,
				body: formData, // Use FormData instead of JSON
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save kathavachak");
			}

			// Refresh the kathavachaks list using the new API
			const fetchResponse = await fetch(
				`/api/users/kathavachak?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
			);
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated kathavachaks");
			}
			const { data } = await fetchResponse.json();

			// Transform the optimized API response
			const mappedKathavachaks = data.map((user: KathavachakApiResponse) => {
				const religiousCategories = resolveReligiousCategories(user);
				return {
					id: user.id,
					name: user.name || "",
					category: user.category || religiousCategories[0] || "",
					religiousCategories,
					phone: user.phone || "",
					email: user.email || "",
					status: user.status || "Inactive",
					rank: user.rank || "",
					isApproved: user.kycApproved === 1 || user.kycApproved === true,
				};
			});

			setKathavachaks(mappedKathavachaks);

			toast.success(
				currentKathavachak?.id
					? "Kathavachak updated successfully"
					: "Kathavachak created successfully"
			);

			setIsFormOpen(false);
		} catch (error: unknown) {
			console.error("Error saving kathavachak:", error);
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
				onDeleteKathavachak={() => {}}
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
		</div>
	);
}
