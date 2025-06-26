"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import VideoTable, { Video } from "../components/launch-video/VideoTable";
import VideoForm, { VideoFormData } from "../components/launch-video/VideoForm";
import { Button } from "@/components/ui/button";

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
}

export default function VideoPage() {
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentVideo, setCurrentVideo] = useState<Partial<Video> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [videoToDelete, setVideoToDelete] = useState<{
		id: string;
		title: string;
	} | null>(null);

	useEffect(() => {
		const fetchVideos = async () => {
			setLoading(true);
			try {
				const response = await fetch(`/api/launch-video`);
				if (!response.ok) throw new Error(`API error: ${response.status}`);
				const data = await response.json();
				setVideos(data.content || []);
			} catch {
				toast.error("Failed to load videos");
			} finally {
				setLoading(false);
			}
		};
		fetchVideos();
	}, []);

	const handleAddVideo = () => {
		setCurrentVideo(null);
		setIsFormOpen(true);
	};

	const handleEditVideo = (video: Video) => {
		setCurrentVideo(video);
		setIsFormOpen(true);
	};

	const handleDeleteVideo = (id: string, title: string) => {
		setVideoToDelete({ id, title });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!videoToDelete) return;
		try {
			const response = await fetch(`/api/launch-video/${videoToDelete.id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error(`API error: ${response.status}`);
			setVideos(videos.filter((v) => v.id !== videoToDelete.id));
			toast.success("Video deleted");
		} catch {
			toast.error("Failed to delete video");
		} finally {
			setIsDeleteDialogOpen(false);
			setVideoToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/launch-video/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!response.ok) throw new Error(`API error: ${response.status}`);
			const updatedVideo = await response.json();
			setVideos(videos.map((v) => (v.id === id ? updatedVideo : v)));
			toast.success("Status updated successfully");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleViewVideo = (video: Video) => {
		window.location.href = `/admin/launch-video/${video.id}`;
	};

	const handleFormSubmit = async (videoFormData: VideoFormData) => {
		setIsSubmitting(true);
		const loadingToastId = toast.loading(
			currentVideo?.id ? "Updating video..." : "Creating video..."
		);

		try {
			const url = currentVideo?.id
				? `/api/launch-video/${currentVideo.id}`
				: "/api/launch-video";
			const method = currentVideo?.id ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(videoFormData),
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: "Failed to save video" }));
				throw new Error(
					errorData.error || errorData.message || "Failed to save video"
				);
			}
			const savedVideo = await response.json();
			if (currentVideo?.id) {
				setVideos(
					videos.map((v) => (v.id === currentVideo.id ? savedVideo : v))
				);
			} else {
				setVideos([savedVideo, ...videos]);
			}
			toast.dismiss(loadingToastId);
			toast.success(
				currentVideo?.id
					? "Video updated successfully"
					: "Video created successfully"
			);
			setIsFormOpen(false);
			setCurrentVideo(null);
		} catch (error: unknown) {
			toast.dismiss(loadingToastId);
			if (typeof error === "object" && error !== null && "details" in error) {
				const err = error as ApiErrorResponse;
				if (Array.isArray(err.details)) {
					err.details.forEach((message) => toast.error(String(message)));
				} else if (err.details && typeof err.details === "object") {
					Object.values(err.details).forEach((message) =>
						toast.error(String(message))
					);
				}
			} else if (error instanceof Error) {
				toast.error(error.message || "Failed to save video");
			} else {
				toast.error("Failed to save video");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				Loading...
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6">
			<h1 className="text-2xl font-bold mb-6">Video Management</h1>

			<VideoTable
				videos={videos}
				setVideos={setVideos}
				onAddVideo={handleAddVideo}
				onEditVideo={handleEditVideo}
				onDeleteVideo={handleDeleteVideo}
				onUpdateStatus={handleUpdateStatus}
				onViewVideo={handleViewVideo}
			/>

			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentVideo?.id ? "Edit Video" : "Add New Video"}
						</DialogTitle>
					</DialogHeader>
					<VideoForm
						initialData={currentVideo ? { ...currentVideo } : undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Confirm Deletion</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete this video? This action cannot be
							undone.
						</p>
						<p className="text-gray-600 mt-2 break-all">
							{videoToDelete?.title}
						</p>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							Delete
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
