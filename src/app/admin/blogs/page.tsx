"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import BlogTable, { Blog } from "../components/blogs/BlogTable";
import BlogForm, { BlogFormData } from "../components/blogs/BlogForm";

interface ApiErrorResponse {
	details?: Record<string, unknown> | string[];
	message?: string;
}

export default function BlogsPage() {
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentBlog, setCurrentBlog] = useState<Partial<Blog> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [blogToDelete, setBlogToDelete] = useState<{
		id: string;
		title: string;
	} | null>(null);

	// Fetch blogs on mount
	useEffect(() => {
		const fetchBlogs = async () => {
			setLoading(true);
			try {
				const response = await fetch(`/api/blogs`);
				if (!response.ok) throw new Error(`API error: ${response.status}`);
				const data = await response.json();
				setBlogs(data.content || []);
			} catch {
				toast.error("Failed to load blogs");
			} finally {
				setLoading(false);
			}
		};
		fetchBlogs();
	}, []);

	const handleAddBlog = () => {
		setCurrentBlog(null);
		setIsFormOpen(true);
	};

	const handleEditBlog = (blog: Blog) => {
		// Transform Blog data to BlogFormData format for the form
		const formData: Partial<BlogFormData> = {
			title: blog.title,
			content: blog.content,
			status: blog.status,
			coverImageUrl: blog.coverImage || null,
			bannerImageUrl: blog.bannerImage || null,
		};
		setCurrentBlog(formData);
		setIsFormOpen(true);
	};

	const handleDeleteBlog = (id: string, title: string) => {
		setBlogToDelete({ id, title });
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!blogToDelete) return;
		try {
			const response = await fetch(`/api/blogs/${blogToDelete.id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error(`API error: ${response.status}`);
			setBlogs(blogs.filter((b) => b.id !== blogToDelete.id));
			toast.success("Blog deleted");
		} catch {
			toast.error("Failed to delete blog");
		} finally {
			setIsDeleteDialogOpen(false);
			setBlogToDelete(null);
		}
	};

	const handleUpdateStatus = async (id: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/blogs/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!response.ok) throw new Error(`API error: ${response.status}`);
			setBlogs(
				blogs.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
			);
			toast.success("Status updated successfully");
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleFormSubmit = async (blogFormData: BlogFormData) => {
		setIsSubmitting(true);
		const loadingToastId = toast.loading(
			currentBlog?.id ? "Updating blog..." : "Creating blog..."
		);

		let finalCoverImageUrl = blogFormData.coverImageUrl; // Use existing URL by default or if explicitly set
		let finalBannerImageUrl = blogFormData.bannerImageUrl; // Use existing URL by default or if explicitly set

		try {
			// 1. Handle cover image upload if a new file is provided
			if (blogFormData.coverImageFile) {
				const imageToastId = toast.loading("Uploading cover image...");
				const formData = new FormData();
				formData.append("file", blogFormData.coverImageFile);

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
								"Cover image upload failed"
						);
					}
					const uploadResult = await uploadResponse.json();
					finalCoverImageUrl = uploadResult.imageUrl; // New uploaded image URL takes precedence
					toast.dismiss(imageToastId);
					toast.success("Cover image uploaded successfully!");
				} catch (uploadError) {
					toast.dismiss(imageToastId);
					toast.error(
						uploadError instanceof Error
							? uploadError.message
							: "Cover image upload failed"
					);
					setIsSubmitting(false);
					toast.dismiss(loadingToastId);
					return;
				}
			} else if (
				blogFormData.coverImageUrl === null &&
				!blogFormData.coverImageFile
			) {
				// If coverImageFile is not present and coverImageUrl is explicitly null (cleared by form)
				finalCoverImageUrl = null;
			}

			// 2. Handle banner image upload if a new file is provided
			if (blogFormData.bannerImageFile) {
				const imageToastId = toast.loading("Uploading banner image...");
				const formData = new FormData();
				formData.append("file", blogFormData.bannerImageFile);

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
								"Banner image upload failed"
						);
					}
					const uploadResult = await uploadResponse.json();
					finalBannerImageUrl = uploadResult.imageUrl; // New uploaded image URL takes precedence
					toast.dismiss(imageToastId);
					toast.success("Banner image uploaded successfully!");
				} catch (uploadError) {
					toast.dismiss(imageToastId);
					toast.error(
						uploadError instanceof Error
							? uploadError.message
							: "Banner image upload failed"
					);
					setIsSubmitting(false);
					toast.dismiss(loadingToastId);
					return;
				}
			} else if (
				blogFormData.bannerImageUrl === null &&
				!blogFormData.bannerImageFile
			) {
				// If bannerImageFile is not present and bannerImageUrl is explicitly null (cleared by form)
				finalBannerImageUrl = null;
			}

			// 3. Prepare blog data for API
			const dataToSave = {
				title: blogFormData.title,
				content: blogFormData.content,
				status: blogFormData.status,
				coverImage: finalCoverImageUrl, // Use the potentially updated cover image URL
				bannerImage: finalBannerImageUrl, // Use the potentially updated banner image URL
			};

			const url = currentBlog?.id
				? `/api/blogs/${currentBlog.id}`
				: "/api/blogs";
			const method = currentBlog?.id ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSave),
			});
			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: "Failed to save blog" }));
				throw new Error(
					errorData.error || errorData.message || "Failed to save blog"
				);
			}
			const savedBlog = await response.json();
			if (currentBlog?.id) {
				setBlogs(blogs.map((b) => (b.id === currentBlog.id ? savedBlog : b)));
			} else {
				setBlogs([savedBlog, ...blogs]);
			}
			toast.dismiss(loadingToastId);
			toast.success(
				currentBlog?.id
					? "Blog updated successfully"
					: "Blog created successfully"
			);
			setIsFormOpen(false);
			setCurrentBlog(null);
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
				toast.error(error.message || "Failed to save blog");
			} else {
				toast.error("Failed to save blog");
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
			<h1 className="text-2xl font-bold mb-6">Blog Management</h1>

			<BlogTable
				blogs={blogs}
				setBlogs={setBlogs}
				onAddBlog={handleAddBlog}
				onEditBlog={handleEditBlog}
				onDeleteBlog={handleDeleteBlog}
				onUpdateStatus={handleUpdateStatus}
			/>

			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentBlog?.id ? "Edit Blog" : "Add New Blog"}
						</DialogTitle>
					</DialogHeader>
					<BlogForm
						initialData={currentBlog || undefined}
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
							Are you sure you want to delete this blog? This action cannot be
							undone.
						</p>
						<p className="text-gray-600 mt-2 break-all">
							{blogToDelete?.title}
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
