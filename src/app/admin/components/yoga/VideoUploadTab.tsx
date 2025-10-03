"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Upload, X, Play } from "lucide-react";
import { toast } from "@/lib/toast";

interface YogaImage {
	url: string;
	caption?: string;
	alt?: string;
	order: number;
}

interface Yoga {
	id: string;
	name: string;
	date: Date;
	description: string;
	status: string;
	images: YogaImage[];
	videos: string[];
	coverImage?: string;
	createdAt: Date;
	updatedAt: Date;
}

interface VideoUploadTabProps {
	yoga: Yoga;
	onUpdate: (videos: string[]) => void;
	onCancel?: () => void;
}

export default function VideoUploadTab({
	yoga,
	onUpdate,
	onCancel,
}: VideoUploadTabProps) {
	const [videos, setVideos] = useState<string[]>(yoga.videos || []);
	const [uploading, setUploading] = useState(false);

	const handleVideoUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		setUploading(true);
		try {
			const uploadPromises = Array.from(files).map(async (file) => {
				const formData = new FormData();
				formData.append("file", file);
				formData.append("type", "video");

				const response = await fetch("/api/upload/video", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					throw new Error("Upload failed");
				}

				const data = await response.json();
				return data.videoUrl || data.url;
			});

			const uploadedUrls = await Promise.all(uploadPromises);
			// Filter out any null or undefined URLs
			const validUrls = uploadedUrls.filter(
				(url) => url && typeof url === "string"
			);

			const newVideos = [...videos, ...validUrls];
			setVideos(newVideos);

			toast.success("Videos uploaded successfully");
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Failed to upload videos");
		} finally {
			setUploading(false);
		}
	};

	const handleRemoveVideo = (index: number) => {
		const newVideos = videos.filter((_, i) => i !== index);
		setVideos(newVideos);
	};

	const handleSave = () => {
		onUpdate(videos);
	};

	return (
		<div className="space-y-6">
			{/* Videos Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Play className="h-5 w-5" />
						Videos
					</CardTitle>
					<CardDescription>
						Upload and manage yoga session videos
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Upload Button */}
					<div>
						<Label htmlFor="video-upload" className="cursor-pointer">
							<div className="flex items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
								<Upload className="h-5 w-5" />
								<span>Upload Videos</span>
							</div>
						</Label>
						<Input
							id="video-upload"
							type="file"
							multiple
							accept="video/*"
							onChange={handleVideoUpload}
							className="hidden"
							disabled={uploading}
						/>
					</div>

					{/* Videos List */}
					{videos.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{videos.map((video, index) => (
								<div
									key={index}
									className="relative group border rounded-lg p-4"
								>
									<div className="flex items-center gap-3">
										<Play className="h-8 w-8 text-gray-400" />
										<div className="flex-1">
											<p className="text-sm font-medium">Video {index + 1}</p>
											<p className="text-xs text-gray-500 truncate">{video}</p>
										</div>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleRemoveVideo(index)}
											className="opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
									{/* Video Preview */}
									<div className="mt-3">
										<video
											src={video}
											controls
											className="w-full h-32 object-cover rounded-lg"
											preload="metadata"
										/>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-gray-500 text-center py-8">
							No videos uploaded yet. Click &quot;Upload Videos&quot; to add
							some.
						</p>
					)}

					{uploading && (
						<div className="text-center py-4">
							<p className="text-sm text-gray-500">Uploading videos...</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<div className="flex justify-end gap-2 pt-4">
				{onCancel && (
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button onClick={handleSave}>Save Changes</Button>
			</div>
		</div>
	);
}
