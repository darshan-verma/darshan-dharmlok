"use client";

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
import Image from "next/image"; // Import next/image
import { Trash2, UploadCloud } from "lucide-react"; // Import icons

import { BANNER_PAGE_SLUGS } from "@/lib/banner-pages";

export interface BannerFormData {
	title: string;
	date: string;
	description: string;
	pageSlug: string | null; // Frontend page this banner is for (required)
	imageUrl?: string | null; // Allow null for explicit removal
	imageFile?: File | null; // Add imageFile field
}

interface BannerFormProps {
	initialData?: Partial<BannerFormData>;
	onSubmit: (bannerData: BannerFormData) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function BannerForm({
	initialData = {
		title: "",
		date: "",
		description: "",
		pageSlug: null,
		imageUrl: null,
		imageFile: null,
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: BannerFormProps) {
	const [bannerData, setBannerData] = useState<BannerFormData>({
		title: initialData.title || "",
		date: initialData.date || "",
		description: initialData.description || "",
		pageSlug: initialData.pageSlug ?? null,
		imageUrl: initialData.imageUrl || null,
		imageFile: initialData.imageFile || null,
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
		initialData.imageUrl || null
	);

	useEffect(() => {
		// This effect ensures that if initialData.imageUrl changes (e.g., when editing an existing banner),
		// the preview is updated accordingly, but only if no new file has been selected.
		if (initialData.imageUrl && !bannerData.imageFile) {
			setImagePreviewUrl(initialData.imageUrl);
		} else if (!initialData.imageUrl && !bannerData.imageFile) {
			setImagePreviewUrl(null);
		}
		// If an imageFile is selected, it takes precedence for the preview, handled in handleFileChange.
	}, [initialData.imageUrl, bannerData.imageFile]);

	const validateForm = (data: BannerFormData) => {
		const errors: Record<string, string> = {};
		if (!data.title?.trim()) errors.title = "Title is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.description?.trim())
			errors.description = "Description is required";
		if (!data.pageSlug?.trim()) errors.pageSlug = "Page is required";

		// Basic validation for imageFile if present
		if (data.imageFile && data.imageFile.size > 5 * 1024 * 1024) {
			// 5MB limit
			errors.imageFile = "Image size should be less than 5MB.";
		}
		if (
			data.imageFile &&
			!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
				data.imageFile.type
			)
		) {
			errors.imageFile = "Invalid image format. Use JPG, PNG, WebP, or GIF.";
		}
		return errors;
	};

	const handleSubmit = async () => {
		// Pass the full bannerData including imageFile to the parent
		const dataToSubmit: BannerFormData = { ...bannerData };

		const errors = validateForm(dataToSubmit);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;

		try {
			await onSubmit(dataToSubmit);
		} catch {
			setFormErrors((prev) => ({
				...prev,
				_submit: "Failed to save banner. Please try again.",
			}));
		}
	};

	const handleInputChange = (
		field: keyof Omit<BannerFormData, "imageFile" | "imageUrl">,
		value: string
	) => {
		setBannerData({ ...bannerData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	const handleImageUrlChange = (value: string) => {
		setBannerData({ ...bannerData, imageUrl: value, imageFile: null }); // If URL is typed, clear selected file
		setImagePreviewUrl(value); // Update preview with URL
		if (formErrors.imageUrl) setFormErrors({ ...formErrors, imageUrl: "" });
		if (formErrors.imageFile) setFormErrors({ ...formErrors, imageFile: "" });
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setBannerData({ ...bannerData, imageFile: file, imageUrl: null }); // New file overrides existing imageUrl input
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreviewUrl(reader.result as string);
			};
			reader.readAsDataURL(file);
			if (formErrors.imageFile) setFormErrors({ ...formErrors, imageFile: "" });
			if (formErrors.imageUrl) setFormErrors({ ...formErrors, imageUrl: "" });
		}
	};

	const handleRemoveImage = () => {
		setBannerData({ ...bannerData, imageFile: null, imageUrl: null }); // Clear both file and URL input
		setImagePreviewUrl(null);
		const fileInput = document.getElementById("imageFile") as HTMLInputElement;
		if (fileInput) {
			fileInput.value = ""; // Reset file input
		}
		const imageUrlInput = document.getElementById(
			"imageUrl"
		) as HTMLInputElement;
		if (imageUrlInput) {
			imageUrlInput.value = "";
		}
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="title">Title *</Label>
				<Input
					id="title"
					value={bannerData.title}
					onChange={(e) => handleInputChange("title", e.target.value)}
					placeholder="Enter banner title"
					className={formErrors.title ? "border-red-500" : ""}
				/>
				{formErrors.title && (
					<p className="text-sm text-red-500">{formErrors.title}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="date">Date *</Label>
				<Input
					id="date"
					type="date"
					value={bannerData.date}
					onChange={(e) => handleInputChange("date", e.target.value)}
					className={formErrors.date ? "border-red-500" : ""}
				/>
				{formErrors.date && (
					<p className="text-sm text-red-500">{formErrors.date}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">Description *</Label>
				<Textarea
					id="description"
					value={bannerData.description}
					onChange={(e) => handleInputChange("description", e.target.value)}
					placeholder="Enter banner description"
					rows={3}
					className={formErrors.description ? "border-red-500" : ""}
				/>
				{formErrors.description && (
					<p className="text-sm text-red-500">{formErrors.description}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="pageSlug">Page *</Label>
				<Select
					value={bannerData.pageSlug || ""}
					onValueChange={(value) =>
						setBannerData({
							...bannerData,
							pageSlug: value || null,
						})
					}
				>
					<SelectTrigger
						id="pageSlug"
						className={formErrors.pageSlug ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select which page this banner appears on" />
					</SelectTrigger>
					<SelectContent>
						{BANNER_PAGE_SLUGS.map((p) => (
							<SelectItem key={p.value} value={p.value}>
								{p.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{formErrors.pageSlug && (
					<p className="text-sm text-red-500">{formErrors.pageSlug}</p>
				)}
				<p className="text-xs text-gray-500 mt-1">
					This banner will be shown on the selected frontend page. Title and
					description above are what users see on that page.
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="imageFile">Banner Image (Upload or URL)</Label>
				<div className="flex items-center gap-4">
					{imagePreviewUrl && (
						<div className="relative w-24 h-16 rounded border overflow-hidden shrink-0">
							<Image
								src={imagePreviewUrl}
								alt="Banner preview"
								layout="fill"
								objectFit="cover"
								onError={() => {
									// If URL from input fails, clear preview. File preview shouldn't fail this way.
									if (bannerData.imageUrl && !bannerData.imageFile)
										setImagePreviewUrl(null);
								}}
							/>
						</div>
					)}
					{!imagePreviewUrl && (
						<div className="w-24 h-16 rounded border bg-muted flex items-center justify-center shrink-0">
							<UploadCloud className="w-8 h-8 text-gray-400" />
						</div>
					)}
					<div className="flex-grow space-y-2">
						<Input
							id="imageFile"
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							onChange={handleFileChange}
							className={`file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 ${
								formErrors.imageFile ? "border-red-500" : ""
							}`}
						/>
						<Input
							id="imageUrl"
							type="url"
							value={bannerData.imageUrl || ""}
							onChange={(e) => handleImageUrlChange(e.target.value)}
							placeholder="Or paste image URL here"
							className={formErrors.imageUrl ? "border-red-500" : ""}
							disabled={!!bannerData.imageFile} // Disable if a file is selected
						/>
					</div>
					{(imagePreviewUrl || bannerData.imageUrl) && ( // Show remove button if there's any image source
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={handleRemoveImage}
							title="Remove image"
							className="shrink-0"
						>
							<Trash2 className="h-4 w-4 text-red-500" />
						</Button>
					)}
				</div>
				{formErrors.imageFile && (
					<p className="text-sm text-red-500 mt-1">{formErrors.imageFile}</p>
				)}
				{formErrors.imageUrl && (
					<p className="text-sm text-red-500 mt-1">{formErrors.imageUrl}</p>
				)}
				<p className="text-xs text-gray-500 mt-1">
					Upload an image (max 5MB) or provide a direct URL. Upload takes
					precedence.
				</p>
			</div>

			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Banner"}
				</Button>
			</div>
			{formErrors._submit && (
				<p className="text-sm text-red-500 mt-2">{formErrors._submit}</p>
			)}
		</div>
	);
}
