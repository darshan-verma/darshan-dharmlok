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
import { useCallback, useEffect, useRef, useState, memo, useMemo } from "react";
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

// Component wrapped with memo to prevent unnecessary re-renders
const KathavachakPostsTabInner = function KathavachakPostsTabInner({
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
	// --- Refactored state for details open ---
	// Use lazy state initialization to prevent re-renders
	const [imageDetailsOpen, setImageDetailsOpen] = useState<
		Record<string, boolean>
	>(() => ({}));
	const [videoDetailsOpen, setVideoDetailsOpen] = useState<
		Record<string, boolean>
	>(() => ({}));

	// Dialog state (remains local)
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [tempUploadedImageUrl, setTempUploadedImageUrl] = useState("");

	// --- Dialog state for video details ---
	const [isVideoDetailsDialogOpen, setIsVideoDetailsDialogOpen] =
		useState(false);
	const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
	const [tempUploadedVideoUrl, setTempUploadedVideoUrl] = useState("");

	// Use useMemo for derived values to prevent unnecessary recalculations
	const imageUrlsHash = useMemo(
		() =>
			postImages
				.map((img) => (typeof img === "string" ? img : img.url))
				.join("|"),
		[postImages]
	);

	const videoUrlsHash = useMemo(
		() =>
			postVideos
				.map((vid) => (typeof vid === "string" ? vid : vid.url))
				.join("|"),
		[postVideos]
	);

	// Store previous values in refs to detect real changes
	const prevImageUrlsHash = useRef(imageUrlsHash);
	const prevVideoUrlsHash = useRef(videoUrlsHash);
	const isFirstRenderRef = useRef(true);
	const prevTabActiveRef = useRef(true); // Track when component becomes visible/active

	// Only reset open state if the parent truly resets the array (e.g., after save)
	useEffect(() => {
		// Skip first render
		if (isFirstRenderRef.current) {
			isFirstRenderRef.current = false;
			prevImageUrlsHash.current = imageUrlsHash;
			return;
		}

		if (
			imageUrlsHash !== prevImageUrlsHash.current &&
			postImages.length === 0
		) {
			setImageDetailsOpen({});
		}
		prevImageUrlsHash.current = imageUrlsHash;
	}, [imageUrlsHash, postImages.length]);

	useEffect(() => {
		// Skip first render
		if (isFirstRenderRef.current) {
			return;
		}

		if (
			videoUrlsHash !== prevVideoUrlsHash.current &&
			postVideos.length === 0
		) {
			setVideoDetailsOpen({});
		}
		prevVideoUrlsHash.current = videoUrlsHash;
	}, [videoUrlsHash, postVideos.length]);

	// Track previous URLs to detect truly new images/videos
	const prevImageUrls = useRef<string[]>(
		postImages.map((img) => (typeof img === "string" ? img : img.url))
	);
	const prevVideoUrls = useRef<string[]>(
		postVideos.map((vid) => (typeof vid === "string" ? vid : vid.url))
	);

	// Auto-open details for new images (with stable deps)
	useEffect(() => {
		// Skip first render
		if (isFirstRenderRef.current) {
			return;
		}

		const currentUrls = postImages.map((img) =>
			typeof img === "string" ? img : img.url
		);
		const prevSet = new Set(prevImageUrls.current);
		const newUrls = currentUrls.filter((url) => !prevSet.has(url));

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
	}, [imageUrlsHash]);

	// Auto-open details for new videos (with stable deps)
	useEffect(() => {
		// Skip first render
		if (isFirstRenderRef.current) {
			return;
		}

		const currentUrls = postVideos.map((vid) =>
			typeof vid === "string" ? vid : vid.url
		);
		const prevSet = new Set(prevVideoUrls.current);
		const newUrls = currentUrls.filter((url) => !prevSet.has(url));

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
	}, [videoUrlsHash]);

	// Memoize toggle handlers to prevent unnecessary function recreation
	const toggleImageDetails = useCallback((key: string) => {
		setImageDetailsOpen((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	}, []);

	const toggleVideoDetails = useCallback((key: string) => {
		setVideoDetailsOpen((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	}, []);

	// Handle confirmation from the details dialog
	const handleDetailsConfirm = useCallback(
		async (title: string, description: string) => {
			// Close the dialog
			setIsDetailsDialogOpen(false);

			if (!pendingFile) return;

			// Create a new event with the file
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(pendingFile);

			const event = {
				target: {
					files: dataTransfer.files,
				},
			} as unknown as React.ChangeEvent<HTMLInputElement>;

			try {
				// Call the parent's image upload handler and get the uploaded images
				const uploadedImages = await handlePostImageUpload(event);

				// If no images were uploaded, return early
				if (!uploadedImages || uploadedImages.length === 0) return;

				// Get the uploaded image
				const uploadedImage = uploadedImages[0];

				// Update title and description if provided
				if (title || description) {
					// Update the image metadata
					if (title && handleImageTitleChange) {
						handleImageTitleChange(uploadedImage, title);
					}

					if (description && handleImageDescriptionChange) {
						handleImageDescriptionChange(uploadedImage, description);
					}

					// Make sure the details panel is open for this image
					setImageDetailsOpen((prev) => ({
						...prev,
						[uploadedImage.url]: true,
					}));
				}
			} catch (error) {
				console.error("Failed to handle image upload:", error);
			} finally {
				// Clean up
				setPendingFile(null);
				if (tempUploadedImageUrl) {
					URL.revokeObjectURL(tempUploadedImageUrl);
					setTempUploadedImageUrl("");
				}
			}
		},
		[
			pendingFile,
			tempUploadedImageUrl,
			handlePostImageUpload,
			handleImageTitleChange,
			handleImageDescriptionChange,
		]
	);

	// Handle initial video selection with useCallback
	const handleInitialVideoSelection = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (!files || files.length === 0) return;

			// Only support one video at a time for dialog flow
			const file = files[0];
			const tempUrl = URL.createObjectURL(file);
			setPendingVideoFile(file);
			setTempUploadedVideoUrl(tempUrl);
			setIsVideoDetailsDialogOpen(true);
			// Do not upload yet, wait for dialog confirm
		},
		[]
	);

	// Handle confirmation from the video details dialog
	const handleVideoDetailsConfirm = useCallback(
		async (title: string, description: string) => {
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
				// After upload, update the title/description for the new video
				// Find the last video (just uploaded)
				const lastVideo = postVideos[postVideos.length - 1];
				if (lastVideo && typeof lastVideo !== "string") {
					if (title && handleVideoTitleChange)
						handleVideoTitleChange(lastVideo, title);
					if (description && handleVideoDescriptionChange)
						handleVideoDescriptionChange(lastVideo, description);
					setVideoDetailsOpen((prev) => ({ ...prev, [lastVideo.url]: true }));
				}
			} catch (error) {
				console.error("Failed to handle video upload:", error);
			} finally {
				setPendingVideoFile(null);
				if (tempUploadedVideoUrl) {
					URL.revokeObjectURL(tempUploadedVideoUrl);
					setTempUploadedVideoUrl("");
				}
			}
		},
		[
			pendingVideoFile,
			tempUploadedVideoUrl,
			handlePostVideoUpload,
			postVideos,
			handleVideoTitleChange,
			handleVideoDescriptionChange,
		]
	);

	// Handle initial image selection with useCallback
	const handleInitialImageSelection = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			const files = event.target.files;
			if (!files || files.length === 0) return;

			// If only one file, open the details dialog for it
			if (files.length === 1) {
				const file = files[0];
				const tempUrl = URL.createObjectURL(file);
				setPendingFile(file);
				setTempUploadedImageUrl(tempUrl);
				setIsDetailsDialogOpen(true);
				// Do not upload yet, wait for dialog confirm
				return;
			}

			// For multiple files, upload directly (no details dialog)
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
		},
		[handlePostImageUpload]
	);

	// Detect when the tab becomes visible again
	useEffect(() => {
		// This effect will run when the component mounts or updates
		prevTabActiveRef.current = true;
		return () => {
			// And this will run when the component unmounts or before it updates
			prevTabActiveRef.current = false;
		};
	});

	// Memoize the image and video galleries to prevent unnecessary re-renders
	const imageGallery = useMemo(
		() => (
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{postImages.map((image, index) => {
					const imageUrl = typeof image === "string" ? image : image.url;
					const imageTitle = typeof image === "string" ? "" : image.title || "";
					const imageDescription =
						typeof image === "string" ? "" : image.description || "";
					const isOpen = imageDetailsOpen[imageUrl] || false;

					return (
						<div
							key={imageUrl}
							className="group relative rounded-lg overflow-hidden border bg-card transition-all duration-200 hover:shadow-md"
						>
							<div className="aspect-square relative">
								{isEditing && (
									<button
										type="button"
										onClick={() => handleRemovePostImage(image)}
										className="absolute top-2 right-2 z-10 rounded-full p-1.5 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-colors"
										aria-label="Remove image"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								)}
								<Image
									src={imageUrl}
									alt={imageTitle || "Gallery image"}
									fill
									className="object-cover transition-all"
									sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
								/>
							</div>
							{isEditing && (
								<div className="p-3 bg-card">
									<button
										type="button"
										onClick={() => toggleImageDetails(imageUrl)}
										className="flex justify-between items-center w-full text-sm font-medium"
									>
										<span>{isOpen ? "Hide details" : "Add/edit details"}</span>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="20"
											height="20"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											className={`transform transition-transform ${
												isOpen ? "rotate-180" : "rotate-0"
											}`}
										>
											<polyline points="6 9 12 15 18 9"></polyline>
										</svg>
									</button>
									<div
										className={`overflow-hidden transition-all duration-200 ${
											isOpen ? "max-h-72 opacity-100 mt-3" : "max-h-0 opacity-0"
										}`}
									>
										<div className="space-y-3">
											<div>
												<label
													htmlFor={`image-title-${index}`}
													className="text-xs font-medium text-muted-foreground mb-1 block"
												>
													Title
												</label>
												<input
													id={`image-title-${index}`}
													type="text"
													placeholder="Add a title..."
													value={imageTitle}
													onChange={(e) =>
														handleImageTitleChange?.(image, e.target.value)
													}
													className="w-full text-sm p-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary"
												/>
											</div>
											<div>
												<label
													htmlFor={`image-desc-${index}`}
													className="text-xs font-medium text-muted-foreground mb-1 block"
												>
													Description
												</label>
												<textarea
													id={`image-desc-${index}`}
													placeholder="Add a description..."
													value={imageDescription}
													onChange={(e) =>
														handleImageDescriptionChange?.(
															image,
															e.target.value
														)
													}
													className="w-full text-sm p-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary resize-none"
													rows={3}
												/>
											</div>
										</div>
									</div>
								</div>
							)}
							{!isEditing && (imageTitle || imageDescription) && (
								<div className="p-3">
									{imageTitle && (
										<h3 className="font-medium line-clamp-1">{imageTitle}</h3>
									)}
									{imageDescription && (
										<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
											{imageDescription}
										</p>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		),
		[
			postImages,
			isEditing,
			imageDetailsOpen,
			toggleImageDetails,
			handleRemovePostImage,
			handleImageTitleChange,
			handleImageDescriptionChange,
		]
	);

	const videoGallery = useMemo(
		() => (
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
				{postVideos.map((video, index) => {
					const videoUrl = typeof video === "string" ? video : video.url;
					const videoTitle = typeof video === "string" ? "" : video.title || "";
					const videoDescription =
						typeof video === "string" ? "" : video.description || "";
					const isOpen = videoDetailsOpen[videoUrl] || false;

					return (
						<div
							key={videoUrl}
							className="group relative rounded-lg overflow-hidden border bg-card transition-all duration-200 hover:shadow-md"
						>
							<div className="aspect-video relative">
								{isEditing && (
									<button
										type="button"
										onClick={() => handleRemovePostVideo(video)}
										className="absolute top-2 right-2 z-10 rounded-full p-1.5 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-colors"
										aria-label="Remove video"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								)}
								<video
									src={videoUrl}
									controls
									className="absolute inset-0 w-full h-full object-cover"
								/>
							</div>
							{isEditing && (
								<div className="p-3 bg-card">
									<button
										type="button"
										onClick={() => toggleVideoDetails(videoUrl)}
										className="flex justify-between items-center w-full text-sm font-medium"
									>
										<span>{isOpen ? "Hide details" : "Add/edit details"}</span>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="20"
											height="20"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											className={`transform transition-transform ${
												isOpen ? "rotate-180" : "rotate-0"
											}`}
										>
											<polyline points="6 9 12 15 18 9"></polyline>
										</svg>
									</button>
									<div
										className={`overflow-hidden transition-all duration-200 ${
											isOpen ? "max-h-72 opacity-100 mt-3" : "max-h-0 opacity-0"
										}`}
									>
										<div className="space-y-3">
											<div>
												<label
													htmlFor={`video-title-${index}`}
													className="text-xs font-medium text-muted-foreground mb-1 block"
												>
													Title
												</label>
												<input
													id={`video-title-${index}`}
													type="text"
													placeholder="Add a title..."
													value={videoTitle}
													onChange={(e) =>
														handleVideoTitleChange?.(video, e.target.value)
													}
													className="w-full text-sm p-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary"
												/>
											</div>
											<div>
												<label
													htmlFor={`video-desc-${index}`}
													className="text-xs font-medium text-muted-foreground mb-1 block"
												>
													Description
												</label>
												<textarea
													id={`video-desc-${index}`}
													placeholder="Add a description..."
													value={videoDescription}
													onChange={(e) =>
														handleVideoDescriptionChange?.(
															video,
															e.target.value
														)
													}
													className="w-full text-sm p-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary resize-none"
													rows={3}
												/>
											</div>
										</div>
									</div>
								</div>
							)}
							{!isEditing && (videoTitle || videoDescription) && (
								<div className="p-3">
									{videoTitle && (
										<h3 className="font-medium line-clamp-1">{videoTitle}</h3>
									)}
									{videoDescription && (
										<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
											{videoDescription}
										</p>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		),
		[
			postVideos,
			isEditing,
			videoDetailsOpen,
			toggleVideoDetails,
			handleRemovePostVideo,
			handleVideoTitleChange,
			handleVideoDescriptionChange,
		]
	);

	// Render the component
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
						{/* Always render the badge, but hide it when not editing to prevent layout shift */}
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
					<div>
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="font-medium text-lg">Images</h3>
								<p className="text-sm text-muted-foreground">
									Manage your gallery images
								</p>
							</div>
							{/* Always render the button, but hide it when not editing to prevent layout shift */}
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
										<span>Uploading...</span>
									</div>
								)}
							</div>
						)}

						{/* Memoized Image Gallery */}
						{imageGallery}

						<div className="flex items-center justify-between mt-6 mb-4">
							<div>
								<h3 className="font-medium text-lg">Videos</h3>
								<p className="text-sm text-muted-foreground">
									Manage your gallery videos
								</p>
							</div>
							{/* Always render the button, but hide it when not editing to prevent layout shift */}
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
											Drag videos here or click to browse
										</p>
										<p className="text-xs text-muted-foreground">
											Support MP4, WebM up to 50MB
										</p>
									</div>
									<label className="w-full h-24 flex flex-col items-center justify-center rounded-md cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
										<Plus className="h-6 w-6 text-primary/60 mb-1" />
										<span className="text-sm font-medium text-primary/80">
											Select Videos
										</span>
										<input
											type="file"
											accept="video/*"
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
										<span>Uploading...</span>
									</div>
								)}
							</div>
						)}

						{/* Memoized Video Gallery */}
						{videoGallery}
					</div>

					{isEditing && (
						<div className="flex justify-end">
							<Button
								type="button"
								variant="default"
								onClick={handleSavePosts}
								disabled={isSavingPosts}
								className="gap-1.5"
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
};

// Use memo at export level for best performance
export default memo(KathavachakPostsTabInner);
