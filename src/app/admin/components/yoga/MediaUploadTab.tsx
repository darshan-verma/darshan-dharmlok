"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Upload, X, Star, GripVertical, Edit } from "lucide-react";
import { toast } from "@/lib/toast";

interface YogaImage {
	url: string;
	caption?: string;
	alt?: string;
	order: number;
}

interface Yoga {
	id: string;
	name: string;
	date: Date;
	description: string;
	status: string;
	images: YogaImage[];
	videos: string[];
	coverImage?: string;
	createdAt: Date;
	updatedAt: Date;
}

interface MediaUploadTabProps {
	yoga: Yoga;
	onUpdate: (updates: {
		bannerImage?: string;
		coverImage?: string;
		images?: YogaImage[];
	}) => void;
	onCancel?: () => void;
}

export default function MediaUploadTab({
	yoga,
	onUpdate,
	onCancel,
}: MediaUploadTabProps) {
	const [bannerImage, setBannerImage] = useState<string>("");
	const [coverImage, setCoverImage] = useState<string>(yoga.coverImage || "");
	const [images, setImages] = useState<YogaImage[]>(yoga.images || []);
	const [uploading, setUploading] = useState(false);
	const [editingImage, setEditingImage] = useState<number | null>(null);
	const [editForm, setEditForm] = useState({ caption: "", alt: "" });

	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		setUploading(true);
		try {
			const uploadPromises = Array.from(files).map(async (file) => {
				const formData = new FormData();
				formData.append("file", file);
				formData.append("type", "image");

				const response = await fetch("/api/upload/image", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					throw new Error("Upload failed");
				}

				const data = await response.json();
				return data.imageUrl || data.url;
			});

			const uploadedUrls = await Promise.all(uploadPromises);
			const validUrls = uploadedUrls.filter(
				(url) => url && typeof url === "string"
			);

			const newImages: YogaImage[] = validUrls.map((url, index) => ({
				url,
				caption: "",
				alt: `Image ${images.length + index + 1}`,
				order: images.length + index + 1,
			}));

			const updatedImages = [...images, ...newImages];
			setImages(updatedImages);

			toast.success("Images uploaded successfully");
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Failed to upload images");
		} finally {
			setUploading(false);
		}
	};

	const handleRemoveImage = (index: number) => {
		const newImages = images.filter((_, i) => i !== index);
		// Reorder remaining images
		const reorderedImages = newImages.map((img, i) => ({
			...img,
			order: i + 1,
		}));
		setImages(reorderedImages);
	};

	const handleMoveImage = (fromIndex: number, toIndex: number) => {
		const newImages = [...images];
		const [movedImage] = newImages.splice(fromIndex, 1);
		newImages.splice(toIndex, 0, movedImage);

		// Update order numbers
		const reorderedImages = newImages.map((img, i) => ({
			...img,
			order: i + 1,
		}));

		setImages(reorderedImages);
	};

	const handleDragStart = (e: React.DragEvent, index: number) => {
		e.dataTransfer.setData("text/plain", index.toString());
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();
		const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
		if (dragIndex !== dropIndex) {
			handleMoveImage(dragIndex, dropIndex);
		}
	};

	const handleEditImage = (index: number) => {
		const image = images[index];
		setEditingImage(index);
		setEditForm({
			caption: image.caption || "",
			alt: image.alt || "",
		});
	};

	const handleSaveEdit = () => {
		if (editingImage === null) return;

		const newImages = [...images];
		newImages[editingImage] = {
			...newImages[editingImage],
			caption: editForm.caption,
			alt: editForm.alt,
		};

		setImages(newImages);
		setEditingImage(null);
		setEditForm({ caption: "", alt: "" });
	};

	const handleCancelEdit = () => {
		setEditingImage(null);
		setEditForm({ caption: "", alt: "" });
	};

	const handleSetCoverImage = (imageUrl: string) => {
		setCoverImage(imageUrl);
		toast.success("Cover image updated");
	};

	const handleSetBannerImage = (imageUrl: string) => {
		setBannerImage(imageUrl);
		toast.success("Banner image updated");
	};

	const getOrdinalSuffix = (num: number) => {
		const j = num % 10;
		const k = num % 100;
		if (j === 1 && k !== 11) return num + "st";
		if (j === 2 && k !== 12) return num + "nd";
		if (j === 3 && k !== 13) return num + "rd";
		return num + "th";
	};

	return (
		<div className="space-y-6">
			{/* Banner Image Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Star className="h-5 w-5" />
						Banner Image
					</CardTitle>
					<CardDescription>
						Set a banner image for this yoga session
					</CardDescription>
				</CardHeader>
				<CardContent>
					{bannerImage ? (
						<div className="relative">
							<div className="relative w-full h-48">
								<Image
									src={bannerImage}
									alt="Banner"
									fill
									className="object-cover rounded-lg"
								/>
							</div>
							<Button
								variant="destructive"
								size="sm"
								className="absolute top-2 right-2"
								onClick={() => setBannerImage("")}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					) : (
						<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
							<p className="text-gray-500 mb-4">No banner image set</p>
							<p className="text-sm text-gray-400">
								Select a banner image from the images below or upload a new one
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Cover Image Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Star className="h-5 w-5" />
						Cover Image
					</CardTitle>
					<CardDescription>
						Set a cover image for this yoga session
					</CardDescription>
				</CardHeader>
				<CardContent>
					{coverImage ? (
						<div className="relative">
							<div className="relative w-full h-48">
								<Image
									src={coverImage}
									alt="Cover"
									fill
									className="object-cover rounded-lg"
								/>
							</div>
							<Button
								variant="destructive"
								size="sm"
								className="absolute top-2 right-2"
								onClick={() => setCoverImage("")}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					) : (
						<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
							<p className="text-gray-500 mb-4">No cover image set</p>
							<p className="text-sm text-gray-400">
								Select a cover image from the images below or upload a new one
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Images Section */}
			<Card>
				<CardHeader>
					<CardTitle>Images</CardTitle>
					<CardDescription>
						Upload and manage yoga session images with details and ordering
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Upload Button */}
					<div>
						<Label htmlFor="image-upload" className="cursor-pointer">
							<div className="flex items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
								<Upload className="h-5 w-5" />
								<span>Upload Images</span>
							</div>
						</Label>
						<Input
							id="image-upload"
							type="file"
							multiple
							accept="image/*"
							onChange={handleImageUpload}
							className="hidden"
							disabled={uploading}
						/>
					</div>

					{/* Images Grid */}
					{images.length > 0 ? (
						<div className="space-y-4">
							{images
								.sort((a, b) => a.order - b.order)
								.map((image, index) => (
									<div
										key={image.url}
										className="border rounded-lg p-4"
										draggable
										onDragStart={(e) => handleDragStart(e, index)}
										onDragOver={handleDragOver}
										onDrop={(e) => handleDrop(e, index)}
									>
										<div className="flex items-start gap-4">
											{/* Drag Handle */}
											<div className="flex items-center">
												<GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
											</div>

											{/* Image */}
											<div className="relative w-32 h-32 flex-shrink-0">
												<Image
													src={image.url}
													alt={image.alt || `Image ${image.order}`}
													fill
													className="object-cover rounded-lg"
												/>
											</div>

											{/* Image Details */}
											<div className="flex-1 space-y-2">
												<div className="flex items-center justify-between">
													<h4 className="font-medium">
														{getOrdinalSuffix(image.order)} Image
													</h4>
													<div className="flex gap-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleEditImage(index)}
														>
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleSetCoverImage(image.url)}
															disabled={coverImage === image.url}
														>
															Set Cover
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleSetBannerImage(image.url)}
															disabled={bannerImage === image.url}
														>
															Set Banner
														</Button>
														<Button
															variant="destructive"
															size="sm"
															onClick={() => handleRemoveImage(index)}
														>
															<X className="h-4 w-4" />
														</Button>
													</div>
												</div>

												{image.caption && (
													<p className="text-sm text-gray-600">
														<strong>Caption:</strong> {image.caption}
													</p>
												)}
												<p className="text-sm text-gray-600">
													<strong>Alt Text:</strong> {image.alt}
												</p>

												{/* Edit Form */}
												{editingImage === index && (
													<div className="space-y-2 border-t pt-2">
														<div>
															<Label htmlFor={`caption-${index}`}>
																Caption
															</Label>
															<Textarea
																id={`caption-${index}`}
																value={editForm.caption}
																onChange={(e) =>
																	setEditForm({
																		...editForm,
																		caption: e.target.value,
																	})
																}
																placeholder="Enter image caption..."
																rows={2}
															/>
														</div>
														<div>
															<Label htmlFor={`alt-${index}`}>Alt Text</Label>
															<Input
																id={`alt-${index}`}
																value={editForm.alt}
																onChange={(e) =>
																	setEditForm({
																		...editForm,
																		alt: e.target.value,
																	})
																}
																placeholder="Enter alt text..."
															/>
														</div>
														<div className="flex gap-2">
															<Button size="sm" onClick={handleSaveEdit}>
																Save
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={handleCancelEdit}
															>
																Cancel
															</Button>
														</div>
													</div>
												)}
											</div>
										</div>

										{/* Status Indicators */}
										<div className="flex gap-2 mt-2">
											{coverImage === image.url && (
												<span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
													Cover Image
												</span>
											)}
											{bannerImage === image.url && (
												<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
													Banner Image
												</span>
											)}
										</div>
									</div>
								))}
						</div>
					) : (
						<p className="text-sm text-gray-500 text-center py-8">
							No images uploaded yet. Click &quot;Upload Images&quot; to add
							some.
						</p>
					)}

					{uploading && (
						<div className="text-center py-4">
							<p className="text-sm text-gray-500">Uploading images...</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<div className="flex justify-end gap-2 pt-4">
				{onCancel && (
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button
					onClick={() =>
						onUpdate({
							bannerImage,
							coverImage,
							images,
						})
					}
				>
					Save Changes
				</Button>
			</div>
		</div>
	);
}
