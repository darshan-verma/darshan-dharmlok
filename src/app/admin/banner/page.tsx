"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import BannerTable, { Banner } from "../components/banner/BannerTable";
import BannerForm, { BannerFormData } from "../components/banner/BannerForm";

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
}

export default function BannerPage() {
	const [banners, setBanners] = useState<Banner[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentBanner, setCurrentBanner] = useState<Partial<Banner> | null>(
		null
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [bannerToDelete, setBannerToDelete] = useState<{
		id: string;
		title: string;
	} | null>(null);

	// Fetch banners on mount
	useEffect(() => {
		const fetchBanners = async () => {
			setLoading(true);
			try {
				const response = await fetch(`/api/banner`);
				if (!response.ok) throw new Error(`API error: ${response.status}`);
				const data = await response.json();
				setBanners(data.content || []);
			} catch {
				toast.error("Failed to load banners");
			} finally {
				setLoading(false);
			}
		};
		fetchBanners();
	}, []);

	const handleAddBanner = () => {
		setCurrentBanner(null);
		setIsFormOpen(true);
	};

	const handleEditBanner = (banner: Banner) => {
		setCurrentBanner(banner);
		setIsFormOpen(true);
	};

	const handleDeleteBanner = (id: string, title: string) => {
		setBannerToDelete({ id, title });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!bannerToDelete) return;
		try {
			const response = await fetch(`/api/banner/${bannerToDelete.id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error(`API error: ${response.status}`);
			setBanners(banners.filter((b) => b.id !== bannerToDelete.id));
			toast.success("Banner deleted");
		} catch {
			toast.error("Failed to delete banner");
		} finally {
			setIsDeleteDialogOpen(false);
			setBannerToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/banner/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!response.ok) throw new Error(`API error: ${response.status}`);
			setBanners(
				banners.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
			);
			toast.success("Status updated successfully");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleViewBanner = (banner: Banner) => {
		window.location.href = `/admin/banner/${banner.id}`;
	};

	const handleFormSubmit = async (bannerFormData: BannerFormData) => {
		setIsSubmitting(true);
		const loadingToastId = toast.loading(
			currentBanner?.id ? "Updating banner..." : "Creating banner..."
		);

		let finalImageUrl = bannerFormData.imageUrl; // Use existing URL by default or if explicitly set

		try {
			// 1. Handle image upload if a new file is provided
			if (bannerFormData.imageFile) {
				const imageToastId = toast.loading("Uploading image...");
				const formData = new FormData();
				formData.append("file", bannerFormData.imageFile);

				try {
					const uploadResponse = await fetch("/api/upload/image", {
						// Use generic image upload
						method: "POST",
						body: formData,
					});

					if (!uploadResponse.ok) {
						const errorData = await uploadResponse.json().catch(() => ({}));
						throw new Error(
							errorData.error || errorData.message || "Image upload failed"
						);
					}
					const uploadResult = await uploadResponse.json();
					finalImageUrl = uploadResult.imageUrl; // New uploaded image URL takes precedence
					toast.dismiss(imageToastId);
					toast.success("Image uploaded successfully!");
				} catch (uploadError) {
					toast.dismiss(imageToastId);
					toast.error(
						uploadError instanceof Error
							? uploadError.message
							: "Image upload failed"
					);
					setIsSubmitting(false);
					toast.dismiss(loadingToastId);
					return;
				}
			} else if (
				bannerFormData.imageUrl === null &&
				!bannerFormData.imageFile
			) {
				// If imageFile is not present and imageUrl is explicitly null (cleared by form)
				finalImageUrl = null;
			}
			// If no new imageFile and imageUrl was not cleared, finalImageUrl remains as is from initialData or typed input.

			// 2. Prepare banner data for API (category, type, status use defaults in API)
			const dataToSave = {
				title: bannerFormData.title,
				date: bannerFormData.date,
				description: bannerFormData.description,
				pageSlug: bannerFormData.pageSlug ?? null,
				imageUrl: finalImageUrl,
			};

			const url = currentBanner?.id
				? `/api/banner/${currentBanner.id}`
				: "/api/banner";
			const method = currentBanner?.id ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSave),
			});
			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: "Failed to save banner" }));
				throw new Error(
					errorData.error || errorData.message || "Failed to save banner"
				);
			}
			const savedBanner = await response.json();
			if (currentBanner?.id) {
				setBanners(
					banners.map((b) => (b.id === currentBanner.id ? savedBanner : b))
				);
			} else {
				setBanners([savedBanner, ...banners]);
			}
			toast.dismiss(loadingToastId);
			toast.success(
				currentBanner?.id
					? "Banner updated successfully"
					: "Banner created successfully"
			);
			setIsFormOpen(false);
			setCurrentBanner(null);
		} catch (error: unknown) {
			toast.dismiss(loadingToastId);
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
				toast.error(error.message || "Failed to save banner");
			} else {
				toast.error("Failed to save banner");
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
			<h1 className="text-2xl font-bold mb-6">Page Banners</h1>
			<p className="text-muted-foreground mb-6">
				Control banners for all frontend pages. Assign a banner to a page (e.g.
				Blogs, E-Shop) and set it Active; that page will show this banner.
			</p>

			<BannerTable
				banners={banners}
				setBanners={setBanners}
				onAddBanner={handleAddBanner}
				onEditBanner={handleEditBanner}
				onDeleteBanner={handleDeleteBanner}
				onUpdateStatus={handleUpdateStatus}
				onViewBanner={handleViewBanner}
			/>

			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentBanner?.id ? "Edit Banner" : "Add New Banner"}
						</DialogTitle>
					</DialogHeader>
					<BannerForm
						initialData={currentBanner || undefined}
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
							Are you sure you want to delete this banner? This action cannot be
							undone.
						</p>
						<p className="text-gray-600 mt-2 break-all">
							{bannerToDelete?.title}
						</p>
					</div>
					<div className="flex justify-end gap-2">
						<button
							className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
							onClick={() => setIsDeleteDialogOpen(false)}
						>
							Cancel
						</button>
						<button
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
							onClick={confirmDelete}
						>
							Delete
						</button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
