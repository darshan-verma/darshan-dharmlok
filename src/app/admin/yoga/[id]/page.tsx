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
import YogaForm from "../../components/yoga/YogaForm";
import YogaProfileCard from "../../components/yoga/YogaProfileCard";
import YogaDetailsTab from "../../components/yoga/YogaDetailsTab";
import MediaTab from "../../components/yoga/MediaTab";
import VideoTab from "../../components/yoga/VideoTab";

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

interface YogaApiResponse {
	id: string;
	name: string;
	date: string;
	description: string;
	status: string;
	images: YogaImage[];
	videos: string[];
	coverImage?: string;
	createdAt: string;
	updatedAt: string;
}

export default function YogaDetailPage() {
	const params = useParams();
	const router = useRouter();
	const yogaId = params?.id as string;

	const [yoga, setYoga] = useState<Yoga | null>(null);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Fetch yoga data
	useEffect(() => {
		const fetchYoga = async () => {
			if (!yogaId) return;

			setLoading(true);
			try {
				const response = await fetch(`/api/yoga/${yogaId}`);
				if (!response.ok) {
					throw new Error("Failed to fetch yoga");
				}

				const data: YogaApiResponse = await response.json();
				const mappedYoga: Yoga = {
					id: data.id,
					name: data.name,
					date: new Date(data.date),
					description: data.description,
					status: data.status,
					images: data.images || [],
					videos: data.videos || [],
					coverImage: data.coverImage,
					createdAt: new Date(data.createdAt),
					updatedAt: new Date(data.updatedAt),
				};

				setYoga(mappedYoga);
			} catch (error) {
				console.error("Error fetching yoga:", error);
				toast.error("Failed to load yoga details");
				router.push("/admin/yoga");
			} finally {
				setLoading(false);
			}
		};

		fetchYoga();
	}, [yogaId, router]);

	const handleEdit = () => {
		setIsFormOpen(true);
	};

	const handleFormSubmit = async (
		yogaData: Omit<Yoga, "id" | "createdAt" | "updatedAt">
	) => {
		try {
			setIsSubmitting(true);

			const response = await fetch(`/api/yoga/${yogaId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(yogaData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update yoga");
			}

			const updatedData: YogaApiResponse = await response.json();
			const updatedYoga: Yoga = {
				id: updatedData.id,
				name: updatedData.name,
				date: new Date(updatedData.date),
				description: updatedData.description,
				status: updatedData.status,
				images: updatedData.images || [],
				videos: updatedData.videos || [],
				coverImage: updatedData.coverImage,
				createdAt: new Date(updatedData.createdAt),
				updatedAt: new Date(updatedData.updatedAt),
			};

			setYoga(updatedYoga);
			setIsFormOpen(false);
			toast.success("Yoga updated successfully");
		} catch (error) {
			console.error("Error updating yoga:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update yoga"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleMediaUpdate = async (updates: {
		bannerImage?: string;
		coverImage?: string;
		images?: YogaImage[];
		videos?: string[];
	}) => {
		try {
			const response = await fetch(`/api/yoga/${yogaId}`, {
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

			const updatedData: YogaApiResponse = await response.json();
			const updatedYoga: Yoga = {
				id: updatedData.id,
				name: updatedData.name,
				date: new Date(updatedData.date),
				description: updatedData.description,
				status: updatedData.status,
				images: updatedData.images || [],
				videos: updatedData.videos || [],
				coverImage: updatedData.coverImage,
				createdAt: new Date(updatedData.createdAt),
				updatedAt: new Date(updatedData.updatedAt),
			};

			setYoga(updatedYoga);
			toast.success("Media updated successfully");
		} catch (error) {
			console.error("Error updating media:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update media"
			);
		}
	};

	const handleVideoUpdate = async (videos: string[]) => {
		try {
			const response = await fetch(`/api/yoga/${yogaId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					videos,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update videos");
			}

			const updatedData: YogaApiResponse = await response.json();
			const updatedYoga: Yoga = {
				id: updatedData.id,
				name: updatedData.name,
				date: new Date(updatedData.date),
				description: updatedData.description,
				status: updatedData.status,
				images: updatedData.images || [],
				videos: updatedData.videos || [],
				coverImage: updatedData.coverImage,
				createdAt: new Date(updatedData.createdAt),
				updatedAt: new Date(updatedData.updatedAt),
			};

			setYoga(updatedYoga);
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
			const response = await fetch(`/api/yoga/${yogaId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete yoga");
			}

			toast.success("Yoga deleted successfully");
			router.push("/admin/yoga");
		} catch (error) {
			console.error("Error deleting yoga:", error);
			toast.error("Failed to delete yoga");
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

	if (!yoga) {
		return (
			<div className="flex justify-center items-center h-screen">
				Yoga not found
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Yoga</DialogTitle>
					</DialogHeader>
					<div className="py-2">
						Are you sure you want to delete this Yoga? This action cannot be
						undone.
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
					onClick={() => router.push("/admin/yoga")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Yoga Details</h1>
				<Button
					variant="destructive"
					onClick={() => setIsDeleteDialogOpen(true)}
					disabled={isDeleting}
					className="ml-auto"
				>
					{isDeleting ? "Deleting..." : "Delete Yoga"}
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<YogaProfileCard yoga={yoga} />

				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							<TabsTrigger value="details">Yoga Details</TabsTrigger>
							<TabsTrigger value="media">Media</TabsTrigger>
							<TabsTrigger value="videos">Videos</TabsTrigger>
							<TabsTrigger value="activity">Activity</TabsTrigger>
						</TabsList>

						<TabsContent value="details" className="space-y-4">
							<YogaDetailsTab yoga={yoga} onEdit={handleEdit} />
						</TabsContent>

						<TabsContent value="media" className="space-y-4">
							<MediaTab yoga={yoga} onUpdate={handleMediaUpdate} />
						</TabsContent>

						<TabsContent value="videos" className="space-y-4">
							<VideoTab yoga={yoga} onUpdate={handleVideoUpdate} />
						</TabsContent>

						<TabsContent value="activity" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Activity Log</CardTitle>
									<CardDescription>
										View recent activity for this yoga session.
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
						<DialogTitle>Edit Yoga</DialogTitle>
					</DialogHeader>
					<YogaForm
						initialData={yoga}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
