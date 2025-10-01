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
import YogaTable, { Yoga } from "../components/yoga/YogaTable";
import YogaForm from "../components/yoga/YogaForm";
import Pagination from "../components/Pagination/Pagination";
import { usePagination } from "../hooks/usePagination";

interface YogaApiResponse {
	id: string;
	name: string;
	date: string;
	description: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
	error?: string;
}

export default function YogaPage() {
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

	const [yogas, setYogas] = useState<Yoga[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentYoga, setCurrentYoga] = useState<Partial<Yoga> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch yogas on component mount
	useEffect(() => {
		const fetchYogas = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/yoga?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
				);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();

				// Transform the API response to match Yoga structure
				const mappedYogas = data.data.map((yoga: YogaApiResponse) => ({
					id: yoga.id,
					name: yoga.name || "",
					date: new Date(yoga.date),
					description: yoga.description || "",
					status: yoga.status || "Active",
					createdAt: new Date(yoga.createdAt),
					updatedAt: new Date(yoga.updatedAt),
				}));

				setYogas(mappedYogas);

				// Update pagination with the new API response structure
				if (data.pagination) {
					updatePagination(
						data.pagination.totalCount,
						data.pagination.totalPages
					);
				}
			} catch (error) {
				console.error("Error fetching yogas:", error);
				toast.error("Failed to load yogas");
			} finally {
				setLoading(false);
			}
		};

		fetchYogas();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.currentPage, pagination.itemsPerPage]);

	const handleAddYoga = () => {
		setCurrentYoga(null);
		setIsFormOpen(true);
	};

	const handleEditYoga = (yoga: Yoga) => {
		setCurrentYoga(yoga);
		setIsFormOpen(true);
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/yoga/${id}`, {
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
			setYogas(
				yogas.map((y) => (y.id === id ? { ...y, status: newStatus } : y))
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
		yogaData: Omit<Yoga, "id" | "createdAt" | "updatedAt">
	) => {
		try {
			setIsSubmitting(true);

			const url = currentYoga?.id ? `/api/yoga/${currentYoga.id}` : "/api/yoga";

			const method = currentYoga?.id ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(yogaData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save yoga");
			}

			// Refresh the yogas list
			const fetchResponse = await fetch(
				`/api/yoga?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`
			);
			if (!fetchResponse.ok) {
				throw new Error("Failed to fetch updated yogas");
			}
			const { data } = await fetchResponse.json();

			// Transform the API response
			const mappedYogas = data.map((yoga: YogaApiResponse) => ({
				id: yoga.id,
				name: yoga.name || "",
				date: new Date(yoga.date),
				description: yoga.description || "",
				status: yoga.status || "Active",
				createdAt: new Date(yoga.createdAt),
				updatedAt: new Date(yoga.updatedAt),
			}));

			setYogas(mappedYogas);

			toast.success(
				currentYoga?.id
					? "Yoga updated successfully"
					: "Yoga created successfully"
			);

			setIsFormOpen(false);
		} catch (error: unknown) {
			console.error("Error saving yoga:", error);
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
				toast.error(error.message || "Failed to save yoga");
			} else {
				toast.error("Failed to save yoga");
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
			<h1 className="text-2xl font-bold mb-6">Yoga Management</h1>

			<YogaTable
				yogas={yogas}
				setYogas={setYogas}
				onAddYoga={handleAddYoga}
				onEditYoga={handleEditYoga}
				onDeleteYoga={() => {}}
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
							{currentYoga?.id ? "Edit Yoga" : "Add New Yoga"}
						</DialogTitle>
					</DialogHeader>
					<YogaForm
						initialData={currentYoga || undefined}
						onSubmit={handleFormSubmit}
						onCancel={() => setIsFormOpen(false)}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
