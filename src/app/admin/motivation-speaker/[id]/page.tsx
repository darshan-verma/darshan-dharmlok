"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import MotivationSpeakerForm from "../../components/motivation-speaker/MotivationSpeakerForm";
import MotivationSpeakerProfileCard from "../../components/motivation-speaker/MotivationSpeakerProfileCard";
import MotivationSpeakerDetailsTab from "../../components/motivation-speaker/MotivationSpeakerDetailsTab";
import MediaTab from "../../components/motivation-speaker/MediaTab";
import VideoTab from "../../components/motivation-speaker/VideoTab";

interface MotivationSpeaker {
	id: string;
	name: string;
	date: Date;
	phone: string;
	email: string;
	timings: string;
	category: string;
	status: string;
	coverImage?: string;
	bannerImage?: string;
	profileImage?: string;
	images: string[];
	videos: string[];
	description?: string;
	createdAt: Date;
	updatedAt: Date;
}

interface MotivationSpeakerApiResponse {
	id: string;
	name: string;
	date: string;
	phone: string;
	email: string;
	timings: string;
	category: string;
	status: string;
	coverImage?: string;
	bannerImage?: string;
	profileImage?: string;
	images: string[];
	videos: string[];
	description?: string;
	createdAt: string;
	updatedAt: string;
}

