"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
	CardDescription,
} from "@/components/ui/card";
import { Save, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "@/lib/toast";
import Image from "next/image";

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

interface VideoData {
	id: string;
	title: string;
	date: string;
	description: string;
	category: string;
	type: string;
	status: string;
	videoUrl: string;
	thumbnailUrl?: string | null;
	createdAt?: string;
	updatedAt?: string;
}

const getStatusColor = (status: string) =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

const formatDate = (dateString: string | Date) => {
	if (!dateString) return "N/A";
	const date =
		typeof dateString === "string" ? new Date(dateString) : dateString;
	return new Intl.DateTimeFormat("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
};

export default function VideoDetailPage() {
	const params = useParams();
	const router = useRouter();
	const videoId = params?.id as string;

	const [video, setVideo] = useState<VideoData | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedVideo, setEditedVideo] = useState<VideoData | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		const fetchVideo = async () => {
			try {
				const response = await fetch(`/api/video/${videoId}`);
				if (!response.ok) throw new Error("Failed to fetch video");
				const data = await response.json();
				setVideo(data);
				setEditedVideo(data);
			} catch {
				toast.error("Failed to load video details");
				router.push("/admin/video");
			}
		};
		if (videoId) fetchVideo();
	}, [videoId, router]);

	const validateForm = (data: VideoData) => {
		const errors: Record<string, string> = {};
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
			const response = await fetch(`/api/video/${videoId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...editedVideo,
					thumbnailUrl: editedVideo.thumbnailUrl || null, // ensure thumbnailUrl is sent
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
				<Card className="md:col-span-1 h-fit">
					<CardHeader className="text-center p-4 pb-2">
						<div className="relative w-24 h-16 mx-auto mb-3">
							<div className="w-full h-full rounded-lg bg-muted flex items-center justify-center overflow-hidden">
								{(
									isEditing ? editedVideo?.thumbnailUrl : video?.thumbnailUrl
								) ? (
									<Image
										src={
											isEditing
												? editedVideo?.thumbnailUrl || "/placeholder.png"
												: video?.thumbnailUrl || "/placeholder.png"
										}
										alt={
											isEditing
												? editedVideo?.title || "Video"
												: video?.title || "Video"
										}
										width={96}
										height={64}
										className="w-full h-full rounded-lg object-cover"
									/>
								) : (
									<ImageIcon className="h-10 w-10 text-muted-foreground" />
								)}
							</div>
						</div>
						<CardTitle className="text-center text-lg">
							{video?.title}
						</CardTitle>
						<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
							<span
								className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
									video
										? getStatusColor(video.status)
										: "bg-red-100 text-red-800"
								}`}
							>
								{video?.status || "Unknown"}
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 p-4 pt-0">
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Type:</span>
							<span>{video?.type}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Category:</span>
							<span>{video?.category}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Date:</span>
							<span>{video?.date ? formatDate(video.date) : "N/A"}</span>
						</div>
						{isEditing && (
							<div className="space-y-2">
								<Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
								<Input
									id="thumbnailUrl"
									type="url"
									value={editedVideo?.thumbnailUrl || ""}
									onChange={(e) =>
										setEditedVideo((prev) =>
											prev ? { ...prev, thumbnailUrl: e.target.value } : prev
										)
									}
									placeholder="https://example.com/thumbnail.jpg"
								/>
								<p className="text-xs text-gray-500">
									Provide a direct link to the video thumbnail.
								</p>
							</div>
						)}
					</CardContent>
					<CardFooter className="p-4 pt-0">
						<Button
							className="w-full text-sm h-8"
							variant={isEditing ? "outline" : "default"}
							onClick={() => setIsEditing(!isEditing)}
						>
							{isEditing ? "Cancel" : "Edit Video"}
						</Button>
					</CardFooter>
				</Card>
				<div className="md:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Video Information</CardTitle>
							<CardDescription>
								Update video details and metadata.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{isEditing ? (
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="title">Title *</Label>
										<Input
											id="title"
											value={editedVideo?.title || ""}
											onChange={(e) =>
												setEditedVideo((prev) =>
													prev ? { ...prev, title: e.target.value } : prev
												)
											}
											className={errors.title ? "border-red-500" : ""}
										/>
										{errors.title && (
											<p className="text-sm text-red-500">{errors.title}</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="date">Date *</Label>
										<Input
											id="date"
											type="date"
											value={editedVideo?.date || ""}
											onChange={(e) =>
												setEditedVideo((prev) =>
													prev ? { ...prev, date: e.target.value } : prev
												)
											}
											className={errors.date ? "border-red-500" : ""}
										/>
										{errors.date && (
											<p className="text-sm text-red-500">{errors.date}</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="description">Description *</Label>
										<Textarea
											id="description"
											value={editedVideo?.description || ""}
											onChange={(e) =>
												setEditedVideo((prev) =>
													prev ? { ...prev, description: e.target.value } : prev
												)
											}
											rows={3}
											className={errors.description ? "border-red-500" : ""}
										/>
										{errors.description && (
											<p className="text-sm text-red-500">
												{errors.description}
											</p>
										)}
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="category">Category *</Label>
											<Select
												value={editedVideo?.category || ""}
												onValueChange={(value) =>
													setEditedVideo((prev) =>
														prev ? { ...prev, category: value } : prev
													)
												}
											>
												<SelectTrigger
													id="category"
													className={errors.category ? "border-red-500" : ""}
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
											{errors.category && (
												<p className="text-sm text-red-500">
													{errors.category}
												</p>
											)}
										</div>
										<div className="space-y-2">
											<Label htmlFor="type">Type *</Label>
											<Select
												value={editedVideo?.type || ""}
												onValueChange={(value) =>
													setEditedVideo((prev) =>
														prev ? { ...prev, type: value } : prev
													)
												}
											>
												<SelectTrigger
													id="type"
													className={errors.type ? "border-red-500" : ""}
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
											{errors.type && (
												<p className="text-sm text-red-500">{errors.type}</p>
											)}
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="status">Status *</Label>
										<Select
											value={editedVideo?.status || ""}
											onValueChange={(value) =>
												setEditedVideo((prev) =>
													prev ? { ...prev, status: value } : prev
												)
											}
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
										{errors.status && (
											<p className="text-sm text-red-500">{errors.status}</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="videoUrl">Video URL *</Label>
										<Input
											id="videoUrl"
											type="url"
											value={editedVideo?.videoUrl || ""}
											onChange={(e) =>
												setEditedVideo((prev) =>
													prev ? { ...prev, videoUrl: e.target.value } : prev
												)
											}
											className={errors.videoUrl ? "border-red-500" : ""}
										/>
										{errors.videoUrl && (
											<p className="text-sm text-red-500">{errors.videoUrl}</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
										<Input
											id="thumbnailUrl"
											type="url"
											value={editedVideo?.thumbnailUrl || ""}
											onChange={(e) =>
												setEditedVideo((prev) =>
													prev
														? { ...prev, thumbnailUrl: e.target.value }
														: prev
												)
											}
										/>
									</div>
								</div>
							) : (
								<div className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<h3 className="text-sm font-medium text-muted-foreground">
												Title
											</h3>
											<p className="font-medium text-foreground">
												{video?.title}
											</p>
										</div>
										<div className="space-y-2">
											<h3 className="text-sm font-medium text-muted-foreground">
												Type
											</h3>
											<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
												{video?.type}
											</span>
										</div>
										<div className="space-y-2">
											<h3 className="text-sm font-medium text-muted-foreground">
												Category
											</h3>
											<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
												{video?.category}
											</span>
										</div>
										<div className="space-y-2">
											<h3 className="text-sm font-medium text-muted-foreground">
												Status
											</h3>
											<span
												className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
													video?.status || ""
												)}`}
											>
												{video?.status}
											</span>
										</div>
										<div className="space-y-2">
											<h3 className="text-sm font-medium text-muted-foreground">
												Date
											</h3>
											<p className="font-medium text-foreground">
												{video?.date ? formatDate(video.date) : "N/A"}
											</p>
										</div>
									</div>
									<div className="space-y-2 pt-2 border-t border-border">
										<h3 className="text-sm font-medium text-muted-foreground">
											Description
										</h3>
										<p className="font-medium text-foreground whitespace-pre-wrap">
											{video?.description || "No description provided"}
										</p>
									</div>
									{video?.videoUrl && (
										<div className="space-y-2 pt-2 border-t border-border">
											<h3 className="text-sm font-medium text-muted-foreground">
												Video URL
											</h3>
											<a
												href={video.videoUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 underline break-all"
											>
												{video.videoUrl}
											</a>
										</div>
									)}
									{video?.thumbnailUrl && (
										<div className="space-y-2 pt-2 border-t border-border">
											<h3 className="text-sm font-medium text-muted-foreground">
												Thumbnail
											</h3>
											<div className="w-48 h-28 rounded-lg overflow-hidden border">
												<Image
													src={video.thumbnailUrl}
													alt={video.title}
													width={192}
													height={112}
													className="w-full h-full object-cover"
												/>
											</div>
										</div>
									)}
								</div>
							)}
						</CardContent>
						{isEditing && (
							<CardFooter>
								<Button onClick={handleSave} disabled={isSaving}>
									{isSaving ? (
										<>
											<Save className="h-4 w-4 mr-2 animate-spin" />
											Saving...
										</>
									) : (
										<>
											<Save className="h-4 w-4 mr-2" />
											Save Changes
										</>
									)}
								</Button>
							</CardFooter>
						)}
					</Card>
				</div>
			</div>
		</div>
	);
}
