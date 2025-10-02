"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Upload, X, Star } from "lucide-react";
import { toast } from "@/lib/toast";
import { MotivationSpeaker } from "./MotivationSpeakerTable";

interface MediaUploadTabProps {
	speaker: MotivationSpeaker;
	onUpdate: (updates: {
		coverImage?: string;
		bannerImage?: string;
		images?: string[];
	}) => void;
	onCancel?: () => void;
}

export default function MediaUploadTab({
	speaker,
	onUpdate,
	onCancel,
}: MediaUploadTabProps) {
	const [coverImage, setCoverImage] = useState<string>(
		speaker.coverImage || ""
	);
	const [bannerImage, setBannerImage] = useState<string>(
		speaker.bannerImage || ""
	);
	const [images, setImages] = useState<string[]>(speaker.images || []);
	const [uploading, setUploading] = useState(false);

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
			// Filter out any null or undefined URLs
			const validUrls = uploadedUrls.filter(
				(url) => url && typeof url === "string"
			);

			const newImages = [...images, ...validUrls];
			setImages(newImages);

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
		setImages(newImages);
	};

	const handleSetCoverImage = (imageUrl: string) => {
		setCoverImage(imageUrl);
		toast.success("Cover image updated");
	};

	const handleSetBannerImage = (imageUrl: string) => {
		setBannerImage(imageUrl);
		toast.success("Banner image updated");
	};

	return (
		<div className="space-y-6">
			{/* Cover Image Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Star className="h-5 w-5" />
						Cover Image
					</CardTitle>
					<CardDescription>
						Set a cover image for this motivation speaker
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
								onClick={() => {
									setCoverImage("");
								}}
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

			{/* Banner Image Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Star className="h-5 w-5" />
						Banner Image
					</CardTitle>
					<CardDescription>
						Set a banner image for this motivation speaker
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
								onClick={() => {
									setBannerImage("");
								}}
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

			{/* Images Section */}
			<Card>
				<CardHeader>
					<CardTitle>Images</CardTitle>
					<CardDescription>
						Upload and manage motivation speaker images
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
							onChange={(e) => handleImageUpload(e)}
							className="hidden"
							disabled={uploading}
						/>
					</div>

					{/* Images Grid */}
					{images.length > 0 ? (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{images.map((image, index) => (
								<div key={index} className="relative group">
									<div className="relative w-full h-32">
										<Image
											src={image}
											alt={`Image ${index + 1}`}
											fill
											className="object-cover rounded-lg"
										/>
									</div>
									<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2">
										<Button
											variant="secondary"
											size="sm"
											onClick={() => handleSetCoverImage(image)}
											className="opacity-0 group-hover:opacity-100 transition-opacity"
											disabled={coverImage === image}
										>
											<Star className="h-4 w-4" />
										</Button>
										<Button
											variant="secondary"
											size="sm"
											onClick={() => handleSetBannerImage(image)}
											className="opacity-0 group-hover:opacity-100 transition-opacity"
											disabled={bannerImage === image}
										>
											Banner
										</Button>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleRemoveImage(index)}
											className="opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
									{coverImage === image && (
										<div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
											Cover
										</div>
									)}
									{bannerImage === image && (
										<div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
											Banner
										</div>
									)}
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
							coverImage,
							bannerImage,
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
