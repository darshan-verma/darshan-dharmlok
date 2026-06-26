"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, X } from "lucide-react";
import Image from "next/image";
import { PoojaCategory } from "./PoojaCategoryTable";
import LocaleTabs from "@/components/admin/LocaleTabs";
import type { ContentLang } from "@/lib/content-lang";
import { finalizeTranslationsPayload } from "@/lib/admin-locale-sync";
import { ReligiousCategoryPills } from "@/components/admin/ReligiousCategoryPills";
import {
	resolveReligiousCategories,
	type ReligiousCategory,
} from "@/lib/religious-categories";

export type PoojaCategoryFormData = Omit<
	PoojaCategory,
	"id" | "translations"
> & { translations?: unknown };

interface PoojaCategoryFormProps {
	initialData?: Partial<PoojaCategory>;
	onSubmit: (data: PoojaCategoryFormData) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
	title?: string;
}

interface FormErrors {
	name?: string;
	date?: string;
	price?: string;
	details?: string;
	general?: string;
}

export default function PoojaCategoryForm({
	initialData = {},
	onSubmit,
	onCancel,
	isLoading = false,
	title = "Pooja Category Form",
}: PoojaCategoryFormProps) {
	const [contentLocale, setContentLocale] = useState<ContentLang>("en");
	const initialTranslations = initialData.translations as
		| {
				en?: { name?: string; description?: string; details?: string };
				hi?: { name?: string; description?: string; details?: string } | null;
		  }
		| undefined;
	const [enName, setEnName] = useState(
		initialTranslations?.en?.name ?? initialData.name ?? ""
	);
	const [hiName, setHiName] = useState(initialTranslations?.hi?.name ?? "");
	const [enDetails, setEnDetails] = useState(
		initialTranslations?.en?.details ??
			initialTranslations?.en?.description ??
			initialData.details ??
			initialData.description ??
			""
	);
	const [hiDetails, setHiDetails] = useState(
		initialTranslations?.hi?.details ??
			initialTranslations?.hi?.description ??
			""
	);

	const initialReligious = resolveReligiousCategories({
		religiousCategories: initialData.religiousCategories,
	});

	const [formData, setFormData] = useState<Omit<PoojaCategory, "id">>({
		name: initialData.name || "",
		description: initialData.description || "",
		date: initialData.date || "",
		price: initialData.price ?? undefined,
		details: initialData.details || "",
		religiousCategories: initialReligious,
		images: initialData.images || [],
		videos: initialData.videos || [],
	});

	const [formErrors, setFormErrors] = useState<FormErrors>({});
	const [isDirty, setIsDirty] = useState(false);
	const [uploadingImages, setUploadingImages] = useState(false);
	const [uploadingVideos, setUploadingVideos] = useState(false);

	useEffect(() => {
		const tr = initialData.translations as
			| {
					en?: { name?: string; description?: string; details?: string };
					hi?: { name?: string; description?: string; details?: string } | null;
			  }
			| undefined;
		setEnName(tr?.en?.name ?? initialData.name ?? "");
		setHiName(tr?.hi?.name ?? "");
		setEnDetails(
			tr?.en?.details ??
				tr?.en?.description ??
				initialData.details ??
				initialData.description ??
				""
		);
		setHiDetails(tr?.hi?.details ?? tr?.hi?.description ?? "");
		setFormData({
			name: initialData.name || "",
			description: initialData.description || "",
			date: initialData.date || "",
			price: initialData.price ?? undefined,
			details: initialData.details || "",
			religiousCategories: resolveReligiousCategories({
				religiousCategories: initialData.religiousCategories,
			}),
			images: initialData.images || [],
			videos: initialData.videos || [],
		});
		setFormErrors({});
		setIsDirty(false);
		setContentLocale("en");
	}, [
		initialData.id,
		initialData.name,
		initialData.description,
		initialData.details,
		initialData.date,
		initialData.price,
		initialData.translations,
		initialData.religiousCategories,
		initialData.images,
		initialData.videos,
	]);

	const validateForm = useCallback((data: typeof formData): FormErrors => {
		const errors: FormErrors = {};

		// Name validation
		if (!enName.trim()) {
			errors.name = "English pooja name is required";
		} else if (enName.trim().length < 2) {
			errors.name = "Pooja name must be at least 2 characters";
		} else if (enName.trim().length > 100) {
			errors.name = "Pooja name must be less than 100 characters";
		}

		// Date validation (parse YYYY-MM-DD as local date — avoids UTC timezone false negatives)
		if (!data.date) {
			errors.date = "Date is required";
		} else {
			const datePart = data.date.slice(0, 10);
			const [year, month, day] = datePart.split("-").map(Number);
			const selectedDate = new Date(year, month - 1, day);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			if (
				!Number.isFinite(year) ||
				!Number.isFinite(month) ||
				!Number.isFinite(day) ||
				selectedDate.getFullYear() !== year ||
				selectedDate.getMonth() !== month - 1 ||
				selectedDate.getDate() !== day
			) {
				errors.date = "Please enter a valid date";
			} else if (selectedDate < today) {
				errors.date = "Date cannot be in the past";
			}
		}

		// Price validation
		if (data.price !== undefined && data.price !== null) {
			const priceNum = Number(data.price);
			if (isNaN(priceNum)) {
				errors.price = "Please enter a valid price";
			} else if (priceNum < 0) {
				errors.price = "Price cannot be negative";
			} else if (priceNum > 999999) {
				errors.price = "Price cannot exceed ₹999,999";
			}
		}

		// Details validation (optional but with length limit)
		const detailsVal = contentLocale === "en" ? enDetails : hiDetails;
		if (detailsVal && detailsVal.length > 1000) {
			errors.details = "Description must be less than 1000 characters";
		}

		return errors;
	}, [enName, enDetails, hiDetails, contentLocale]);

	const handleImageUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		setUploadingImages(true);
		try {
			const uploadedUrls: string[] = [];
			for (const file of Array.from(files)) {
				const formDataUpload = new FormData();
				formDataUpload.append("file", file);

				const response = await fetch("/api/upload/profile-image", {
					method: "POST",
					body: formDataUpload,
				});

				if (!response.ok) {
					throw new Error(`Failed to upload ${file.name}`);
				}

				const data = await response.json();
				uploadedUrls.push(data.imageUrl);
			}

			setFormData((prev) => ({
				...prev,
				images: [...(prev.images || []), ...uploadedUrls],
			}));
			setIsDirty(true);
		} catch (error) {
			setFormErrors({
				general:
					error instanceof Error ? error.message : "Failed to upload images",
			});
		} finally {
			setUploadingImages(false);
		}
	};

	const handleVideoUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		setUploadingVideos(true);
		try {
			const uploadedUrls: string[] = [];
			for (const file of Array.from(files)) {
				const formDataUpload = new FormData();
				formDataUpload.append("file", file);
				formDataUpload.append("source", "pooja-category");

				const response = await fetch("/api/upload/video", {
					method: "POST",
					body: formDataUpload,
				});

				if (!response.ok) {
					throw new Error(`Failed to upload ${file.name}`);
				}

				const data = await response.json();
				uploadedUrls.push(data.videoUrl);
			}

			setFormData((prev) => ({
				...prev,
				videos: [...(prev.videos || []), ...uploadedUrls],
			}));
			setIsDirty(true);
		} catch (error) {
			setFormErrors({
				general:
					error instanceof Error ? error.message : "Failed to upload videos",
			});
		} finally {
			setUploadingVideos(false);
		}
	};

	const removeImage = (index: number) => {
		setFormData((prev) => ({
			...prev,
			images: prev.images?.filter((_, i) => i !== index) || [],
		}));
		setIsDirty(true);
	};

	const removeVideo = (index: number) => {
		setFormData((prev) => ({
			...prev,
			videos: prev.videos?.filter((_, i) => i !== index) || [],
		}));
		setIsDirty(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const errors = validateForm(formData);
		setFormErrors(errors);

		if (Object.keys(errors).length > 0) {
			return;
		}

		try {
			const record = {
				...formData,
				name: contentLocale === "en" ? enName : hiName,
				description: contentLocale === "en" ? enDetails : hiDetails,
				details: contentLocale === "en" ? enDetails : hiDetails,
				translations: {
					en: {
						name: enName,
						description: enDetails,
						details: enDetails,
					},
					hi:
						hiName.trim() || hiDetails.trim()
							? {
									name: hiName,
									description: hiDetails,
									details: hiDetails,
								}
							: null,
				},
			};
			const translations = finalizeTranslationsPayload(
				record,
				"poojaCategory",
				contentLocale
			);
			await onSubmit({
				...formData,
				name: enName,
				description: enDetails,
				details: enDetails,
				translations,
			});
		} catch (error) {
			setFormErrors({
				general:
					error instanceof Error
						? error.message
						: "Failed to save pooja category. Please try again.",
			});
		}
	};

	const handleInputChange = useCallback(
		(field: keyof typeof formData, value: string | number) => {
			setFormData((prev) => ({
				...prev,
				[field]: value,
			}));

			setIsDirty(true);

			// Clear field-specific error when user starts typing
			if (formErrors[field as keyof FormErrors]) {
				setFormErrors((prev) => ({ ...prev, [field]: undefined }));
			}
		},
		[formErrors]
	);

	const handleCancel = () => {
		if (isDirty) {
			const confirmCancel = window.confirm(
				"You have unsaved changes. Are you sure you want to cancel?"
			);
			if (!confirmCancel) return;
		}
		onCancel();
	};

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					<LocaleTabs
						activeLocale={contentLocale}
						onLocaleChange={setContentLocale}
						translationStatus={
							hiName.trim() || hiDetails.trim()
								? enName.trim()
									? "partial"
									: "none"
								: "none"
						}
					/>
					{formErrors.general && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{formErrors.general}</AlertDescription>
						</Alert>
					)}

					{/* Pooja Name Field */}
					<div className="space-y-2">
						<Label htmlFor="name" className="text-sm font-medium">
							Pooja Name <span className="text-red-500">*</span>
						</Label>
						<Input
							id="name"
							value={contentLocale === "en" ? enName : hiName}
							onChange={(e) => {
								if (contentLocale === "en") setEnName(e.target.value);
								else setHiName(e.target.value);
								setIsDirty(true);
							}}
							placeholder="Enter pooja name"
							className={
								formErrors.name ? "border-red-500 focus:border-red-500" : ""
							}
							aria-invalid={!!formErrors.name}
							aria-describedby={formErrors.name ? "name-error" : undefined}
							disabled={isLoading}
						/>
						{formErrors.name && (
							<p id="name-error" className="text-sm text-red-500" role="alert">
								{formErrors.name}
							</p>
						)}
					</div>

					{/* Description Field */}
					<div className="space-y-2">
						<Label htmlFor="details" className="text-sm font-medium">
							Description
						</Label>
						<Textarea
							id="details"
							value={contentLocale === "en" ? enDetails : hiDetails}
							onChange={(e) => {
								if (contentLocale === "en") setEnDetails(e.target.value);
								else setHiDetails(e.target.value);
								setIsDirty(true);
							}}
							placeholder="Enter pooja description and details"
							rows={4}
							className={
								formErrors.details ? "border-red-500 focus:border-red-500" : ""
							}
							aria-invalid={!!formErrors.details}
							aria-describedby={
								formErrors.details ? "details-error" : undefined
							}
							disabled={isLoading}
						/>
						<div className="flex justify-between text-xs text-gray-500">
							<span>
								{formErrors.details && (
									<span
										id="details-error"
										className="text-red-500"
										role="alert"
									>
										{formErrors.details}
									</span>
								)}
							</span>
							<span>
								{(contentLocale === "en" ? enDetails : hiDetails).length}/1000
							</span>
						</div>
					</div>

					<ReligiousCategoryPills
						value={formData.religiousCategories || []}
						onChange={(value: ReligiousCategory[]) =>
							setFormData((prev) => ({
								...prev,
								religiousCategories: value,
							}))
						}
					/>

					{/* Date Field */}
					<div className="space-y-2">
						<Label htmlFor="date" className="text-sm font-medium">
							Date <span className="text-red-500">*</span>
						</Label>
						<Input
							id="date"
							type="date"
							value={formData.date ? formData.date.slice(0, 10) : ""}
							onChange={(e) => handleInputChange("date", e.target.value)}
							className={
								formErrors.date ? "border-red-500 focus:border-red-500" : ""
							}
							aria-invalid={!!formErrors.date}
							aria-describedby={formErrors.date ? "date-error" : undefined}
							disabled={isLoading}
							min={new Date().toISOString().split("T")[0]}
						/>
						{formErrors.date && (
							<p id="date-error" className="text-sm text-red-500" role="alert">
								{formErrors.date}
							</p>
						)}
					</div>

					{/* Price Field */}
					<div className="space-y-2">
						<Label htmlFor="price" className="text-sm font-medium">
							Price (₹)
						</Label>
						<Input
							id="price"
							type="number"
							inputMode="decimal"
							min={0}
							max={999999}
							step="0.01"
							value={formData.price ?? ""}
							onChange={(e) =>
								handleInputChange(
									"price",
									e.target.value ? Number(e.target.value) : ""
								)
							}
							placeholder="Enter price (e.g. 500.00)"
							className={
								formErrors.price ? "border-red-500 focus:border-red-500" : ""
							}
							aria-invalid={!!formErrors.price}
							aria-describedby={formErrors.price ? "price-error" : undefined}
							disabled={isLoading}
						/>
						{formErrors.price && (
							<p id="price-error" className="text-sm text-red-500" role="alert">
								{formErrors.price}
							</p>
						)}
						<p className="text-xs text-gray-500">
							Leave empty if price varies or is to be determined
						</p>
					</div>

					{/* Images Field */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">Images</Label>
						<div className="space-y-2">
							<Input
								type="file"
								accept="image/*"
								multiple
								onChange={(e) => handleImageUpload(e.target.files)}
								disabled={isLoading || uploadingImages}
								className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							/>
							{uploadingImages && (
								<div className="flex items-center gap-2 text-sm text-blue-600">
									<Loader2 className="h-4 w-4 animate-spin" />
									Uploading images...
								</div>
							)}
							{formData.images && formData.images.length > 0 && (
								<div className="grid grid-cols-4 gap-2 mt-2">
									{formData.images.map((image, index) => (
										<div key={index} className="relative">
											<Image
												src={image}
												alt={`Image ${index + 1}`}
												width={80}
												height={80}
												className="w-full h-20 object-cover rounded"
											/>
											<Button
												type="button"
												variant="destructive"
												size="sm"
												className="absolute -top-2 -right-2 h-6 w-6 p-0"
												onClick={() => removeImage(index)}
												disabled={isLoading}
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Videos Field */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">Videos</Label>
						<div className="space-y-2">
							<Input
								type="file"
								accept="video/*"
								multiple
								onChange={(e) => handleVideoUpload(e.target.files)}
								disabled={isLoading || uploadingVideos}
								className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							/>
							{uploadingVideos && (
								<div className="flex items-center gap-2 text-sm text-blue-600">
									<Loader2 className="h-4 w-4 animate-spin" />
									Uploading videos...
								</div>
							)}
							{formData.videos && formData.videos.length > 0 && (
								<div className="grid grid-cols-4 gap-2 mt-2">
									{formData.videos.map((video, index) => (
										<div key={index} className="relative">
											<video
												src={video}
												className="w-full h-20 object-cover rounded"
												controls={false}
											/>
											<Button
												type="button"
												variant="destructive"
												size="sm"
												className="absolute -top-2 -right-2 h-6 w-6 p-0"
												onClick={() => removeVideo(index)}
												disabled={isLoading}
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Form Actions */}
					<div className="flex justify-end gap-3 pt-4 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isLoading}
							className="min-w-[140px]"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Pooja Category"
							)}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
