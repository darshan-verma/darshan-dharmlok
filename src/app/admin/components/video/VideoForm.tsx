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
import { PlayCircle, Trash2 } from "lucide-react";

export interface VideoFormData {
	title: string;
	date: string;
	description: string;
	category: string;
	type: string;
	status: string;
	videoUrl: string;
	videoFile?: File | null;
}

interface VideoFormProps {
	initialData?: Partial<VideoFormData>;
	onSubmit: (videoData: VideoFormData) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
	mode?: "add" | "edit";
}

const videoCategories = [
	"Tutorial",
	"Sermon",
	"Event",
	"Music",
	"Documentary",
	"Other",
];
const videoTypes = ["MP4", "YouTube", "Vimeo", "Other"];
const videoStatuses = ["Draft", "Active", "Inactive"];

export default function VideoForm({
	initialData = {
		title: "",
		date: "",
		description: "",
		category: "",
		type: "",
		status: "Draft",
		videoUrl: "",
	},
	onSubmit,
	onCancel,
	isLoading = false,
	mode = "add",
}: VideoFormProps) {
	const [videoData, setVideoData] = useState<VideoFormData>({
		title: initialData.title || "",
		date: initialData.date || "",
		description: initialData.description || "",
		category: initialData.category || "",
		type: initialData.type || "",
		status: initialData.status || "Draft",
		videoUrl: initialData.videoUrl || "",
		videoFile: null,
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [videoSourceType, setVideoSourceType] = useState<"file" | "url">(
		initialData.videoUrl && initialData.videoUrl.startsWith("/uploads/videos/")
			? "file"
			: "url"
	);
	const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(
		initialData.videoUrl && initialData.videoUrl.startsWith("/uploads/videos/")
			? initialData.videoUrl
			: null
	);
	const [isUploading, setIsUploading] = useState(false);
	const [videoFileName, setVideoFileName] = useState<string | null>(
		initialData.videoUrl && initialData.videoUrl.startsWith("/uploads/videos/")
			? initialData.videoUrl.split("/").pop() || null
			: null
	);

	// Only update state when initialData actually changes (not on every render)
	useEffect(() => {
		setVideoData({
			title: initialData.title || "",
			date: initialData.date || "",
			description: initialData.description || "",
			category: initialData.category || "",
			type: initialData.type || "",
			status: initialData.status || "Draft",
			videoUrl: initialData.videoUrl || "",
			videoFile: null,
		});
		setVideoSourceType(
			initialData.videoUrl &&
				initialData.videoUrl.startsWith("/uploads/videos/")
				? "file"
				: "url"
		);
		setVideoPreviewUrl(
			initialData.videoUrl &&
				initialData.videoUrl.startsWith("/uploads/videos/")
				? initialData.videoUrl
				: null
		);
		setVideoFileName(
			initialData.videoUrl &&
				initialData.videoUrl.startsWith("/uploads/videos/")
				? initialData.videoUrl.split("/").pop() || null
				: null
		);

	}, [
		initialData.title,
		initialData.date,
		initialData.description,
		initialData.category,
		initialData.type,
		initialData.status,
		initialData.videoUrl,
	]);

	const validateForm = (data: VideoFormData) => {
		const errors: Record<string, string> = {};
		if (!data.title?.trim()) errors.title = "Title is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.description?.trim())
			errors.description = "Description is required";
		if (!data.category) errors.category = "Category is required";
		if (!data.type) errors.type = "Type is required";
		if (!data.status) errors.status = "Status is required";

		if (videoSourceType === "file") {
			// Only require a video file if adding, or if user is uploading a new file in edit mode
			if (
				(mode === "add" && !data.videoFile && !data.videoUrl) ||
				(mode === "edit" && data.videoFile && !data.videoUrl)
			) {
				errors.videoFile = "Video file is required";
			}
			if (data.videoFile && data.videoFile.size > 200 * 1024 * 1024)
				errors.videoFile = "Video size should be less than 200MB.";
			if (data.videoFile && data.videoFile.type !== "video/mp4")
				errors.videoFile = "Invalid video format. Use MP4.";
			if (data.videoFile && !data.videoUrl?.trim())
				errors.videoFile = "Please wait for the video to finish uploading.";
			// If editing and no new file is selected, do NOT require videoFile or videoUrl (allow editing other fields)
		}
		if (videoSourceType === "url") {
			if (!data.videoUrl?.trim()) errors.videoUrl = "Video URL is required";
		}
		return errors;
	};

	const handleInputChange = (
		field: keyof VideoFormData,
		value: string | File | null
	) => {
		setVideoData((prev) => ({
			...prev,
			[field]: value,
			// For file/url switch, keep the other fields intact
		}));
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	const handleVideoFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setFormErrors((prev) => ({ ...prev, videoFile: "" }));

		if (file.size > 200 * 1024 * 1024) {
			setFormErrors((prev) => ({
				...prev,
				videoFile: "Video size should be less than 200MB.",
			}));
			return;
		}
		if (file.type !== "video/mp4") {
			setFormErrors((prev) => ({
				...prev,
				videoFile: "Invalid video format. Use MP4.",
			}));
			return;
		}

		setVideoPreviewUrl(URL.createObjectURL(file));
		setVideoData((prev) => ({
			...prev,
			videoFile: file,
		}));
		setVideoFileName(file.name);
		setIsUploading(true);

		try {
			const formData = new FormData();
			formData.append("file", file);
			const response = await fetch("/api/upload/video-file", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) {
				setFormErrors((prev) => ({
					...prev,
					videoFile: "Failed to upload video file.",
				}));
				setIsUploading(false);
				return;
			}
			const { fileUrl } = await response.json();
			setVideoData((prev) => ({
				...prev,
				videoUrl: fileUrl,
			}));
			setIsUploading(false);
		} catch {
			setFormErrors((prev) => ({
				...prev,
				videoFile: "Failed to upload video file.",
			}));
			setIsUploading(false);
		}
	};

	const handleRemoveVideoFile = () => {
		setVideoData((prev) => ({
			...prev,
			videoFile: null,
			videoUrl: "",
		}));
		setVideoPreviewUrl(null);
		setVideoFileName(null);
		const fileInput = document.getElementById("videoFile") as HTMLInputElement;
		if (fileInput) fileInput.value = "";
	};

	const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const url = e.target.value;
		setVideoData((prev) => ({
			...prev,
			videoUrl: url,
			videoFile: null,
		}));
		setVideoPreviewUrl(null);
		const fileInput = document.getElementById("videoFile") as HTMLInputElement;
		if (fileInput) fileInput.value = "";
	};

	const handleVideoSourceTypeChange = (type: "file" | "url") => {
		setVideoSourceType(type);
		setFormErrors((prev) => ({ ...prev, videoFile: "", videoUrl: "" }));
		// Do NOT reset videoFile or videoUrl here; only switch the type.
		// User must manually clear or change the file/url if desired.
	};

	const handleSubmit = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		const errors = validateForm(videoData);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;

		const finalVideoUrl = videoData.videoUrl;
		// Convert date to ISO string if present
		let isoDate = videoData.date;
		if (isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
			isoDate = new Date(isoDate).toISOString();
		}

		await onSubmit({
			...videoData,
			date: isoDate,
			videoUrl: finalVideoUrl,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="title">Title *</Label>
				<Input
					id="title"
					value={videoData.title}
					onChange={(e) => handleInputChange("title", e.target.value)}
					placeholder="Enter video title"
					className={formErrors.title ? "border-red-500" : ""}
				/>
				{formErrors.title && (
					<p className="text-sm text-red-500">{formErrors.title}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label>Video Source *</Label>
				<div className="flex gap-4">
					<label className="flex items-center gap-2">
						<input
							type="radio"
							name="videoSourceType"
							value="file"
							checked={videoSourceType === "file"}
							onChange={() => handleVideoSourceTypeChange("file")}
						/>
						<span>Upload File</span>
					</label>
					<label className="flex items-center gap-2">
						<input
							type="radio"
							name="videoSourceType"
							value="url"
							checked={videoSourceType === "url"}
							onChange={() => handleVideoSourceTypeChange("url")}
						/>
						<span>Paste URL</span>
					</label>
				</div>
			</div>
			{videoSourceType === "file" && (
				<div className="space-y-2">
					<Label htmlFor="videoFile">Video File (MP4) *</Label>
					<div className="flex items-center gap-4">
						{videoPreviewUrl ? (
							<video
								src={videoPreviewUrl}
								controls
								width={120}
								height={68}
								className="rounded border"
							/>
						) : (
							<div className="w-32 h-16 rounded border bg-muted flex items-center justify-center">
								<PlayCircle className="w-8 h-8 text-gray-400" />
							</div>
						)}
						<div className="flex-grow">
							<Input
								id="videoFile"
								type="file"
								accept="video/mp4"
								onChange={handleVideoFileChange}
								className={`file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 ${
									formErrors.videoFile ? "border-red-500" : ""
								}`}
							/>
							{/* Show previously uploaded file name if present and no new file selected */}
							{!videoData.videoFile && videoFileName && (
								<p className="text-xs text-gray-600 mt-1">
									Previously uploaded:{" "}
									<span className="font-medium">{videoFileName}</span>
								</p>
							)}
							{formErrors.videoFile && (
								<p className="text-sm text-red-500 mt-1">
									{formErrors.videoFile}
								</p>
							)}
							<p className="text-xs text-gray-500 mt-1">
								Upload an MP4 video file (max 200MB).
							</p>
						</div>
						{(videoPreviewUrl || videoFileName) && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={handleRemoveVideoFile}
								title="Remove video"
							>
								<Trash2 className="h-4 w-4 text-red-500" />
							</Button>
						)}
					</div>
				</div>
			)}
			{videoSourceType === "url" && (
				<div className="space-y-2">
					<Label htmlFor="videoUrl">Video URL (YouTube, Vimeo, etc.) *</Label>
					<Input
						id="videoUrl"
						type="url"
						value={videoData.videoUrl}
						onChange={handleVideoUrlChange}
						placeholder="https://www.youtube.com/watch?v=..."
						className={formErrors.videoUrl ? "border-red-500" : ""}
					/>
					{formErrors.videoUrl && (
						<p className="text-sm text-red-500">{formErrors.videoUrl}</p>
					)}
					<p className="text-xs text-gray-500 mt-1">
						Paste a video URL (YouTube, Vimeo, etc.).
					</p>
				</div>
			)}
			<div className="space-y-2">
				<Label htmlFor="date">Date *</Label>
				<Input
					id="date"
					type="date"
					value={videoData.date}
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
					value={videoData.description}
					onChange={(e) => handleInputChange("description", e.target.value)}
					placeholder="Enter video description"
					rows={3}
					className={formErrors.description ? "border-red-500" : ""}
				/>
				{formErrors.description && (
					<p className="text-sm text-red-500">{formErrors.description}</p>
				)}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="category">Category *</Label>
					<Select
						value={videoData.category}
						onValueChange={(value) => handleInputChange("category", value)}
					>
						<SelectTrigger
							id="category"
							className={formErrors.category ? "border-red-500" : ""}
						>
							<SelectValue placeholder="Select category" />
						</SelectTrigger>
						<SelectContent>
							{videoCategories.map((cat) => (
								<SelectItem key={cat} value={cat}>
									{cat}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{formErrors.category && (
						<p className="text-sm text-red-500">{formErrors.category}</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="type">Type *</Label>
					<Select
						value={videoData.type}
						onValueChange={(value) => handleInputChange("type", value)}
					>
						<SelectTrigger
							id="type"
							className={formErrors.type ? "border-red-500" : ""}
						>
							<SelectValue placeholder="Select type" />
						</SelectTrigger>
						<SelectContent>
							{videoTypes.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{formErrors.type && (
						<p className="text-sm text-red-500">{formErrors.type}</p>
					)}
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={videoData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger id="status">
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						{videoStatuses.map((status) => (
							<SelectItem key={status} value={status}>
								{status}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{formErrors.status && (
					<p className="text-sm text-red-500">{formErrors.status}</p>
				)}
			</div>
			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={
						isLoading ||
						isUploading ||
						(videoSourceType === "file" &&
							((mode === "add" &&
								(!videoData.videoFile || !videoData.videoUrl)) ||
								(mode === "edit" &&
									videoData.videoFile &&
									!videoData.videoUrl))) ||
						(videoSourceType === "url" && !videoData.videoUrl.trim())
					}
				>
					{isLoading
						? mode === "edit"
							? "Updating..."
							: "Saving..."
						: isUploading && videoSourceType === "file"
						? "Uploading..."
						: mode === "edit"
						? "Update Video"
						: "Save Video"}
				</Button>
			</div>
			{formErrors._submit && (
				<p className="text-sm text-red-500 mt-2">{formErrors._submit}</p>
			)}
			{videoSourceType === "file" && isUploading && (
				<p className="text-sm text-blue-500 mt-1">
					Uploading video file, please wait...
				</p>
			)}
		</form>
	);
}
