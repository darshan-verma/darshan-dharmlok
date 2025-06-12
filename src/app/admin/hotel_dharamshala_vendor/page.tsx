"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import HotelDharamshalaTable, {
	HotelDharamshala,
} from "../components/hotel_dharamshala_vendor/HotelDharamshalaTable";
import HotelDharamshalaForm from "../components/hotel_dharamshala_vendor/HotelDharamshalaForm";
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
interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
}

export default function HotelDharamshalaPage() {
	const [HotelDharamshalas, setHotelDharamshalas] = useState<
		HotelDharamshala[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentHotelDharamshala, setCurrentHotelDharamshala] =
		useState<Partial<HotelDharamshala> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [HotelDharamshalaToDelete, setHotelDharamshalaToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [pagination, handlePageChange, updatePagination] = usePagination(1, 12);

	// Fetch HotelDharamshalas on component mount
	useEffect(() => {
		const fetchHotelDharamshalas = async () => {
			setLoading(true);
			try {
				// First try to fetch with the standard "HotelDharamshala" format
				const response = await fetch(
					`/api/users?userType=HotelDharamshala&page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Map the user data to match HotelDharamshala structure
				const mappedHotelDharamshalas = data.users.map((user: UserData) => ({
					id: user.id,
					name: user.name || "",
					phone: user.phone || "",
					email: user.email || "",
					status: user.status || "Active",
					kycApproved: user.kycApproved || false,
				}));

				setHotelDharamshalas(mappedHotelDharamshalas);
				updatePagination(data.total, data.pagination.totalPages);
			} catch (error) {
				console.error("Error fetching HotelDharamshalas:", error);
				toast.error("Failed to load HotelDharamshalas.");
			} finally {
				setLoading(false);
			}
		};

		fetchHotelDharamshalas();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage]);

	const handleAddHotelDharamshala = () => {
		setCurrentHotelDharamshala(null);
		setIsFormOpen(true);
	};

	const handleEditHotelDharamshala = (HotelDharamshala: HotelDharamshala) => {
		setCurrentHotelDharamshala(HotelDharamshala);
		setIsFormOpen(true);
	};

	const handleDeleteHotelDharamshala = (id: string, name: string) => {
		setHotelDharamshalaToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!HotelDharamshalaToDelete) return;

		try {
			// Call the API to delete the HotelDharamshala
			const response = await fetch(
				`/api/users/${HotelDharamshalaToDelete.id}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Update local state
			setHotelDharamshalas(
				HotelDharamshalas.filter((d) => d.id !== HotelDharamshalaToDelete.id)
			);
			toast.success(`${HotelDharamshalaToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete HotelDharamshala");
		} finally {
			setIsDeleteDialogOpen(false);
			setHotelDharamshalaToDelete(null);
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
			setHotelDharamshalas(
				HotelDharamshalas.map((d) =>
					d.id === id ? { ...d, status: newStatus } : d
				)
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
			setHotelDharamshalas(
				HotelDharamshalas.map((d) =>
					d.id === id ? { ...d, isApproved: !currentStatus } : d
				)
			);
			toast.success(
				`HotelDharamshala ${
					currentStatus ? "disapproved" : "approved"
				} successfully`
			);
		} catch {
			toast.error("Failed to update approval status");
		}
	};

	const handleLoginAsHotelDharamshala = (
		HotelDharamshala: HotelDharamshala
	) => {
		// This would typically involve setting authentication state
		// For now, we'll just show a toast message
		toast.info(
			`Login as ${HotelDharamshala.name} functionality would be implemented here`
		);

		// In a real implementation, you might do something like:
		// router.push(`/admin/impersonate/${HotelDharamshala.id}`);
	};
	

	const handleFormSubmit = async (
		HotelDharamshalaData: Omit<HotelDharamshala, "id">
	) => {
		setIsSubmitting(true);
		try {
			const url = currentHotelDharamshala?.id
				? `/api/users/${currentHotelDharamshala.id}`
				: "/api/users";

			const method = currentHotelDharamshala?.id ? "PUT" : "POST";

			const requestData = {
				...(currentHotelDharamshala?.id && { id: currentHotelDharamshala.id }),
				...HotelDharamshalaData,
				userType: "HotelDharamshala", // Explicitly set userType to "HotelDharamshala" (no space)
				isApproved: HotelDharamshalaData.isApproved || false,
				kycApproved: HotelDharamshalaData.isApproved || false, // Ensure kycApproved is set to match isApproved
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
				throw new Error("Failed to save HotelDharamshala");
			}

			// Refresh the HotelDharamshalas list
			const fetchResponse = await fetch("/api/users?userType=HotelDharamshala");
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated HotelDharamshalas");
			}
			const { users } = await fetchResponse.json();
			console.log("Refreshed users data:", users);

			// Map the user data to match HotelDharamshala structure
			const mappedHotelDharamshalas = users.map((user: UserData) => ({
				id: user.id,
				name: user.name || "",
				phone: user.phone || "",
				email: user.email || "",
				status: user.status || "Inactive",
				isApproved: user.kycApproved || false,
			}));

			setHotelDharamshalas(mappedHotelDharamshalas);
			setIsFormOpen(false);
			toast.success(
				currentHotelDharamshala?.id
					? "HotelDharamshala updated successfully"
					: "HotelDharamshala created successfully"
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
				toast.error(error.message || "Failed to save HotelDharamshala");
			} else {
				toast.error("Failed to save HotelDharamshala");
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
			<h1 className="text-2xl font-bold mb-6">Hotel Dharamshala Management</h1>

			<HotelDharamshalaTable
				hotelDharamshalas={HotelDharamshalas}
				setHotelDharamshalas={setHotelDharamshalas}
				onAddHotelDharamshala={handleAddHotelDharamshala}
				onEditHotelDharamshala={handleEditHotelDharamshala}
				onDeleteHotelDharamshala={handleDeleteHotelDharamshala}
				onUpdateStatus={handleUpdateStatus}
				onToggleApproval={handleToggleApproval}
				onLoginAsHotelDharamshala={handleLoginAsHotelDharamshala}
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
							{currentHotelDharamshala?.id
								? "Edit Hotel Dharamshala"
								: "Add New Hotel Dharamshala"}
						</DialogTitle>
					</DialogHeader>
					<HotelDharamshalaForm
						initialData={currentHotelDharamshala || undefined}
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
							Are you sure you want to delete {HotelDharamshalaToDelete?.name}?
							This action cannot be undone.
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
