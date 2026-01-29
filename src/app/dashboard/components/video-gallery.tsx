"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from "@/components/ui/card";
import {
	Plus,
	Edit,
	Trash2,
	Save,
	X,
	Loader2,
	Video as VideoIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Video {
	id: string;
	title: string;
	videoFile: string;
	videoUrl?: string;
	description?: string;
}

interface UserProfile {
	id: string;
	name: string;
	category?: string;
	profileImageUrl?: string;
	videos?: Video[];
}

interface VideoGalleryProps {
	userId: string;
	editable?: boolean;
	source: string;
}

export default function VideoGallery({
	userId,
	editable = true,
	source,
}: VideoGalleryProps) {
	const [user, setUser] = useState<UserProfile | null>(null);
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [isAdding, setIsAdding] = useState(false);
	const [newVideo, setNewVideo] = useState<{
		title: string;
		description: string;
		file: File | null;
	}>({ title: "", description: "", file: null });

	const [editState, setEditState] = useState<{
		id: string;
		title: string;
		description: string;
		file: File | null;
	} | null>(null);

	const [isSaving, setIsSaving] = useState(false);

	const fetchVideos = useCallback(async () => {
		try {
			const url = source && source.trim() 
				? `/api/videos?userId=${userId}&source=${source}`
				: `/api/videos?userId=${userId}`;
			console.log("Fetching videos from:", url);
			console.log("Query params - userId:", userId, "source:", source);
			
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
				console.log(`Video ${v.id}: videoFile=${videoFile}, title=${v.title}`);
				return {
					...v,
					videoFile: videoFile,
				};
			});
			console.log("Processed videos:", videosWithUrl);
			setVideos(videosWithUrl);
		} catch (e) {
			console.error("Error fetching videos:", e);
			setError((e as Error).message);
		}
	}, [userId, source]);

	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			setError(null);

			try {
				// First fetch the user profile to get basic user info
				const userRes = await fetch(`/api/users/${userId}`);
				if (!userRes.ok) throw new Error("Failed to fetch user profile");
				const userData = await userRes.json();
				setUser(userData);

				// Then fetch videos from the video API
				await fetchVideos();
			} catch (e) {
				console.error("Error loading data:", e);
				setError((e as Error).message);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [userId, source, fetchVideos]);

	const handleAddVideo = async () => {
		if (!newVideo.title || !newVideo.file) return;
		setIsSaving(true);
		try {
			// Upload the video file first
			const formData = new FormData();
			formData.append("file", newVideo.file);
			formData.append("userId", userId);
			formData.append("source", source);
			const uploadRes = await fetch("/api/upload/video", {
				method: "POST",
				body: formData,
			});
			if (!uploadRes.ok) throw new Error("Failed to upload video file");
			const { video } = await uploadRes.json();

			// If the video record was already created during upload, use it
			if (video) {
				// If needed, update the title and description
				if (
					video.title !== newVideo.title ||
					video.description !== newVideo.description
				) {
					const updateRes = await fetch(`/api/videos/${video.id}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							title: newVideo.title,
							description: newVideo.description,
						}),
					});
					if (!updateRes.ok) {
						console.warn("Failed to update video title/description");
					}
				}
			}

			// Refetch videos from the API to ensure we have the latest data
			await fetchVideos();

			// Reset form
			setNewVideo({ title: "", description: "", file: null });
			setIsAdding(false);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setIsSaving(false);
		}
	};

	const handleSaveEdit = async () => {
		if (!editState) return;
		setIsSaving(true);
		try {
			let videoUrl: string | undefined = undefined;
			if (editState.file) {
				const formData = new FormData();
				formData.append("file", editState.file);
				formData.append("userId", userId);
				formData.append("source", source);
				const uploadRes = await fetch("/api/upload/video", {
					method: "POST",
					body: formData,
				});
				if (!uploadRes.ok) throw new Error("Failed to upload new video file");
				const data = await uploadRes.json();
				videoUrl = data.videoUrl;
			}

			// Update the video record
			const res = await fetch(`/api/videos/${editState.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: editState.title,
					description: editState.description,
					...(videoUrl && { videoFile: videoUrl }), // Use videoFile property name
				}),
			});
			if (!res.ok) throw new Error("Failed to update video");
			
			// Refetch videos to ensure we have the latest data
			await fetchVideos();
			setEditState(null);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteVideo = async (id: string) => {
		// To prevent accidental deletion, you might want a confirmation modal here
		setIsSaving(true);
		try {
			const res = await fetch(`/api/videos/${id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete video");
			
			// Refetch videos to ensure we have the latest data
			await fetchVideos();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setIsSaving(false);
		}
	};

	if (loading)
		return (
			<Card className="flex flex-col items-center justify-center p-12">
				<Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
			</Card>
		);

	if (error)
		return <div className="text-red-500 text-center mt-8">{error}</div>;
	if (!user) return null;

	return (
		<Card className="w-full rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-background">
			{editable && (
				<CardHeader className="flex flex-row items-center gap-6 p-4 border-b">
					<div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 shadow-md bg-white dark:bg-zinc-800 flex items-center justify-center">
						<Image
							src={user.profileImageUrl || "./placeholder-avatar.svg"}
							alt={user.name}
							width={64}
							height={64}
							className="object-cover w-full h-full"
						/>
					</div>
					<div className="flex flex-col justify-center flex-1 gap-1">
						<CardTitle className="text-xl font-bold text-left">
							{user.name}
						</CardTitle>
						{user.category && (
							<CardDescription className="text-sm text-muted-foreground text-left">
								{user.category}
							</CardDescription>
						)}
					</div>
					<Button
						size="sm"
						variant="default"
						className="rounded-full px-4 py-2"
						onClick={() => setIsAdding(!isAdding)}
					>
						<Plus className="h-4 w-4 mr-2" /> Add Video
					</Button>
				</CardHeader>
			)}
			<CardContent className="p-4">
				{isAdding && (
					<Card className="mb-6 border bg-muted/30 shadow-sm">
						<CardContent className="p-4 space-y-3">
							<Input
								placeholder="Video Title"
								value={newVideo.title}
								onChange={(e) =>
									setNewVideo((v) => ({ ...v, title: e.target.value }))
								}
								className="text-sm"
							/>
							<Input
								placeholder="Description (optional)"
								value={newVideo.description}
								onChange={(e) =>
									setNewVideo((v) => ({ ...v, description: e.target.value }))
								}
								className="text-sm"
							/>
							<Input
								type="file"
								accept="video/*"
								onChange={(e) =>
									setNewVideo((v) => ({
										...v,
										file: e.target.files?.[0] || null,
									}))
								}
								className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
							/>
							<div className="flex justify-end gap-2 mt-2">
								<Button
									variant="outline"
									onClick={() => setIsAdding(false)}
									className="rounded-full px-5 text-sm"
								>
									<X className="h-4 w-4 mr-2" /> Cancel
								</Button>
								<Button
									onClick={handleAddVideo}
									disabled={isSaving || !newVideo.file || !newVideo.title}
									className="rounded-full px-5 text-sm"
								>
									{isSaving ? (
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									) : (
										<Save className="h-4 w-4 mr-2" />
									)}
									Save Video
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					{videos.length > 0 ? (
						videos.map((video, idx) => (
							<Card
								key={video.id || idx}
								className="shadow-sm border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300"
							>
								{editState && editState.id === video.id ? (
									<div className="p-4 space-y-3">
										<Input
											value={editState.title}
											onChange={(e) =>
												setEditState((s) =>
													s ? { ...s, title: e.target.value } : null
												)
											}
											placeholder="Video Title"
											className="text-base font-medium"
										/>
										<Input
											value={editState.description}
											onChange={(e) =>
												setEditState((s) =>
													s ? { ...s, description: e.target.value } : null
												)
											}
											placeholder="Description (optional)"
											className="text-sm"
										/>
										<div className="pt-1">
											<Input
												type="file"
												accept="video/*"
												onChange={(e) =>
													setEditState((s) =>
														s
															? { ...s, file: e.target.files?.[0] || null }
															: null
													)
												}
												className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
											/>
										</div>
										<div className="flex gap-2 justify-end pt-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => setEditState(null)}
												className="rounded-full px-4"
											>
												<X className="h-4 w-4 mr-2" />
												Cancel
											</Button>
											<Button
												size="sm"
												onClick={handleSaveEdit}
												disabled={isSaving}
												className="rounded-full px-4"
											>
												{isSaving ? (
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												) : (
													<Save className="h-4 w-4 mr-2" />
												)}
												Save
											</Button>
										</div>
									</div>
								) : (
									<>
										<div className="aspect-video bg-black">
											{video.videoFile && video.videoFile.trim() !== "" ? (
												<video
													src={video.videoFile}
													controls
													className="w-full h-full rounded-t-lg"
												>
													Your browser does not support the video tag.
												</video>
											) : (
												<div className="w-full h-full flex items-center justify-center text-white">
													<p>Video URL not available</p>
												</div>
											)}
										</div>
										<CardHeader className="flex flex-row items-start gap-3 pb-1 pt-3 px-4">
											<div className="flex-1">
												<CardTitle className="text-base font-semibold line-clamp-1">
													{video.title}
												</CardTitle>
												{video.description && (
													<CardDescription className="text-sm mt-1 line-clamp-2">
														{video.description}
													</CardDescription>
												)}
											</div>
											{editable && (
												<div className="flex gap-2">
													<Button
														size="icon"
														variant="ghost"
														onClick={() =>
															setEditState({
																id: video.id,
																title: video.title,
																description: video.description || "",
																file: null,
															})
														}
														className="h-8 w-8 rounded-full hover:bg-primary/10"
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														size="icon"
														variant="ghost"
														onClick={() => handleDeleteVideo(video.id)}
														disabled={isSaving}
														className="h-8 w-8 rounded-full text-red-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											)}
										</CardHeader>
									</>
								)}
							</Card>
						))
					) : (
						<div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
							<div className="bg-muted/30 p-4 rounded-full mb-4">
								<VideoIcon className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="text-muted-foreground font-medium">
								No videos have been added yet.
							</p>
							{editable && (
								<Button
									variant="outline"
									className="mt-4 rounded-full"
									onClick={() => setIsAdding(true)}
								>
									<Plus className="h-4 w-4 mr-2" />
									Add Your First Video
								</Button>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
