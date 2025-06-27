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
// 		setEditedBanner((prev) => (prev ? { ...prev, imageUrl: undefined } : null));
// 		setImageError(false);
// 		toast.success("Banner image removed");
// 	};

// 	const handleImageUrlChange = (value: string) => {
// 		setEditedBanner((prev) => (prev ? { ...prev, imageUrl: value } : null));
// 		setImageError(false);
// 	};

// 	const formatDate = (dateString: string | Date) => {
// 		if (!dateString) return "N/A";
// 		const date =
// 			typeof dateString === "string" ? new Date(dateString) : dateString;
// 		return new Intl.DateTimeFormat("en-IN", {
// 			day: "2-digit",
// 			month: "short",
// 			year: "numeric",
// 		}).format(date);
// 	};

// 	// When entering edit mode, always use the latest banner.imageUrl as the initial value
// 	useEffect(() => {
// 		if (isEditing && banner) {
// 			setEditedBanner({ ...banner });
// 			setImageError(false);
// 		}
// 		// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, [isEditing]);

// 	return (
// 		<div className="p-6 space-y-6">
// 			<div className="flex items-center gap-4">
// 				<Button
// 					variant="outline"
// 					size="icon"
// 					onClick={() => router.push("/admin/banner")}
// 				>
// 					<ArrowLeft className="h-4 w-4" />
// 				</Button>
// 				<h1 className="text-2xl font-bold">Banner Details</h1>
// 			</div>
// 			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// 				<Card className="md:col-span-1 h-fit">
// 					<CardHeader className="text-center p-4 pb-2">
// 						<div className="relative w-24 h-16 mx-auto mb-3">
// 							<div className="w-full h-full rounded-lg bg-muted flex items-center justify-center overflow-hidden">
// 								{(isEditing ? editedBanner?.imageUrl : banner?.imageUrl) &&
// 								!imageError ? (
// 									<Image
// 										src={
// 											isEditing
// 												? editedBanner?.imageUrl || "/placeholder.png"
// 												: banner?.imageUrl || "/placeholder.png"
// 										}
// 										alt={
// 											isEditing
// 												? editedBanner?.title || "Banner"
// 												: banner?.title || "Banner"
// 										}
// 										width={96}
// 										height={64}
// 										className="w-full h-full rounded-lg object-cover"
// 										onError={() => setImageError(true)}
// 										unoptimized={true}
// 									/>
// 								) : (
// 									<ImageIcon className="h-10 w-10 text-muted-foreground" />
// 								)}
// 							</div>
// 							{isEditing && editedBanner?.imageUrl && !imageError && (
// 								<Button
// 									type="button"
// 									variant="ghost"
// 									size="icon"
// 									onClick={handleRemoveImage}
// 									title="Remove image"
// 									tabIndex={-1}
// 									className="absolute bottom-1 right-1 bg-white/80"
// 								>
// 									<Trash2 className="h-4 w-4 text-red-500" />
// 								</Button>
// 							)}
// 						</div>
// 						<CardTitle className="text-center text-lg">
// 							{banner?.title}
// 						</CardTitle>
// 						<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
// 							<span
// 								className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
// 									banner
// 										? getStatusColor(banner.status)
// 										: "bg-red-100 text-red-800"
// 								}`}
// 							>
// 								{banner?.status || "Unknown"}
// 							</span>
// 						</CardDescription>
// 					</CardHeader>
// 					<CardContent className="space-y-3 p-4 pt-0">
// 						<div className="flex items-center gap-2 text-sm">
// 							<span className="font-medium">Type:</span>
// 							<span>{banner?.type}</span>
// 						</div>
// 						<div className="flex items-center gap-2 text-sm">
// 							<span className="font-medium">Category:</span>
// 							<span>{banner?.category}</span>
// 						</div>
// 						<div className="flex items-center gap-2 text-sm">
// 							<span className="font-medium">Date:</span>
// 							<span>{banner?.date ? formatDate(banner.date) : "N/A"}</span>
// 						</div>
// 						{isEditing && (
// 							<div className="space-y-2">
// 								<Label htmlFor="imageUrl">Banner Image URL</Label>
// 								<Input
// 									id="imageUrl"
// 									type="url"
// 									value={editedBanner?.imageUrl || ""}
// 									onChange={(e) => handleImageUrlChange(e.target.value)}
// 									placeholder="https://example.com/banner.jpg"
// 									className={errors.imageUrl ? "border-red-500" : ""}
// 								/>
// 								<p className="text-xs text-gray-500">
// 									Provide a direct link to the banner image or upload below.
// 								</p>
// 								<Label htmlFor="bannerImageUpload" className="block mt-2">
// 									Upload Banner Image
// 								</Label>
// 								<Input
// 									id="bannerImageUpload"
// 									type="file"
// 									accept="image/jpeg,image/jpg,image/png,image/webp"
// 									onChange={handleImageUpload}
// 									disabled={isUploadingImage}
// 								/>
// 								{isUploadingImage && (
// 									<p className="text-xs text-blue-600">Uploading...</p>
// 								)}
// 							</div>
// 						)}
// 					</CardContent>
// 					<CardFooter className="p-4 pt-0">
// 						<Button
// 							className="w-full text-sm h-8"
// 							variant={isEditing ? "outline" : "default"}
// 							onClick={() => setIsEditing(!isEditing)}
// 						>
// 							{isEditing ? "Cancel" : "Edit Banner"}
// 						</Button>
// 					</CardFooter>
// 				</Card>
// 				<div className="md:col-span-2">
// 					<Card>
// 						<CardHeader>
// 							<CardTitle>Banner Information</CardTitle>
// 							<CardDescription>
// 								Update banner details and metadata.
// 							</CardDescription>
// 						</CardHeader>
// 						<CardContent className="space-y-4">
// 							{isEditing ? (
// 								<div className="space-y-4">
// 									<div className="space-y-2">
// 										<Label htmlFor="title">Title *</Label>
// 										<Input
// 											id="title"
// 											value={editedBanner?.title || ""}
// 											onChange={(e) =>
// 												setEditedBanner((prev) =>
// 													prev ? { ...prev, title: e.target.value } : prev
// 												)
// 											}
// 											className={errors.title ? "border-red-500" : ""}
// 										/>
// 										{errors.title && (
// 											<p className="text-sm text-red-500">{errors.title}</p>
// 										)}
// 									</div>
// 									<div className="space-y-2">
// 										<Label htmlFor="date">Date *</Label>
// 										<Input
// 											id="date"
// 											type="date"
// 											value={editedBanner?.date || ""}
// 											onChange={(e) =>
// 												setEditedBanner((prev) =>
// 													prev ? { ...prev, date: e.target.value } : prev
// 												)
// 											}
// 											className={errors.date ? "border-red-500" : ""}
// 										/>
// 										{errors.date && (
// 											<p className="text-sm text-red-500">{errors.date}</p>
// 										)}
// 									</div>
// 									<div className="space-y-2">
// 										<Label htmlFor="description">Description *</Label>
// 										<Textarea
// 											id="description"
// 											value={editedBanner?.description || ""}
// 											onChange={(e) =>
// 												setEditedBanner((prev) =>
// 													prev ? { ...prev, description: e.target.value } : prev
// 												)
// 											}
// 											rows={3}
// 											className={errors.description ? "border-red-500" : ""}
// 										/>
// 										{errors.description && (
// 											<p className="text-sm text-red-500">
// 												{errors.description}
// 											</p>
// 										)}
// 									</div>
// 									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// 										<div className="space-y-2">
// 											<Label htmlFor="category">Category *</Label>
// 											<Select
// 												value={editedBanner?.category || ""}
// 												onValueChange={(value) =>
// 													setEditedBanner((prev) =>
// 														prev ? { ...prev, category: value } : prev
// 													)
// 												}
// 											>
// 												<SelectTrigger
// 													id="category"
// 													className={errors.category ? "border-red-500" : ""}
// 												>
// 													<SelectValue placeholder="Select category" />
// 												</SelectTrigger>
// 												<SelectContent>
// 													{bannerCategories.map((cat) => (
// 														<SelectItem key={cat} value={cat}>
// 															{cat}
// 														</SelectItem>
// 													))}
// 												</SelectContent>
// 											</Select>
// 											{errors.category && (
// 												<p className="text-sm text-red-500">
// 													{errors.category}
// 												</p>
// 											)}
// 										</div>
// 										<div className="space-y-2">
// 											<Label htmlFor="type">Type *</Label>
// 											<Select
// 												value={editedBanner?.type || ""}
// 												onValueChange={(value) =>
// 													setEditedBanner((prev) =>
// 														prev ? { ...prev, type: value } : prev
// 													)
// 												}
// 											>
// 												<SelectTrigger
// 													id="type"
// 													className={errors.type ? "border-red-500" : ""}
// 												>
// 													<SelectValue placeholder="Select type" />
// 												</SelectTrigger>
// 												<SelectContent>
// 													{bannerTypes.map((type) => (
// 														<SelectItem key={type} value={type}>
// 															{type}
// 														</SelectItem>
// 													))}
// 												</SelectContent>
// 											</Select>
// 											{errors.type && (
// 												<p className="text-sm text-red-500">{errors.type}</p>
// 											)}
// 										</div>
// 									</div>
// 									<div className="space-y-2">
// 										<Label htmlFor="status">Status *</Label>
// 										<Select
// 											value={editedBanner?.status || ""}
// 											onValueChange={(value) =>
// 												setEditedBanner((prev) =>
// 													prev ? { ...prev, status: value } : prev
// 												)
// 											}
// 										>
// 											<SelectTrigger id="status">
// 												<SelectValue placeholder="Select status" />
// 											</SelectTrigger>
// 											<SelectContent>
// 												{bannerStatuses.map((status) => (
// 													<SelectItem key={status.value} value={status.value}>
// 														{status.label}
// 													</SelectItem>
// 												))}
// 											</SelectContent>
// 										</Select>
// 										{errors.status && (
// 											<p className="text-sm text-red-500">{errors.status}</p>
// 										)}
// 									</div>
// 								</div>
// 							) : (
// 								<div className="space-y-6">
// 									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// 										<div className="space-y-2">
// 											<h3 className="text-sm font-medium text-muted-foreground">
// 												Title
// 											</h3>
// 											<p className="font-medium text-foreground">
// 												{banner?.title}
// 											</p>
// 										</div>
// 										<div className="space-y-2">
// 											<h3 className="text-sm font-medium text-muted-foreground">
// 												Type
// 											</h3>
// 											<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
// 												{banner?.type}
// 											</span>
// 										</div>
// 										<div className="space-y-2">
// 											<h3 className="text-sm font-medium text-muted-foreground">
// 												Category
// 											</h3>
// 											<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
// 												{banner?.category}
// 											</span>
// 										</div>
// 										<div className="space-y-2">
// 											<h3 className="text-sm font-medium text-muted-foreground">
// 												Status
// 											</h3>
// 											<span
// 												className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
// 													banner?.status || ""
// 												)}`}
// 											>
// 												{banner?.status}
// 											</span>
// 										</div>
// 										<div className="space-y-2">
// 											<h3 className="text-sm font-medium text-muted-foreground">
// 												Date
// 											</h3>
// 											<p className="font-medium text-foreground">
// 												{banner?.date ? formatDate(banner.date) : "N/A"}
// 											</p>
// 										</div>
// 									</div>
// 									<div className="space-y-2 pt-2 border-t border-border">
// 										<h3 className="text-sm font-medium text-muted-foreground">
// 											Description
// 										</h3>
// 										<p className="font-medium text-foreground whitespace-pre-wrap">
// 											{banner?.description || "No description provided"}
// 										</p>
// 									</div>
// 									{banner?.imageUrl && (
// 										<div className="space-y-2 pt-2 border-t border-border">
// 											<h3 className="text-sm font-medium text-muted-foreground">
// 												Banner Image
// 											</h3>
// 											<div className="w-48 h-28 rounded-lg overflow-hidden border">
// 												<Image
// 													src={banner.imageUrl}
// 													alt={banner.title}
// 													width={192}
// 													height={112}
// 													className="w-full h-full object-cover"
// 													unoptimized={true}
// 												/>
// 											</div>
// 										</div>
// 									)}
// 								</div>
// 							)}
// 						</CardContent>
// 						{isEditing && (
// 							<CardFooter>
// 								<Button onClick={handleSaveChanges} disabled={isSaving}>
// 									{isSaving ? (
// 										<>
// 											<svg
// 												className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
// 												xmlns="http://www.w3.org/2000/svg"
// 												fill="none"
// 												viewBox="0 0 24 24"
// 											>
// 												<circle
// 													className="opacity-25"
// 													cx="12"
// 													cy="12"
// 													r="10"
// 													stroke="currentColor"
// 													strokeWidth="4"
// 												></circle>
// 												<path
// 													className="opacity-75"
// 													fill="currentColor"
// 													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
// 												></path>
// 											</svg>
// 											Saving...
// 										</>
// 									) : (
// 										<>
// 											<Save className="h-4 w-4 mr-2" />
// 											Save Changes
// 										</>
// 									)}
// 								</Button>
// 							</CardFooter>
// 						)}
// 					</Card>
// 				</div>
// 			</div>
// 		</div>
// 	);
// }
