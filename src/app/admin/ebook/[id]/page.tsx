"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import EbookProfileCard from "@/app/admin/components/ebook/EbookProfileCard";
import EbookInfoCard from "@/app/admin/components/ebook/EbookInfoCard";
import EbookPdfViewer from "@/app/admin/components/ebook/EbookPdfViewer";
import EbookForm from "@/app/admin/components/ebook/EbookForm";
import { Ebook, EbookErrors } from "@/app/admin/components/ebook/types";

export default function EbookDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const ebookId = params?.id as string;

	const [ebook, setEbook] = useState<Ebook | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedEbook, setEditedEbook] = useState<Ebook | null>(null);
	const [errors, setErrors] = useState<EbookErrors>({});
	const [isUploadingBook, setIsUploadingBook] = useState(false);
	const [isUploadingBookCover, setIsUploadingBookCover] = useState(false);
	const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | undefined>(
		undefined
	);

	// Fetch ebook data
	const fetchEbookData = useCallback(async () => {
		try {
			if (ebookId && !/^[0-9a-fA-F]{24}$/.test(ebookId)) {
				toast.error("Invalid Ebook ID format");
				router.push("/admin/ebook");
				return;
			}
			const loadingToast = toast.loading("Loading ebook details...");
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);
			try {
				const response = await fetch(`/api/ebook/${ebookId}`, {
					signal: controller.signal,
				});
				clearTimeout(timeoutId);
				if (!response.ok) throw new Error("Failed to fetch ebook");
				const ebookData = await response.json();
				setEbook(ebookData);
				setEditedEbook({ ...ebookData });
				setUploadedPdfUrl(undefined);
				toast.dismiss(loadingToast);
			} catch (error) {
				clearTimeout(timeoutId);
				throw error;
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to load ebook details"
			);
			router.push("/admin/ebook");
		}
	}, [ebookId, router]);

	useEffect(() => {
		if (ebookId) fetchEbookData();
	}, [ebookId, fetchEbookData]);

	// --- Handlers for book file and cover upload ---
	const handleBookUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (file.type !== "application/pdf") {
			toast.error("Please select a valid PDF file");
			return;
		}
		const maxSize = 20 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error("PDF size must be less than 20MB");
			return;
		}
		setIsUploadingBook(true);
		const loadingToast = toast.loading("Uploading PDF...");
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("ebookId", ebookId);
			const response = await fetch("/api/upload/pdf", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) throw new Error("Failed to upload PDF");
			const { pdfUrl } = await response.json();
			setEditedEbook((prev) => (prev ? { ...prev, bookFile: pdfUrl } : null));
			setUploadedPdfUrl(pdfUrl);
			toast.dismiss(loadingToast);
			toast.success("PDF uploaded successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to upload PDF"
			);
		} finally {
			setIsUploadingBook(false);
		}
	};

	const handleBookCoverUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		if (!validTypes.includes(file.type)) {
			toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
			return;
		}
		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error("Image size must be less than 5MB");
			return;
		}
		setIsUploadingBookCover(true);
		const loadingToast = toast.loading("Uploading book cover...");
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("ebookId", ebookId);
			const response = await fetch("/api/upload/profile-image", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) throw new Error("Failed to upload book cover");
			const { imageUrl } = await response.json();
			setEditedEbook((prev) =>
				prev ? { ...prev, bookCover: imageUrl } : null
			);
			toast.dismiss(loadingToast);
			toast.success("Book cover uploaded successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to upload book cover"
			);
		} finally {
			setIsUploadingBookCover(false);
		}
	};

	const handleRemoveBookFile = () => {
		setEditedEbook((prev) => (prev ? { ...prev, bookFile: "" } : null));
		setUploadedPdfUrl(undefined);
		toast.success("PDF removed");
	};

	const handleRemoveBookCover = () => {
		setEditedEbook((prev) => (prev ? { ...prev, bookCover: "" } : null));
		toast.success("Book cover removed");
	};

	// --- Save changes handler ---
	const validateForm = (data: Ebook): boolean => {
		const newErrors: EbookErrors = {};
		if (!data.title?.trim()) newErrors.title = "Title is required";
		if (!data.date?.trim()) newErrors.date = "Date is required";
		if (!data.description?.trim())
			newErrors.description = "Description is required";
		if (!data.type) newErrors.type = "Type is required";
		if (!data.category) newErrors.category = "Category is required";
		if (!data.detail?.trim()) newErrors.detail = "Detail is required";
		if (!data.status) newErrors.status = "Status is required";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSaveChanges = async (formData: Partial<Ebook>) => {
		if (!editedEbook) return;
		const merged = { ...editedEbook, ...formData };
		if (!validateForm(merged)) return;
		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");
		try {
			const dataToSave = {
				title: merged.title,
				date: merged.date,
				description: merged.description,
				type: merged.type,
				category: merged.category,
				detail: merged.detail,
				status: merged.status,
				bookFile: merged.bookFile || null,
				bookCover: merged.bookCover || null,
			};
			const response = await fetch(`/api/ebook/${ebookId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSave),
			});
			if (!response.ok) throw new Error("Failed to update ebook");
			const updatedEbook = await response.json();
			setEbook(updatedEbook);
			setEditedEbook(updatedEbook);
			setUploadedPdfUrl(undefined);
			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("Ebook updated successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to update ebook"
			);
		} finally {
			setIsSaving(false);
		}
	};

	// When entering edit mode, always use the latest ebook.bookFile as the initial value
	useEffect(() => {
		if (isEditing && ebook) {
			setEditedEbook({ ...ebook });
			setUploadedPdfUrl(undefined);
		}
	}, [isEditing, ebook]);

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/ebook")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Ebook Details</h1>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Profile Card (cover, status, upload) */}
				<EbookProfileCard
					ebook={ebook}
					editedEbook={editedEbook}
					isEditing={isEditing}
					isUploadingBookCover={isUploadingBookCover}
					handleBookCoverUpload={handleBookCoverUpload}
					handleRemoveBookCover={handleRemoveBookCover}
					isUploadingBook={isUploadingBook}
					handleBookUpload={handleBookUpload}
					handleRemoveBookFile={handleRemoveBookFile}
				/>
				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid grid-cols-2 mb-4">
							<TabsTrigger value="details">Ebook Details</TabsTrigger>
							<TabsTrigger value="pdf">PDF Viewer</TabsTrigger>
						</TabsList>
						<TabsContent value="details" className="space-y-4">
							{isEditing && editedEbook ? (
								<EbookForm
									initialData={editedEbook}
									onSubmit={async (data) => {
										await handleSaveChanges(data);
									}}
									onCancel={() => setIsEditing(false)}
									isLoading={isSaving}
									errors={errors}
								/>
							) : (
								<EbookInfoCard ebook={ebook} />
							)}
							{!isEditing && (
								<Button className="mt-4" onClick={() => setIsEditing(true)}>
									Edit Ebook
								</Button>
							)}
						</TabsContent>
						<TabsContent value="pdf" className="space-y-4">
							<EbookPdfViewer
								pdfUrl={
									isEditing
										? editedEbook?.bookFile || uploadedPdfUrl
										: ebook?.bookFile
								}
							/>
							{isEditing && (
								<div className="mt-4">
									<label htmlFor="bookFile">Book PDF *</label>
									<input
										id="bookFile"
										type="file"
										accept="application/pdf"
										onChange={handleBookUpload}
										disabled={isUploadingBook}
									/>
									{(editedEbook?.bookFile || uploadedPdfUrl) && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={handleRemoveBookFile}
											title="Remove PDF"
											tabIndex={-1}
											className="ml-2"
										>
											Remove PDF
										</Button>
									)}
								</div>
							)}
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
