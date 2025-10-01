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
import BookYogaForm from "../../components/book-yoga/BookYogaForm";
import BookYogaProfileCard from "../../components/book-yoga/BookYogaProfileCard";
import BookYogaDetailsTab from "../../components/book-yoga/BookYogaDetailsTab";
import MediaTab from "../../components/book-yoga/MediaTab";
import VideoTab from "../../components/book-yoga/VideoTab";
import ActivityTab from "../../components/book-yoga/ActivityTab";
import { YogaSession } from "../../components/book-yoga/BookYogaTable";

interface YogaSessionApiResponse {
	id: string;
	trainerId: string;
	trainerName: string;
	name: string;
	date: string;
	serviceType: string;
	description: string;
	status: string;
	bannerImage?: string;
	coverImage?: string;
	images: string[];
	videos: string[];
	price: number;
	duration: number;
	capacity: number;
	createdAt: string;
	updatedAt: string;
}

export default function YogaSessionDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const sessionId = params?.id as string;

	const [session, setSession] = useState<YogaSession | null>(null);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Fetch session data
	useEffect(() => {
		const fetchSession = async () => {
			if (!sessionId) return;

			setLoading(true);
			try {
				const response = await fetch(`/api/yoga-sessions/${sessionId}`);
				if (!response.ok) {
					throw new Error("Failed to fetch session");
				}

				const data: YogaSessionApiResponse = await response.json();
				const mappedSession: YogaSession = {
					id: data.id,
					trainerId: data.trainerId,
					trainerName: data.trainerName,
					name: data.name,
					date: new Date(data.date),
					serviceType: data.serviceType,
					description: data.description,
					status: data.status,
					bannerImage: data.bannerImage,
					coverImage: data.coverImage,
					images: data.images || [],
					videos: data.videos || [],
					price: data.price,
					duration: data.duration,
					capacity: data.capacity,
					createdAt: new Date(data.createdAt),
					updatedAt: new Date(data.updatedAt),
				};

				setSession(mappedSession);
			} catch (error) {
				console.error("Error fetching session:", error);
				toast.error("Failed to load session details");
				router.push("/admin/book-yoga");
			} finally {
				setLoading(false);
			}
		};

		fetchSession();
	}, [sessionId, router]);

	const handleEdit = () => {
		setIsFormOpen(true);
	};

	const handleFormSubmit = async (
		sessionData: Omit<
			YogaSession,
			"id" | "createdAt" | "updatedAt" | "trainerName"
		>
	) => {
		try {
			setIsSubmitting(true);

			const response = await fetch(`/api/yoga-sessions/${sessionId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(sessionData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update session");
			}

			const updatedData: YogaSessionApiResponse = await response.json();
			const updatedSession: YogaSession = {
				id: updatedData.id,
				trainerId: updatedData.trainerId,
				trainerName: updatedData.trainerName,
				name: updatedData.name,
				date: new Date(updatedData.date),
				serviceType: updatedData.serviceType,
				description: updatedData.description,
				status: updatedData.status,
				bannerImage: updatedData.bannerImage,
				coverImage: updatedData.coverImage,
				images: updatedData.images || [],
				videos: updatedData.videos || [],
				price: updatedData.price,
				duration: updatedData.duration,
				capacity: updatedData.capacity,
				createdAt: new Date(updatedData.createdAt),
				updatedAt: new Date(updatedData.updatedAt),
			};

			setSession(updatedSession);
			setIsFormOpen(false);
			toast.success("Session updated successfully");
		} catch (error) {
			console.error("Error updating session:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update session"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleMediaUpdate = async (updates: {
		bannerImage?: string;
		coverImage?: string;
		images?: string[];
	}) => {
		try {
			const response = await fetch(`/api/yoga-sessions/${sessionId}`, {
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

			const updatedData: YogaSessionApiResponse = await response.json();
			const updatedSession: YogaSession = {
				id: updatedData.id,
				trainerId: updatedData.trainerId,
				trainerName: updatedData.trainerName,
				name: updatedData.name,
				date: new Date(updatedData.date),
				serviceType: updatedData.serviceType,
				description: updatedData.description,
				status: updatedData.status,
				bannerImage: updatedData.bannerImage,
				coverImage: updatedData.coverImage,
				images: updatedData.images || [],
				videos: updatedData.videos || [],
				price: updatedData.price,
				duration: updatedData.duration,
				capacity: updatedData.capacity,
				createdAt: new Date(updatedData.createdAt),
				updatedAt: new Date(updatedData.updatedAt),
			};

			setSession(updatedSession);
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
			const response = await fetch(`/api/yoga-sessions/${sessionId}`, {
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

			const updatedData: YogaSessionApiResponse = await response.json();
			const updatedSession: YogaSession = {
				id: updatedData.id,
				trainerId: updatedData.trainerId,
				trainerName: updatedData.trainerName,
				name: updatedData.name,
				date: new Date(updatedData.date),
				serviceType: updatedData.serviceType,
				description: updatedData.description,
				status: updatedData.status,
				bannerImage: updatedData.bannerImage,
				coverImage: updatedData.coverImage,
				images: updatedData.images || [],
				videos: updatedData.videos || [],
				price: updatedData.price,
				duration: updatedData.duration,
				capacity: updatedData.capacity,
				createdAt: new Date(updatedData.createdAt),
				updatedAt: new Date(updatedData.updatedAt),
			};

			setSession(updatedSession);
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
			const response = await fetch(`/api/yoga-sessions/${sessionId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete session");
			}

			toast.success("Session deleted successfully");
			router.push("/admin/book-yoga");
		} catch (error) {
			console.error("Error deleting session:", error);
			toast.error("Failed to delete session");
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

	if (!session) {
		return (
			<div className="flex justify-center items-center h-screen">
				Session not found
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Yoga Session</DialogTitle>
					</DialogHeader>
					<div className="py-2">
						Are you sure you want to delete this yoga session? This action
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
					onClick={() => router.push("/admin/book-yoga")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Yoga Session Details</h1>
				<Button
					variant="destructive"
					onClick={() => setIsDeleteDialogOpen(true)}
					disabled={isDeleting}
					className="ml-auto"
				>
					{isDeleting ? "Deleting..." : "Delete Session"}
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<BookYogaProfileCard session={session} />

				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							<TabsTrigger value="details">Session Details</TabsTrigger>
							<TabsTrigger value="media">Media</TabsTrigger>
							<TabsTrigger value="videos">Videos</TabsTrigger>
							<TabsTrigger value="activity">Activity</TabsTrigger>
						</TabsList>

						<TabsContent value="details" className="space-y-4">
							<BookYogaDetailsTab session={session} onEdit={handleEdit} />
						</TabsContent>

						<TabsContent value="media" className="space-y-4">
							<MediaTab session={session} onUpdate={handleMediaUpdate} />
						</TabsContent>

						<TabsContent value="videos" className="space-y-4">
							<VideoTab session={session} onUpdate={handleVideoUpdate} />
						</TabsContent>

						<TabsContent value="activity" className="space-y-4">
							<ActivityTab />
						</TabsContent>
					</Tabs>
				</div>
			</div>

			{/* Edit Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>Edit Yoga Session</DialogTitle>
					</DialogHeader>
					<BookYogaForm
						initialData={session}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
