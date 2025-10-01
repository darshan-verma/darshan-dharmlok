"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import BookYogaTable, {
	YogaSession,
} from "../components/book-yoga/BookYogaTable";
import BookYogaForm from "../components/book-yoga/BookYogaForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

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
	price?: number;
	duration?: number;
	capacity?: number;
	createdAt: string;
	updatedAt: string;
}

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
	error?: string;
}

export default function BookYogaPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Read page from URL query, default to 1
	const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
	const [pagination, handlePageChangeRaw, updatePagination] = usePagination(
		pageFromUrl,
		12
	);

	// When page changes, update the URL
	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(Array.from(searchParams.entries()));
		params.set("page", String(page));
		router.replace(`?${params.toString()}`);
		handlePageChangeRaw(page);
	};

	// Keep pagination in sync if URL changes (e.g., browser navigation)
	useEffect(() => {
		const urlPage = parseInt(searchParams.get("page") || "1", 10);
		if (urlPage !== pagination.currentPage) {
			handlePageChangeRaw(urlPage);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	const [yogaSessions, setYogaSessions] = useState<YogaSession[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentSession, setCurrentSession] =
		useState<Partial<YogaSession> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch yoga sessions on component mount
	useEffect(() => {
		const fetchYogaSessions = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/yoga-sessions?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Transform the API response to match YogaSession structure
				const mappedSessions = data.data.map(
					(session: YogaSessionApiResponse) => ({
						id: session.id,
						trainerId: session.trainerId,
						trainerName: session.trainerName,
						name: session.name || "",
						date: new Date(session.date),
						serviceType: session.serviceType || "",
						description: session.description || "",
						status: session.status || "Active",
						bannerImage: session.bannerImage,
						coverImage: session.coverImage,
						images: session.images || [],
						videos: session.videos || [],
						price: session.price,
						duration: session.duration,
						capacity: session.capacity,
						createdAt: new Date(session.createdAt),
						updatedAt: new Date(session.updatedAt),
					})
				);

				setYogaSessions(mappedSessions);

				// Update pagination with the new API response structure
				if (data.pagination) {
					updatePagination(
						data.pagination.totalCount,
						data.pagination.totalPages
					);
				}
			} catch (error) {
				console.error("Error fetching yoga sessions:", error);
				toast.error("Failed to load yoga sessions");
			} finally {
				setLoading(false);
			}
		};

		fetchYogaSessions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, pagination.itemsPerPage]);

	const handleAddSession = () => {
		setCurrentSession(null);
		setIsFormOpen(true);
	};

	const handleEditSession = (session: YogaSession) => {
		setCurrentSession(session);
		setIsFormOpen(true);
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/yoga-sessions/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status: newStatus }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API error: ${response.status}`);
			}

			// Update local state
			setYogaSessions(
				yogaSessions.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
			);
			toast.success("Status updated successfully");
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update status"
			);
		}
	};

	const handleFormSubmit = async (
		sessionData: Omit<
			YogaSession,
			"id" | "createdAt" | "updatedAt" | "trainerName"
		>
	) => {
		try {
			setIsSubmitting(true);

			const url = currentSession?.id
				? `/api/yoga-sessions/${currentSession.id}`
				: "/api/yoga-sessions";

			const method = currentSession?.id ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(sessionData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save yoga session");
			}

			// Refresh the yoga sessions list
			const fetchResponse = await fetch(
				`/api/yoga-sessions?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
			);
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated yoga sessions");
			}
			const { data } = await fetchResponse.json();

			// Transform the API response
			const mappedSessions = data.map((session: YogaSessionApiResponse) => ({
				id: session.id,
				trainerId: session.trainerId,
				trainerName: session.trainerName,
				name: session.name || "",
				date: new Date(session.date),
				serviceType: session.serviceType || "",
				description: session.description || "",
				status: session.status || "Active",
				bannerImage: session.bannerImage,
				coverImage: session.coverImage,
				images: session.images || [],
				videos: session.videos || [],
				price: session.price,
				duration: session.duration,
				capacity: session.capacity,
				createdAt: new Date(session.createdAt),
				updatedAt: new Date(session.updatedAt),
			}));

			setYogaSessions(mappedSessions);

			toast.success(
				currentSession?.id
					? "Yoga session updated successfully"
					: "Yoga session created successfully"
			);

			setIsFormOpen(false);
		} catch (error: unknown) {
			console.error("Error saving yoga session:", error);
			// Type guard for error with 'details'
			if (typeof error === "object" && error !== null && "details" in error) {
				const err = error as ApiErrorResponse;
				if (Array.isArray(err.details)) {
					err.details.forEach((message) => {
						toast.error(String(message));
					});
				} else if (err.details && typeof err.details === "object") {
					Object.values(err.details).forEach((message) => {
						toast.error(String(message));
					});
				}
			} else if (error instanceof Error) {
				toast.error(error.message || "Failed to save yoga session");
			} else {
				toast.error("Failed to save yoga session");
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
			<h1 className="text-2xl font-bold mb-6">Book Yoga Sessions</h1>

			<BookYogaTable
				yogaSessions={yogaSessions}
				setYogaSessions={setYogaSessions}
				onAddSession={handleAddSession}
				onEditSession={handleEditSession}
				onDeleteSession={() => {}}
				onUpdateStatus={handleUpdateStatus}
			/>

			<Pagination
				currentPage={pagination.currentPage}
				totalPages={pagination.totalPages}
				totalItems={pagination.totalItems}
				itemsPerPage={pagination.itemsPerPage}
				onPageChange={handlePageChange}
			/>

			{/* Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentSession?.id
								? "Edit Yoga Session"
								: "Add New Yoga Session"}
						</DialogTitle>
					</DialogHeader>
					<BookYogaForm
						initialData={currentSession || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
