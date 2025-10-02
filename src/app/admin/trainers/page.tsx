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
import TrainersTable, { Trainer } from "../components/trainers/TrainersTable";
import TrainersForm, {
	TrainerFormData,
} from "../components/trainers/TrainersForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

interface TrainerApiResponse {
	id: string;
	name: string;
	email: string;
	phone: string;
	bio?: string;
	category?: string;
	coverImageUrl?: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
	error?: string;
}

export default function TrainersPage() {
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

	const [trainers, setTrainers] = useState<Trainer[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentTrainer, setCurrentTrainer] = useState<Partial<Trainer> | null>(
		null
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch trainers on component mount
	useEffect(() => {
		const fetchTrainers = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/trainers?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Transform the API response to match Trainer structure
				const mappedTrainers = data.users.map(
					(trainer: TrainerApiResponse) => ({
						id: trainer.id,
						name: trainer.name || "",
						email: trainer.email || "",
						phone: trainer.phone || "",
						bio: trainer.bio || "",
						category: trainer.category || "",
						coverImageUrl: trainer.coverImageUrl || "",
						status: trainer.status || "Active",
						createdAt: new Date(trainer.createdAt),
						updatedAt: new Date(trainer.createdAt), // Use createdAt as fallback since updatedAt is not returned
					})
				);

				setTrainers(mappedTrainers);

				// Update pagination with the new API response structure
				if (data.pagination) {
					updatePagination(data.pagination.total, data.pagination.totalPages);
				}
			} catch (error) {
				console.error("Error fetching trainers:", error);
				toast.error("Failed to load trainers");
			} finally {
				setLoading(false);
			}
		};

		fetchTrainers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, pagination.itemsPerPage]);

	const handleAddTrainer = () => {
		setCurrentTrainer(null);
		setIsFormOpen(true);
	};

	const handleEditTrainer = (trainer: Trainer) => {
		setCurrentTrainer(trainer);
		setIsFormOpen(true);
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/trainers`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id, status: newStatus }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API error: ${response.status}`);
			}

			// Update local state
			setTrainers(
				trainers.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
			);
			toast.success("Status updated successfully");
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update status"
			);
		}
	};

	const handleFormSubmit = async (trainerData: TrainerFormData) => {
		try {
			setIsSubmitting(true);

			let coverImageUrl = trainerData.coverImageUrl;

			// Handle file upload if a file was selected
			if (trainerData.coverImageFile) {
				const formData = new FormData();
				formData.append("file", trainerData.coverImageFile);

				const uploadResponse = await fetch("/api/upload/image", {
					method: "POST",
					body: formData,
				});

				if (!uploadResponse.ok) {
					const errorData = await uploadResponse.json();
					throw new Error(errorData.error || "Failed to upload image");
				}

				const uploadResult = await uploadResponse.json();
				coverImageUrl = uploadResult.imageUrl;
			}

			const payload = {
				name: trainerData.name,
				email: trainerData.email,
				phone: trainerData.phone,
				userType: "trainer",
				bio: trainerData.bio,
				category: trainerData.category,
				coverImageUrl: coverImageUrl,
				status: trainerData.status,
				...(currentTrainer?.id && { id: currentTrainer.id }),
			};

			const method = currentTrainer?.id ? "PUT" : "POST";

			const response = await fetch("/api/trainers", {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save trainer");
			}

			// Refresh the trainers list
			const fetchResponse = await fetch(
				`/api/trainers?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
			);
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated trainers");
			}
			const { users } = await fetchResponse.json();

			// Transform the API response
			const mappedTrainers = users.map((trainer: TrainerApiResponse) => ({
				id: trainer.id,
				name: trainer.name || "",
				email: trainer.email || "",
				phone: trainer.phone || "",
				bio: trainer.bio || "",
				category: trainer.category || "",
				coverImageUrl: trainer.coverImageUrl || "",
				status: trainer.status || "Active",
				createdAt: new Date(trainer.createdAt),
				updatedAt: new Date(trainer.createdAt), // Use createdAt as fallback
			}));

			setTrainers(mappedTrainers);

			toast.success(
				currentTrainer?.id
					? "Trainer updated successfully"
					: "Trainer created successfully"
			);

			setIsFormOpen(false);
		} catch (error: unknown) {
			console.error("Error saving trainer:", error);
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
				toast.error(error.message || "Failed to save trainer");
			} else {
				toast.error("Failed to save trainer");
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
			<h1 className="text-2xl font-bold mb-6">Trainers Management</h1>

			<TrainersTable
				trainers={trainers}
				setTrainers={setTrainers}
				onAddTrainer={handleAddTrainer}
				onEditTrainer={handleEditTrainer}
				onDeleteTrainer={() => {}}
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
							{currentTrainer?.id ? "Edit Trainer" : "Add New Trainer"}
						</DialogTitle>
					</DialogHeader>
					<TrainersForm
						initialData={currentTrainer || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
