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

interface UserData {
	id: string;
	name?: string;
	phone?: string;
	email?: string;
	status?: string;
	kycApproved?: boolean | number;
}
export default function SellerPage() {
	interface ApiErrorResponse {
		details?: Record<string, unknown> | string[];
		message?: string;
	}
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
	// Delete dialog logic is now handled in SellerTable

	// Fetch sellers on component mount
	useEffect(() => {
		const fetchSellers = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/users?userType=Seller&page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Map the user data to match Seller structure
				const mappedSellers = data.users.map((user: UserData) => ({
					id: user.id,
					name: user.name || "",
					phone: user.phone || "",
					email: user.email || "",
					status: user.status || "Active",
					isApproved: user.kycApproved || false,
				}));

				setSellers(mappedSellers);
				updatePagination(data.total, data.pagination.totalPages);
			} catch (error) {
				console.error("Error fetching sellers:", error);
				toast.error("Failed to load sellers.");
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

	// Delete logic is now handled in SellerTable

	// confirmDelete and related state removed; handled in SellerTable

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
			setSellers(
				sellers.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
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
			setSellers(
				sellers.map((d) =>
					d.id === id ? { ...d, isApproved: !currentStatus } : d
				)
			);
			toast.success(
				`Seller ${currentStatus ? "disapproved" : "approved"} successfully`
			);
		} catch {
			toast.error("Failed to update approval status");
		}
	};

	const handleLoginAsSeller = (seller: Seller) => {
		// This would typically involve setting authentication state
		// For now, we'll just show a toast message
		toast.info(
			`Login as ${seller.name} functionality would be implemented here`
		);

		// In a real implementation, you might do something like:
		// router.push(`/admin/impersonate/${seller.id}`);
	};

	const handleFormSubmit = async (sellerData: Omit<Seller, "id">) => {
		setIsSubmitting(true);
		try {
			const url = currentSeller?.id
				? `/api/users/${currentSeller.id}`
				: "/api/users";

			const method = currentSeller?.id ? "PUT" : "POST";

			const requestData = {
				...(currentSeller?.id && { id: currentSeller.id }),
				...sellerData,
				userType: "Seller", // Explicitly set userType to "Seller" (no space)
				isApproved: sellerData.isApproved || false,
				kycApproved: sellerData.isApproved || false, // Ensure kycApproved is set to match isApproved
			};

			console.log("Sending request data:", requestData);

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error("API error response:", errorData);
				throw new Error("Failed to save seller");
			}

			// Refresh the sellers list
			const fetchResponse = await fetch("/api/users?userType=Seller");
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated sellers");
			}
			const { users } = await fetchResponse.json();
			console.log("Refreshed users data:", users);

			// Map the user data to match Seller structure
			const mappedSellers = users.map((user: UserData) => ({
				id: user.id,
				name: user.name || "",
				phone: user.phone || "",
				email: user.email || "",
				status: user.status || "Inactive",
				isApproved: user.kycApproved || false,
			}));

			setSellers(mappedSellers);
			setIsFormOpen(false);
			toast.success(
				currentSeller?.id
					? "Seller updated successfully"
					: "Seller created successfully"
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
