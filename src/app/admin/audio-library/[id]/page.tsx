"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ChevronDown,
	ChevronUp,
	Edit,
	Trash2,
	CheckCircle2,
	CircleSlash,
	Image as ImageIcon,
	ChevronLeft,
	Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

type Song = {
	id: string;
	name: string;
	date: string;
	description: string;
	audioFile: string;
	thumbnail: string;
	status: string;
};

const formatDate = (dateString: string) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

export default function AudioLibraryDetailPage() {
	const params = useParams();
	const router = useRouter();
	const audioLibraryId = params?.id as string;

	const [songs, setSongs] = useState<Song[]>([]);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [currentSong, setCurrentSong] = useState<Partial<Song> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [songToDelete, setSongToDelete] = useState<Song | null>(null);
	const [collapseOpen, setCollapseOpen] = useState(false);

	// Song form state
	const [songForm, setSongForm] = useState<Omit<Song, "id">>({
		name: "",
		date: "",
		description: "",
		audioFile: "",
		thumbnail: "",
		status: "Active",
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [isUploadingAudio, setIsUploadingAudio] = useState(false);
	const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

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

	const resetForm = () => {
		setSongForm({
			name: "",
			date: "",
			description: "",
			audioFile: "",
			thumbnail: "",
			status: "Active",
		});
		setFormErrors({});
		setIsEditing(false);
		setCurrentSong(null);
	};

	const validateForm = (data: Omit<Song, "id">) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Song name is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.audioFile) errors.audioFile = "Audio file is required";
		if (!data.thumbnail) errors.thumbnail = "Thumbnail is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleFormChange = (field: keyof Omit<Song, "id">, value: string) => {
		setSongForm((prev) => ({ ...prev, [field]: value }));
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	const handleAudioUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setIsUploadingAudio(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("audioLibraryId", audioLibraryId);
			const response = await fetch("/api/upload/song-audio", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) throw new Error("Failed to upload audio");
			const { audioUrl } = await response.json();
			setSongForm((prev) => ({ ...prev, audioFile: audioUrl }));
			toast.success("Audio uploaded!");
		} catch {
			toast.error("Failed to upload audio");
		} finally {
			setIsUploadingAudio(false);
		}
	};

	const handleThumbnailUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setIsUploadingThumbnail(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("audioLibraryId", audioLibraryId);
			const response = await fetch("/api/upload/song-thumbnail", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) throw new Error("Failed to upload thumbnail");
			const { thumbnailUrl } = await response.json();
			setSongForm((prev) => ({ ...prev, thumbnail: thumbnailUrl }));
			toast.success("Thumbnail uploaded!");
		} catch {
			toast.error("Failed to upload thumbnail");
		} finally {
			setIsUploadingThumbnail(false);
		}
	};

	const handleFormSubmit = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		const errors = validateForm(songForm);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;
		setIsSubmitting(true);
		try {
			let response: Response;
			let saved: Song;
			if (isEditing && currentSong?.id) {
				response = await fetch(
					`/api/audio-library/${audioLibraryId}/songs/${currentSong.id}`,
					{
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(songForm),
					}
				);
				if (!response.ok) throw new Error();
				saved = await response.json();
				setSongs((prev) =>
					prev.map((s) => (s.id === currentSong.id ? saved : s))
				);
				toast.success("Song updated");
			} else {
				response = await fetch(`/api/audio-library/${audioLibraryId}/songs`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(songForm),
				});
				if (!response.ok) throw new Error();
				saved = await response.json();
				setSongs((prev) => [saved, ...prev]);
				toast.success("Song added");
			}
			resetForm();
			setCollapseOpen(false);
		} catch {
			toast.error("Failed to save song");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditSong = (song: Song) => {
		setSongForm({
			name: song.name,
			date: song.date,
			description: song.description,
			audioFile: song.audioFile,
			thumbnail: song.thumbnail,
			status: song.status,
		});
		setCurrentSong(song);
		setIsEditing(true);
		setCollapseOpen(true);
	};

	const handleDeleteSong = (song: Song) => {
		setSongToDelete(song);
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
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
			setIsDeleteDialogOpen(false);
			setSongToDelete(null);
		}
	};

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

	// Optionally, show loading spinner or message
	if (loading) {
		return (
			<div className="flex justify-center items-center h-40">Loading...</div>
		);
	}

	function getStatusColor(status: string) {
		switch (status) {
			case "Active":
				return "bg-green-100 text-green-800";
			case "Inactive":
				return "bg-red-100 text-gray-600";
			default:
				return "bg-gray-100 text-gray-600";
		}
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
			{/* Collapsible Song Form */}
			<div className="mb-6">
				<Button
					variant="outline"
					className="flex items-center gap-2"
					onClick={() => {
						setCollapseOpen((open) => !open);
						if (!collapseOpen) resetForm();
					}}
				>
					{collapseOpen ? (
						<ChevronUp className="h-4 w-4" />
					) : (
						<ChevronDown className="h-4 w-4" />
					)}
					{isEditing ? "Edit Song" : "Add Song"}
				</Button>
				{collapseOpen && (
					<form
						onSubmit={handleFormSubmit}
						className="mt-4 p-4 border rounded bg-gray-50 space-y-4"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Song Name *</Label>
								<Input
									id="name"
									value={songForm.name}
									onChange={(e) => handleFormChange("name", e.target.value)}
									placeholder="Enter song name"
									className={formErrors.name ? "border-red-500" : ""}
								/>
								{formErrors.name && (
									<p className="text-sm text-red-500">{formErrors.name}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="date">Date *</Label>
								<Input
									id="date"
									type="date"
									value={songForm.date}
									onChange={(e) => handleFormChange("date", e.target.value)}
									className={formErrors.date ? "border-red-500" : ""}
								/>
								{formErrors.date && (
									<p className="text-sm text-red-500">{formErrors.date}</p>
								)}
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={songForm.description}
								onChange={(e) =>
									handleFormChange("description", e.target.value)
								}
								placeholder="Enter song description"
								rows={2}
							/>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Audio File *</Label>
								<Input
									type="file"
									accept="audio/*"
									onChange={handleAudioUpload}
									disabled={isUploadingAudio}
								/>
								{songForm.audioFile && (
									<audio
										controls
										src={songForm.audioFile}
										className="mt-2 w-full"
									/>
								)}
								{formErrors.audioFile && (
									<p className="text-sm text-red-500">{formErrors.audioFile}</p>
								)}
								{isUploadingAudio && (
									<p className="text-xs text-blue-600">Uploading audio...</p>
								)}
							</div>
							<div className="space-y-2">
								<Label>Thumbnail *</Label>
								<Input
									type="file"
									accept="image/*"
									onChange={handleThumbnailUpload}
									disabled={isUploadingThumbnail}
								/>
								{songForm.thumbnail && (
									<Image
										src={songForm.thumbnail}
										alt="Thumbnail"
										width={500}
										height={300}
										className="w-24 h-16 object-cover rounded mt-2 border"
									/>
								)}
								{formErrors.thumbnail && (
									<p className="text-sm text-red-500">{formErrors.thumbnail}</p>
								)}
								{isUploadingThumbnail && (
									<p className="text-xs text-blue-600">
										Uploading thumbnail...
									</p>
								)}
							</div>
						</div>
						<div className="space-y-2">
							<Label>Status *</Label>
							<Select
								value={songForm.status}
								onValueChange={(value) => handleFormChange("status", value)}
								disabled={isSubmitting}
							>
								<SelectTrigger
									className={formErrors.status ? "border-red-500" : ""}
								>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Active">Active</SelectItem>
									<SelectItem value="Inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
							{formErrors.status && (
								<p className="text-sm text-red-500">{formErrors.status}</p>
							)}
						</div>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={resetForm}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting
									? isEditing
										? "Updating..."
										: "Saving..."
									: isEditing
									? "Update Song"
									: "Save Song"}
							</Button>
						</div>
					</form>
				)}
			</div>
			{/* Songs Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Description</TableHead>
							<TableHead className="text-center">Audio</TableHead>
							<TableHead>Thumbnail</TableHead>
							<TableHead className="text-center">Status</TableHead>
							<TableHead className="text-center">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{songs.length > 0 ? (
							songs.map((song) => (
								<TableRow key={song.id}>
									<TableCell>{song.name}</TableCell>
									<TableCell>{formatDate(song.date)}</TableCell>
									<TableCell>{song.description}</TableCell>
									<TableCell className="min-w-[180px] text-center">
										{song.audioFile ? (
											<audio
												controls
												src={song.audioFile}
												className="w-44 mx-auto"
											/>
										) : (
											<span className="text-xs text-gray-400">No audio</span>
										)}
									</TableCell>
									<TableCell>
										{song.thumbnail ? (
											<Image
												src={song.thumbnail}
												alt="Thumbnail"
												width={500}
												height={300}
												className="w-16 h-10 object-cover rounded border"
											/>
										) : (
											<ImageIcon className="h-6 w-6 text-gray-400" />
										)}
									</TableCell>
									<TableCell className="text-center">
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												song.status
											)}`}
										>
											{song.status}
										</span>
									</TableCell>
									<TableCell className="text-center">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													aria-label="Actions"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="20"
														height="20"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
														className="h-5 w-5"
													>
														<circle cx="12" cy="5" r="1.5" />
														<circle cx="12" cy="12" r="1.5" />
														<circle cx="12" cy="19" r="1.5" />
													</svg>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Manage Song</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<Activity className="h-4 w-4 mr-2" />
														Change Status
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() =>
																handleUpdateStatus(song.id, "Active")
															}
															className={
																song.status === "Active" ? "bg-blue-50" : ""
															}
														>
															<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
															Active
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																handleUpdateStatus(song.id, "Inactive")
															}
															className={
																song.status === "Inactive" ? "bg-blue-50" : ""
															}
														>
															<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
															Inactive
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuItem onClick={() => handleEditSong(song)}>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="flex items-center gap-2 text-red-600"
													onSelect={(e) => {
														e.preventDefault();
														handleDeleteSong(song);
													}}
												>
													<Trash2 className="h-4 w-4" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-6">
									No songs found. Add a new song to this audio library.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Confirm Deletion</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete {songToDelete?.name}? This action
							cannot be undone.
						</p>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							Delete
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
