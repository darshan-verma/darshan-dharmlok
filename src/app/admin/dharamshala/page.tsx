"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import DharamshalaTable, {
	Dharamshala,
} from "../components/dharamshala/DharamShalaTable";
import DharamshalaForm from "../components/dharamshala/DharamShalaForm";
import { resolveReligiousCategories } from "@/lib/religious-categories";

export default function DharamshalaPage() {
	const [dharamshalas, setDharamshalas] = useState<Dharamshala[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentDharamshala, setCurrentDharamshala] =
		useState<Partial<Dharamshala> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [dharamshalaToDelete, setDharamshalaToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Fetch dharamshalas on mount
	useEffect(() => {
		const fetchDharamshalas = async () => {
			setLoading(true);
			try {
				const response = await fetch("/api/dharamshala");
				if (!response.ok) throw new Error("Failed to fetch dharamshalas");
				const data = await response.json();
				setDharamshalas(
					(Array.isArray(data) ? data : []).map((item: Dharamshala) => ({
						...item,
						religiousCategories: resolveReligiousCategories(item),
					}))
				);
			} catch {
				toast.error("Failed to load dharamshalas");
			} finally {
				setLoading(false);
			}
		};
		fetchDharamshalas();
	}, []);

	const handleAddDharamshala = () => {
		setCurrentDharamshala(null);
		setIsFormOpen(true);
	};

	const handleEditDharamshala = (dharamshala: Dharamshala) => {
		setCurrentDharamshala(dharamshala);
		setIsFormOpen(true);
	};

	const handleDeleteDharamshala = (id: string, name: string) => {
		setDharamshalaToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!dharamshalaToDelete) return;
		try {
			const response = await fetch(
				`/api/dharamshala/${dharamshalaToDelete.id}`,
				{
					method: "DELETE",
				}
			);
			if (!response.ok) throw new Error();
			setDharamshalas((prev) =>
				prev.filter((t) => t.id !== dharamshalaToDelete.id)
			);
			toast.success(`${dharamshalaToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete dharamshala");
		} finally {
			setIsDeleteDialogOpen(false);
			setDharamshalaToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/dharamshala/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!response.ok) throw new Error();
			const updated = await response.json();
			setDharamshalas((prev) =>
				prev.map((t) => (t.id === id ? { ...t, status: updated.status } : t))
			);
			toast.success("Status updated");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleViewDharamshala = (dharamshala: Dharamshala) => {
		window.location.href = `/admin/dharamshala/${dharamshala.id}`;
	};

	const handleFormSubmit = async (data: Omit<Dharamshala, "id">) => {
		setIsSubmitting(true);
		try {
			let response: Response;
			let saved: Dharamshala;
			if (currentDharamshala && currentDharamshala.id) {
				response = await fetch(`/api/dharamshala/${currentDharamshala.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error();
				saved = await response.json();
				setDharamshalas((prev) =>
					prev.map((t) => (t.id === currentDharamshala.id ? saved : t))
				);
				toast.success("Dharamshala updated");
			} else {
				response = await fetch("/api/dharamshala", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error();
				saved = await response.json();
				setDharamshalas((prev) => [saved, ...prev]);
				toast.success("Dharamshala added");
			}
			setIsFormOpen(false);
			setCurrentDharamshala(null);
		} catch {
			toast.error("Failed to save dharamshala");
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
			<h1 className="text-2xl font-bold mb-6">Dharamshala Management</h1>
			<DharamshalaTable
				dharamshalas={dharamshalas}
				setDharamshalas={setDharamshalas}
				onAddDharamshala={handleAddDharamshala}
				onEditDharamshala={handleEditDharamshala}
				onDeleteDharamshala={handleDeleteDharamshala}
				onUpdateStatus={handleUpdateStatus}
				onViewDharamshala={handleViewDharamshala}
			/>
			{/* Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentDharamshala?.id
								? "Edit Dharamshala"
								: "Add New Dharamshala"}
						</DialogTitle>
					</DialogHeader>
					<DharamshalaForm
						initialData={currentDharamshala || undefined}
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
							Are you sure you want to delete {dharamshalaToDelete?.name}? This
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
