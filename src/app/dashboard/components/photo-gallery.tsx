"use client";
import { useState, useEffect } from "react";
import {
	Loader2,
	Plus,
	Trash2,
	Image as ImageIcon,
	X,
	Save,
	Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from "@/components/ui/card";
import { toast } from "@/lib/toast";
import Image from "next/image";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface Photo {
	id: string;
	url: string;
	title?: string;
	description?: string;
}

interface UserProfile {
	id: string;
	name: string;
	category?: string;
	profileImageUrl?: string;
	images?: (string | Photo)[];
}

interface PhotoGalleryProps {
	userId: string;
	editable?: boolean;
}

export default function PhotoGallery({
	userId,
	editable = true,
}: PhotoGalleryProps) {
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [user, setUser] = useState<UserProfile | null>(null);

	// Edit state for photos
	const [editState, setEditState] = useState<{
		url: string;
		title: string;
		description: string;
		file: File | null;
	} | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	// Fetch user data including images
	useEffect(() => {
		setLoading(true);
		setError(null);
		Promise.all([
			fetch(`/api/users/${userId}`).then((res) => {
				if (!res.ok) throw new Error("Failed to fetch user data");
				return res.json();
			}),
			fetch(`/api/images?userId=${userId}`).then((res) => {
				if (!res.ok) throw new Error("Failed to fetch images");
				return res.json();
			}),
		])
			.then(([userData, imagesData]) => {
				setUser(userData);
				setPhotos(imagesData.images || []);
			})
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, [userId]);

	// Add a state for the photo details form
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [photoTitle, setPhotoTitle] = useState("");
	const [photoDescription, setPhotoDescription] = useState("");
	const [showDetailsForm, setShowDetailsForm] = useState(false);

	// Handle file selection
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) {
			return;
		}

		// Store the file for later upload after adding details
		setUploadedFile(files[0]);
		setShowDetailsForm(true);
	};

	// Handle form submission and file upload
	const handleUploadWithDetails = async () => {
		if (!uploadedFile) {
			return;
		}

		setIsUploading(true);
		const loadingToast = toast.loading("Uploading image...");

		try {
			// Validate file type
			const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
			if (!validTypes.includes(uploadedFile.type)) {
				toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
				return;
			}

			// Validate file size (5MB limit)
			const maxSize = 5 * 1024 * 1024;
			if (uploadedFile.size > maxSize) {
				toast.error("Image size must be less than 5MB");
				return;
			}

			const formData = new FormData();
			formData.append("file", uploadedFile);
			formData.append("userId", userId);

			const response = await fetch("/api/upload/profile-image", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) throw new Error("Failed to upload image");
			const data = await response.json();
			const newPhoto = {
				url: data.imageUrl,
				title: photoTitle.trim() || undefined,
				description: photoDescription.trim() || undefined,
				userId,
			};
			const createRes = await fetch("/api/images", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newPhoto),
			});
			if (!createRes.ok) throw new Error("Failed to create image record");
			const created = await createRes.json();
			setPhotos((prev) => [...prev, created]);
			setPhotoTitle("");
			setPhotoDescription("");
			setUploadedFile(null);
			setShowDetailsForm(false);
			toast.dismiss(loadingToast);
			toast.success("Image uploaded successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to upload image"
			);
		} finally {
			setIsUploading(false);
		}
	};

	// Handle image deletion
	const handleDeletePhoto = async (photo: Photo) => {
		if (!confirm("Are you sure you want to delete this photo?")) return;

		setIsDeleting(true);
		const loadingToast = toast.loading("Deleting image...");

		try {
			const res = await fetch(`/api/images/${photo.id}`, { method: "DELETE" });
			if (!res.ok) throw new Error("Failed to delete image");
			setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
			if (selectedPhoto && selectedPhoto.id === photo.id)
				setSelectedPhoto(null);
			toast.dismiss(loadingToast);
			toast.success("Image deleted successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to delete image"
			);
		} finally {
			setIsDeleting(false);
		}
	};

	// Handle photo editing
	const handleEditPhoto = (photo: Photo) => {
		setEditState({
			url: photo.url,
			title: photo.title || "",
			description: photo.description || "",
			file: null,
		});
	};

	const handleSaveEdit = async () => {
		if (!editState) return;
		setIsSaving(true);
		try {
			let imageUrl = editState.url;
			if (editState.file) {
				const formData = new FormData();
				formData.append("file", editState.file);
				formData.append("userId", userId);
				const response = await fetch("/api/upload/profile-image", {
					method: "POST",
					body: formData,
				});
				if (!response.ok) throw new Error("Failed to upload new image file");
				const data = await response.json();
				imageUrl = data.imageUrl;
			}
			const photoToEdit = photos.find((p) => p.url === editState.url);
			if (!photoToEdit) throw new Error("Image not found");
			const res = await fetch(`/api/images/${photoToEdit.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: editState.title,
					description: editState.description,
					url: imageUrl,
				}),
			});
			if (!res.ok) throw new Error("Failed to update image");
			const updated = await res.json();
			setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
			setEditState(null);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to update photo");
		} finally {
			setIsSaving(false);
		}
	};

	if (loading) {
		return (
			<Card className="flex flex-col items-center justify-center p-12">
				<Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
			</Card>
		);
	}

	if (error) {
		return (
			<div className="text-center p-4 text-red-500">
				<p>Error loading images: {error}</p>
			</div>
		);
	}

	return (
		<Card className="w-full rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-background">
			<CardHeader className="flex flex-row items-center gap-6 p-4 border-b">
				<div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 shadow-md bg-white dark:bg-zinc-800 flex items-center justify-center">
					<Image
						src={user?.profileImageUrl || "/placeholder-avatar.png"}
						alt={user?.name || "User"}
						width={64}
						height={64}
						className="object-cover w-full h-full"
					/>
				</div>
				<div className="flex flex-col justify-center flex-1 gap-1">
					<CardTitle className="text-xl font-bold text-left">
						{user?.name || "User"}
					</CardTitle>
					{user?.category && (
						<CardDescription className="text-sm text-muted-foreground text-left">
							{user.category}
						</CardDescription>
					)}
				</div>
				{editable && (
					<label className="cursor-pointer">
						<input
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleFileSelect}
							disabled={isUploading}
						/>
						<Button
							type="button"
							disabled={isUploading || showDetailsForm}
							onClick={() => {
								const fileInput = document.querySelector(
									'input[type="file"]'
								) as HTMLInputElement;
								if (fileInput) fileInput.click();
							}}
							className="rounded-full"
						>
							<Plus className="h-4 w-4 mr-2" />
							{isUploading ? "Uploading..." : "Add Photo"}
						</Button>
					</label>
				)}
			</CardHeader>
			<CardContent className="p-4">
				{/* Photo Details Form */}
				{showDetailsForm && uploadedFile && (
					<Card className="mb-6 border bg-muted/30 shadow-sm">
						<CardContent className="p-4 space-y-4">
							<div>
								<h3 className="text-lg font-medium mb-3">Add Photo Details</h3>
								<div className="space-y-4">
									<div>
										<label
											htmlFor="photoTitle"
											className="block text-sm font-medium mb-1"
										>
											Title (optional)
										</label>
										<input
											id="photoTitle"
											type="text"
											value={photoTitle}
											onChange={(e) => setPhotoTitle(e.target.value)}
											className="w-full p-2 border rounded-md"
											placeholder="Give your photo a title"
										/>
									</div>
									<div>
										<label
											htmlFor="photoDescription"
											className="block text-sm font-medium mb-1"
										>
											Description (optional)
										</label>
										<textarea
											id="photoDescription"
											value={photoDescription}
											onChange={(e) => setPhotoDescription(e.target.value)}
											className="w-full p-2 border rounded-md"
											placeholder="Add a description for your photo"
											rows={3}
										/>
									</div>
									<div className="flex justify-end space-x-2">
										<Button
											variant="outline"
											onClick={() => {
												setShowDetailsForm(false);
												setUploadedFile(null);
												setPhotoTitle("");
												setPhotoDescription("");
											}}
											className="rounded-full"
										>
											<X className="h-4 w-4 mr-2" />
											Cancel
										</Button>
										<Button
											onClick={handleUploadWithDetails}
											disabled={isUploading}
											className="rounded-full"
										>
											{isUploading ? (
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											) : (
												<Save className="h-4 w-4 mr-2" />
											)}
											Upload Photo
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{photos.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="bg-muted/30 p-4 rounded-full mb-4">
							<ImageIcon className="h-8 w-8 text-muted-foreground" />
						</div>
						<p className="text-muted-foreground font-medium">
							No photos yet. Add some to showcase your work.
						</p>
						{editable && (
							<Button
								variant="outline"
								className="mt-4 rounded-full"
								onClick={() => {
									const fileInput = document.querySelector(
										'input[type="file"]'
									) as HTMLInputElement;
									if (fileInput) fileInput.click();
								}}
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Your First Photo
							</Button>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						{photos.map((photo, index) => (
							<Card
								key={`${photo.url}-${index}`}
								className="shadow-sm border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300"
							>
								{editState && editState.url === photo.url ? (
									<div className="p-4 space-y-3">
										<input
											type="text"
											value={editState.title}
											onChange={(e) =>
												setEditState((s) =>
													s ? { ...s, title: e.target.value } : null
												)
											}
											placeholder="Title (optional)"
											className="w-full p-2 border rounded-md text-sm"
										/>
										<textarea
											value={editState.description}
											onChange={(e) =>
												setEditState((s) =>
													s ? { ...s, description: e.target.value } : null
												)
											}
											placeholder="Description (optional)"
											className="w-full p-2 border rounded-md text-sm"
											rows={3}
										/>
										<input
											type="file"
											accept="image/*"
											onChange={(e) =>
												setEditState((s) =>
													s
														? { ...s, file: e.target.files?.[0] || null }
														: null
												)
											}
											className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
										/>
										<div className="flex gap-2 justify-end pt-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => setEditState(null)}
												className="rounded-full px-4"
											>
												<X className="h-4 w-4 mr-2" />
												Cancel
											</Button>
											<Button
												size="sm"
												onClick={handleSaveEdit}
												disabled={isSaving}
												className="rounded-full px-4"
											>
												{isSaving ? (
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												) : (
													<Save className="h-4 w-4 mr-2" />
												)}
												Save
											</Button>
										</div>
									</div>
								) : (
									<>
										<Dialog>
											<DialogTrigger asChild>
												<div
													className="relative aspect-video bg-black cursor-pointer"
													onClick={() => setSelectedPhoto(photo)}
												>
													<Image
														src={photo.url}
														alt={photo.title || `Photo ${index + 1}`}
														fill
														sizes="(max-width: 768px) 100vw, 50vw"
														className="object-cover rounded-t-lg"
													/>
												</div>
											</DialogTrigger>
											<DialogContent className="max-w-3xl">
												<DialogHeader>
													<DialogTitle className="flex justify-between items-center">
														<span>{photo.title || `Photo ${index + 1}`}</span>
													</DialogTitle>
												</DialogHeader>
												<div className="relative aspect-[4/3] w-full mt-2">
													<Image
														src={photo.url}
														alt={photo.title || `Photo ${index + 1}`}
														fill
														sizes="80vw"
														className="object-contain"
													/>
												</div>
												{photo.description && (
													<div className="mt-4 text-muted-foreground">
														{photo.description}
													</div>
												)}
											</DialogContent>
										</Dialog>
										<CardHeader className="flex flex-row items-start gap-3 pb-1 pt-3 px-4">
											<div className="flex-1">
												<CardTitle className="text-base font-semibold line-clamp-1">
													{photo.title || `Photo ${index + 1}`}
												</CardTitle>
												{photo.description && (
													<CardDescription className="text-sm mt-1 line-clamp-2">
														{photo.description}
													</CardDescription>
												)}
											</div>
											{editable && (
												<div className="flex gap-2">
													<Button
														size="icon"
														variant="ghost"
														onClick={() => handleEditPhoto(photo)}
														className="h-8 w-8 rounded-full hover:bg-primary/10"
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														size="icon"
														variant="ghost"
														onClick={() => handleDeletePhoto(photo)}
														disabled={isDeleting}
														className="h-8 w-8 rounded-full text-red-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											)}
										</CardHeader>
									</>
								)}
							</Card>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
