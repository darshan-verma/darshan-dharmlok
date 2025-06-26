"use client";
import { useState } from "react";
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

interface PostsTabProps {
	isEditing: boolean;
	postImages: string[];
	postVideos: string[];
	handlePostImageUpload: (
		event: React.ChangeEvent<HTMLInputElement>
	) => Promise<void>;
	handleRemovePostImage: (url: string) => void;
	isUploadingPostImage: boolean;
	handlePostVideoUpload: (
		event: React.ChangeEvent<HTMLInputElement>
	) => Promise<void>;
	handleRemovePostVideo: (url: string) => void;
	isUploadingPostVideo: boolean;
	handleSavePosts: (
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	) => Promise<void>;
	isSavingPosts: boolean;
}

export default function PostsTab({
	isEditing,
	postImages,
	postVideos,
	handlePostImageUpload,
	handleRemovePostImage,
	isUploadingPostImage,
	handlePostVideoUpload,
	handleRemovePostVideo,
	isUploadingPostVideo,
	handleSavePosts,
	isSavingPosts,
}: PostsTabProps) {
	const [showImageUpload, setShowImageUpload] = useState(false);
	const [showVideoUpload, setShowVideoUpload] = useState(false);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Panditji Posts</CardTitle>
				<CardDescription>
					Add and manage images and videos for posts.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Images Section */}
				<div>
					<div className="flex items-center justify-between mb-2">
						<h3 className="font-medium">Images</h3>
						{isEditing && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setShowImageUpload((v) => !v)}
							>
								{showImageUpload ? "Hide" : "Add Image"}
							</Button>
						)}
					</div>
					{isEditing && showImageUpload && (
						<div className="space-y-2 mb-2">
							<label className="w-32 h-20 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
								<Plus className="h-6 w-6 text-gray-400" />
								<span className="text-xs text-gray-500">Add Image</span>
								<input
									type="file"
									accept="image/*"
									multiple
									className="hidden"
									onChange={handlePostImageUpload}
									disabled={isUploadingPostImage}
								/>
							</label>
							{isUploadingPostImage && (
								<p className="text-xs text-blue-600">Uploading image(s)...</p>
							)}
						</div>
					)}
					<div className="flex flex-wrap gap-3 mt-2">
						{postImages.map((img, idx) => (
							<div
								key={img}
								className="relative w-32 h-20 rounded border overflow-hidden flex items-center justify-center bg-muted"
							>
								<Image
									src={img}
									alt={`Post Image ${idx + 1}`}
									fill
									sizes="128px"
									style={{ objectFit: "cover" }}
									className="object-cover w-full h-full"
								/>
								{isEditing && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => handleRemovePostImage(img)}
										className="absolute top-1 right-1 bg-white/80"
									>
										<Trash2 className="h-4 w-4 text-red-500" />
									</Button>
								)}
							</div>
						))}
						{!isEditing && postImages.length === 0 && (
							<p className="text-xs text-muted-foreground">No images added.</p>
						)}
					</div>
				</div>
				{/* Videos Section */}
				<div>
					<div className="flex items-center justify-between mb-2">
						<h3 className="font-medium">Videos</h3>
						{isEditing && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setShowVideoUpload((v) => !v)}
							>
								{showVideoUpload ? "Hide" : "Add Video"}
							</Button>
						)}
					</div>
					{isEditing && showVideoUpload && (
						<div className="space-y-2 mb-2">
							<label className="w-40 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
								<Plus className="h-6 w-6 text-gray-400" />
								<span className="text-xs text-gray-500">Add Video</span>
								<input
									type="file"
									accept="video/mp4,video/webm,video/ogg"
									multiple
									className="hidden"
									onChange={handlePostVideoUpload}
									disabled={isUploadingPostVideo}
								/>
							</label>
							{isUploadingPostVideo && (
								<p className="text-xs text-blue-600">Uploading video(s)...</p>
							)}
						</div>
					)}
					<div className="flex flex-wrap gap-3 mt-2">
						{postVideos.map((vid) => (
							<div
								key={vid}
								className="relative w-40 h-24 rounded border overflow-hidden flex items-center justify-center bg-muted"
							>
								<video
									src={vid}
									controls
									className="object-cover w-full h-full"
								/>
								{isEditing && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => handleRemovePostVideo(vid)}
										className="absolute top-1 right-1 bg-white/80"
									>
										<Trash2 className="h-4 w-4 text-red-500" />
									</Button>
								)}
							</div>
						))}
						{!isEditing && postVideos.length === 0 && (
							<p className="text-xs text-muted-foreground">No videos added.</p>
						)}
					</div>
				</div>
				{/* Save Posts Button */}
				{isEditing && (
					<div className="pt-4">
						<Button onClick={handleSavePosts} disabled={isSavingPosts}>
							{isSavingPosts ? (
								<>
									<Save className="h-4 w-4 mr-2 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Save className="h-4 w-4 mr-2" />
									Save Posts
								</>
							)}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
