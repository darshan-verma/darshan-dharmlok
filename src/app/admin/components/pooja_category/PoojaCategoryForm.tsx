"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { PoojaCategory } from "./PoojaCategoryTable";

interface PoojaCategoryFormProps {
	initialData?: Partial<PoojaCategory>;
	onSubmit: (data: Omit<PoojaCategory, "id">) => Promise<void>;
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
	const [formData, setFormData] = useState<Omit<PoojaCategory, "id">>({
		name: initialData.name || "",
		description: initialData.description || "",
		date: initialData.date || "",
		price: initialData.price ?? undefined,
		details: initialData.details || "",
	});

	const [formErrors, setFormErrors] = useState<FormErrors>({});
	const [isDirty, setIsDirty] = useState(false);

	const validateForm = useCallback((data: typeof formData): FormErrors => {
		const errors: FormErrors = {};

		// Name validation
		if (!data.name.trim()) {
			errors.name = "Pooja name is required";
		} else if (data.name.trim().length < 2) {
			errors.name = "Pooja name must be at least 2 characters";
		} else if (data.name.trim().length > 100) {
			errors.name = "Pooja name must be less than 100 characters";
		}

		// Date validation
		if (!data.date) {
			errors.date = "Date is required";
		} else {
			const selectedDate = new Date(data.date);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			if (isNaN(selectedDate.getTime())) {
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
		if (data.details && data.details.length > 1000) {
			errors.details = "Description must be less than 1000 characters";
		}

		return errors;
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const errors = validateForm(formData);
		setFormErrors(errors);

		if (Object.keys(errors).length > 0) {
			return;
		}

		try {
			await onSubmit(formData);
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
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
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
							value={formData.details}
							onChange={(e) => handleInputChange("details", e.target.value)}
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
							<span>{(formData.details ?? "").length}/1000</span>
						</div>
					</div>

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
