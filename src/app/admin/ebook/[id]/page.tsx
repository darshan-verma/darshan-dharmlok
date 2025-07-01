"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, BookOpen, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import Image from "next/image";

const ebookTypes = [
	{ value: "pdf", label: "PDF" },
	{ value: "epub", label: "EPUB" },
	{ value: "other", label: "Other" },
];

const ebookCategories = [
	{ value: "spiritual", label: "Spiritual" },
	{ value: "mythology", label: "Mythology" },
	{ value: "biography", label: "Biography" },
	{ value: "children", label: "Children" },
	{ value: "other", label: "Other" },
];

const ebookStatuses = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

type Ebook = {
	id: string;
	title: string;
	date: string;
	description: string;
	type: string;
	category: string;
	detail: string;
	status: string;
	bookFile?: string;
	bookCover?: string; // <-- add bookCover
	createdAt?: string;
	updatedAt?: string;
};

type Errors = {
	title?: string;
	date?: string;
	description?: string;
	type?: string;
	category?: string;
	detail?: string;
	status?: string;
	bookFile?: string;
	bookCover?: string; // <-- add bookCover
};

export default function EbookDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const ebookId = params?.id as string;

	const [ebook, setEbook] = useState<Ebook | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedEbook, setEditedEbook] = useState<Ebook | null>(null);
	const [errors, setErrors] = useState<Errors>({});
	const [isUploadingBook, setIsUploadingBook] = useState(false);
	const [isUploadingBookCover, setIsUploadingBookCover] = useState(false);
	const [showPdf, setShowPdf] = useState(false);
	const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | undefined>(
		undefined
	);
	const pdfIframeRef = useRef<HTMLIFrameElement>(null);

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
				setUploadedPdfUrl(undefined); // Reset uploadedPdfUrl on fetch
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

	const validateForm = (data: Ebook): boolean => {
		const newErrors: Errors = {};
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

	const handleSaveChanges = async () => {
		if (!editedEbook) return;
		if (!validateForm(editedEbook)) return;
		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");
		try {
			const dataToSave = {
				title: editedEbook.title,
				date: editedEbook.date,
				description: editedEbook.description,
				type: editedEbook.type,
				category: editedEbook.category,
				detail: editedEbook.detail,
				status: editedEbook.status,
				bookFile: editedEbook.bookFile || null,
				bookCover: editedEbook.bookCover || null, // <-- ensure bookCover is sent
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
			const { pdfUrl } = await response.json(); // <-- use pdfUrl, not fileUrl
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

	const formatDate = (dateString: string | Date) => {
		if (!dateString) return "N/A";
		const date =
			typeof dateString === "string" ? new Date(dateString) : dateString;
		return new Intl.DateTimeFormat("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		}).format(date);
	};

	const getStatusColor = (status: string) => {
		if (status === "Active") return "bg-green-100 text-green-800";
		return "bg-red-100 text-red-800";
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
				<Card className="md:col-span-1 h-fit">
					<CardHeader className="text-center p-4 pb-2">
						<BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
						<CardTitle className="text-center text-lg">
							{ebook?.title}
						</CardTitle>
						<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
							<span
								className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
									ebook
										? getStatusColor(ebook.status)
										: "bg-red-100 text-red-800"
								}`}
							>
								{ebook?.status || "Unknown"}
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 p-4 pt-0">
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Type:</span>
							<span>{ebook?.type}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Category:</span>
							<span>{ebook?.category}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Date:</span>
							<span>{ebook?.date ? formatDate(ebook.date) : "N/A"}</span>
						</div>
						{(isEditing
							? editedEbook?.bookFile || uploadedPdfUrl
							: ebook?.bookFile) && (
							<div className="flex items-center gap-2 text-sm">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowPdf((v) => !v)}
								>
									{showPdf ? (
										<>
											<EyeOff className="h-4 w-4 mr-1" />
											Hide PDF
										</>
									) : (
										<>
											<Eye className="h-4 w-4 mr-1" />
											View PDF
										</>
									)}
								</Button>
								<a
									href={
										isEditing
											? editedEbook?.bookFile || uploadedPdfUrl
											: ebook?.bookFile
									}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 underline text-xs break-all"
								>
									Download PDF
								</a>
								{isEditing && (editedEbook?.bookFile || uploadedPdfUrl) && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={handleRemoveBookFile}
										title="Remove PDF"
										tabIndex={-1}
									>
										<Trash2 className="h-4 w-4 text-red-500" />
									</Button>
								)}
							</div>
						)}
						{isEditing && (
							<div className="space-y-2">
								<Label htmlFor="bookFile">Book PDF *</Label>
								<div className="relative">
									<Input
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
											className="absolute top-1/2 right-2 -translate-y-1/2"
										>
											<Trash2 className="h-4 w-4 text-red-500" />
										</Button>
									)}
								</div>
								{(editedEbook?.bookFile || uploadedPdfUrl) && (
									<div className="flex items-center gap-2 mt-1">
										<a
											href={editedEbook?.bookFile || uploadedPdfUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-blue-700 underline break-all"
										>
											{(editedEbook?.bookFile || uploadedPdfUrl)
												?.split("/")
												.pop()}
										</a>
									</div>
								)}
								<p className="text-xs text-gray-500">
									Upload a PDF file for the ebook (max 20MB)
								</p>
							</div>
						)}
						{/* Book Cover upload */}
						{isEditing && (
							<div className="space-y-2">
								<Label htmlFor="bookCover">Book Cover (Image)</Label>
								<div className="relative">
									<Input
										id="bookCover"
										type="file"
										accept="image/jpeg,image/jpg,image/png,image/webp"
										onChange={handleBookCoverUpload}
										disabled={isUploadingBookCover}
									/>
									{/* Always show the current cover image if present */}
									{(editedEbook?.bookCover || ebook?.bookCover) && (
										<div className="flex items-center gap-2 mt-2">
											<Image
												src={editedEbook?.bookCover || ebook?.bookCover || ""}
												alt="Book Cover"
												className="w-16 h-20 object-cover rounded border"
											/>
											{(editedEbook?.bookCover || ebook?.bookCover) && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={handleRemoveBookCover}
													title="Remove book cover"
													tabIndex={-1}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											)}
										</div>
									)}
								</div>
								{isUploadingBookCover && (
									<p className="text-xs text-blue-600">
										Uploading book cover...
									</p>
								)}
								<p className="text-xs text-gray-500">
									Upload a cover image for the book (JPEG, PNG, WebP, max 5MB)
								</p>
							</div>
						)}
						{showPdf && (
							<div className="mt-4">
								<iframe
									ref={pdfIframeRef}
									src={
										isEditing
											? editedEbook?.bookFile || uploadedPdfUrl
											: ebook?.bookFile
									}
									title="Ebook PDF"
									width="100%"
									height="600px"
									className="border rounded"
								/>
							</div>
						)}
					</CardContent>
					<CardFooter className="p-4 pt-0">
						<Button
							className="w-full text-sm h-8"
							variant={isEditing ? "outline" : "default"}
							onClick={() => setIsEditing(!isEditing)}
						>
							{isEditing ? "Cancel" : "Edit Ebook"}
						</Button>
					</CardFooter>
				</Card>
				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid grid-cols-2 mb-4">
							<TabsTrigger value="details">Ebook Details</TabsTrigger>
							<TabsTrigger value="pdf">PDF Viewer</TabsTrigger>
						</TabsList>
						<TabsContent value="details" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Ebook Information</CardTitle>
									<CardDescription>
										Update ebook details and metadata.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{isEditing ? (
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="title">Title *</Label>
												<Input
													id="title"
													value={editedEbook?.title || ""}
													onChange={(e) =>
														setEditedEbook((prev) =>
															prev ? { ...prev, title: e.target.value } : prev
														)
													}
													className={errors.title ? "border-red-500" : ""}
												/>
												{errors.title && (
													<p className="text-sm text-red-500">{errors.title}</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="date">Date *</Label>
												<Input
													id="date"
													type="date"
													value={editedEbook?.date || ""}
													onChange={(e) =>
														setEditedEbook((prev) =>
															prev ? { ...prev, date: e.target.value } : prev
														)
													}
													className={errors.date ? "border-red-500" : ""}
												/>
												{errors.date && (
													<p className="text-sm text-red-500">{errors.date}</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="description">Description *</Label>
												<Textarea
													id="description"
													value={editedEbook?.description || ""}
													onChange={(e) =>
														setEditedEbook((prev) =>
															prev
																? { ...prev, description: e.target.value }
																: prev
														)
													}
													rows={3}
													className={errors.description ? "border-red-500" : ""}
												/>
												{errors.description && (
													<p className="text-sm text-red-500">
														{errors.description}
													</p>
												)}
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="type">Type *</Label>
													<Select
														value={editedEbook?.type || ""}
														onValueChange={(value) =>
															setEditedEbook((prev) =>
																prev ? { ...prev, type: value } : prev
															)
														}
													>
														<SelectTrigger
															id="type"
															className={errors.type ? "border-red-500" : ""}
														>
															<SelectValue placeholder="Select type" />
														</SelectTrigger>
														<SelectContent>
															{ebookTypes.map((type) => (
																<SelectItem key={type.value} value={type.value}>
																	{type.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													{errors.type && (
														<p className="text-sm text-red-500">
															{errors.type}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="category">Category *</Label>
													<Select
														value={editedEbook?.category || ""}
														onValueChange={(value) =>
															setEditedEbook((prev) =>
																prev ? { ...prev, category: value } : prev
															)
														}
													>
														<SelectTrigger
															id="category"
															className={
																errors.category ? "border-red-500" : ""
															}
														>
															<SelectValue placeholder="Select category" />
														</SelectTrigger>
														<SelectContent>
															{ebookCategories.map((cat) => (
																<SelectItem key={cat.value} value={cat.value}>
																	{cat.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													{errors.category && (
														<p className="text-sm text-red-500">
															{errors.category}
														</p>
													)}
												</div>
											</div>
											<div className="space-y-2">
												<Label htmlFor="detail">Detail *</Label>
												<Textarea
													id="detail"
													value={editedEbook?.detail || ""}
													onChange={(e) =>
														setEditedEbook((prev) =>
															prev ? { ...prev, detail: e.target.value } : prev
														)
													}
													rows={3}
													className={errors.detail ? "border-red-500" : ""}
												/>
												{errors.detail && (
													<p className="text-sm text-red-500">
														{errors.detail}
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="status">Status *</Label>
												<Select
													value={editedEbook?.status || ""}
													onValueChange={(value) =>
														setEditedEbook((prev) =>
															prev ? { ...prev, status: value } : prev
														)
													}
												>
													<SelectTrigger id="status">
														<SelectValue placeholder="Select status" />
													</SelectTrigger>
													<SelectContent>
														{ebookStatuses.map((status) => (
															<SelectItem
																key={status.value}
																value={status.value}
															>
																{status.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="bookFile">Book PDF *</Label>
												<div className="relative">
													<Input
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
															className="absolute top-1/2 right-2 -translate-y-1/2"
														>
															<Trash2 className="h-4 w-4 text-red-500" />
														</Button>
													)}
												</div>
												{(editedEbook?.bookFile || uploadedPdfUrl) && (
													<div className="flex items-center gap-2 mt-1">
														<a
															href={editedEbook?.bookFile || uploadedPdfUrl}
															target="_blank"
															rel="noopener noreferrer"
															className="text-xs text-blue-700 underline break-all"
														>
															{(editedEbook?.bookFile || uploadedPdfUrl)
																?.split("/")
																.pop()}
														</a>
													</div>
												)}
												{errors.bookFile && (
													<p className="text-sm text-red-500">
														{errors.bookFile}
													</p>
												)}
												<p className="text-xs text-gray-500">
													Upload a PDF file for the ebook (max 20MB)
												</p>
											</div>
											<div className="space-y-2">
												<Label htmlFor="bookCover">Book Cover (Image)</Label>
												<div className="relative">
													<Input
														id="bookCover"
														type="file"
														accept="image/jpeg,image/jpg,image/png,image/webp"
														onChange={handleBookCoverUpload}
														disabled={isUploadingBookCover}
													/>
													{/* Always show the current cover image if present */}
													{(editedEbook?.bookCover || ebook?.bookCover) && (
														<div className="flex items-center gap-2 mt-2">
															<Image
																src={editedEbook?.bookCover || ebook?.bookCover || ""}
																alt="Book Cover"
																className="w-16 h-20 object-cover rounded border"
															/>
															{(editedEbook?.bookCover || ebook?.bookCover) && (
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	onClick={handleRemoveBookCover}
																	title="Remove book cover"
																	tabIndex={-1}
																>
																	<Trash2 className="h-4 w-4 text-red-500" />
																</Button>
															)}
														</div>
													)}
												</div>
												{isUploadingBookCover && (
													<p className="text-xs text-blue-600">
														Uploading book cover...
													</p>
												)}
												<p className="text-xs text-gray-500">
													Upload a cover image for the book (JPEG, PNG, WebP,
													max 5MB)
												</p>
											</div>
										</div>
									) : (
										<div className="space-y-6">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Title
													</h3>
													<p className="font-medium text-foreground">
														{ebook?.title}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Type
													</h3>
													<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
														{ebook?.type}
													</span>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Category
													</h3>
													<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
														{ebook?.category}
													</span>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Status
													</h3>
													<span
														className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
															ebook?.status || ""
														)}`}
													>
														{ebook?.status}
													</span>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Date
													</h3>
													<p className="font-medium text-foreground">
														{ebook?.date ? formatDate(ebook.date) : "N/A"}
													</p>
												</div>
											</div>
											<div className="space-y-2 pt-2 border-t border-border">
												<h3 className="text-sm font-medium text-muted-foreground">
													Description
												</h3>
												<p className="font-medium text-foreground whitespace-pre-wrap">
													{ebook?.description || "No description provided"}
												</p>
											</div>
											<div className="space-y-2 pt-2 border-t border-border">
												<h3 className="text-sm font-medium text-muted-foreground">
													Detail
												</h3>
												<p className="font-medium text-foreground whitespace-pre-wrap">
													{ebook?.detail || "No detail provided"}
												</p>
											</div>
											{ebook?.bookFile && (
												<div className="space-y-2 pt-2 border-t border-border">
													<h3 className="text-sm font-medium text-muted-foreground">
														Book PDF
													</h3>
													<a
														href={ebook.bookFile}
														target="_blank"
														rel="noopener noreferrer"
														className="text-blue-600 underline break-all"
													>
														{ebook.bookFile}
													</a>
												</div>
											)}
											{ebook?.bookCover && (
												<div className="space-y-2 pt-2 border-t border-border">
													<h3 className="text-sm font-medium text-muted-foreground">
														Book Cover
													</h3>
													<div className="w-24 h-32 rounded-lg overflow-hidden border">
														<Image
															src={ebook.bookCover}
															alt="Book Cover"
															className="w-full h-full object-cover"
														/>
													</div>
												</div>
											)}
										</div>
									)}
								</CardContent>
								{isEditing && (
									<CardFooter>
										<Button onClick={handleSaveChanges} disabled={isSaving}>
											{isSaving ? (
												<>
													<svg
														className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
													>
														<circle
															className="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															strokeWidth="4"
														></circle>
														<path
															className="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														></path>
													</svg>
													Saving...
												</>
											) : (
												<>
													<Save className="h-4 w-4 mr-2" />
													Save Changes
												</>
											)}
										</Button>
									</CardFooter>
								)}
							</Card>
						</TabsContent>
						<TabsContent value="pdf" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>PDF Viewer</CardTitle>
									<CardDescription>
										View the uploaded PDF ebook here.
									</CardDescription>
								</CardHeader>
								<CardContent>
									{(
										isEditing
											? editedEbook?.bookFile || uploadedPdfUrl
											: ebook?.bookFile
									) ? (
										<iframe
											ref={pdfIframeRef}
											src={
												isEditing
													? editedEbook?.bookFile || uploadedPdfUrl
													: ebook?.bookFile
											}
											title="Ebook PDF"
											width="100%"
											height="600px"
											className="border rounded"
										/>
									) : (
										<p className="text-gray-500">
											No PDF uploaded for this ebook.
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
