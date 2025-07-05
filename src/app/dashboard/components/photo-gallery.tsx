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

		fetch(`/api/users/${userId}`)
			.then((res) => {
				if (!res.ok) {
					throw new Error("Failed to fetch user data");
				}
				return res.json();
			})
			.then((data: UserProfile) => {
				setUser(data);
				// Ensure we handle both array and single string cases
				const imagesData = data.images || [];

				// Convert all images to Photo objects
				const photoObjects = Array.isArray(imagesData)
					? imagesData.map((img) => {
							if (typeof img === "string") {
								// Handle legacy string URLs
								return { url: img };
							} else if (img && typeof img === "object") {
								// Already a Photo object from JSON[]
								return img as Photo;
							}
							return { url: String(img) };
					  })
					: [{ url: String(imagesData) }];

				setPhotos(photoObjects);
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

			try {
				const response = await fetch("/api/upload/profile-image", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`Failed to upload image: ${errorText}`);
				}

				const data = await response.json();

				// Create a new photo object with URL, title, and description
				const newPhoto: Photo = {
					url: data.imageUrl,
					title: photoTitle.trim() || undefined,
					description: photoDescription.trim() || undefined,
				};

				// Add the new photo to the photos array
				setPhotos((prev) => [...prev, newPhoto]);

				// Update the user record to persist the image with metadata
				await fetch(`/api/users/${userId}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						newImages: [newPhoto],
					}),
				});

				// Reset form
				setPhotoTitle("");
				setPhotoDescription("");
				setUploadedFile(null);
				setShowDetailsForm(false);
			} catch (err) {
				throw err;
			}

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
			// Update the user record by sending the image to delete
			const response = await fetch(`/api/users/${userId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					deletedImages: [photo],
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to delete image");
			}

			// Remove the deleted image from the UI
			setPhotos((prev) => prev.filter((p) => p.url !== photo.url));

			// Close the dialog if open
			if (selectedPhoto && selectedPhoto.url === photo.url) {
				setSelectedPhoto(null);
			}

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
			// Update the user record with the edited photo
			await fetch(`/api/users/${userId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					editedImage: {
						oldUrl: editState.url,
						url: imageUrl,
						title: editState.title,
						description: editState.description,
					},
				}),
			});
			setPhotos((prev) =>
				prev.map((p) =>
					p.url === editState.url
						? {
								url: imageUrl,
								title: editState.title,
								description: editState.description,
						  }
						: p
				)
			);
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
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-4">
						{photos.map((photo, index) => (
							<div key={`${photo.url}-${index}`} className="relative group">
								{editState && editState.url === photo.url ? (
									<Card className="mb-2 border bg-muted/30 shadow-sm">
										<CardContent className="p-4 space-y-3">
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
										</CardContent>
									</Card>
								) : (
									<>
										<Dialog>
											<DialogTrigger asChild>
												<div
													className="relative aspect-square rounded-md overflow-hidden cursor-pointer border shadow-sm hover:shadow-md transition-shadow duration-300"
													onClick={() => setSelectedPhoto(photo)}
												>
													<Image
														src={photo.url}
														alt={photo.title || `Photo ${index + 1}`}
														fill
														sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
														className="object-cover hover:scale-105 transition-transform duration-300"
													/>
													{photo.title && (
														<div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm truncate">
															{photo.title}
														</div>
													)}
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

										{editable && (
											<div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
												<Button
													size="icon"
													variant="ghost"
													onClick={() => handleEditPhoto(photo)}
													className="h-8 w-8 rounded-full hover:bg-primary/10"
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="destructive"
													size="icon"
													className="h-8 w-8 rounded-full shadow-md bg-black/60 hover:bg-red-600/90"
													onClick={(e) => {
														e.stopPropagation();
														handleDeletePhoto(photo);
													}}
													disabled={isDeleting}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										)}
									</>
								)}
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