export default function MotivationSpeakerDetailPage() {
	const params = useParams();
	const router = useRouter();
	const speakerId = params?.id as string;

	const [speaker, setSpeaker] = useState<MotivationSpeaker | null>(null);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Fetch speaker data
	useEffect(() => {
		const fetchSpeaker = async () => {
			if (!speakerId) return;

			setLoading(true);
			try {
				const response = await fetch(`/api/motivation-speaker/${speakerId}`);
				if (!response.ok) {
					throw new Error("Failed to fetch speaker");
				}

				const data: MotivationSpeakerApiResponse = await response.json();
				const mappedSpeaker: MotivationSpeaker = {
					id: data.id,
					name: data.name,
					date: new Date(data.date),
					phone: data.phone,
					email: data.email,
					timings: data.timings,
					category: data.category,
					status: data.status,
					coverImage: data.coverImage,
					bannerImage: data.bannerImage,
					profileImage: data.profileImage,
					images: data.images || [],
					videos: data.videos || [],
					description: data.description,
					createdAt: new Date(data.createdAt),
					updatedAt: new Date(data.updatedAt),
				};

				setSpeaker(mappedSpeaker);
			} catch (error) {
				console.error("Error fetching speaker:", error);
				toast.error("Failed to load speaker details");
				router.push("/admin/motivation-speaker");
			} finally {
				setLoading(false);
			}
		};

		fetchSpeaker();
	}, [speakerId, router]);

	const handleEdit = () => {
		setIsFormOpen(true);
	};

	const handleFormSubmit = async (
		speakerData: Omit<MotivationSpeaker, "id" | "createdAt" | "updatedAt"> & {
			profileImageFile?: File | null;
		}
	) => {
		try {
			setIsSubmitting(true);

			let finalProfileImageUrl = speakerData.profileImage;

			// Handle profile image upload if a new file is provided
			if (speakerData.profileImageFile) {
				const imageToastId = toast.loading("Uploading profile image...");
				const formData = new FormData();
				formData.append("file", speakerData.profileImageFile);

				try {
					const uploadResponse = await fetch("/api/upload/image", {
						method: "POST",
						body: formData,
					});

					if (!uploadResponse.ok) {
						const errorData = await uploadResponse.json().catch(() => ({}));
						throw new Error(
							errorData.error ||
								errorData.message ||
								"Profile image upload failed"
						);
					}
					const uploadResult = await uploadResponse.json();
					finalProfileImageUrl = uploadResult.imageUrl;
					toast.dismiss(imageToastId);
					toast.success("Profile image uploaded successfully!");
				} catch (uploadError) {
					toast.dismiss(imageToastId);
					toast.error(
						uploadError instanceof Error
							? uploadError.message
							: "Profile image upload failed"
					);
					setIsSubmitting(false);
					return;
				}
			} else if (
				speakerData.profileImage === undefined &&
				!speakerData.profileImageFile
			) {
				// If profileImageFile is not present and profileImage is explicitly undefined (cleared by form)
				finalProfileImageUrl = undefined;
			}

			// Prepare the data for API submission (exclude profileImageFile)
			const { profileImageFile: _profileImageFile, ...apiData } = speakerData;
			const dataToSubmit = {
				...apiData,
				profileImage: finalProfileImageUrl,
			};

			const response = await fetch(`/api/motivation-speaker/${speakerId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSubmit),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update speaker");
			}

			const updatedData: MotivationSpeakerApiResponse = await response.json();
			const updatedSpeaker: MotivationSpeaker = {
				id: updatedData.id,
				name: updatedData.name,
				date: new Date(updatedData.date),
				phone: updatedData.phone,
				email: updatedData.email,
				timings: updatedData.timings,
				category: updatedData.category,
				status: updatedData.status,
				coverImage: updatedData.coverImage,
				bannerImage: updatedData.bannerImage,
				profileImage: updatedData.profileImage,
				images: updatedData.images || [],
				videos: updatedData.videos || [],
				description: updatedData.description,
				createdAt: new Date(updatedData.createdAt),
				updatedAt: new Date(updatedData.updatedAt),
			};

			setSpeaker(updatedSpeaker);
			setIsFormOpen(false);
			toast.success("Speaker updated successfully");
		} catch (error) {
			console.error("Error updating speaker:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update speaker"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUpdateMedia = async (updates: {
		coverImage?: string;
		bannerImage?: string;
		images?: string[];
	}) => {
		try {
			const response = await fetch(`/api/motivation-speaker/${speakerId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updates),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update media");
			}

			const updatedData: MotivationSpeakerApiResponse = await response.json();
			const updatedSpeaker: MotivationSpeaker = {
				id: updatedData.id,
				name: updatedData.name,
				date: new Date(updatedData.date),
				phone: updatedData.phone,
				email: updatedData.email,
				timings: updatedData.timings,
				category: updatedData.category,
				status: updatedData.status,
				coverImage: updatedData.coverImage,
				bannerImage: updatedData.bannerImage,
				images: updatedData.images || [],
				videos: updatedData.videos || [],
				description: updatedData.description,
				createdAt: new Date(updatedData.createdAt),
				updatedAt: new Date(updatedData.updatedAt),
			};

			setSpeaker(updatedSpeaker);
			toast.success("Media updated successfully");
		} catch (error) {
			console.error("Error updating media:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update media"
			);
		}
	};

	const handleUpdateVideos = async (updates: { videos?: string[] }) => {
		try {
			const response = await fetch(`/api/motivation-speaker/${speakerId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updates),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update videos");
			}

			const updatedData: MotivationSpeakerApiResponse = await response.json();
			const updatedSpeaker: MotivationSpeaker = {
				id: updatedData.id,
				name: updatedData.name,
				date: new Date(updatedData.date),
				phone: updatedData.phone,
				email: updatedData.email,
				timings: updatedData.timings,
				category: updatedData.category,
				status: updatedData.status,
				coverImage: updatedData.coverImage,
				bannerImage: updatedData.bannerImage,
				images: updatedData.images || [],
				videos: updatedData.videos || [],
				description: updatedData.description,
				createdAt: new Date(updatedData.createdAt),
				updatedAt: new Date(updatedData.updatedAt),
			};

			setSpeaker(updatedSpeaker);
			toast.success("Videos updated successfully");
		} catch (error) {
			console.error("Error updating videos:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update videos"
			);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/motivation-speaker/${speakerId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete speaker");
			}

			toast.success("Speaker deleted successfully");
			router.push("/admin/motivation-speaker");
		} catch (error) {
			console.error("Error deleting speaker:", error);
			toast.error("Failed to delete speaker");
		} finally {
			setIsDeleting(false);
			setIsDeleteDialogOpen(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				Loading...
			</div>
		);
	}

	if (!speaker) {
		return (
			<div className="flex justify-center items-center h-screen">
				Speaker not found
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Speaker</DialogTitle>
					</DialogHeader>
					<div className="py-2">
						Are you sure you want to delete this Motivation Speaker? This action
						cannot be undone.
					</div>
					<DialogFooter className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="flex items-center gap-4 mb-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/motivation-speaker")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Speaker Details</h1>
				<Button
					variant="destructive"
					onClick={() => setIsDeleteDialogOpen(true)}
					disabled={isDeleting}
					className="ml-auto"
				>
					{isDeleting ? "Deleting..." : "Delete Speaker"}
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<MotivationSpeakerProfileCard speaker={speaker} />

				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							<TabsTrigger value="details">Speaker Details</TabsTrigger>
							<TabsTrigger value="media">Media</TabsTrigger>
							<TabsTrigger value="videos">Videos</TabsTrigger>
							<TabsTrigger value="activity">Activity</TabsTrigger>
						</TabsList>

						<TabsContent value="details" className="space-y-4">
							<MotivationSpeakerDetailsTab
								speaker={speaker}
								onEdit={handleEdit}
							/>
						</TabsContent>

						<TabsContent value="media" className="space-y-4">
							<MediaTab speaker={speaker} onUpdate={handleUpdateMedia} />
						</TabsContent>

						<TabsContent value="videos" className="space-y-4">
							<VideoTab speaker={speaker} onUpdate={handleUpdateVideos} />
						</TabsContent>

						<TabsContent value="activity" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Activity Log</CardTitle>
									<CardDescription>
										View recent activity for this speaker.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-gray-500">
										Activity log will be displayed here.
									</p>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>

			{/* Edit Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>Edit Speaker</DialogTitle>
					</DialogHeader>
					<MotivationSpeakerForm
						initialData={speaker}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
