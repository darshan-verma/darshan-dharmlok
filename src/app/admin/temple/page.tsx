"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import TempleTable, { Temple } from "../components/temple/TempleTable";
import TempleForm from "../components/temple/TempleForm";

export default function TemplePage() {
	const [temples, setTemples] = useState<Temple[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentTemple, setCurrentTemple] = useState<Partial<Temple> | null>(
		null
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [templeToDelete, setTempleToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Fetch temples on mount
	useEffect(() => {
		const fetchTemples = async () => {
			setLoading(true);
			try {
				const response = await fetch("/api/temple");
				if (!response.ok) throw new Error("Failed to fetch temples");
				const data = await response.json();
				const list = Array.isArray(data) ? data : data.content ?? [];
				setTemples(list);
			} catch {
				toast.error("Failed to load temples");
			} finally {
				setLoading(false);
			}
		};
		fetchTemples();
	}, []);

	const handleAddTemple = () => {
		setCurrentTemple(null);
		setIsFormOpen(true);
	};

	const handleEditTemple = (temple: Temple) => {
		setCurrentTemple(temple);
		setIsFormOpen(true);
	};

	const handleDeleteTemple = (id: string, name: string) => {
		setTempleToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!templeToDelete) return;
		try {
			const response = await fetch(`/api/temple/${templeToDelete.id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error();
			setTemples((prev) => prev.filter((t) => t.id !== templeToDelete.id));
			toast.success(`${templeToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete temple");
		} finally {
			setIsDeleteDialogOpen(false);
			setTempleToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/temple/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!response.ok) throw new Error();
			const updated = await response.json();
			setTemples((prev) =>
				prev.map((t) => (t.id === id ? { ...t, status: updated.status } : t))
			);
			toast.success("Status updated");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleViewTemple = (temple: Temple) => {
		window.location.href = `/admin/temple/${temple.id}`;
	};

	const handleFormSubmit = async (data: Omit<Temple, "id">) => {
		setIsSubmitting(true);
		try {
			let response: Response;
			let saved: Temple;
			if (currentTemple && currentTemple.id) {
				response = await fetch(`/api/temple/${currentTemple.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error();
				saved = await response.json();
				setTemples((prev) =>
					prev.map((t) => (t.id === currentTemple.id ? saved : t))
				);
				toast.success("Temple updated");
			} else {
				response = await fetch("/api/temple", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error();
				saved = await response.json();
				setTemples((prev) => [saved, ...prev]);
				toast.success("Temple added");
			}
			setIsFormOpen(false);
			setCurrentTemple(null);
		} catch {
			toast.error("Failed to save temple");
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
			<h1 className="text-2xl font-bold mb-6">Temple Management</h1>
			<TempleTable
				temples={temples}
				setTemples={setTemples}
				onAddTemple={handleAddTemple}
				onEditTemple={handleEditTemple}
				onDeleteTemple={handleDeleteTemple}
				onUpdateStatus={handleUpdateStatus}
				onViewTemple={handleViewTemple}
			/>
			{/* Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentTemple?.id ? "Edit Temple" : "Add New Temple"}
						</DialogTitle>
					</DialogHeader>
					<TempleForm
						initialData={currentTemple || undefined}
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
							Are you sure you want to delete {templeToDelete?.name}? This
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
