"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import AudioLibraryTable, {
	AudioLibrary,
} from "../components/audio-library/AudioLibraryTable";
import AudioLibraryForm from "../components/audio-library/AudioLibraryForm";

export default function AudioLibraryPage() {
	const [audioLibraries, setAudioLibraries] = useState<AudioLibrary[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentAudioLibrary, setCurrentAudioLibrary] =
		useState<Partial<AudioLibrary> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [audioLibraryToDelete, setAudioLibraryToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Fetch audio libraries on mount
	useEffect(() => {
		const fetchAudioLibraries = async () => {
			setLoading(true);
			try {
				const response = await fetch("/api/audio-library");
				if (!response.ok) throw new Error("Failed to fetch audio libraries");
				const data = await response.json();
				setAudioLibraries(data);
			} catch {
				toast.error("Failed to load audio libraries");
			} finally {
				setLoading(false);
			}
		};
		fetchAudioLibraries();
	}, []);

	const handleAddAudioLibrary = () => {
		setCurrentAudioLibrary(null);
		setIsFormOpen(true);
	};

	const handleEditAudioLibrary = (audioLibrary: AudioLibrary) => {
		setCurrentAudioLibrary(audioLibrary);
		setIsFormOpen(true);
	};

	const handleDeleteAudioLibrary = (id: string, name: string) => {
		setAudioLibraryToDelete({ id, name });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!audioLibraryToDelete) return;
		try {
			const response = await fetch(
				`/api/audio-library/${audioLibraryToDelete.id}`,
				{
					method: "DELETE",
				}
			);
			if (!response.ok) throw new Error();
			setAudioLibraries((prev) =>
				prev.filter((t) => t.id !== audioLibraryToDelete.id)
			);
			toast.success(`${audioLibraryToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete audio library");
		} finally {
			setIsDeleteDialogOpen(false);
			setAudioLibraryToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/audio-library/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!response.ok) throw new Error();
			const updated = await response.json();
			setAudioLibraries((prev) =>
				prev.map((t) => (t.id === id ? { ...t, status: updated.status } : t))
			);
			toast.success("Status updated");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleViewAudioLibrary = (audioLibrary: AudioLibrary) => {
		window.location.href = `/admin/audio-library/${audioLibrary.id}`;
	};

	const handleAddSongs = (audioLibrary: AudioLibrary) => {
		window.location.href = `/admin/audio-library/${audioLibrary.id}`;
	};

	const handleFormSubmit = async (data: Omit<AudioLibrary, "id">) => {
		setIsSubmitting(true);
		try {
			let response: Response;
			let saved: AudioLibrary;
			if (currentAudioLibrary && currentAudioLibrary.id) {
				response = await fetch(`/api/audio-library/${currentAudioLibrary.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error();
				saved = await response.json();
				setAudioLibraries((prev) =>
					prev.map((t) => (t.id === currentAudioLibrary.id ? saved : t))
				);
				toast.success("Audio library updated");
			} else {
				response = await fetch("/api/audio-library", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error();
				saved = await response.json();
				setAudioLibraries((prev) => [saved, ...prev]);
				toast.success("Audio library added");
			}
			setIsFormOpen(false);
			setCurrentAudioLibrary(null);
		} catch {
			toast.error("Failed to save audio library");
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
			<h1 className="text-2xl font-bold mb-6">Audio Library Management</h1>
			<AudioLibraryTable
				audioLibraries={audioLibraries}
				setAudioLibraries={setAudioLibraries}
				onAddAudioLibrary={handleAddAudioLibrary}
				onEditAudioLibrary={handleEditAudioLibrary}
				onDeleteAudioLibrary={handleDeleteAudioLibrary}
				onUpdateStatus={handleUpdateStatus}
				onViewAudioLibrary={handleViewAudioLibrary}
				onAddSongs={handleAddSongs}
			/>
			{/* Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentAudioLibrary?.id
								? "Edit Audio Library"
								: "Add New Audio Library"}
						</DialogTitle>
					</DialogHeader>
					<AudioLibraryForm
						initialData={currentAudioLibrary || undefined}
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
							Are you sure you want to delete {audioLibraryToDelete?.name}? This
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
