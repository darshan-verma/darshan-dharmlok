"use client";

import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Trash2 } from "lucide-react";
import {
	BalvidhyaData,
	Errors,
	typeOptions,
	categoryOptions,
	statusOptions,
	categoryLabel,
	typeLabel,
	statusLabel,
	getStatusColor,
	formatDate,
} from "./types";
import { getTypeIcon } from "./BalvidhyaDetailCard";
import { toast } from "@/lib/toast";
import { ReligiousCategoryPills } from "@/components/admin/ReligiousCategoryPills";
import { ReligiousCategoryBadges } from "@/components/admin/ReligiousCategoryBadges";
import type { ReligiousCategory } from "@/lib/religious-categories";

type Props = {
	balvidhya: BalvidhyaData | null;
	editedBalvidhya: BalvidhyaData | null;
	setEditedBalvidhya: (balvidhya: BalvidhyaData | null) => void;
	isEditing: boolean;
	isSaving: boolean;
	errors: Errors;
	onSave: () => void;
};

export function BalvidhyaInfoCard({
	balvidhya,
	editedBalvidhya,
	setEditedBalvidhya,
	isEditing,
	isSaving,
	errors,
	onSave,
}: Props) {
	if (!balvidhya || !editedBalvidhya) return null;

	const handleRemoveVideoUrl = () => {
		setEditedBalvidhya({ ...editedBalvidhya, videoUrl: "" });
	};

	const handleRemoveBookFile = () => {
		setEditedBalvidhya({ ...editedBalvidhya, bookFile: "" });
	};

	const handleRemoveVideoFile = () => {
		setEditedBalvidhya({ ...editedBalvidhya, videoFile: "" });
	};

	const handleFileUpload = async (file: File, type: "book" | "video") => {
		if (!file) return;

		const endpoint = type === "book" ? "/api/upload/pdf" : "/api/upload/video";
		const formData = new FormData();
		formData.append("file", file);
		formData.append("contentId", balvidhya._id);

		const loadingToast = toast.loading(`Uploading ${type} file...`);

		try {
			const response = await fetch(endpoint, {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Failed to upload ${type} file`);
			}

			const data = await response.json();
			const fileUrl = type === "book" ? data.pdfUrl : data.videoUrl;

			if (type === "book") {
				setEditedBalvidhya({ ...editedBalvidhya, bookFile: fileUrl });
			} else {
				setEditedBalvidhya({
					...editedBalvidhya,
					videoFile: fileUrl,
					videoUrl: "",
				});
			}

			toast.dismiss(loadingToast);
			toast.success(
				`${type === "book" ? "Book" : "Video"} uploaded successfully!`
			);
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : `Failed to upload ${type} file`
			);
		}
	};

	return (
		<Tabs defaultValue="details">
			<TabsList className="grid grid-cols-3 mb-4">
				<TabsTrigger value="details">Content Details</TabsTrigger>
				<TabsTrigger value="preferences">Settings</TabsTrigger>
				<TabsTrigger value="activity">Activity Log</TabsTrigger>
			</TabsList>
			<TabsContent value="details" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Content Information</CardTitle>
						<CardDescription>
							Update content details and metadata.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{isEditing ? (
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Content Name *</Label>
									<Input
										id="name"
										value={editedBalvidhya.name || ""}
										onChange={(e) =>
											setEditedBalvidhya({
												...editedBalvidhya,
												name: e.target.value,
											})
										}
										className={errors.name ? "border-red-500" : ""}
									/>
									{errors.name && (
										<p className="text-sm text-red-500">{errors.name}</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="description">Description *</Label>
									<Textarea
										id="description"
										value={editedBalvidhya.description || ""}
										onChange={(e) =>
											setEditedBalvidhya({
												...editedBalvidhya,
												description: e.target.value,
											})
										}
										rows={4}
										className={errors.description ? "border-red-500" : ""}
									/>
									{errors.description && (
										<p className="text-sm text-red-500">{errors.description}</p>
									)}
									<p className="text-xs text-gray-500">
										{(editedBalvidhya.description || "").length}/500 characters
									</p>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="type">Content Type *</Label>
										<Select
											value={editedBalvidhya.type || ""}
											onValueChange={(value) =>
												setEditedBalvidhya({
													...editedBalvidhya,
													type: value,
												})
											}
										>
											<SelectTrigger
												id="type"
												className={errors.type ? "border-red-500" : ""}
											>
												<SelectValue placeholder="Select content type" />
											</SelectTrigger>
											<SelectContent>
												{typeOptions.map((type) => (
													<SelectItem key={type.value} value={type.value}>
														{type.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{errors.type && (
											<p className="text-sm text-red-500">{errors.type}</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="category">Category *</Label>
										<Select
											value={editedBalvidhya.category || ""}
											onValueChange={(value) =>
												setEditedBalvidhya({
													...editedBalvidhya,
													category: value,
												})
											}
										>
											<SelectTrigger
												id="category"
												className={errors.category ? "border-red-500" : ""}
											>
												<SelectValue placeholder="Select category" />
											</SelectTrigger>
											<SelectContent>
												{categoryOptions.map((cat) => (
													<SelectItem key={cat.value} value={cat.value}>
														{cat.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{errors.category && (
											<p className="text-sm text-red-500">{errors.category}</p>
										)}
									</div>
								</div>
								<ReligiousCategoryPills
									value={editedBalvidhya.religiousCategories || []}
									onChange={(value: ReligiousCategory[]) =>
										setEditedBalvidhya({
											...editedBalvidhya,
											religiousCategories: value,
										})
									}
								/>
								<div className="space-y-2">
									<Label htmlFor="thumbnailUrl">Thumbnail URL (Optional)</Label>
									<Input
										id="thumbnailUrl"
										type="url"
										value={editedBalvidhya.thumbnailUrl || ""}
										onChange={(e) =>
											setEditedBalvidhya({
												...editedBalvidhya,
												thumbnailUrl: e.target.value,
											})
										}
										placeholder="https://example.com/image.jpg"
										className={errors.thumbnailUrl ? "border-red-500" : ""}
									/>
									{errors.thumbnailUrl && (
										<p className="text-sm text-red-500">
											{errors.thumbnailUrl}
										</p>
									)}
									<p className="text-xs text-gray-500">
										Provide a direct link to the content thumbnail image
									</p>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="status">Status *</Label>
										<Select
											value={editedBalvidhya.status || ""}
											onValueChange={(value) =>
												setEditedBalvidhya({
													...editedBalvidhya,
													status: value,
												})
											}
										>
											<SelectTrigger id="status">
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
											<SelectContent>
												{statusOptions.map((status) => (
													<SelectItem key={status.value} value={status.value}>
														{status.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">
											Content Settings
										</Label>
										<div className="flex items-center space-x-2 py-2">
											<input
												type="checkbox"
												id="trending"
												checked={editedBalvidhya.trending || false}
												onChange={(e) =>
													setEditedBalvidhya({
														...editedBalvidhya,
														trending: e.target.checked,
													})
												}
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
								<div className="space-y-2">
									<Label htmlFor="videoUrl">Video URL (Optional)</Label>
									<div className="relative">
										<Input
											id="videoUrl"
											type="url"
											value={editedBalvidhya.videoUrl || ""}
											onChange={(e) =>
												setEditedBalvidhya({
													...editedBalvidhya,
													videoUrl: e.target.value,
												})
											}
											placeholder="https://example.com/video"
										/>
										{editedBalvidhya.videoUrl && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={handleRemoveVideoUrl}
												title="Remove video URL"
												tabIndex={-1}
												className="absolute top-1/2 right-2 -translate-y-1/2"
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										)}
									</div>
									<p className="text-xs text-gray-500">
										Provide a direct link to a video (YouTube, Vimeo, etc.)
									</p>
								</div>
								{editedBalvidhya.type === "book" && (
									<div className="space-y-2 relative">
										<Label htmlFor="bookFile">Book File (PDF)</Label>
										<Input
											id="bookFile"
											type="file"
											accept="application/pdf"
											onChange={(e) => {
												const file = e.target.files?.[0];
												if (file) {
													handleFileUpload(file, "book");
												}
											}}
										/>
										{editedBalvidhya.bookFile && (
											<div className="flex items-center gap-2 mt-1">
												<div className="flex-grow">
													<p className="text-xs text-green-700 break-all">
														Current book file: {editedBalvidhya.bookFile}
													</p>
													<a
														href={editedBalvidhya.bookFile}
														target="_blank"
														rel="noopener noreferrer"
														className="text-xs text-blue-600 underline"
													>
														View PDF
													</a>
												</div>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={handleRemoveBookFile}
													title="Remove book file"
													tabIndex={-1}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											</div>
										)}
										<p className="text-xs text-gray-500">
											Upload a PDF file for the book (max 20MB)
										</p>
									</div>
								)}
								{editedBalvidhya.type === "video" && (
									<div className="space-y-2 relative">
										<Label htmlFor="videoFile">Video File (MP4)</Label>
										<Input
											id="videoFile"
											type="file"
											accept="video/mp4"
											onChange={(e) => {
												const file = e.target.files?.[0];
												if (file) {
													handleFileUpload(file, "video");
												}
											}}
										/>
										{editedBalvidhya.videoFile && (
											<div className="flex flex-col gap-2 mt-1">
												<div className="flex items-center justify-between">
													<p className="text-xs text-green-700 truncate max-w-[90%]">
														Current video file:{" "}
														{editedBalvidhya.videoFile.split("/").pop()}
													</p>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={handleRemoveVideoFile}
														title="Remove video file"
														tabIndex={-1}
													>
														<Trash2 className="h-4 w-4 text-red-500" />
													</Button>
												</div>
												<div className="w-full h-48 rounded overflow-hidden border border-gray-200 bg-gray-50">
													<video
														src={editedBalvidhya.videoFile}
														controls
														className="w-full h-full object-contain"
													/>
												</div>
											</div>
										)}
										<p className="text-xs text-gray-500">
											Upload an MP4 video file (max 200MB)
										</p>
									</div>
								)}
							</div>
						) : (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<h3 className="text-sm font-medium text-muted-foreground">
											Content Name
										</h3>
										<p className="font-medium text-foreground">
											{balvidhya.name}
										</p>
									</div>
									<div className="space-y-2">
										<h3 className="text-sm font-medium text-muted-foreground">
											Type
										</h3>
										<span
											className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium`}
										>
											{getTypeIcon(balvidhya.type || "")}
											{typeLabel(balvidhya.type || "")}
										</span>
									</div>
									<div className="space-y-2">
										<h3 className="text-sm font-medium text-muted-foreground">
											Category
										</h3>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`}
										>
											{categoryLabel(balvidhya.category || "")}
										</span>
									</div>
									<div className="space-y-2">
										<h3 className="text-sm font-medium text-muted-foreground">
											Religious Category
										</h3>
										<ReligiousCategoryBadges
											religiousCategories={balvidhya.religiousCategories}
										/>
									</div>
									<div className="space-y-2">
										<h3 className="text-sm font-medium text-muted-foreground">
											Status
										</h3>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
												balvidhya.status || ""
											)}`}
										>
											{statusLabel(balvidhya.status || "")}
										</span>
									</div>
									<div className="space-y-2">
										<h3 className="text-sm font-medium text-muted-foreground">
											Trending
										</h3>
										<span
											className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
												balvidhya.trending
													? "bg-orange-100 text-orange-800"
													: "bg-gray-100 text-gray-800"
											}`}
										>
											{balvidhya.trending ? "Trending" : "Normal"}
										</span>
									</div>
									<div className="space-y-2">
										<h3 className="text-sm font-medium text-muted-foreground">
											Date Added
										</h3>
										<p className="font-medium text-foreground">
											{balvidhya.dateAdded
												? formatDate(balvidhya.dateAdded)
												: "N/A"}
										</p>
									</div>
								</div>
								<div className="space-y-2 pt-2 border-t border-border">
									<h3 className="text-sm font-medium text-muted-foreground">
										Description
									</h3>
									<p className="font-medium text-foreground whitespace-pre-wrap">
										{balvidhya.description || "No description provided"}
									</p>
								</div>
								{balvidhya.thumbnailUrl && (
									<div className="space-y-2 pt-2 border-t border-border">
										<h3 className="text-sm font-medium text-muted-foreground">
											Thumbnail
										</h3>
										<div className="w-32 h-20 rounded-lg overflow-hidden border">
											<Image
												src={balvidhya.thumbnailUrl}
												alt={balvidhya.name}
												width={128}
												height={80}
												className="w-full h-full object-cover"
												unoptimized={true}
											/>
										</div>
									</div>
								)}
								{balvidhya.videoUrl && (
									<div className="space-y-2 pt-2 border-t border-border">
										<h3 className="text-sm font-medium text-muted-foreground">
											Video URL
										</h3>
										<a
											href={balvidhya.videoUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-600 underline break-all"
										>
											{balvidhya.videoUrl}
										</a>
									</div>
								)}
								{balvidhya.bookFile && (
									<div className="space-y-2 pt-2 border-t border-border">
										<h3 className="text-sm font-medium text-muted-foreground">
											Book File (PDF)
										</h3>
										<div className="flex flex-col space-y-2">
											<a
												href={balvidhya.bookFile}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 underline break-all"
											>
												{balvidhya.bookFile}
											</a>
											<div className="flex justify-start">
												<a
													href={balvidhya.bookFile}
													target="_blank"
													rel="noopener noreferrer"
													className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
												>
													View PDF
												</a>
											</div>
										</div>
									</div>
								)}
								{balvidhya.videoFile && (
									<div className="space-y-2 pt-2 border-t border-border">
										<h3 className="text-sm font-medium text-muted-foreground">
											Video File (MP4)
										</h3>
										<div className="flex flex-col space-y-2">
											<a
												href={balvidhya.videoFile}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 underline break-all"
											>
												{balvidhya.videoFile}
											</a>
											<div className="w-full max-w-lg rounded overflow-hidden border">
												<video
													src={balvidhya.videoFile}
													controls
													className="w-full h-auto"
												/>
											</div>
										</div>
									</div>
								)}
							</div>
						)}
					</CardContent>
					{isEditing && (
						<CardFooter>
							<Button onClick={onSave} disabled={isSaving}>
								{isSaving ? (
									<>
										<svg
											className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
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
			</TabsContent>
			<TabsContent value="preferences" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Content Settings</CardTitle>
						<CardDescription>
							Manage content visibility and notification settings.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<p className="text-gray-500 text-sm">
								Settings section coming soon.
							</p>
						</div>
					</CardContent>
				</Card>
			</TabsContent>
			<TabsContent value="activity" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Activity Log</CardTitle>
						<CardDescription>
							Recent content activities and updates.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-gray-500 text-sm">Activity log coming soon.</p>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}
