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
import DharmguruTable, {
	Dharmguru,
} from "../components/dharmguru/DharmguruTable";
import DharmguruForm from "../components/dharmguru/DharmguruForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

// Interface for the dharmguru API response
interface DharmguruApiResponse {
	id: string;
	name: string;
	email: string;
	phone: string;
	profileImageUrl?: string;
	bannerImageUrl?: string;
	bio?: string;
	category?: string;
	rank?: string;
	status: string;
	kycApproved?: number;
	isLoggedIn?: boolean;
	createdAt?: string;
}

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
	error?: string;
}

interface DharmguruFormData extends Omit<Dharmguru, "id"> {
	password?: string;
}

export default function DharmguruPage() {
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

	const [dharmgurus, setDharmgurus] = useState<Dharmguru[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentDharmguru, setCurrentDharmguru] =
		useState<Partial<Dharmguru> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	// Delete dialog logic is now handled in DharmguruTable

	// Fetch dharmgurus on component mount
	useEffect(() => {
		const fetchDharmgurus = async () => {
			setLoading(true);
			try {
				// Use the new optimized dharmguru-specific API endpoint
				const response = await fetch(
					`/api/users/dharmguru?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Transform the optimized API response to match Dharmguru structure
				const mappedDharmgurus = data.dharmgurus.map(
					(user: DharmguruApiResponse) => ({
						id: user.id,
						name: user.name || "",
						category: user.category || "",
						phone: user.phone || "",
						email: user.email || "",
						status: user.status || "Active",
						rank: user.rank || "",
						isApproved: user.kycApproved === 1,
					})
				);

				setDharmgurus(mappedDharmgurus);

				// Update pagination with the new API response structure
				if (data.pagination) {
					updatePagination(data.pagination.total, data.pagination.totalPages);
				}
			} catch {
				toast.error("Failed to load dharmgurus");
			} finally {
				setLoading(false);
			}
		};

		fetchDharmgurus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, pagination.itemsPerPage]);

	const handleAddDharmguru = () => {
		setCurrentDharmguru(null);
		setIsFormOpen(true);
	};

	const handleEditDharmguru = (dharmguru: Dharmguru) => {
		// Ensure rank is properly passed as a string
		const dharmguruWithStringRank = {
			...dharmguru,
			rank: dharmguru.rank || "", // Ensure rank is a string
		};
		setCurrentDharmguru(dharmguruWithStringRank);
		setIsFormOpen(true);
	};

	// Delete logic is now handled in DharmguruTable

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			// Use the new dharmguru-specific API endpoint for updates
			const response = await fetch(`/api/users/dharmguru/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API error: ${response.status}`);
			}

			// Update local state
			setDharmgurus(
				dharmgurus.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
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
			// Use the new dharmguru-specific API endpoint for KYC approval updates
			const response = await fetch(`/api/users/dharmguru/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ kycApproved: !currentStatus ? 1 : 0 }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API error: ${response.status}`);
			}

			// Update local state
			setDharmgurus(
				dharmgurus.map((d) =>
					d.id === id ? { ...d, isApproved: !currentStatus } : d
				)
			);
			toast.success(
				`Dharmguru ${currentStatus ? "disapproved" : "approved"} successfully`
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

	const handleLoginAsDharmguru = (dharmguru: Dharmguru) => {
		// This would typically involve setting authentication state
		// For now, we'll just show a toast message
		toast.info(
			`Login as ${dharmguru.name} functionality would be implemented here`
		);

		// In a real implementation, you might do something like:
		// router.push(`/admin/impersonate/${kathavachak.id}`);
	};

	const handleFormSubmit = async (dharmguruData: DharmguruFormData) => {
		try {
			setIsSubmitting(true);

			const url = currentDharmguru?.id
				? `/api/users/dharmguru/${currentDharmguru.id}`
				: "/api/users/dharmguru";

			const method = currentDharmguru?.id ? "PUT" : "POST";

			// Prepare JSON data for the API
			const requestData = {
				name: dharmguruData.name,
				email: dharmguruData.email,
				phone: dharmguruData.phone,
				category: dharmguruData.category,
				status: dharmguruData.status || "Active",
				rank: dharmguruData.rank || "",
				kycApproved: dharmguruData.isApproved ? 1 : 0,
				// Add password only if it's a new user or if password is being updated
				...((!currentDharmguru?.id || dharmguruData.password) && {
					password: dharmguruData.password || "tempPassword123",
				}),
			};

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save dharmguru");
			}

			// Refresh the dharmgurus list using the new API
			const fetchResponse = await fetch(
				`/api/users/dharmguru?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
			);
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated dharmgurus");
			}
			const fetchData = await fetchResponse.json();

			// Transform the optimized API response
			const mappedDharmgurus = fetchData.dharmgurus.map(
				(user: DharmguruApiResponse) => ({
					id: user.id,
					name: user.name || "",
					category: user.category || "",
					phone: user.phone || "",
					email: user.email || "",
					status: user.status || "Active",
					rank: user.rank || "",
					isApproved: user.kycApproved === 1,
				})
			);

			setDharmgurus(mappedDharmgurus);

			toast.success(
				currentDharmguru?.id
					? "Dharmguru updated successfully"
					: "Dharmguru created successfully"
			);

			setIsFormOpen(false);
		} catch (error: unknown) {
			console.error("Error saving dharmguru:", error);
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
				toast.error(error.message || "Failed to save dharmguru");
			} else {
				toast.error("Failed to save dharmguru");
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
			<h1 className="text-2xl font-bold mb-6">Dharmguru Management</h1>

			<DharmguruTable
				dharmgurus={dharmgurus}
				setDharmgurus={setDharmgurus}
				onAddDharmguru={handleAddDharmguru}
				onEditDharmguru={handleEditDharmguru}
				onDeleteDharmguru={() => {}} // No-op, handled in table
				onUpdateStatus={handleUpdateStatus}
				onToggleApproval={handleToggleApproval}
				onLoginAsDharmguru={handleLoginAsDharmguru}
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
							{currentDharmguru?.id ? "Edit Dharmguru" : "Add New Dharmguru"}
						</DialogTitle>
					</DialogHeader>
					<DharmguruForm
						initialData={currentDharmguru || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
