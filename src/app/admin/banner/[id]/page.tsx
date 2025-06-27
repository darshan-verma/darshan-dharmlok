"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Banner, BannerFormErrors } from "@/app/admin/components/banner/types";
import { BannerDetailCard } from "@/app/admin/components/banner/BannerDetailCard";
import { BannerInfoCard } from "@/app/admin/components/banner/BannerInfoCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BannerDetailPage() {
	const params = useParams();
	const router = useRouter();
	const bannerId = params?.id as string;

	const [banner, setBanner] = useState<Banner | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedBanner, setEditedBanner] = useState<Banner | null>(null);
	const [errors, setErrors] = useState<BannerFormErrors>({});
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [imageError, setImageError] = useState(false);

	const fetchBannerData = useCallback(async () => {
		try {
			if (bannerId && !/^[0-9a-fA-F]{24}$/.test(bannerId)) {
				toast.error("Invalid Banner ID format");
				router.push("/admin/banner");
				return;
			}
			const loadingToast = toast.loading("Loading banner details...");
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);
			try {
				const response = await fetch(`/api/banner/${bannerId}`, {
					signal: controller.signal,
				});
				clearTimeout(timeoutId);
				if (!response.ok) throw new Error("Failed to fetch banner");
				const bannerData = await response.json();
				setBanner(bannerData);
				setEditedBanner({ ...bannerData });
				toast.dismiss(loadingToast);
			} catch (error) {
				clearTimeout(timeoutId);
				throw error;
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to load banner details"
			);
			router.push("/admin/banner");
		}
	}, [bannerId, router]);

	useEffect(() => {
		if (bannerId) fetchBannerData();
	}, [bannerId, fetchBannerData]);

	const validateForm = (data: Banner): boolean => {
		const newErrors: BannerFormErrors = {};
		if (!data.title?.trim()) newErrors.title = "Title is required";
		if (!data.date?.trim()) newErrors.date = "Date is required";
		if (!data.description?.trim())
			newErrors.description = "Description is required";
		if (!data.category) newErrors.category = "Category is required";
		if (!data.type) newErrors.type = "Type is required";
		if (!data.status) newErrors.status = "Status is required";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSaveChanges = async () => {
		if (!editedBanner) return;
		if (!validateForm(editedBanner)) return;
		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");
		try {
			const dataToSave = {
				title: editedBanner.title,
				date: editedBanner.date,
				description: editedBanner.description,
				category: editedBanner.category,
				type: editedBanner.type,
				status: editedBanner.status,
				imageUrl: editedBanner.imageUrl || null,
			};
			const response = await fetch(`/api/banner/${bannerId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSave),
			});
			if (!response.ok) throw new Error("Failed to update banner");
			const updatedBanner = await response.json();
			setBanner(updatedBanner);
			setEditedBanner(updatedBanner);
			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("Banner updated successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to update banner"
			);
		} finally {
			setIsSaving(false);
		}
	};

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
			formData.append("bannerId", bannerId);
			const response = await fetch("/api/upload/banner-image", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) throw new Error("Failed to upload image");
			const { imageUrl } = await response.json();
			setEditedBanner((prev) => (prev ? { ...prev, imageUrl } : null));
			setImageError(false);
			toast.dismiss(loadingToast);
			toast.success("Banner image uploaded to S3 successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to upload image"
			);
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleRemoveImage = () => {
		setEditedBanner((prev) => (prev ? { ...prev, imageUrl: undefined } : null));
		setImageError(false);
		toast.success("Banner image removed");
	};

	const handleImageUrlChange = (value: string) => {
		setEditedBanner((prev) => (prev ? { ...prev, imageUrl: value } : null));
		setImageError(false);
	};

	const handleFieldChange = (field: keyof Banner, value: string) => {
		setEditedBanner((prev) => (prev ? { ...prev, [field]: value } : prev));
		if (errors[field as keyof BannerFormErrors])
			setErrors((prevErr) => ({
				...prevErr,
				[field as keyof BannerFormErrors]: "",
			}));
	};

	// When entering edit mode, always use the latest banner.imageUrl as the initial value
	useEffect(() => {
		if (isEditing && banner) {
			setEditedBanner({ ...banner });
			setImageError(false);
		}
	}, [isEditing, banner]);

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/banner")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Banner Details</h1>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<BannerDetailCard
					banner={banner}
					editedBanner={editedBanner}
					isEditing={isEditing}
					isUploadingImage={isUploadingImage}
					imageError={imageError}
					errors={errors}
					onEdit={() => setIsEditing((v) => !v)}
					onImageUpload={handleImageUpload}
					onRemoveImage={handleRemoveImage}
					onImageUrlChange={handleImageUrlChange}
				/>
				<div className="md:col-span-2">
					<BannerInfoCard
						banner={banner}
						editedBanner={editedBanner}
						isEditing={isEditing}
						isSaving={isSaving}
						errors={errors}
						onFieldChange={handleFieldChange}
						onSave={handleSaveChanges}
					/>
				</div>
			</div>
		</div>
	);
}