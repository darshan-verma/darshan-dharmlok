"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import Image from "next/image";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import ImageDetailsDialog from "./ImageDetailsDialog";
import VideoDetailsDialog from "./VideoDetailsDialog";
import type { ImageObject, VideoObject } from "./types";

interface DharmguruPostsTabProps {
	isEditing: boolean;
	postImages: ImageObject[];
	postVideos: VideoObject[];
	isUploadingPostImage?: boolean;
	handlePostImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleRemovePostImage?: (img: ImageObject) => void;
	isUploadingPostVideo?: boolean;
	handlePostVideoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleRemovePostVideo?: (vid: VideoObject) => void;
	isSavingPosts?: boolean;
	handleSavePosts?: () => void;
	userId: string;
	// Optional handlers for editing title/description
	handleImageTitleChange?: (img: ImageObject, title: string) => void;
	handleImageDescriptionChange?: (
		img: ImageObject,
		description: string
	) => void;
	handleVideoTitleChange?: (vid: VideoObject, title: string) => void;
	handleVideoDescriptionChange?: (
		vid: VideoObject,
		description: string
	) => void;
	// New prop for immediate UI update
	onImageAdded?: (img: ImageObject) => void;
	onVideoAdded?: (vid: VideoObject) => void;
}

const DharmguruPostsTab = memo(function DharmguruPostsTab({
	isEditing,
	postImages,
	postVideos,
	isUploadingPostImage,
	handlePostImageUpload,
	handleRemovePostImage,
	isUploadingPostVideo,
	handlePostVideoUpload,
	handleRemovePostVideo,
	isSavingPosts,
	handleSavePosts,
	userId,
	handleImageTitleChange,
	handleImageDescriptionChange,
	handleVideoTitleChange,
	handleVideoDescriptionChange,
	onImageAdded,
	onVideoAdded,
}: DharmguruPostsTabProps) {
	const [showImageUpload, setShowImageUpload] = useState(false);
	const [showVideoUpload, setShowVideoUpload] = useState(false);
	const [imageDetailsOpen, setImageDetailsOpen] = useState<
		Record<string, boolean>
	>({});
	const [videoDetailsOpen, setVideoDetailsOpen] = useState<
		Record<string, boolean>
	>({});
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [tempUploadedImageUrl, setTempUploadedImageUrl] = useState("");
	const [isVideoDetailsDialogOpen, setIsVideoDetailsDialogOpen] =
		useState(false);
	const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
	const [tempUploadedVideoUrl, setTempUploadedVideoUrl] = useState("");

	const prevImageUrls = useRef<string[]>(postImages.map((img) => img.url));
	const prevVideoUrls = useRef<string[]>(postVideos.map((vid) => vid.url));
	const getUrls = (arr: Array<{ url: string }>) => arr.map((x) => x.url);

	useEffect(() => {
		const currentUrls = getUrls(postImages);
		const prevUrls = prevImageUrls.current;
		const newUrls = currentUrls.filter((url) => !prevUrls.includes(url));
		if (newUrls.length > 0) {
			setImageDetailsOpen((prev) => {
				const updates: Record<string, boolean> = {};
				newUrls.forEach((url) => {
					updates[url] = true;
				});
				return { ...prev, ...updates };
			});
		}
		prevImageUrls.current = currentUrls;
	}, [postImages]);

	useEffect(() => {
		const currentUrls = getUrls(postVideos);
		const prevUrls = prevVideoUrls.current;
		const newUrls = currentUrls.filter((url) => !prevUrls.includes(url));
		if (newUrls.length > 0) {
			setVideoDetailsOpen((prev) => {
				const updates: Record<string, boolean> = {};
				newUrls.forEach((url) => {
					updates[url] = true;
				});
				return { ...prev, ...updates };
			});
		}
		prevVideoUrls.current = currentUrls;
	}, [postVideos]);

	useEffect(() => {
		if (postImages.length === 0) setImageDetailsOpen({});
	}, [postImages.length]);
	useEffect(() => {
		if (postVideos.length === 0) setVideoDetailsOpen({});
	}, [postVideos.length]);

	const toggleImageDetails = useCallback((url: string) => {
		setImageDetailsOpen((prev) => ({ ...prev, [url]: !prev[url] }));
	}, []);
	const toggleVideoDetails = useCallback((url: string) => {
		setVideoDetailsOpen((prev) => ({ ...prev, [url]: !prev[url] }));
	}, []);

	const handleInitialImageSelection = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			const files = event.target.files;
			if (!files || files.length === 0) return;

			if (files.length === 1) {
				const file = files[0];
				const tempUrl = URL.createObjectURL(file);
				setPendingFile(file);
				setTempUploadedImageUrl(tempUrl);
				setIsDetailsDialogOpen(true);
			} else if (handlePostImageUpload) {
				handlePostImageUpload(event);
			}
		},
		[handlePostImageUpload]
	);

	const handleDetailsConfirm = useCallback(
		async (title: string, description: string) => {
			setIsDetailsDialogOpen(false);
			if (!pendingFile || !handlePostImageUpload) return;
			let imageUrl = "";
			try {
				const formData = new FormData();
				formData.append("file", pendingFile);
				formData.append("userId", userId);
				const uploadRes = await fetch("/api/upload/profile-image", {
					method: "POST",
					body: formData,
				});
				if (!uploadRes.ok) throw new Error("Failed to upload image");
				const uploadData = await uploadRes.json();
				imageUrl = uploadData.imageUrl;
				const createRes = await fetch("/api/images", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ url: imageUrl, userId, title, description }),
				});
				if (!createRes.ok) throw new Error("Failed to save image metadata");
				const image = await createRes.json();
				// Notify parent to update state immediately
				if (typeof onImageAdded === "function") {
					onImageAdded(image);
				}
			} catch (err) {
				// Optionally show error toast
			}
			setPendingFile(null);
			if (tempUploadedImageUrl) {
				URL.revokeObjectURL(tempUploadedImageUrl);
				setTempUploadedImageUrl("");
			}
		},
		[
			pendingFile,
			tempUploadedImageUrl,
			userId,
			handlePostImageUpload,
			onImageAdded,
		]
	);

	const handleInitialVideoSelection = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (!files || files.length === 0) return;
			const file = files[0];
			const tempUrl = URL.createObjectURL(file);
			setPendingVideoFile(file);
			setTempUploadedVideoUrl(tempUrl);
			setIsVideoDetailsDialogOpen(true);
		},
		[]
	);

	const handleVideoDetailsConfirm = useCallback(
		async (title: string, description: string) => {
			setIsVideoDetailsDialogOpen(false);
			if (!pendingVideoFile || !handlePostVideoUpload) return;
			let videoUrl = "";
			try {
				const formData = new FormData();
				formData.append("file", pendingVideoFile);
				formData.append("userId", userId);
				const uploadRes = await fetch("/api/upload/video", {
					method: "POST",
					body: formData,
				});
				if (!uploadRes.ok) throw new Error("Failed to upload video");
				const uploadData = await uploadRes.json();
				videoUrl = uploadData.videoUrl;
				const createRes = await fetch("/api/videos", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ url: videoUrl, userId, title, description }),
				});
				if (!createRes.ok) throw new Error("Failed to save video metadata");
				const video = await createRes.json();
				// Notify parent to update state immediately
				if (typeof onVideoAdded === "function") {
					onVideoAdded(video);
				}
			} catch (err) {
				// Optionally show error toast
			}
			setPendingVideoFile(null);
			if (tempUploadedVideoUrl) {
				URL.revokeObjectURL(tempUploadedVideoUrl);
				setTempUploadedVideoUrl("");
			}
		},
		[
			pendingVideoFile,
			tempUploadedVideoUrl,
			userId,
			handlePostVideoUpload,
			onVideoAdded,
		]
	);

	return (
		<>
			<Card>
				<CardHeader className="pb-3 border-b">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Media Gallery</CardTitle>
							<CardDescription>
								Add and manage your media content
							</CardDescription>
						</div>
						<div
							className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200 ${
								isEditing
									? "bg-blue-100 text-blue-800 opacity-100"
									: "opacity-0"
							}`}
							style={{
								minWidth: 90,
								minHeight: 24,
								visibility: isEditing ? "visible" : "hidden",
							}}
						>
							Editing Mode
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Images Section */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="font-medium text-lg">Images</h3>
								<p className="text-sm text-muted-foreground">
									Manage your gallery images
								</p>
							</div>
							<div
								style={{
									minWidth: 120,
									minHeight: 36,
									display: "flex",
									alignItems: "center",
									justifyContent: "flex-end",
								}}
							>
								<Button
									type="button"
									variant={showImageUpload ? "default" : "outline"}
									size="sm"
									onClick={() => setShowImageUpload((v) => !v)}
									className={`gap-1 transition-all duration-200 ${
										isEditing ? "" : "opacity-0 pointer-events-none"
									}`}
									style={{
										visibility: isEditing ? "visible" : "hidden",
									}}
								>
									{showImageUpload ? (
										<>Hide Upload</>
									) : (
										<>
											<Plus className="h-4 w-4" /> Add Images
										</>
									)}
								</Button>
							</div>
						</div>
						{isEditing && showImageUpload && (
							<div className="space-y-3 mb-4">
								<div className="bg-muted/50 p-4 rounded-lg border border-dashed">
									<div className="text-center mb-2">
										<p className="text-sm text-muted-foreground mb-1">
											Drag images here or click to browse
										</p>
										<p className="text-xs text-muted-foreground">
											Support JPG, PNG, WEBP up to 5MB
										</p>
									</div>
									<label className="w-full h-24 flex flex-col items-center justify-center rounded-md cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
										<Plus className="h-6 w-6 text-primary/60 mb-1" />
										<span className="text-sm font-medium text-primary/80">
											Select Images
										</span>
										<input
											type="file"
											accept="image/*"
											multiple
											className="hidden"
											onChange={
												isEditing ? handleInitialImageSelection : undefined
											}
											disabled={isUploadingPostImage}
										/>
									</label>
								</div>
								{isUploadingPostImage && (
									<div className="flex items-center space-x-2 bg-blue-50 text-blue-700 p-2 rounded">
										<svg
											className="animate-spin h-4 w-4"
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
										<p className="text-sm">Uploading image(s)...</p>
									</div>
								)}
							</div>
						)}
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-3">
							{postImages.map((img, idx) => {
								const imgKey = img.url;
								return (
									<div
										key={imgKey}
										className="relative rounded-lg border shadow-sm overflow-hidden bg-white flex flex-col"
									>
										<div className="relative aspect-square w-full">
											<Image
												src={img.url}
												alt={img.title || `Post Image ${idx + 1}`}
												fill
												sizes="(max-width: 768px) 100vw, 300px"
												style={{ objectFit: "cover" }}
												className="object-cover w-full h-full"
											/>
											{isEditing && handleRemovePostImage && (
												<Button
													type="button"
													variant="destructive"
													size="icon"
													onClick={() => handleRemovePostImage(img)}
													className="absolute top-2 right-2"
												>
													<Trash2 className="h-2 w-2" />
												</Button>
											)}
										</div>
										{isEditing ? (
											<div className="p-3 space-y-2 bg-white">
												<Button
													onClick={() => toggleImageDetails(imgKey)}
													variant="outline"
													size="sm"
													className="mb-2 flex items-center gap-1"
												>
													{imageDetailsOpen[imgKey]
														? "Hide Details"
														: "Add Details"}
													<span
														className={`transition-transform ${
															imageDetailsOpen[imgKey]
																? "rotate-90"
																: "rotate-0"
														}`}
													>
														&#9654;
													</span>
												</Button>
												{imageDetailsOpen[imgKey] && (
													<>
														<div>
															<label className="text-xs font-medium text-gray-700 mb-1 block">
																Title
															</label>
															<input
																type="text"
																placeholder="Add a title..."
																value={img.title || ""}
																onChange={(e) =>
																	handleImageTitleChange?.(img, e.target.value)
																}
																className="w-full text-sm p-1.5 border rounded focus:ring-1 focus:ring-primary focus:border-primary"
															/>
														</div>
														<div>
															<label className="text-xs font-medium text-gray-700 mb-1 block">
																Description
															</label>
															<textarea
																placeholder="Add a description..."
																value={img.description || ""}
																onChange={(e) =>
																	handleImageDescriptionChange?.(
																		img,
																		e.target.value
																	)
																}
																className="w-full text-sm p-1.5 border rounded focus:ring-1 focus:ring-primary focus:border-primary resize-none"
																rows={2}
															/>
														</div>
													</>
												)}
											</div>
										) : (
											<div className="p-3 space-y-1 bg-white">
												{img.title && (
													<h4 className="font-medium text-sm truncate">
														{img.title}
													</h4>
												)}
												{img.description && (
													<p className="text-xs text-gray-500 line-clamp-2">
														{img.description}
													</p>
												)}
												{!img.title && !img.description && (
													<p className="text-xs text-gray-500">
														Image {idx + 1}
													</p>
												)}
											</div>
										)}
									</div>
								);
							})}
							{!isEditing && postImages.length === 0 && (
								<div className="col-span-full flex items-center justify-center h-32 bg-muted/30 rounded-lg border border-dashed">
									<p className="text-sm text-muted-foreground">
										No images added yet.
									</p>
								</div>
							)}
							{isEditing && postImages.length === 0 && !showImageUpload && (
								<div className="col-span-full flex flex-col items-center justify-center h-32 bg-muted/30 rounded-lg border border-dashed">
									<p className="text-sm text-muted-foreground mb-2">
										No images added yet
									</p>
									<Button
										size="sm"
										variant="outline"
										onClick={() => setShowImageUpload(true)}
										className="gap-1"
									>
										<Plus className="h-4 w-4" /> Add Images
									</Button>
								</div>
							)}
						</div>
					</div>
					{/* Videos Section */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="font-medium text-lg">Videos</h3>
								<p className="text-sm text-muted-foreground">
									Manage your media videos
								</p>
							</div>
							<div
								style={{
									minWidth: 120,
									minHeight: 36,
									display: "flex",
									alignItems: "center",
									justifyContent: "flex-end",
								}}
							>
								<Button
									type="button"
									variant={showVideoUpload ? "default" : "outline"}
									size="sm"
									onClick={() => setShowVideoUpload((v) => !v)}
									className={`gap-1 transition-all duration-200 ${
										isEditing ? "" : "opacity-0 pointer-events-none"
									}`}
									style={{
										visibility: isEditing ? "visible" : "hidden",
									}}
								>
									{showVideoUpload ? (
										<>Hide Upload</>
									) : (
										<>
											<Plus className="h-4 w-4" /> Add Videos
										</>
									)}
								</Button>
							</div>
						</div>
						{isEditing && showVideoUpload && (
							<div className="space-y-3 mb-4">
								<div className="bg-muted/50 p-4 rounded-lg border border-dashed">
									<div className="text-center mb-2">
										<p className="text-sm text-muted-foreground mb-1">
											Select videos to upload
										</p>
										<p className="text-xs text-muted-foreground">
											Support MP4, WEBM, OGG formats
										</p>
									</div>
									<label className="w-full h-24 flex flex-col items-center justify-center rounded-md cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
										<Plus className="h-6 w-6 text-primary/60 mb-1" />
										<span className="text-sm font-medium text-primary/80">
											Select Videos
										</span>
										<input
											type="file"
											accept="video/mp4,video/webm,video/ogg"
											multiple
											className="hidden"
											onChange={
												isEditing ? handleInitialVideoSelection : undefined
											}
											disabled={isUploadingPostVideo}
										/>
									</label>
								</div>
								{isUploadingPostVideo && (
									<div className="flex items-center space-x-2 bg-blue-50 text-blue-700 p-2 rounded">
										<svg
											className="animate-spin h-4 w-4"
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
										<p className="text-sm">Uploading video(s)...</p>
									</div>
								)}
							</div>
						)}
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
							{postVideos.map((vid, idx) => {
								const vidKey = vid.id || vid.url + "-" + idx;
								return (
									<div
										key={vidKey}
										className="relative rounded-lg border shadow-sm overflow-hidden bg-white flex flex-col"
									>
										<div className="relative aspect-video w-full">
											<video
												src={vid.url || vid.videoUrl}
												controls
												className="w-full h-full rounded-t-lg"
											/>
											{isEditing && handleRemovePostVideo && (
												<Button
													type="button"
													variant="destructive"
													size="icon"
													onClick={() => handleRemovePostVideo(vid)}
													className="absolute top-2 right-2"
												>
													<Trash2 className="h-2 w-2" />
												</Button>
											)}
										</div>
										{isEditing ? (
											<div className="p-3 space-y-2 bg-white">
												<Button
													onClick={() => toggleVideoDetails(vidKey)}
													variant="outline"
													size="sm"
													className="mb-2 flex items-center gap-1"
												>
													{videoDetailsOpen[vidKey]
														? "Hide Details"
														: "Add Details"}
													<span
														className={`transition-transform ${
															videoDetailsOpen[vidKey]
																? "rotate-90"
																: "rotate-0"
														}`}
													>
														&#9654;
													</span>
												</Button>
												{videoDetailsOpen[vidKey] && (
													<>
														<div>
															<label className="text-xs font-medium text-gray-700 mb-1 block">
																Title
															</label>
															<input
																type="text"
																placeholder="Add a title..."
																value={vid.title || ""}
																onChange={(e) =>
																	handleVideoTitleChange?.(vid, e.target.value)
																}
																className="w-full text-sm p-1.5 border rounded focus:ring-1 focus:ring-primary focus:border-primary"
															/>
														</div>
														<div>
															<label className="text-xs font-medium text-gray-700 mb-1 block">
																Description
															</label>
															<textarea
																placeholder="Add a description..."
																value={vid.description || ""}
																onChange={(e) =>
																	handleVideoDescriptionChange?.(
																		vid,
																		e.target.value
																	)
																}
																className="w-full text-sm p-1.5 border rounded focus:ring-1 focus:ring-primary focus:border-primary resize-none"
																rows={2}
															/>
														</div>
													</>
												)}
											</div>
										) : (
											<div className="p-3 space-y-1 bg-white">
												{vid.title && (
													<h4 className="font-medium text-sm truncate">
														{vid.title}
													</h4>
												)}
												{vid.description && (
													<p className="text-xs text-gray-500 line-clamp-2">
														{vid.description}
													</p>
												)}
												{!vid.title && !vid.description && (
													<p className="text-xs text-gray-500 truncate">
														Video {idx + 1}
													</p>
												)}
											</div>
										)}
									</div>
								);
							})}
							{!isEditing && postVideos.length === 0 && (
								<div className="col-span-full flex items-center justify-center h-32 bg-muted/30 rounded-lg border border-dashed">
									<p className="text-sm text-muted-foreground">
										No videos added yet.
									</p>
								</div>
							)}
							{isEditing && postVideos.length === 0 && !showVideoUpload && (
								<div className="col-span-full flex flex-col items-center justify-center h-32 bg-muted/30 rounded-lg border border-dashed">
									<p className="text-sm text-muted-foreground mb-2">
										No videos added yet
									</p>
									<Button
										size="sm"
										variant="outline"
										onClick={() => setShowVideoUpload(true)}
										className="gap-1"
									>
										<Plus className="h-4 w-4" /> Add Videos
									</Button>
								</div>
							)}
						</div>
					</div>
					{/* Save Changes Button */}
					{isEditing && (
						<div className="pt-6 flex justify-end border-t">
							<Button
								onClick={handleSavePosts}
								disabled={isSavingPosts}
								size="lg"
								className="gap-2"
							>
								{isSavingPosts ? (
									<>
										<svg
											className="animate-spin h-4 w-4"
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
										Saving Changes...
									</>
								) : (
									<>
										<Save className="h-4 w-4" /> Save All Changes
									</>
								)}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
			<ImageDetailsDialog
				isOpen={isDetailsDialogOpen}
				onClose={() => {
					setIsDetailsDialogOpen(false);
					setPendingFile(null);
					if (tempUploadedImageUrl) {
						URL.revokeObjectURL(tempUploadedImageUrl);
						setTempUploadedImageUrl("");
					}
				}}
				onConfirm={handleDetailsConfirm}
				imageUrl={tempUploadedImageUrl}
			/>
			<VideoDetailsDialog
				isOpen={isVideoDetailsDialogOpen}
				onClose={() => {
					setIsVideoDetailsDialogOpen(false);
					setPendingVideoFile(null);
					if (tempUploadedVideoUrl) {
						URL.revokeObjectURL(tempUploadedVideoUrl);
						setTempUploadedVideoUrl("");
					}
				}}
				onConfirm={handleVideoDetailsConfirm}
				videoUrl={tempUploadedVideoUrl}
			/>
		</>
	);
});

export default DharmguruPostsTab;
