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
import SellerTable, { Seller } from "../components/seller/SellerTable";
import SellerForm from "../components/seller/SellerForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

interface SellerApiResponse {
	id: string;
	name: string;
	phone: string;
	email: string;
	status: string;
	kycApproved: number | boolean;
}

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
	error?: string;
}

export default function SellerPage() {
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

	const [sellers, setSellers] = useState<Seller[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentSeller, setCurrentSeller] = useState<Partial<Seller> | null>(
		null
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch sellers on component mount
	useEffect(() => {
		const fetchSellers = async () => {
			setLoading(true);
			try {
				// Use the new optimized seller-specific API endpoint
				const response = await fetch(
					`/api/users/seller?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Transform the optimized API response to match Seller structure
				const mappedSellers = data.data.map((user: SellerApiResponse) => ({
					id: user.id,
					name: user.name || "",
					phone: user.phone || "",
					email: user.email || "",
					status: user.status || "Active",
					isApproved: user.kycApproved === 1 || user.kycApproved === true,
				}));

				setSellers(mappedSellers);

				// Update pagination with the new API response structure
				if (data.pagination) {
					updatePagination(
						data.pagination.totalCount,
						data.pagination.totalPages
					);
				}
			} catch (error) {
				console.error("Error fetching sellers:", error);
				toast.error("Failed to load sellers");
			} finally {
				setLoading(false);
			}
		};

		fetchSellers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, pagination.itemsPerPage]);

	const handleAddSeller = () => {
		setCurrentSeller(null);
		setIsFormOpen(true);
	};

	const handleEditSeller = (seller: Seller) => {
		setCurrentSeller(seller);
		setIsFormOpen(true);
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			// Use the new seller-specific API endpoint for updates
			const response = await fetch(`/api/users/seller/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API error: ${response.status}`);
			}

			// Update local state
			setSellers(
				sellers.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
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
			// Use the new seller-specific API endpoint for KYC approval updates
			const response = await fetch(`/api/users/seller/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ kycApproved: !currentStatus ? 1 : 0 }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API error: ${response.status}`);
			}

			// Update local state
			setSellers(
				sellers.map((s) =>
					s.id === id ? { ...s, isApproved: !currentStatus } : s
				)
			);
			toast.success(
				`Seller ${currentStatus ? "disapproved" : "approved"} successfully`
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

	const handleLoginAsSeller = (seller: Seller) => {
		// This would typically involve setting authentication state
		// For now, we'll just show a toast message
		toast.info(
			`Login as ${seller.name} functionality would be implemented here`
		);
	};

	const handleFormSubmit = async (sellerData: Omit<Seller, "id">) => {
		try {
			setIsSubmitting(true);

			const url = currentSeller?.id
				? `/api/users/seller/${currentSeller.id}`
				: "/api/users/seller";

			const method = currentSeller?.id ? "PUT" : "POST";

			// Prepare FormData for the API
			const formData = new FormData();
			formData.append("name", sellerData.name);
			formData.append("email", sellerData.email);
			formData.append("phone", sellerData.phone);
			formData.append("status", sellerData.status || "Active");
			formData.append("kycApproved", sellerData.isApproved ? "1" : "0");
			formData.append("userType", "seller");

			// Add password only if it's a new user or if password is being updated
			if (
				!currentSeller?.id ||
				(sellerData as Record<string, unknown>).password
			) {
				formData.append(
					"password",
					((sellerData as Record<string, unknown>).password as string) ||
						"tempPassword123"
				);
			}

			const response = await fetch(url, {
				method,
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save seller");
			}

			// Refresh the sellers list using the new API
			const fetchResponse = await fetch(
				`/api/users/seller?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
			);
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated sellers");
			}
			const { data } = await fetchResponse.json();

			// Transform the optimized API response
			const mappedSellers = data.map((user: SellerApiResponse) => ({
				id: user.id,
				name: user.name || "",
				phone: user.phone || "",
				email: user.email || "",
				status: user.status || "Active",
				isApproved: user.kycApproved === 1 || user.kycApproved === true,
			}));

			setSellers(mappedSellers);

			toast.success(
				currentSeller?.id
					? "Seller updated successfully"
					: "Seller created successfully"
			);

			setIsFormOpen(false);
		} catch (error: unknown) {
			console.error("Error saving seller:", error);
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
				toast.error(error.message || "Failed to save seller");
			} else {
				toast.error("Failed to save seller");
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
			<h1 className="text-2xl font-bold mb-6">Seller Management</h1>

			<SellerTable
				sellers={sellers}
				setSellers={setSellers}
				onAddSeller={handleAddSeller}
				onEditSeller={handleEditSeller}
				onDeleteSeller={() => {}} // No-op, handled in table
				onUpdateStatus={handleUpdateStatus}
				onToggleApproval={handleToggleApproval}
				onLoginAsSeller={handleLoginAsSeller}
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
							{currentSeller?.id ? "Edit Seller" : "Add New Seller"}
						</DialogTitle>
					</DialogHeader>
					<SellerForm
						initialData={currentSeller || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
