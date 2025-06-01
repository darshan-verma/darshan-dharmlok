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

export default function KathavachakPage() {
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
			try {
				setLoading(true);

				// Fetch users with userType=Kathavachak from our reusable API endpoint
				const response = await fetch("/api/users?userType=Kathavachak");

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Map the user data to match Kathavachak structure
				const mappedKathavachaks = data.users.map((user: any) => ({
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
				setLoading(false);
			} catch (error) {
				console.error("Error fetching kathavachaks:", error);
				toast.error("Failed to load kathavachaks");
				setLoading(false);
			}
		};

		fetchKathavachaks();
	}, []);

	const handleAddKathavachak = () => {
		setCurrentKathavachak(null);
		setIsFormOpen(true);
	};

	const handleEditKathavachak = (kathavachak: Kathavachak) => {
		setCurrentKathavachak(kathavachak);
		setIsFormOpen(true);
	};

	const handleDeleteKathavachak = (id: string, name: string) => {
		setKathavachakToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!kathavachakToDelete) return;

		try {
			// In a real app, this would be an API call
			// await fetch(`/api/kathavachaks/${kathavachakToDelete.id}`, {
			//   method: 'DELETE',
			// });

			// Update local state
			setKathavachaks(
				kathavachaks.filter((k) => k.id !== kathavachakToDelete.id)
			);
			toast.success(`${kathavachakToDelete.name} has been deleted`);
		} catch (error) {
			console.error("Error deleting kathavachak:", error);
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
		} catch (error) {
			console.error("Error updating status:", error);
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
		} catch (error) {
			console.error("Error toggling approval:", error);
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
		setIsSubmitting(true);
		try {
			if (currentKathavachak?.id) {
				// Update existing kathavachak
				// In a real app, this would be an API call
				// await fetch(`/api/kathavachaks/${currentKathavachak.id}`, {
				//   method: 'PUT',
				//   headers: { 'Content-Type': 'application/json' },
				//   body: JSON.stringify(kathavachakData),
				// });

				// Update local state
				setKathavachaks(
					kathavachaks.map((k) =>
						k.id === currentKathavachak.id
							? { ...kathavachakData, id: currentKathavachak.id }
							: k
					)
				);
				toast.success("Kathavachak updated successfully");
			} else {
				// Add new kathavachak
				// In a real app, this would be an API call
				// const response = await fetch('/api/kathavachaks', {
				//   method: 'POST',
				//   headers: { 'Content-Type': 'application/json' },
				//   body: JSON.stringify(kathavachakData),
				// });
				// const newKathavachak = await response.json();

				// Mock new kathavachak with generated ID
				const newKathavachak: Kathavachak = {
					...kathavachakData,
					id: Date.now().toString(),
				};

				// Update local state
				setKathavachaks([...kathavachaks, newKathavachak]);
				toast.success("Kathavachak added successfully");
			}

			// Close form dialog
			setIsFormOpen(false);
			setCurrentKathavachak(null);
		} catch (error) {
			console.error("Error saving kathavachak:", error);
			toast.error("Failed to save kathavachak");
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
