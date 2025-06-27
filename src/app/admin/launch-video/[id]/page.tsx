"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { VideoDetailCard } from "@/app/admin/components/launch-video/VideoDetailCard";
import { VideoInfoCard } from "@/app/admin/components/launch-video/VideoInfoCard";
import {
	VideoData,
	VideoFormErrors,
} from "@/app/admin/components/launch-video/types";

export default function VideoDetailPage() {
	const params = useParams();
	const router = useRouter();
	const videoId = params?.id as string;

	const [video, setVideo] = useState<VideoData | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedVideo, setEditedVideo] = useState<VideoData | null>(null);
	const [errors, setErrors] = useState<VideoFormErrors>({});
	const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
	const [thumbnailError, setThumbnailError] = useState(false);

	const fetchVideo = useCallback(async () => {
		try {
			const response = await fetch(`/api/launch-video/${videoId}`);
			if (!response.ok) throw new Error("Failed to fetch video");
			const data = await response.json();
			setVideo(data);
			setEditedVideo(data);
		} catch {
			toast.error("Failed to load video details");
			router.push("/admin/video");
		}
	}, [videoId, router]);

	useEffect(() => {
		if (videoId) fetchVideo();
	}, [videoId, fetchVideo]);

	const validateForm = (data: VideoData) => {
		const errors: VideoFormErrors = {};
		if (!data.title?.trim()) errors.title = "Title is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.description?.trim())
			errors.description = "Description is required";
		if (!data.category) errors.category = "Category is required";
		if (!data.type) errors.type = "Type is required";
		if (!data.status) errors.status = "Status is required";
		if (!data.videoUrl?.trim())
			errors.videoUrl = "Video file or URL is required";
		return errors;
	};

	const handleSave = async () => {
		if (!editedVideo) return;
		const validation = validateForm(editedVideo);
		setErrors(validation);
		if (Object.keys(validation).length > 0) return;
		setIsSaving(true);
		try {
			const response = await fetch(`/api/launch-video/${videoId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...editedVideo,
					thumbnailUrl: editedVideo.thumbnailUrl || null,
				}),
			});
			if (!response.ok) throw new Error("Failed to update video");
			const updated = await response.json();
			setVideo(updated);
			setEditedVideo(updated);
			setIsEditing(false);
			toast.success("Video updated successfully!");
		} catch {
			toast.error("Failed to update video");
		} finally {
			setIsSaving(false);
		}
	};

	const handleThumbnailUpload = async (
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
		setIsUploadingThumbnail(true);
		const loadingToast = toast.loading("Uploading thumbnail...");
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("videoId", videoId);
			const response = await fetch("/api/upload/profile-image", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) throw new Error("Failed to upload thumbnail");
			const { imageUrl } = await response.json();
			setEditedVideo((prev) =>
				prev ? { ...prev, thumbnailUrl: imageUrl } : null
			);
			setThumbnailError(false);
			toast.dismiss(loadingToast);
			toast.success("Thumbnail uploaded successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to upload thumbnail"
			);
		} finally {
			setIsUploadingThumbnail(false);
		}
	};

	const handleRemoveThumbnail = () => {
		setEditedVideo((prev) => (prev ? { ...prev, thumbnailUrl: "" } : null));
		setThumbnailError(false);
		toast.success("Thumbnail removed");
	};

	const handleThumbnailUrlChange = (value: string) => {
		setEditedVideo((prev) => (prev ? { ...prev, thumbnailUrl: value } : null));
		setThumbnailError(false);
	};

	const handleFieldChange = (field: keyof VideoData, value: string) => {
		setEditedVideo((prev) => (prev ? { ...prev, [field]: value } : prev));
		if (errors[field as keyof VideoFormErrors])
			setErrors((prevErr) => ({
				...prevErr,
				[field as keyof VideoFormErrors]: "",
			}));
	};

	useEffect(() => {
		if (isEditing && video) {
			setEditedVideo({ ...video });
			setThumbnailError(false);
		}
	}, [isEditing, video]);

	if (!video) {
		return (
			<div className="flex justify-center items-center h-40">Loading...</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/video")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Video Details</h1>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<VideoDetailCard
					video={video}
					editedVideo={editedVideo}
					isEditing={isEditing}
					isUploadingThumbnail={isUploadingThumbnail}
					thumbnailError={thumbnailError}
					errors={errors}
					onEdit={() => setIsEditing((v) => !v)}
					onThumbnailUpload={handleThumbnailUpload}
					onRemoveThumbnail={handleRemoveThumbnail}
					onThumbnailUrlChange={handleThumbnailUrlChange}
				/>
				<div className="md:col-span-2">
					<VideoInfoCard
						video={video}
						editedVideo={editedVideo}
						isEditing={isEditing}
						isSaving={isSaving}
						errors={errors}
						onFieldChange={handleFieldChange}
						onSave={handleSave}
					/>
				</div>
			</div>
		</div>
	);
}
