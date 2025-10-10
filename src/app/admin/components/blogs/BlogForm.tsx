"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image"; // Import next/image
import { Trash2, UploadCloud } from "lucide-react"; // Import icons
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";

const blogStatuses = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

export interface BlogFormData {
	title: string;
	content: string;
	status: string;
	coverImageUrl?: string | null; // Allow null for explicit removal
	coverImageFile?: File | null; // Add coverImageFile field
	bannerImageUrl?: string | null; // Allow null for explicit removal
	bannerImageFile?: File | null; // Add bannerImageFile field
}

interface BlogFormProps {
	initialData?: Partial<BlogFormData>;
	onSubmit: (blogData: BlogFormData) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function BlogForm({
	initialData = {
		title: "",
		content: "",
		status: "Active",
		coverImageUrl: null, // Default to null
		coverImageFile: null, // Default to null
		bannerImageUrl: null, // Default to null
		bannerImageFile: null, // Default to null
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: BlogFormProps) {
	const [blogData, setBlogData] = useState<BlogFormData>({
		title: initialData.title || "",
		content: initialData.content || "",
		status: initialData.status || "Active",
		coverImageUrl: initialData.coverImageUrl || null,
		coverImageFile: initialData.coverImageFile || null,
		bannerImageUrl: initialData.bannerImageUrl || null,
		bannerImageFile: initialData.bannerImageFile || null,
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState<
		string | null
	>(initialData.coverImageUrl || null);
	const [bannerImagePreviewUrl, setBannerImagePreviewUrl] = useState<
		string | null
	>(initialData.bannerImageUrl || null);

	useEffect(() => {
		// This effect ensures that if initialData.coverImageUrl changes (e.g., when editing an existing blog),
		// the preview is updated accordingly, but only if no new file has been selected.
		if (initialData.coverImageUrl && !blogData.coverImageFile) {
			setCoverImagePreviewUrl(initialData.coverImageUrl);
		} else if (!initialData.coverImageUrl && !blogData.coverImageFile) {
			setCoverImagePreviewUrl(null);
		}
		// If a coverImageFile is selected, it takes precedence for the preview, handled in handleCoverFileChange.
	}, [initialData.coverImageUrl, blogData.coverImageFile]);

	useEffect(() => {
		// This effect ensures that if initialData.bannerImageUrl changes (e.g., when editing an existing blog),
		// the preview is updated accordingly, but only if no new file has been selected.
		if (initialData.bannerImageUrl && !blogData.bannerImageFile) {
			setBannerImagePreviewUrl(initialData.bannerImageUrl);
		} else if (!initialData.bannerImageUrl && !blogData.bannerImageFile) {
			setBannerImagePreviewUrl(null);
		}
		// If a bannerImageFile is selected, it takes precedence for the preview, handled in handleBannerFileChange.
	}, [initialData.bannerImageUrl, blogData.bannerImageFile]);

	useEffect(() => {
		// Reset form data when initialData changes (for editing existing blogs)
		setBlogData({
			title: initialData.title || "",
			content: initialData.content || "",
			status: initialData.status || "Active",
			coverImageUrl: initialData.coverImageUrl || null,
			coverImageFile: initialData.coverImageFile || null,
			bannerImageUrl: initialData.bannerImageUrl || null,
			bannerImageFile: initialData.bannerImageFile || null,
		});
		setCoverImagePreviewUrl(initialData.coverImageUrl || null);
		setBannerImagePreviewUrl(initialData.bannerImageUrl || null);
		setFormErrors({}); // Clear any previous form errors
	}, [initialData]);

	const validateForm = (data: BlogFormData) => {
		const errors: Record<string, string> = {};
		if (!data.title?.trim()) errors.title = "Title is required";
		if (!data.content?.trim()) errors.content = "Content is required";
		if (!data.status) errors.status = "Status is required";

		// Basic validation for coverImageFile if present
		if (data.coverImageFile && data.coverImageFile.size > 5 * 1024 * 1024) {
			// 5MB limit
			errors.coverImageFile = "Cover image size should be less than 5MB.";
		}
		if (
			data.coverImageFile &&
			!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
				data.coverImageFile.type
			)
		) {
			errors.coverImageFile =
				"Invalid cover image format. Use JPG, PNG, WebP, or GIF.";
		}

		// Basic validation for bannerImageFile if present
		if (data.bannerImageFile && data.bannerImageFile.size > 5 * 1024 * 1024) {
			// 5MB limit
			errors.bannerImageFile = "Banner image size should be less than 5MB.";
		}
		if (
			data.bannerImageFile &&
			!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
				data.bannerImageFile.type
			)
		) {
			errors.bannerImageFile =
				"Invalid banner image format. Use JPG, PNG, WebP, or GIF.";
		}
		return errors;
	};

	const handleSubmit = async () => {
		// Pass the full blogData including imageFiles to the parent
		const dataToSubmit: BlogFormData = { ...blogData };

		const errors = validateForm(dataToSubmit);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;

		try {
			await onSubmit(dataToSubmit);
		} catch {
			setFormErrors((prev) => ({
				...prev,
				_submit: "Failed to save blog. Please try again.",
			}));
		}
	};

	const handleInputChange = (
		field: keyof Omit<
			BlogFormData,
			| "coverImageFile"
			| "coverImageUrl"
			| "bannerImageFile"
			| "bannerImageUrl"
			| "content"
		>, // Exclude imageFile and imageUrl fields as they are handled separately
		value: string
	) => {
		setBlogData({ ...blogData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	const handleContentChange = (value: string) => {
		setBlogData({ ...blogData, content: value });
		if (formErrors.content) setFormErrors({ ...formErrors, content: "" });
	};

	const handleCoverImageUrlChange = (value: string) => {
		setBlogData({ ...blogData, coverImageUrl: value, coverImageFile: null }); // If URL is typed, clear selected file
		setCoverImagePreviewUrl(value); // Update preview with URL
		if (formErrors.coverImageUrl)
			setFormErrors({ ...formErrors, coverImageUrl: "" });
		if (formErrors.coverImageFile)
			setFormErrors({ ...formErrors, coverImageFile: "" });
	};

	const handleCoverFileChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file) {
			setBlogData({ ...blogData, coverImageFile: file, coverImageUrl: null }); // New file overrides existing imageUrl input
			const reader = new FileReader();
			reader.onloadend = () => {
				setCoverImagePreviewUrl(reader.result as string);
			};
			reader.readAsDataURL(file);
			if (formErrors.coverImageFile)
				setFormErrors({ ...formErrors, coverImageFile: "" });
			if (formErrors.coverImageUrl)
				setFormErrors({ ...formErrors, coverImageUrl: "" });
		}
	};

	const handleBannerImageUrlChange = (value: string) => {
		setBlogData({ ...blogData, bannerImageUrl: value, bannerImageFile: null }); // If URL is typed, clear selected file
		setBannerImagePreviewUrl(value); // Update preview with URL
		if (formErrors.bannerImageUrl)
			setFormErrors({ ...formErrors, bannerImageUrl: "" });
		if (formErrors.bannerImageFile)
			setFormErrors({ ...formErrors, bannerImageFile: "" });
	};

	const handleBannerFileChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file) {
			setBlogData({ ...blogData, bannerImageFile: file, bannerImageUrl: null }); // New file overrides existing imageUrl input
			const reader = new FileReader();
			reader.onloadend = () => {
				setBannerImagePreviewUrl(reader.result as string);
			};
			reader.readAsDataURL(file);
			if (formErrors.bannerImageFile)
				setFormErrors({ ...formErrors, bannerImageFile: "" });
			if (formErrors.bannerImageUrl)
				setFormErrors({ ...formErrors, bannerImageUrl: "" });
		}
	};

	const handleRemoveCoverImage = () => {
		setBlogData({ ...blogData, coverImageFile: null, coverImageUrl: null }); // Clear both file and URL input
		setCoverImagePreviewUrl(null);
		const fileInput = document.getElementById(
			"coverImageFile"
		) as HTMLInputElement;
		if (fileInput) {
			fileInput.value = ""; // Reset file input
		}
		const imageUrlInput = document.getElementById(
			"coverImageUrl"
		) as HTMLInputElement;
		if (imageUrlInput) {
			imageUrlInput.value = "";
		}
	};

	const handleRemoveBannerImage = () => {
		setBlogData({ ...blogData, bannerImageFile: null, bannerImageUrl: null }); // Clear both file and URL input
		setBannerImagePreviewUrl(null);
		const fileInput = document.getElementById(
			"bannerImageFile"
		) as HTMLInputElement;
		if (fileInput) {
			fileInput.value = ""; // Reset file input
		}
		const imageUrlInput = document.getElementById(
			"bannerImageUrl"
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
					value={blogData.title}
					onChange={(e) => handleInputChange("title", e.target.value)}
					placeholder="Enter blog title"
					className={formErrors.title ? "border-red-500" : ""}
				/>
				{formErrors.title && (
					<p className="text-sm text-red-500">{formErrors.title}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="content">Content *</Label>
				<div className="min-h-[300px] border rounded-md">
					<BlockNoteEditor
						onChange={handleContentChange}
						initialContent={blogData.content}
						editable={true}
					/>
				</div>
				{formErrors.content && (
					<p className="text-sm text-red-500">{formErrors.content}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="coverImageFile">Cover Image (Upload or URL)</Label>
				<div className="flex items-center gap-4">
					{coverImagePreviewUrl && (
						<div className="relative w-24 h-16 rounded border overflow-hidden shrink-0">
							<Image
								src={coverImagePreviewUrl}
								alt="Cover image preview"
								layout="fill"
								objectFit="cover"
								onError={() => {
									// If URL from input fails, clear preview. File preview shouldn't fail this way.
									if (blogData.coverImageUrl && !blogData.coverImageFile)
										setCoverImagePreviewUrl(null);
								}}
							/>
						</div>
					)}
					{!coverImagePreviewUrl && (
						<div className="w-24 h-16 rounded border bg-muted flex items-center justify-center shrink-0">
							<UploadCloud className="w-8 h-8 text-gray-400" />
						</div>
					)}
					<div className="flex-grow space-y-2">
						<Input
							id="coverImageFile"
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							onChange={handleCoverFileChange}
							className={`file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 ${
								formErrors.coverImageFile ? "border-red-500" : ""
							}`}
						/>
						<Input
							id="coverImageUrl"
							type="url"
							value={blogData.coverImageUrl || ""}
							onChange={(e) => handleCoverImageUrlChange(e.target.value)}
							placeholder="Or paste cover image URL here"
							className={formErrors.coverImageUrl ? "border-red-500" : ""}
							disabled={!!blogData.coverImageFile} // Disable if a file is selected
						/>
					</div>
					{(coverImagePreviewUrl || blogData.coverImageUrl) && ( // Show remove button if there's any image source
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={handleRemoveCoverImage}
							title="Remove cover image"
							className="shrink-0"
						>
							<Trash2 className="h-4 w-4 text-red-500" />
						</Button>
					)}
				</div>
				{formErrors.coverImageFile && (
					<p className="text-sm text-red-500 mt-1">
						{formErrors.coverImageFile}
					</p>
				)}
				{formErrors.coverImageUrl && (
					<p className="text-sm text-red-500 mt-1">
						{formErrors.coverImageUrl}
					</p>
				)}
				<p className="text-xs text-gray-500 mt-1">
					Upload a cover image (max 5MB) or provide a direct URL. Upload takes
					precedence.
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="bannerImageFile">Banner Image (Upload or URL)</Label>
				<div className="flex items-center gap-4">
					{bannerImagePreviewUrl && (
						<div className="relative w-24 h-16 rounded border overflow-hidden shrink-0">
							<Image
								src={bannerImagePreviewUrl}
								alt="Banner image preview"
								layout="fill"
								objectFit="cover"
								onError={() => {
									// If URL from input fails, clear preview. File preview shouldn't fail this way.
									if (blogData.bannerImageUrl && !blogData.bannerImageFile)
										setBannerImagePreviewUrl(null);
								}}
							/>
						</div>
					)}
					{!bannerImagePreviewUrl && (
						<div className="w-24 h-16 rounded border bg-muted flex items-center justify-center shrink-0">
							<UploadCloud className="w-8 h-8 text-gray-400" />
						</div>
					)}
					<div className="flex-grow space-y-2">
						<Input
							id="bannerImageFile"
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							onChange={handleBannerFileChange}
							className={`file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 ${
								formErrors.bannerImageFile ? "border-red-500" : ""
							}`}
						/>
						<Input
							id="bannerImageUrl"
							type="url"
							value={blogData.bannerImageUrl || ""}
							onChange={(e) => handleBannerImageUrlChange(e.target.value)}
							placeholder="Or paste banner image URL here"
							className={formErrors.bannerImageUrl ? "border-red-500" : ""}
							disabled={!!blogData.bannerImageFile} // Disable if a file is selected
						/>
					</div>
					{(bannerImagePreviewUrl || blogData.bannerImageUrl) && ( // Show remove button if there's any image source
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={handleRemoveBannerImage}
							title="Remove banner image"
							className="shrink-0"
						>
							<Trash2 className="h-4 w-4 text-red-500" />
						</Button>
					)}
				</div>
				{formErrors.bannerImageFile && (
					<p className="text-sm text-red-500 mt-1">
						{formErrors.bannerImageFile}
					</p>
				)}
				{formErrors.bannerImageUrl && (
					<p className="text-sm text-red-500 mt-1">
						{formErrors.bannerImageUrl}
					</p>
				)}
				<p className="text-xs text-gray-500 mt-1">
					Upload a banner image (max 5MB) or provide a direct URL. Upload takes
					precedence.
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={blogData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger id="status">
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						{blogStatuses.map((status) => (
							<SelectItem key={status.value} value={status.value}>
								{status.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Blog"}
				</Button>
			</div>
			{formErrors._submit && (
				<p className="text-sm text-red-500 mt-2">{formErrors._submit}</p>
			)}
		</div>
	);
}
