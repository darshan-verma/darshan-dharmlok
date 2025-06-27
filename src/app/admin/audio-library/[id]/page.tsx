"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { toast } from "@/lib/toast";
import { SongForm } from "@/app/admin/components/audio-library/SongForm";
import { SongTable } from "@/app/admin/components/audio-library/SongTable";
import { DeleteConfirmationDialog } from "@/app/admin/components/audio-library/DeleteConfirmationDialog";
import { Song } from "@/app/admin/components/audio-library/types";

export default function AudioLibraryDetailPage() {
	const params = useParams();
	const router = useRouter();
	const audioLibraryId = params?.id as string;

	const [songs, setSongs] = useState<Song[]>([]);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [currentSong, setCurrentSong] = useState<Song | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [songToDelete, setSongToDelete] = useState<Song | null>(null);

	// Fetch songs for this audio library
	useEffect(() => {
		const fetchSongs = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/audio-library/${audioLibraryId}/songs`
				);
				if (!response.ok) throw new Error("Failed to fetch songs");
				const data = await response.json();
				setSongs(data);
			} catch {
				toast.error("Failed to load songs");
			} finally {
				setLoading(false);
			}
		};
		if (audioLibraryId) fetchSongs();
	}, [audioLibraryId]);

	// Handle song form save (both add and edit)
	const handleSaveSong = (savedSong: Song) => {
		if (isEditing) {
			setSongs((prev) =>
				prev.map((s) => (s.id === savedSong.id ? savedSong : s))
			);
			toast.success("Song updated successfully");
		} else {
			setSongs((prev) => [savedSong, ...prev]);
			toast.success("Song added successfully");
		}
		resetEditState();
	};

	// Handle song edit
	const handleEditSong = (song: Song) => {
		setCurrentSong(song);
		setIsEditing(true);
	};

	// Handle song delete
	const handleDeleteSong = (song: Song) => {
		setSongToDelete(song);
		setIsDeleteDialogOpen(true);
	};

	// Confirm delete song
	const confirmDeleteSong = async () => {
		if (!songToDelete) return;
		try {
			const response = await fetch(
				`/api/audio-library/${audioLibraryId}/songs/${songToDelete.id}`,
				{
					method: "DELETE",
				}
			);
			if (!response.ok) throw new Error();
			setSongs((prev) => prev.filter((s) => s.id !== songToDelete.id));
			toast.success(`${songToDelete.name} has been deleted`);
		} catch {
			toast.error("Failed to delete song");
		} finally {
			closeDeleteDialog();
		}
	};

	// Close delete dialog
	const closeDeleteDialog = () => {
		setIsDeleteDialogOpen(false);
		setSongToDelete(null);
	};

	// Reset edit state
	const resetEditState = () => {
		setIsEditing(false);
		setCurrentSong(null);
	};

	// Handle status update
	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(
				`/api/audio-library/${audioLibraryId}/songs/${id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: newStatus }),
				}
			);
			if (!response.ok) throw new Error();
			const updated = await response.json();
			setSongs((prev) =>
				prev.map((s) => (s.id === id ? { ...s, status: updated.status } : s))
			);
			toast.success("Status updated");
		} catch {
			toast.error("Failed to update status");
		}
	};

	// Display loading state
	if (loading && songs.length === 0) {
		return (
			<div className="container mx-auto py-6">
				<div className="flex items-center gap-4 mb-6">
					<Button
						variant="outline"
						size="icon"
						onClick={() => router.push("/admin/audio-library")}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<h1 className="text-2xl font-bold">Audio Library Songs</h1>
				</div>
				<div className="flex justify-center items-center h-40">Loading...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6">
			<div className="flex items-center gap-4 mb-6">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/audio-library")}
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Audio Library Songs</h1>
			</div>

			{/* Song Form Component */}
			<SongForm
				audioLibraryId={audioLibraryId}
				isEditing={isEditing}
				editingSong={currentSong}
				onSave={handleSaveSong}
				onCancel={resetEditState}
			/>

			{/* Song Table Component */}
			<SongTable
				songs={songs}
				onEdit={handleEditSong}
				onDelete={handleDeleteSong}
				onUpdateStatus={handleUpdateStatus}
			/>

			{/* Delete Confirmation Dialog Component */}
			<DeleteConfirmationDialog
				isOpen={isDeleteDialogOpen}
				songToDelete={songToDelete}
				onClose={closeDeleteDialog}
				onConfirm={confirmDeleteSong}
			/>
		</div>
	);
}
