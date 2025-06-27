import React, { useState } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
	ImageIcon,
	Play,
	BookOpen,
	TrendingUp,
	Calendar,
	Upload,
	Plus,
	Trash2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
	BalvidhyaData,
	typeLabel,
	categoryLabel,
	getStatusColor,
	formatDate,
} from "./types";

type Props = {
	balvidhya: BalvidhyaData | null;
	isEditing: boolean;
	setIsEditing: (value: boolean) => void;
	editedBalvidhya: BalvidhyaData | null;
	setEditedBalvidhya: React.Dispatch<
		React.SetStateAction<BalvidhyaData | null>
	>;
	isUploadingImage: boolean;
	setIsUploadingImage: (value: boolean) => void;
};

export function getTypeIcon(type: string) {
	return type === "video" ? (
		<Play className="h-3.5 w-3.5" />
	) : type === "book" ? (
		<BookOpen className="h-3.5 w-3.5" />
	) : (
		<ImageIcon className="h-3.5 w-3.5" />
	);
}

export function BalvidhyaDetailCard({
	balvidhya,
	isEditing,
	setIsEditing,
	editedBalvidhya,
	setEditedBalvidhya,
	isUploadingImage,
	setIsUploadingImage,
}: Props) {
	const [imageError, setImageError] = useState(false);

	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		if (!validTypes.includes(file.type)) {
			toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
			return;
		}
		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error("Image size must be less than 5MB");
			return;
		}
		setIsUploadingImage(true);
		const loadingToast = toast.loading("Uploading image...");
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("contentId", balvidhya?._id || "");
			const response = await fetch("/api/upload/content-image", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) throw new Error("Failed to upload image");
			const { imageUrl } = await response.json();
			setEditedBalvidhya((prev: BalvidhyaData | null): BalvidhyaData | null =>
				prev ? { ...prev, thumbnailUrl: imageUrl } : null
			);
			setImageError(false);
			toast.dismiss(loadingToast);
			toast.success("Thumbnail updated successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to upload image"
			);
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleRemoveThumbnailUrl = () => {
		setEditedBalvidhya((prev) => (prev ? { ...prev, thumbnailUrl: "" } : null));
		setImageError(false);
		toast.success("Thumbnail removed");
	};

	if (!balvidhya) return null;

	return (
		<Card className="md:col-span-1 h-fit">
			<CardHeader className="text-center p-4 pb-2">
				<div className="flex flex-col items-center mb-3">
					<div className="flex w-full justify-end">
						{isEditing && editedBalvidhya?.thumbnailUrl && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={handleRemoveThumbnailUrl}
								title="Remove thumbnail"
								tabIndex={-1}
								className="mb-2 bg-white hover:bg-gray-100"
								style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
							>
								<Trash2 className="h-4 w-4 text-red-500" />
							</Button>
						)}
					</div>
					<div className="relative w-20 h-20">
						<div className="w-full h-full rounded-lg bg-muted flex items-center justify-center overflow-hidden">
							{(isEditing
								? editedBalvidhya?.thumbnailUrl
								: balvidhya?.thumbnailUrl) && !imageError ? (
								<Image
									src={
										isEditing
											? editedBalvidhya?.thumbnailUrl || "/placeholder.png"
											: balvidhya?.thumbnailUrl || "/placeholder.png"
									}
									alt={
										isEditing
											? editedBalvidhya?.name || "Content"
											: balvidhya?.name || "Content"
									}
									width={80}
									height={80}
									className="w-full h-full rounded-lg object-cover"
									onError={() => setImageError(true)}
									unoptimized={true}
								/>
							) : (
								<ImageIcon className="h-10 w-10 text-muted-foreground" />
							)}
						</div>
						{isEditing && (
							<div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group">
								<input
									type="file"
									accept="image/jpeg,image/jpg,image/png,image/webp"
									onChange={handleImageUpload}
									className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
									disabled={isUploadingImage}
								/>
								{isUploadingImage ? (
									<div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
								) : (
									<Upload className="h-6 w-6 text-white" />
								)}
							</div>
						)}
						{isEditing && !editedBalvidhya?.thumbnailUrl && !imageError && (
							<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
								<input
									type="file"
									accept="image/jpeg,image/jpg,image/png,image/webp"
									onChange={handleImageUpload}
									className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
									disabled={isUploadingImage}
								/>
								<Plus className="h-3 w-3 text-primary-foreground" />
							</div>
						)}
					</div>
				</div>
				<CardTitle className="text-center text-lg">{balvidhya.name}</CardTitle>
				<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
					<span
						className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(
							balvidhya.status
						)}`}
					>
						{balvidhya.status}
					</span>
					{balvidhya.trending && (
						<span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
							<TrendingUp className="h-2.5 w-2.5" />
							Trending
						</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 p-4 pt-0">
				<div className="pt-2 space-y-2">
					<div className="flex items-center gap-2 text-sm">
						{getTypeIcon(balvidhya.type || "")}
						<div className="flex-1">
							<span className="text-xs text-muted-foreground">Type: </span>
							<span
								className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
									balvidhya.type ? getStatusColor(balvidhya.type) : ""
								} w-20`}
							>
								{typeLabel(balvidhya.type || "")}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-2 text-sm">
						<BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
						<div className="flex-1">
							<span className="text-xs text-muted-foreground">Category: </span>
							<span
								className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
									balvidhya.category ? getStatusColor(balvidhya.category) : ""
								} w-20`}
							>
								{categoryLabel(balvidhya.category || "")}
							</span>
						</div>
					</div>
				</div>
				<div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
					<Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
					<div>
						<div>
							Added:{" "}
							{balvidhya.dateAdded ? formatDate(balvidhya.dateAdded) : "N/A"}
						</div>
						{balvidhya.updatedAt && (
							<div>Updated: {formatDate(balvidhya.updatedAt)}</div>
						)}
					</div>
				</div>
			</CardContent>
			<CardFooter className="p-4 pt-0">
				<Button
					className="w-full text-sm h-8"
					variant={isEditing ? "outline" : "default"}
					onClick={() => setIsEditing(!isEditing)}
				>
					{isEditing ? "Cancel" : "Edit Content"}
				</Button>
			</CardFooter>
		</Card>
	);
}
