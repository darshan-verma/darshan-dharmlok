
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState, memo } from "react";
import ImageDetailsDialog from "./ImageDetailsDialog";
import VideoDetailsDialog from "./VideoDetailsDialog";

// Use a more stable state structure with URL keys

interface ImageObject {
	url: string;
	title?: string;
	description?: string;
}

interface VideoObject {
	url: string;
	title?: string;
	description?: string;
	id?: string;
}

interface KathavachakPostsTabProps {
	isEditing: boolean;
	postImages: ImageObject[];
	postVideos: VideoObject[];
	isUploadingPostImage: boolean;
	isUploadingPostVideo: boolean;
	handlePostImageUpload: (
		e: React.ChangeEvent<HTMLInputElement>
	) => Promise<ImageObject[]>;
	handleRemovePostImage: (img: ImageObject) => void;
	handlePostVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleRemovePostVideo: (vid: VideoObject) => void;
	isSavingPosts: boolean;
	handleSavePosts: () => void;
	showImageUpload: boolean;
	setShowImageUpload: React.Dispatch<React.SetStateAction<boolean>>;
	showVideoUpload: boolean;
	setShowVideoUpload: React.Dispatch<React.SetStateAction<boolean>>;
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
}

// Wrap the component with memo to prevent unnecessary re-renders
const KathavachakPostsTab = memo(function KathavachakPostsTab({
	isEditing,
	postImages,
	postVideos,
	isUploadingPostImage,
	isUploadingPostVideo,
	handlePostImageUpload,
	handleRemovePostImage,
	handlePostVideoUpload,
	handleRemovePostVideo,
	isSavingPosts,
	handleSavePosts,
	showImageUpload,
	setShowImageUpload,
	showVideoUpload,
	setShowVideoUpload,
	handleImageTitleChange,
	handleImageDescriptionChange,
	handleVideoTitleChange,
	handleVideoDescriptionChange,
}: KathavachakPostsTabProps) {
	// ----------- State -----------
	const [imageDetailsOpen, setImageDetailsOpen] = useState<Record<string, boolean>>({});
	const [videoDetailsOpen, setVideoDetailsOpen] = useState<Record<string, boolean>>({});
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [tempUploadedImageUrl, setTempUploadedImageUrl] = useState("");
	const [isVideoDetailsDialogOpen, setIsVideoDetailsDialogOpen] = useState(false);
	const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
	const [tempUploadedVideoUrl, setTempUploadedVideoUrl] = useState("");

	// ----------- Stable Refs for Previous Arrays -----------
	const prevImageUrls = useRef<string[]>(postImages.map((img) => img.url));
	const prevVideoUrls = useRef<string[]>(postVideos.map((vid) => vid.url));

	// ----------- Utility: Detect array changes in-place, NOT just ref change -----------
	const getUrls = (arr: Array<{ url: string }>) => arr.map((x) => x.url);

	// ----------- Effect: Open details for new images only (no flicker/reset) -----------
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

	// ----------- Effect: If arrays become empty, reset open states -----------
	useEffect(() => {
		if (postImages.length === 0) setImageDetailsOpen({});
	}, [postImages.length]);
	useEffect(() => {
		if (postVideos.length === 0) setVideoDetailsOpen({});
	}, [postVideos.length]);

	// ----------- Toggle handlers -----------
	const toggleImageDetails = useCallback((url: string) => {
		console.log("CallBack 1")
		setImageDetailsOpen((prev) => ({ ...prev, [url]: !prev[url] }));
	}, []);
	const toggleVideoDetails = useCallback((url: string) => {
		console.log("CallBack 2")
		setVideoDetailsOpen((prev) => ({ ...prev, [url]: !prev[url] }));
	}, []);

	// ----------- Image Upload Flow: Initial selection -----------
	const handleInitialImageSelection = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
		console.log("CallBack 3")
		const files = event.target.files;
		if (!files || files.length === 0) return;

		if (files.length === 1) {
			const file = files[0];
			const tempUrl = URL.createObjectURL(file);
			setPendingFile(file);
			setTempUploadedImageUrl(tempUrl);
			setIsDetailsDialogOpen(true);
		} else {
			const dataTransfer = new DataTransfer();
			for (let i = 0; i < files.length; i++) {
				dataTransfer.items.add(files[i]);
			}
			const uploadEvent = {
				target: {
					files: dataTransfer.files,
				},
			} as unknown as React.ChangeEvent<HTMLInputElement>;
			handlePostImageUpload(uploadEvent);
		}
	}, []);

	// ----------- Image Upload Flow: Dialog confirm -----------
	const handleDetailsConfirm = useCallback(async (title: string, description: string) => {
		console.log("CallBack 4")
		setIsDetailsDialogOpen(false);
		if (!pendingFile) return;
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(pendingFile);
		const event = {
			target: {
				files: dataTransfer.files,
			},
		} as unknown as React.ChangeEvent<HTMLInputElement>;

		try {
			const uploadedImages = await handlePostImageUpload(event);
			if (!uploadedImages || uploadedImages.length === 0) return;
			const uploadedImage = uploadedImages[0];
			if (title && handleImageTitleChange) handleImageTitleChange(uploadedImage, title);
			if (description && handleImageDescriptionChange) handleImageDescriptionChange(uploadedImage, description);
			setImageDetailsOpen((prev) => ({ ...prev, [uploadedImage.url]: true }));
		} catch (error) {
			console.error("Failed to handle image upload:", error);
		} finally {
			setPendingFile(null);
			if (tempUploadedImageUrl) {
				URL.revokeObjectURL(tempUploadedImageUrl);
				setTempUploadedImageUrl("");
			}
		}
	}, [pendingFile, tempUploadedImageUrl]);

	// ----------- Video Upload Flow: Initial selection -----------
	const handleInitialVideoSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		console.log("CallBack 5")
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		const tempUrl = URL.createObjectURL(file);
		setPendingVideoFile(file);
		setTempUploadedVideoUrl(tempUrl);
		setIsVideoDetailsDialogOpen(true);
	}, []);

	// ----------- Video Upload Flow: Dialog confirm -----------
	const handleVideoDetailsConfirm = useCallback(async (title: string, description: string) => {
		console.log("CallBack 6")
		setIsVideoDetailsDialogOpen(false);
		if (!pendingVideoFile) return;

		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(pendingVideoFile);
		const event = {
			target: {
				files: dataTransfer.files,
			},
		} as unknown as React.ChangeEvent<HTMLInputElement>;

		try {
			await handlePostVideoUpload(event);
			// Timeout to allow parent to update postVideos before accessing the last element
			setTimeout(() => {
				const updatedVideos = getUrls(postVideos);
				const lastUrl = updatedVideos[updatedVideos.length - 1];
				const lastVideo = postVideos.find((v) => v.url === lastUrl);
				if (lastVideo) {
					if (title && handleVideoTitleChange) handleVideoTitleChange(lastVideo, title);
					if (description && handleVideoDescriptionChange) handleVideoDescriptionChange(lastVideo, description);
					setVideoDetailsOpen((prev) => ({ ...prev, [lastVideo.url]: true }));
				}
			}, 0);
		} catch (error) {
			console.error("Failed to handle video upload:", error);
		} finally {
			setPendingVideoFile(null);
			if (tempUploadedVideoUrl) {
				URL.revokeObjectURL(tempUploadedVideoUrl);
				setTempUploadedVideoUrl("");
			}
		}
	}, [pendingVideoFile, tempUploadedVideoUrl, postVideos]);

	// ----------- UI -----------
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
								isEditing ? "bg-blue-100 text-blue-800 opacity-100" : "opacity-0"
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
									onClick={() => setShowImageUpload((v: boolean) => !v)}
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
							{postImages.map((img, idx: number) => {
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
											{isEditing && (
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
										<Plus className="h-4 w-4" />
										Add Images
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
									onClick={() => setShowVideoUpload((v: boolean) => !v)}
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
							{postVideos.map((vid, idx: number) => {
								const vidKey = vid.url;
								return (
									<div
										key={vidKey}
										className="relative rounded-lg border shadow-sm overflow-hidden bg-white flex flex-col"
									>
										<div className="relative aspect-video w-full">
											<video
												src={vid.url}
												controls
												className="object-cover w-full h-full"
											/>
											{isEditing && (
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
										<Plus className="h-4 w-4" />
										Add Videos
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
										<Save className="h-4 w-4" />
										Save All Changes
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

export default KathavachakPostsTab;