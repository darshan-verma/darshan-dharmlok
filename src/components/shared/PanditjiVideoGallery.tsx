"use client";

import { useEffect, useState, useCallback } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	Loader2,
	Video as VideoIcon,
} from "lucide-react";

interface Video {
	id: string;
	title: string;
	videoFile: string;
	videoUrl?: string;
	description?: string;
}

interface PanditjiVideoGalleryProps {
	userId: string;
}

export default function PanditjiVideoGallery({
	userId,
}: PanditjiVideoGalleryProps) {
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchVideos = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			
			// Try fetching without source filter first to get all videos for this user
			const url = `/api/videos?userId=${userId}`;
			console.log("Fetching videos from:", url);
			
			const res = await fetch(url);
			if (!res.ok) {
				const errorText = await res.text();
				console.error("API error response:", errorText);
				throw new Error(`Failed to fetch videos: ${res.status} ${errorText}`);
			}
			const data = await res.json();
			
			console.log("Video API response:", data);
			// Handle both array and object with videos property
			const videosArray = Array.isArray(data) ? data : (data.videos || []);
			console.log("Videos array:", videosArray);
			
			if (!Array.isArray(videosArray)) {
				console.error("Videos is not an array:", videosArray);
				setVideos([]);
				return;
			}

			const videosWithUrl = videosArray.map((v: Video) => {
				const videoFile = v.videoFile || v.videoUrl || "";
				return {
					...v,
					videoFile,
				};
			});

			setVideos(videosWithUrl);
		} catch (err) {
			console.error("Error fetching videos:", err);
			setError(err instanceof Error ? err.message : "Failed to load videos");
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		fetchVideos();
	}, [fetchVideos]);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
				<p className="text-muted-foreground">Loading videos...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-12">
				<p className="text-red-500">{error}</p>
			</div>
		);
	}

	if (videos.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<div className="bg-muted/30 p-4 rounded-full mb-4">
					<VideoIcon className="h-8 w-8 text-muted-foreground" />
				</div>
				<p className="text-muted-foreground font-medium">
					No videos available at the moment.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{videos.map((video) => (
				<Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
					<div className="relative aspect-video bg-black">
						{video.videoFile ? (
							<video
								src={video.videoFile}
								controls
								className="w-full h-full object-cover"
								preload="metadata"
							>
								Your browser does not support the video tag.
							</video>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<VideoIcon className="h-12 w-12 text-white/50" />
							</div>
						)}
					</div>
					<CardHeader>
						<CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
						{video.description && (
							<CardDescription className="line-clamp-2 mt-2">
								{video.description}
							</CardDescription>
						)}
					</CardHeader>
				</Card>
			))}
		</div>
	);
}
