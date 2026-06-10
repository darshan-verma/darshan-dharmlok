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
import { Trash2 } from "lucide-react";
import { ReligiousCategoryPills } from "@/components/admin/ReligiousCategoryPills";
import {
	resolveReligiousCategories,
	type ReligiousCategory,
} from "@/lib/religious-categories";
import { categoryOptions, typeOptions, statusOptions } from "./types";

const balvidhyaTypes = typeOptions;
const balvidhyaStatuses = statusOptions;
const balvidhyaCategories = categoryOptions;

// Define the shape of data the form will submit
export interface BalvidhyaSubmitData {
	name: string;
	description: string;
	type: string;
	category: string;
	religiousCategories?: ReligiousCategory[];
	status: string;
	trending: boolean;
	thumbnailUrl: string | null;
	videoUrl?: string | null;
	bookFile?: string | null;
	videoFile?: string | null;
}

// Use a more specific type for initialData
type BalvidhyaFormInitialData = Partial<
	BalvidhyaSubmitData & { religiousCategories?: ReligiousCategory[] }
> & {
	id?: string;
	dateAdded?: string | Date;
	createdAt?: string | Date;
	updatedAt?: string | Date;
	trendingStatus?: string;
};

interface BalvidhyaFormProps {
	initialData?: BalvidhyaFormInitialData; // Specify a better type than any
	onSubmit: (balvidhyaData: BalvidhyaSubmitData) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function BalvidhyaForm({
	initialData = {
		name: "",
		description: "",
		type: "video",
		category: "Other",
		status: "Active",
		trending: false,
		thumbnailUrl: "",
		videoUrl: "",
		bookFile: "",
		videoFile: "",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: BalvidhyaFormProps) {
	const initialReligious = resolveReligiousCategories({
		religiousCategories: initialData.religiousCategories,
		category: ["Sanatan", "Jain", "Buddhism", "Buddhist", "Sikh"].includes(
			initialData.category || ""
		)
			? initialData.category
			: undefined,
	});

	const [balvidhyaData, setBalvidhyaData] = useState(() => ({
		name: initialData.name || "",
		description: initialData.description || "",
		type: initialData.type || "video",
		category: initialData.category || "Other",
		religiousCategories: initialReligious,
		status: initialData.status || "Active",
		trending:
			typeof initialData.trending === "boolean"
				? initialData.trending
				: initialData.trendingStatus === "Trending" ||
				  initialData.trendingStatus === "HighlyTrending" ||
				  initialData.trendingStatus === "Featured",
		thumbnailUrl: initialData.thumbnailUrl || "",
		videoUrl: initialData.videoUrl || "",
		bookFile: initialData.bookFile || "",
		videoFile: initialData.videoFile || "",
	}));

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	// Prevent infinite update loop by only updating state if initialData actually changes
	useEffect(() => {
		setBalvidhyaData((prev) => {
			const nextReligious = resolveReligiousCategories({
				religiousCategories: initialData.religiousCategories,
				category: ["Sanatan", "Jain", "Buddhism", "Buddhist", "Sikh"].includes(
					initialData.category || ""
				)
					? initialData.category
					: undefined,
			});
			const next = {
				name: initialData.name || "",
				description: initialData.description || "",
				type: initialData.type || "video",
				category: initialData.category || "Other",
				religiousCategories: nextReligious,
				status: initialData.status || "Active",
				trending:
					typeof initialData.trending === "boolean"
						? initialData.trending
						: initialData.trendingStatus === "Trending" ||
						  initialData.trendingStatus === "HighlyTrending" ||
						  initialData.trendingStatus === "Featured",
				thumbnailUrl: initialData.thumbnailUrl || "",
				videoUrl: initialData.videoUrl || "",
				bookFile: initialData.bookFile || "",
				videoFile: initialData.videoFile || "",
			};
			const keys = Object.keys(next) as (keyof typeof next)[];
			for (const key of keys) {
				if (prev[key] !== next[key]) return next;
			}
			return prev;
		});
	}, [
		initialData.name,
		initialData.description,
		initialData.type,
		initialData.category,
		initialData.religiousCategories,
		initialData.status,
		initialData.trending,
		initialData.trendingStatus,
		initialData.thumbnailUrl,
		initialData.videoUrl,
		initialData.bookFile,
		initialData.videoFile,
	]);

	const validateForm = (data: typeof balvidhyaData) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Content name is required";
		else if (data.name.length < 3)
			errors.name = "Name must be at least 3 characters";
		else if (data.name.length > 100)
			errors.name = "Name must be less than 100 characters";

		if (!data.description?.trim())
			errors.description = "Description is required";
		else if (data.description.length < 10)
			errors.description = "Description must be at least 10 characters";
		else if (data.description.length > 500)
			errors.description = "Description must be less than 500 characters";

		if (!data.type) errors.type = "Content type is required";
		if (!data.category) errors.category = "Category is required";
		if (data.thumbnailUrl && data.thumbnailUrl.trim()) {
			try {
				new URL(data.thumbnailUrl);
			} catch {
				errors.thumbnailUrl = "Please enter a valid URL";
			}
		}
		return errors;
	};

	const handleFileUpload = async (
		file: File,
		field: "bookFile" | "videoFile"
	) => {
		if (!file) return;
		const isBook = field === "bookFile";
		const validTypes = isBook ? ["application/pdf"] : ["video/mp4"];
		if (!validTypes.includes(file.type)) {
			setFormErrors((prev) => ({
				...prev,
				[field]: isBook
					? "Please select a valid PDF file"
					: "Please select a valid MP4 video file",
			}));
			return;
		}
		const maxSize = isBook ? 20 * 1024 * 1024 : 200 * 1024 * 1024; // 20MB for PDF, 200MB for video
		if (file.size > maxSize) {
			setFormErrors((prev) => ({
				...prev,
				[field]: isBook
					? "PDF size must be less than 20MB"
					: "Video size must be less than 200MB",
			}));
			return;
		}
		try {
			const formData = new FormData();
			formData.append("file", file);
			const uploadUrl = isBook ? "/api/upload/pdf" : "/api/upload/video";
			const response = await fetch(uploadUrl, {
				method: "POST",
				body: formData,
			});
			if (!response.ok) throw new Error("Failed to upload file");
			const { fileUrl } = await response.json();
			setBalvidhyaData((prev) => ({
				...prev,
				[field]: fileUrl,
			}));
			setFormErrors((prev) => ({ ...prev, [field]: "" }));
		} catch {
			setFormErrors((prev) => ({
				...prev,
				[field]: "Failed to upload file",
			}));
		}
	};

	const handleSubmit = async () => {
		const errors = validateForm(balvidhyaData);
		setFormErrors(errors);

		if (Object.keys(errors).length > 0) return;
		try {
			// Prepare data for submission according to BalvidhyaSubmitData
			const dataToSubmit: BalvidhyaSubmitData = {
				name: balvidhyaData.name,
				description: balvidhyaData.description,
				type: balvidhyaData.type,
				status: balvidhyaData.status,
				category: balvidhyaData.category,
				religiousCategories: balvidhyaData.religiousCategories || [],
				trending: !!balvidhyaData.trending,
				thumbnailUrl: balvidhyaData.thumbnailUrl || null, // Ensure null if empty
				videoUrl: balvidhyaData.videoUrl || null,
				bookFile: balvidhyaData.bookFile || null,
				videoFile: balvidhyaData.videoFile || null,
			};
			await onSubmit(dataToSubmit);
		} catch {
			// Optionally, set a general form error here if the submission fails at a higher level
			setFormErrors((prev) => ({
				...prev,
				_submit: "Failed to save content. Please try again.",
			}));
		}
	};

	const handleInputChange = (
		field: keyof typeof balvidhyaData & string,
		value: string | boolean | Date | ReligiousCategory[]
	) => {
		setBalvidhyaData({ ...balvidhyaData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="name">Content Name *</Label>
				<Input
					id="name"
					value={balvidhyaData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter content name"
					className={formErrors.name ? "border-red-500" : ""}
				/>
				{formErrors.name && (
					<p className="text-sm text-red-500">{formErrors.name}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">Description *</Label>
				<Textarea
					id="description"
					value={balvidhyaData.description}
					onChange={(e) => handleInputChange("description", e.target.value)}
					placeholder="Enter detailed description of the content"
					rows={4}
					className={formErrors.description ? "border-red-500" : ""}
				/>
				{formErrors.description && (
					<p className="text-sm text-red-500">{formErrors.description}</p>
				)}
				<p className="text-xs text-gray-500">
					{balvidhyaData.description.length}/500 characters
				</p>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="type">Content Type *</Label>
					<Select
						value={balvidhyaData.type}
						onValueChange={(value) => handleInputChange("type", value)}
					>
						<SelectTrigger
							id="type"
							className={formErrors.type ? "border-red-500" : ""}
						>
							<SelectValue placeholder="Select content type" />
						</SelectTrigger>
						<SelectContent>
							{balvidhyaTypes.map((type) => (
								<SelectItem key={type.value} value={type.value}>
									{type.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{formErrors.type && (
						<p className="text-sm text-red-500">{formErrors.type}</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="category">Category *</Label>
					<Select
						value={balvidhyaData.category}
						onValueChange={(value) => handleInputChange("category", value)}
					>
						<SelectTrigger
							id="category"
							className={formErrors.category ? "border-red-500" : ""}
						>
							<SelectValue placeholder="Select category" />
						</SelectTrigger>
						<SelectContent>
							{balvidhyaCategories.map((cat) => (
								<SelectItem key={cat.value} value={cat.value}>
									{cat.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{formErrors.category && (
						<p className="text-sm text-red-500">{formErrors.category}</p>
					)}
				</div>
			</div>
			<ReligiousCategoryPills
				value={balvidhyaData.religiousCategories || []}
				onChange={(value) => handleInputChange("religiousCategories", value)}
			/>
			<div className="space-y-2">
				<Label htmlFor="thumbnailUrl">Thumbnail URL (Optional)</Label>
				<Input
					id="thumbnailUrl"
					type="url"
					value={balvidhyaData.thumbnailUrl}
					onChange={(e) => handleInputChange("thumbnailUrl", e.target.value)}
					placeholder="https://example.com/image.jpg"
					className={formErrors.thumbnailUrl ? "border-red-500" : ""}
				/>
				{formErrors.thumbnailUrl && (
					<p className="text-sm text-red-500">{formErrors.thumbnailUrl}</p>
				)}
				<p className="text-xs text-gray-500">
					Provide a direct link to the content thumbnail image
				</p>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="status">Status *</Label>
					<Select
						value={balvidhyaData.status}
						onValueChange={(value) => handleInputChange("status", value)}
					>
						<SelectTrigger id="status">
							<SelectValue placeholder="Select status" />
						</SelectTrigger>
						<SelectContent>
							{balvidhyaStatuses.map((status) => (
								<SelectItem key={status.value} value={status.value}>
									{status.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label className="text-sm font-medium">Content Settings</Label>
					<div className="flex items-center space-x-2 py-2">
						<input
							type="checkbox"
							id="trending"
							checked={balvidhyaData.trending}
							onChange={(e) => handleInputChange("trending", e.target.checked)}
							className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
						/>
						<Label
							htmlFor="trending"
							className="text-sm font-medium text-gray-700"
						>
							Mark as Trending
						</Label>
					</div>
				</div>
			</div>
			{balvidhyaData.type === "book" && (
				<div className="space-y-2">
					<Label htmlFor="bookFile">Book File (PDF)</Label>
					<div className="relative">
						<Input
							id="bookFile"
							type="file"
							accept="application/pdf"
							onChange={(e) =>
								e.target.files?.[0] &&
								handleFileUpload(e.target.files[0], "bookFile")
							}
						/>
						{balvidhyaData.bookFile && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => handleInputChange("bookFile", "")}
								title="Remove book file"
								tabIndex={-1}
								className="absolute top-1/2 right-2 -translate-y-1/2"
							>
								<Trash2 className="h-4 w-4 text-red-500" />
							</Button>
						)}
					</div>
					{balvidhyaData.bookFile && (
						<div className="flex items-center gap-2 mt-1">
							<a
								href={balvidhyaData.bookFile}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-blue-700 underline break-all"
							>
								{balvidhyaData.bookFile.split("/").pop()}
							</a>
						</div>
					)}
					{formErrors.bookFile && (
						<p className="text-sm text-red-500">{formErrors.bookFile}</p>
					)}
					<p className="text-xs text-gray-500">
						Upload a PDF file for the book (max 20MB)
					</p>
				</div>
			)}
			{balvidhyaData.type === "video" && (
				<div className="space-y-2">
					<Label htmlFor="videoFile">Video File (MP4)</Label>
					<div className="relative">
						<Input
							id="videoFile"
							type="file"
							accept="video/mp4"
							onChange={(e) =>
								e.target.files?.[0] &&
								handleFileUpload(e.target.files[0], "videoFile")
							}
						/>
						{balvidhyaData.videoFile && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => handleInputChange("videoFile", "")}
								title="Remove video file"
								tabIndex={-1}
								className="absolute top-1/2 right-2 -translate-y-1/2"
							>
								<Trash2 className="h-4 w-4 text-red-500" />
							</Button>
						)}
					</div>
					{balvidhyaData.videoFile && (
						<div className="flex items-center gap-2 mt-1">
							<a
								href={balvidhyaData.videoFile}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-blue-700 underline break-all"
							>
								{balvidhyaData.videoFile.split("/").pop()}
							</a>
						</div>
					)}
					{formErrors.videoFile && (
						<p className="text-sm text-red-500">{formErrors.videoFile}</p>
					)}
					<p className="text-xs text-gray-500">
						Upload an MP4 video file (max 200MB)
					</p>
				</div>
			)}
			<div className="space-y-2">
				<Label htmlFor="videoUrl">Video URL (Optional)</Label>
				<div className="relative">
					<Input
						id="videoUrl"
						type="url"
						value={balvidhyaData.videoUrl}
						onChange={(e) => handleInputChange("videoUrl", e.target.value)}
						placeholder="https://example.com/video"
					/>
					{balvidhyaData.videoUrl && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => handleInputChange("videoUrl", "")}
							title="Remove video URL"
							tabIndex={-1}
							className="absolute top-1/2 right-2 -translate-y-1/2"
						>
							<Trash2 className="h-4 w-4 text-red-500" />
						</Button>
					)}
				</div>
				{balvidhyaData.videoUrl && (
					<div className="flex items-center gap-2 mt-1">
						<a
							href={balvidhyaData.videoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-blue-700 underline break-all"
						>
							{balvidhyaData.videoUrl}
						</a>
					</div>
				)}
				<p className="text-xs text-gray-500">
					Provide a direct link to a video (YouTube, Vimeo, etc.)
				</p>
			</div>
			<div className="flex justify-end gap-2 mt-6 pt-4 border-t">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Content"}
				</Button>
			</div>
			<div className="text-xs text-gray-500 mt-2 p-3 bg-gray-50 rounded">
				<p className="font-medium mb-1">Form Guidelines:</p>
				<ul className="space-y-1">
					<li>• All fields marked with (*) are required</li>
					<li>• Name should be descriptive and under 100 characters</li>
					<li>• Description should provide clear content overview</li>
					<li>• Thumbnail URL should be a direct link to an image file</li>
					<li>• Trending content will be featured prominently</li>
				</ul>
			</div>
		</div>
	);
}
