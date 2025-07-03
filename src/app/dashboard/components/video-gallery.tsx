"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from "@/components/ui/card";
import { Plus, Edit, Trash2, Save, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Video {
	id: string;
	title: string;
	videoUrl: string;
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
}

export default function VideoGallery({
	userId,
	editable = true,
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

	useEffect(() => {
		setLoading(true);
		setError(null);

		// First fetch the user profile to get basic user info
		fetch(`/api/users/${userId}`)
			.then((res) => {
				if (!res.ok) throw new Error("Failed to fetch user profile");
				return res.json();
			})
			.then((userData) => {
				setUser(userData);

				// Then fetch videos from the video API
				return fetch(`/api/videos?userId=${userId}`);
			})
			.then((res) => {
				if (!res.ok) throw new Error("Failed to fetch videos");
				return res.json();
			})
			.then((data) => {
				setVideos(data.videos || []);
			})
			.catch((e) => setError(e.message))
			.finally(() => setLoading(false));
	}, [userId]);

	const handleAddVideo = async () => {
		if (!newVideo.title || !newVideo.file) return;
		setIsSaving(true);
		try {
			// Upload the video file first
			const formData = new FormData();
			formData.append("file", newVideo.file);
			formData.append("userId", userId);
			const uploadRes = await fetch("/api/upload/video", {
				method: "POST",
				body: formData,
			});
			if (!uploadRes.ok) throw new Error("Failed to upload video file");
			const { videoUrl, video } = await uploadRes.json();

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
					if (updateRes.ok) {
						const updatedVideo = await updateRes.json();
						setVideos((prev) => [updatedVideo, ...prev]);
					} else {
						// Still add the video even if update fails
						setVideos((prev) => [video, ...prev]);
					}
				} else {
					setVideos((prev) => [video, ...prev]);
				}
			} else {
				// Create a new video record if not already created
				const createRes = await fetch(`/api/videos`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						title: newVideo.title,
						description: newVideo.description,
						videoUrl,
						userId,
						status: "active",
						category: "general",
						type: "video",
					}),
				});
				if (!createRes.ok) throw new Error("Failed to create video record");
				const newVideoRecord = await createRes.json();
				setVideos((prev) => [newVideoRecord, ...prev]);
			}

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
					...(videoUrl && { videoUrl }), // Use videoUrl property name
				}),
			});
			if (!res.ok) throw new Error("Failed to update video");
			const updatedVideo = await res.json();
			setVideos((prev) =>
				prev.map((v) => (v.id === updatedVideo.id ? updatedVideo : v))
			);
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
			setVideos((prev) => prev.filter((v) => v.id !== id));
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setIsSaving(false);
		}
	};

	if (loading)
		return (
			<div className="flex flex-col justify-center items-center h-60">
				<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
				<p className="text-lg text-muted-foreground">Loading Videos...</p>
			</div>
		);

	if (error)
		return <div className="text-red-500 text-center mt-8">{error}</div>;
	if (!user) return null;

	return (
		<Card className="w-full max-w-3xl mx-auto mt-8 shadow-lg border-0 bg-white dark:bg-zinc-900 rounded-xl">
			<CardHeader className="flex flex-row items-center gap-5 pb-4 pt-6 px-6">
				<div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md bg-white dark:bg-zinc-800 flex items-center justify-center">
					<Image
						src={user.profileImageUrl || "/placeholder-avatar.png"}
						alt={user.name}
						width={64}
						height={64}
						className="object-cover w-full h-full"
					/>
				</div>
				<div className="flex flex-col justify-center flex-1 gap-0.5 min-w-0">
					<CardTitle className="text-xl font-bold text-left truncate">
						Video Gallery
					</CardTitle>
					<CardDescription className="text-sm text-muted-foreground text-left truncate">
						Manage your video content
					</CardDescription>
				</div>
				{editable && (
					<Button
						size="sm"
						variant="default"
						className="ml-auto px-4 py-2 rounded-full"
						onClick={() => setIsAdding(!isAdding)}
					>
						<Plus className="h-4 w-4 mr-2" /> Add Video
					</Button>
				)}
			</CardHeader>
			<CardContent className="pt-2 pb-6 px-6">
				{isAdding && (
					<div className="mb-6 flex flex-col gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
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
					</div>
				)}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					{videos.length > 0 ? (
						videos.map((video, idx) => (
							<Card
								key={video.id || idx}
								className="shadow-md border bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-0 border-zinc-200 dark:border-zinc-700 overflow-hidden"
							>
								{editState && editState.id === video.id ? (
									<div className="p-4">
										<Input
											value={editState.title}
											onChange={(e) =>
												setEditState((s) =>
													s ? { ...s, title: e.target.value } : null
												)
											}
											className="text-base font-semibold mb-2"
										/>
										<Input
											value={editState.description}
											onChange={(e) =>
												setEditState((s) =>
													s ? { ...s, description: e.target.value } : null
												)
											}
											placeholder="Description"
											className="text-sm mb-2"
										/>
										<Input
											type="file"
											accept="video/*"
											onChange={(e) =>
												setEditState((s) =>
													s ? { ...s, file: e.target.files?.[0] || null } : null
												)
											}
											className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
										/>
										<div className="flex gap-2 justify-end mt-3">
											<Button
												size="sm"
												variant="outline"
												onClick={() => setEditState(null)}
												className="rounded-full px-3 text-xs"
											>
												<X className="h-3 w-3 mr-1" />
												Cancel
											</Button>
											<Button
												size="sm"
												onClick={handleSaveEdit}
												disabled={isSaving}
												className="rounded-full px-3 text-xs"
											>
												{isSaving ? (
													<Loader2 className="h-3 w-3 mr-1 animate-spin" />
												) : (
													<Save className="h-3 w-3 mr-1" />
												)}
												Save
											</Button>
										</div>
									</div>
								) : (
									<>
										<div className="aspect-video bg-black">
											<video
												src={video.videoUrl}
												controls
												className="w-full h-full rounded-t-lg"
												poster="/placeholder-video.png"
											>
												Your browser does not support the video tag.
											</video>
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
														className="rounded-full h-8 w-8"
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														size="icon"
														variant="ghost"
														onClick={() => handleDeleteVideo(video.id)}
														disabled={isSaving}
														className="rounded-full h-8 w-8 text-red-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
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
						<div className="col-span-full text-center py-12">
							<p className="text-muted-foreground italic">
								No videos have been added yet.
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
