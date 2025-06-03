"use client";

import { useState, useEffect } from "react";
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

export default function DharmguruPage() {
	const [dharmgurus, setDharmgurus] = useState<Dharmguru[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentDharmguru, setCurrentDharmguru] =
		useState<Partial<Dharmguru> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [dharmguruToDelete, setDharmguruToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Fetch dharmgurus on component mount
	useEffect(() => {
		const fetchDharmgurus = async () => {
			setLoading(true);
			try {
				const response = await fetch("/api/users?userType=Dharmguru");

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Map the user data to match Kathavachak structure
				const mappedDharmgurus = data.users.map((user: UserData) => ({
					id: user.id,
					name: user.name || "",
					category: user.category || "",
					phone: user.phone || "",
					email: user.email || "",
					status: user.status || "Inactive",
					rank: user.rank || "",
					isApproved: user.kycApproved || false,
				}));

				setDharmgurus(mappedDharmgurus);
			} catch {
				toast.error("Failed to load dharmgurus");
			} finally {
				setLoading(false);
			}
		};

		fetchDharmgurus();
	}, []);

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

	const handleDeleteDharmguru = (id: string, name: string) => {
		setDharmguruToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!dharmguruToDelete) return;

		try {
			// Call the API to delete the dharmguru
			const response = await fetch(`/api/users/${dharmguruToDelete.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Update local state
			setDharmgurus(
				dharmgurus.filter((d) => d.id !== dharmguruToDelete.id)
			);
			toast.success(`${dharmguruToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete dharmguru");
		} finally {
			setIsDeleteDialogOpen(false);
			setDharmguruToDelete(null);
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
			setDharmgurus(
				dharmgurus.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
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
			setDharmgurus(
				dharmgurus.map((d) =>
					d.id === id ? { ...d, isApproved: !currentStatus } : d
				)
			);
			toast.success(
				`Dharmguru ${currentStatus ? "disapproved" : "approved"} successfully`
			);
		} catch {
			toast.error("Failed to update approval status");
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

	const handleFormSubmit = async (dharmguruData: Omit<Dharmguru, "id">) => {
		try {
			const url = currentDharmguru?.id
				? `/api/users/${currentDharmguru.id}`
				: "/api/users";

			const method = currentDharmguru?.id ? "PUT" : "POST";

			// Ensure rank is included in the request data
			const requestData = {
				...(currentDharmguru?.id && { id: currentDharmguru.id }),
				...dharmguruData,
				userType: "Dharmguru",
				isApproved: dharmguruData.isApproved || false,
				rank: dharmguruData.rank || "", // Ensure rank is explicitly set
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
			const fetchResponse = await fetch("/api/users?userType=Dharmguru");
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated dharmgurus");
			}
			const { users } = await fetchResponse.json();

			// Map the user data to match Kathavachak structure
			const mappedDharmgurus = users.map((user: UserData) => ({
				id: user.id,
				name: user.name || "",
				category: user.category || "",
				phone: user.phone || "",
				email: user.email || "",
				status: user.status || "Inactive",
				rank: user.rank || "",
				isApproved: user.kycApproved || false,
			}));

			setDharmgurus(mappedDharmgurus);

			toast.success(
				currentDharmguru?.id
					? "Dharmguru updated successfully"
					: "Dharmguru created successfully"
			);

			setIsFormOpen(false);
			toast.success(
				currentDharmguru?.id
					? "Dharmguru updated successfully"
					: "Dharmguru created successfully"
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
			<h1 className="text-2xl font-bold mb-6">Dharmguru Management</h1>

			<DharmguruTable
				dharmgurus={dharmgurus}
				setDharmgurus={setDharmgurus}
				onAddDharmguru={handleAddDharmguru}
				onEditDharmguru={handleEditDharmguru}
				onDeleteDharmguru={handleDeleteDharmguru}
				onUpdateStatus={handleUpdateStatus}
				onToggleApproval={handleToggleApproval}
				onLoginAsDharmguru={handleLoginAsDharmguru}
			/>

			{/* Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentDharmguru?.id
								? "Edit Dharmguru"
								: "Add New Dharmguru"}
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

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Confirm Deletion</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete {dharmguruToDelete?.name}? This
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
