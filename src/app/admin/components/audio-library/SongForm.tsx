import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { SongFormData, SongFormErrors, Song } from "./types";

interface SongFormProps {
	audioLibraryId: string;
	isEditing: boolean;
	editingSong: Song | null;
	onSave: (song: Song) => void;
	onCancel: () => void;
}

export function SongForm({
	audioLibraryId,
	isEditing,
	editingSong,
	onSave,
	onCancel,
}: SongFormProps) {
	const [collapseOpen, setCollapseOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isUploadingAudio, setIsUploadingAudio] = useState(false);
	const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
	const [formErrors, setFormErrors] = useState<SongFormErrors>({});
	const [songForm, setSongForm] = useState<SongFormData>({
		name: "",
		date: "",
		description: "",
		audioFile: "",
		thumbnail: "",
		status: "Active",
	});

	// Initialize form with editing song data when available
	useEffect(() => {
		if (isEditing && editingSong) {
			setSongForm({
				id: editingSong.id,
				name: editingSong.name,
				date: editingSong.date,
				description: editingSong.description,
				audioFile: editingSong.audioFile,
				thumbnail: editingSong.thumbnail,
				status: editingSong.status,
			});
			setCollapseOpen(true);
		} else {
			resetForm();
		}
	}, [isEditing, editingSong]);

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
	};

	const validateForm = (data: SongFormData): SongFormErrors => {
		const errors: SongFormErrors = {};
		if (!data.name?.trim()) errors.name = "Song name is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.audioFile) errors.audioFile = "Audio file is required";
		if (!data.thumbnail) errors.thumbnail = "Thumbnail is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleFormChange = (field: keyof SongFormData, value: string): void => {
		setSongForm((prev) => ({ ...prev, [field]: value }));
		if (formErrors[field as keyof SongFormErrors]) {
			setFormErrors((prev) => ({ ...prev, [field]: undefined }));
		}
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
			// Clear audioFile error when upload succeeds
			setFormErrors((prev) => ({ ...prev, audioFile: undefined }));
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
			const response = await fetch("/api/upload/profile-image", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) throw new Error("Failed to upload thumbnail");
			const { imageUrl } = await response.json();
			setSongForm((prev) => ({ ...prev, thumbnail: imageUrl }));
			// Clear thumbnail error when upload succeeds
			setFormErrors((prev) => ({ ...prev, thumbnail: undefined }));
			toast.success("Thumbnail uploaded!");
		} catch {
			toast.error("Failed to upload thumbnail");
		} finally {
			setIsUploadingThumbnail(false);
		}
	};

	// Add functions to remove uploaded files
	const handleRemoveAudio = () => {
		setSongForm((prev) => ({ ...prev, audioFile: "" }));
		setFormErrors((prev) => ({ ...prev, audioFile: undefined }));
		toast.success("Audio file removed");
	};

	const handleRemoveThumbnail = () => {
		setSongForm((prev) => ({ ...prev, thumbnail: "" }));
		setFormErrors((prev) => ({ ...prev, thumbnail: undefined }));
		toast.success("Thumbnail removed");
	};

	const handleFormSubmit = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		const errors = validateForm(songForm);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;

		setIsSubmitting(true);
		try {
			let response: Response;
			let savedSong: Song;

			if (isEditing && songForm.id) {
				response = await fetch(
					`/api/audio-library/${audioLibraryId}/songs/${songForm.id}`,
					{
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(songForm),
					}
				);
				if (!response.ok) throw new Error();
				savedSong = await response.json();
			} else {
				response = await fetch(`/api/audio-library/${audioLibraryId}/songs`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(songForm),
				});
				if (!response.ok) throw new Error();
				savedSong = await response.json();
			}

			onSave(savedSong);
			resetForm();
			setCollapseOpen(false);
		} catch {
			toast.error("Failed to save song");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		resetForm();
		onCancel();
	};

	return (
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
							onChange={(e) => handleFormChange("description", e.target.value)}
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
								<div className="mt-2">
									<div className="flex justify-between items-center mb-1">
										<div className="text-xs text-gray-600">Audio Preview:</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={handleRemoveAudio}
											className="h-6 px-2 text-red-500 hover:text-red-700"
										>
											<Trash2 className="h-3.5 w-3.5 mr-1" />
										</Button>
									</div>
									<audio controls src={songForm.audioFile} className="w-full" />
								</div>
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
								<div className="mt-2">
									<div className="flex justify-between items-center mb-1">
										<div className="text-xs text-gray-600">Image Preview:</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={handleRemoveThumbnail}
											className="h-6 px-2 text-red-500 hover:text-red-700"
										>
											<Trash2 className="h-3.5 w-3.5 mr-1" />
										</Button>
									</div>
									<div className="relative">
										<Image
											src={songForm.thumbnail}
											alt="Thumbnail"
											width={120}
											height={80}
											className="w-24 h-16 object-cover rounded border"
										/>
									</div>
								</div>
							)}
							{formErrors.thumbnail && (
								<p className="text-sm text-red-500">{formErrors.thumbnail}</p>
							)}
							{isUploadingThumbnail && (
								<p className="text-xs text-blue-600">Uploading thumbnail...</p>
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
							onClick={handleCancel}
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
	);
}
