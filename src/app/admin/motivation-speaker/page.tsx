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
import MotivationSpeakerTable, {
	MotivationSpeaker,
} from "../components/motivation-speaker/MotivationSpeakerTable";
import MotivationSpeakerForm from "../components/motivation-speaker/MotivationSpeakerForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

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
	images: string[];
	videos: string[];
	description?: string;
	createdAt: string;
	updatedAt: string;
}

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
	error?: string;
}

export default function MotivationSpeakerPage() {
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

	const [speakers, setSpeakers] = useState<MotivationSpeaker[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentSpeaker, setCurrentSpeaker] =
		useState<Partial<MotivationSpeaker> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch speakers on component mount
	useEffect(() => {
		const fetchSpeakers = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/motivation-speaker?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Transform the API response to match MotivationSpeaker structure
				const mappedSpeakers = data.data.map(
					(speaker: MotivationSpeakerApiResponse) => ({
						id: speaker.id,
						name: speaker.name || "",
						date: new Date(speaker.date),
						phone: speaker.phone || "",
						email: speaker.email || "",
						timings: speaker.timings || "",
						category: speaker.category || "",
						status: speaker.status || "Active",
						coverImage: speaker.coverImage,
						bannerImage: speaker.bannerImage,
						images: speaker.images || [],
						videos: speaker.videos || [],
						description: speaker.description,
						createdAt: new Date(speaker.createdAt),
						updatedAt: new Date(speaker.updatedAt),
					})
				);

				setSpeakers(mappedSpeakers);

				// Update pagination with the new API response structure
				if (data.pagination) {
					updatePagination(
						data.pagination.totalCount,
						data.pagination.totalPages
					);
				}
			} catch (error) {
				console.error("Error fetching speakers:", error);
				toast.error("Failed to load speakers");
			} finally {
				setLoading(false);
			}
		};

		fetchSpeakers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, pagination.itemsPerPage]);

	const handleAddSpeaker = () => {
		setCurrentSpeaker(null);
		setIsFormOpen(true);
	};

	const handleEditSpeaker = (speaker: MotivationSpeaker) => {
		setCurrentSpeaker(speaker);
		setIsFormOpen(true);
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/motivation-speaker/${id}`, {
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
			setSpeakers(
				speakers.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
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
		speakerData: Omit<MotivationSpeaker, "id" | "createdAt" | "updatedAt">
	) => {
		try {
			setIsSubmitting(true);

			const url = currentSpeaker?.id
				? `/api/motivation-speaker/${currentSpeaker.id}`
				: "/api/motivation-speaker";

			const method = currentSpeaker?.id ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(speakerData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save speaker");
			}

			// Refresh the speakers list
			const fetchResponse = await fetch(
				`/api/motivation-speaker?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
			);
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated speakers");
			}
			const { data } = await fetchResponse.json();

			// Transform the API response
			const mappedSpeakers = data.map(
				(speaker: MotivationSpeakerApiResponse) => ({
					id: speaker.id,
					name: speaker.name || "",
					date: new Date(speaker.date),
					phone: speaker.phone || "",
					email: speaker.email || "",
					timings: speaker.timings || "",
					category: speaker.category || "",
					status: speaker.status || "Active",
					coverImage: speaker.coverImage,
					bannerImage: speaker.bannerImage,
					images: speaker.images || [],
					videos: speaker.videos || [],
					description: speaker.description,
					createdAt: new Date(speaker.createdAt),
					updatedAt: new Date(speaker.updatedAt),
				})
			);

			setSpeakers(mappedSpeakers);

			toast.success(
				currentSpeaker?.id
					? "Speaker updated successfully"
					: "Speaker created successfully"
			);

			setIsFormOpen(false);
		} catch (error: unknown) {
			console.error("Error saving speaker:", error);
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
				toast.error(error.message || "Failed to save speaker");
			} else {
				toast.error("Failed to save speaker");
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
			<h1 className="text-2xl font-bold mb-6">Motivation Speaker Management</h1>

			<MotivationSpeakerTable
				speakers={speakers}
				setSpeakers={setSpeakers}
				onAddSpeaker={handleAddSpeaker}
				onEditSpeaker={handleEditSpeaker}
				onDeleteSpeaker={() => {}}
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
							{currentSpeaker?.id ? "Edit Speaker" : "Add New Speaker"}
						</DialogTitle>
					</DialogHeader>
					<MotivationSpeakerForm
						initialData={currentSpeaker || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
