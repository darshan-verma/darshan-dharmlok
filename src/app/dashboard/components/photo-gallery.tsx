"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import Image from "next/image";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface UserProfile {
	id: string;
	name: string;
	category?: string;
	profileImageUrl?: string;
	images?: string[];
}

interface PhotoGalleryProps {
	userId: string;
	editable?: boolean;
}

export default function PhotoGallery({
	userId,
	editable = true,
}: PhotoGalleryProps) {
	// Removed unused 'user' state
	const [photos, setPhotos] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

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
				// Ensure we handle both array and single string cases
				const imagesData = data.images || [];
				setPhotos(Array.isArray(imagesData) ? imagesData : [imagesData]);
			})
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, [userId]);

	// Handle file upload
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) {
			return;
		}

		setIsUploading(true);
		const loadingToast = toast.loading("Uploading image...");

		try {
			// Process each file
			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				// Validate file type
				const validTypes = [
					"image/jpeg",
					"image/jpg",
					"image/png",
					"image/webp",
				];
				if (!validTypes.includes(file.type)) {
					toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
					continue;
				}

				// Validate file size (5MB limit)
				const maxSize = 5 * 1024 * 1024;
				if (file.size > maxSize) {
					toast.error("Image size must be less than 5MB");
					continue;
				}

				const formData = new FormData();
				formData.append("file", file);
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

					// Add the new image URL to the photos array
					setPhotos((prev) => [...prev, data.imageUrl]);

					// Update the user record to persist the image
					await fetch(`/api/users/${userId}`, {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							newImages: [data.imageUrl],
						}),
					});
				} catch (err) {
					throw err;
				}
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
			// Reset the file input to allow uploading the same file again
			e.target.value = "";
		}
	};

	// Handle image deletion
	const handleDeletePhoto = async (photoUrl: string) => {
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
					deletedImages: [photoUrl],
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to delete image");
			}

			// Remove the deleted image from the UI
			setPhotos((prev) => prev.filter((url) => url !== photoUrl));

			// Close the dialog if open
			if (selectedPhoto === photoUrl) {
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

	if (loading) {
		return (
			<div className="flex justify-center items-center h-40">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
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
		<Card>
			<CardContent className="p-6">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">Photo Gallery</h2>
					{editable && (
						<div>
							<label className="cursor-pointer">
								<input
									type="file"
									accept="image/*"
									multiple
									className="hidden"
									onChange={handleFileUpload}
									disabled={isUploading}
								/>
								<Button
									type="button"
									disabled={isUploading}
									onClick={() => {
										// Trigger file input click programmatically
										const fileInput = document.querySelector(
											'input[type="file"]'
										) as HTMLInputElement;
										if (fileInput) fileInput.click();
									}}
								>
									<Plus className="h-4 w-4 mr-2" />
									{isUploading ? "Uploading..." : "Add Photo"}
								</Button>
							</label>
						</div>
					)}
				</div>

				{photos.length === 0 ? (
					<div className="text-center p-8 text-muted-foreground">
						<p>No photos yet. Add some to showcase your work.</p>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
						{photos.map((photoUrl, index) => (
							<div key={`${photoUrl}-${index}`} className="relative group">
								<Dialog>
									<DialogTrigger asChild>
										<div
											className="relative aspect-square rounded-md overflow-hidden cursor-pointer border"
											onClick={() => setSelectedPhoto(photoUrl)}
										>
											<Image
												src={photoUrl}
												alt={`Photo ${index + 1}`}
												fill
												sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
												className="object-cover hover:scale-105 transition-transform duration-300"
											/>
										</div>
									</DialogTrigger>
									<DialogContent className="max-w-3xl">
										<DialogHeader>
											<DialogTitle className="flex justify-between items-center">
												<span>Photo {index + 1}</span>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setSelectedPhoto(null)}
												>
													<X className="h-4 w-4" />
												</Button>
											</DialogTitle>
										</DialogHeader>
										<div className="relative aspect-[4/3] w-full mt-2">
											<Image
												src={photoUrl}
												alt={`Photo ${index + 1}`}
												fill
												sizes="80vw"
												className="object-contain"
											/>
										</div>
									</DialogContent>
								</Dialog>

								{editable && (
									<Button
										variant="destructive"
										size="icon"
										className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
										onClick={(e) => {
											e.stopPropagation();
											handleDeletePhoto(photoUrl);
										}}
										disabled={isDeleting}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
