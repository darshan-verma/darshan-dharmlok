"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import SellerTable, { Seller } from "../components/seller/SellerTable";
import SellerForm from "../components/seller/SellerForm";

interface UserData {
	id: string;
	name?: string;
	phone?: string;
	email?: string;
	status?: string;
	kycApproved?: boolean | number;
}
interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
}

export default function SellerPage() {
	const [sellers, setSellers] = useState<Seller[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentSeller, setCurrentSeller] =
		useState<Partial<Seller> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [sellerToDelete, setSellerToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Fetch sellers on component mount
	useEffect(() => {
		const fetchSellers = async () => {
			setLoading(true);
			try {
				// First try to fetch with the standard "Seller" format
				const response = await fetch("/api/users?userType=Seller");

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();
				console.log("API Response for Seller:", data); // Debug log to see what's being returned

				// Check if users array exists and has items
				if (!data.users || data.users.length === 0) {
					console.log(
						"No Seller users found with 'Seller' userType, checking for 'Seller'"
					);

					// Try to fetch with the alternative "Seller" format as a fallback
					const altResponse = await fetch("/api/users?userType=Seller");

					if (!altResponse.ok) {
						console.log("No users found with 'Seller' userType either");
						setSellers([]);
						setLoading(false);
						return;
					}

					const altData = await altResponse.json();
					console.log("API Response for 'Seller':", altData);

					if (!altData.users || altData.users.length === 0) {
						console.log(
							"No Seller users found in the database with either format"
						);
						setSellers([]);
						setLoading(false);
						return;
					}

					// Map the alternative format user data
					const mappedSeller = altData.users.map((user: UserData) => ({
						id: user.id,
						name: user.name || "",
						phone: user.phone || "",
						email: user.email || "",
						status: user.status || "Inactive",
						isApproved: user.kycApproved || false,
					}));

					setSellers(mappedSeller);
				} else {
					// Map the user data to match Seller structure
					const mappedSeller = data.users.map((user: UserData) => ({
						id: user.id,
						name: user.name || "",
						phone: user.phone || "",
						email: user.email || "",
						status: user.status || "Inactive",
						isApproved: user.kycApproved || false,
					}));

					setSellers(mappedSeller);
				}
			} catch {
				toast.error("Failed to load sellers");
			} finally {
				setLoading(false);
			}
		};

		fetchSellers();
	}, []);

	const handleAddSeller = () => {
		setCurrentSeller(null);
		setIsFormOpen(true);
	};

	const handleEditSeller = (seller: Seller) => {
		setCurrentSeller(seller);
		setIsFormOpen(true);
	};

	const handleDeleteSeller = (id: string, name: string) => {
		setSellerToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!sellerToDelete) return;

		try {
			// Call the API to delete the seller
			const response = await fetch(`/api/users/${sellerToDelete.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Update local state
			setSellers(sellers.filter((d) => d.id !== sellerToDelete.id));
			toast.success(`${sellerToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete seller");
		} finally {
			setIsDeleteDialogOpen(false);
			setSellerToDelete(null);
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
				onDeleteSeller={handleDeleteSeller}
				onUpdateStatus={handleUpdateStatus}
				onToggleApproval={handleToggleApproval}
                onLoginAsSeller={handleLoginAsSeller}
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

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Confirm Deletion</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete {sellerToDelete?.name}? This
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
