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
	handlePostImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

export default function KathavachakPostsTab({
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
	return (
		<Card>
			<CardHeader className="pb-3 border-b">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Media Gallery</CardTitle>
						<CardDescription>Add and manage your media content</CardDescription>
					</div>
					{isEditing && (
						<div className="rounded-full px-2.5 py-0.5 text-xs bg-blue-100 text-blue-800 font-medium">
							Editing Mode
						</div>
					)}
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
						{isEditing && (
							<Button
								type="button"
								variant={showImageUpload ? "default" : "outline"}
								size="sm"
								onClick={() => setShowImageUpload((v: boolean) => !v)}
								className="gap-1"
							>
								{showImageUpload ? (
									<>Hide Upload</>
								) : (
									<>
										<Plus className="h-4 w-4" /> Add Images
									</>
								)}
							</Button>
						)}
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
										onChange={handlePostImageUpload}
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
						{postImages.map((img, idx: number) => (
							<div
								key={typeof img === "string" ? img : img.url}
								className="relative rounded-lg border shadow-sm overflow-hidden bg-white flex flex-col group"
							>
								<div className="relative aspect-square w-full">
									<Image
										src={typeof img === "string" ? img : img.url}
										alt={
											typeof img === "string"
												? `Post Image ${idx + 1}`
												: img.title || `Post Image ${idx + 1}`
										}
										fill
										sizes="(max-width: 768px) 100vw, 300px"
										style={{ objectFit: "cover" }}
										className="object-cover w-full h-full transition-transform group-hover:scale-105"
									/>
									{isEditing && (
										<Button
											type="button"
											variant="destructive"
											size="icon"
											onClick={() => handleRemovePostImage(img)}
											className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>

								{isEditing && typeof img !== "string" ? (
									<div className="p-3 space-y-2 bg-white">
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
													handleImageDescriptionChange?.(img, e.target.value)
												}
												className="w-full text-sm p-1.5 border rounded focus:ring-1 focus:ring-primary focus:border-primary resize-none"
												rows={2}
											/>
										</div>
									</div>
								) : (
									<div className="p-3 space-y-1 bg-white">
										{typeof img !== "string" && img.title && (
											<h4 className="font-medium text-sm truncate">
												{img.title}
											</h4>
										)}
										{typeof img !== "string" && img.description && (
											<p className="text-xs text-gray-500 line-clamp-2">
												{img.description}
											</p>
										)}
										{typeof img === "string" && (
											<p className="text-xs text-gray-500">Image {idx + 1}</p>
										)}
									</div>
								)}
							</div>
						))}
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
				<div>
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="font-medium text-lg">Videos</h3>
							<p className="text-sm text-muted-foreground">
								Manage your media videos
							</p>
						</div>
						{isEditing && (
							<Button
								type="button"
								variant={showVideoUpload ? "default" : "outline"}
								size="sm"
								onClick={() => setShowVideoUpload((v: boolean) => !v)}
								className="gap-1"
							>
								{showVideoUpload ? (
									<>Hide Upload</>
								) : (
									<>
										<Plus className="h-4 w-4" /> Add Videos
									</>
								)}
							</Button>
						)}
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
										onChange={handlePostVideoUpload}
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
						{postVideos.map((vid, idx: number) => (
							<div
								key={typeof vid === "string" ? vid : vid.url}
								className="relative rounded-lg border shadow-sm overflow-hidden bg-white flex flex-col group"
							>
								<div className="relative aspect-video w-full">
									<video
										src={typeof vid === "string" ? vid : vid.url}
										controls
										className="object-cover w-full h-full"
									/>
									{isEditing && (
										<Button
											type="button"
											variant="destructive"
											size="icon"
											onClick={() => handleRemovePostVideo(vid)}
											className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>

								{isEditing && typeof vid !== "string" ? (
									<div className="p-3 space-y-2 bg-white">
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
													handleVideoDescriptionChange?.(vid, e.target.value)
												}
												className="w-full text-sm p-1.5 border rounded focus:ring-1 focus:ring-primary focus:border-primary resize-none"
												rows={2}
											/>
										</div>
									</div>
								) : (
									<div className="p-3 space-y-1 bg-white">
										{typeof vid !== "string" && vid.title && (
											<h4 className="font-medium text-sm truncate">
												{vid.title}
											</h4>
										)}
										{typeof vid !== "string" && vid.description && (
											<p className="text-xs text-gray-500 line-clamp-2">
												{vid.description}
											</p>
										)}
										{typeof vid === "string" && (
											<p className="text-xs text-gray-500 truncate">
												Video {idx + 1}
											</p>
										)}
									</div>
								)}
							</div>
						))}
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
	);
}
