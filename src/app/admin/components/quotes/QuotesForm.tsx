"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

// Status options for quotes
const quoteStatuses = [
	{ value: "active", label: "Active" },
	{ value: "inactive", label: "Inactive" },
];

export interface QuoteFormData {
	quote: string;
	date: string;
	status: string;
}

interface QuotesFormProps {
	initialData?: Partial<QuoteFormData>;
	onSubmit: (data: QuoteFormData) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function QuotesForm({
	initialData = {
		quote: "",
		date: "",
		status: "active",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: QuotesFormProps) {
	const [formData, setFormData] = useState<QuoteFormData>({
		quote: initialData.quote || "",
		date: initialData.date || "",
		status: initialData.status || "active",
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: QuoteFormData) => {
		const errors: Record<string, string> = {};
		if (!data.quote?.trim()) errors.quote = "Quote is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSubmit = async () => {
		const errors = validateForm(formData);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;
		try {
			await onSubmit(formData);
		} catch {
			setFormErrors((prev) => ({
				...prev,
				_submit: "Failed to save quote. Please try again.",
			}));
		}
	};

	const handleInputChange = (field: keyof QuoteFormData, value: string) => {
		setFormData({ ...formData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="quote">Quote *</Label>
				<Textarea
					id="quote"
					value={formData.quote}
					onChange={(e) => handleInputChange("quote", e.target.value)}
					placeholder="Enter the quote"
					rows={3}
					className={formErrors.quote ? "border-red-500" : ""}
				/>
				{formErrors.quote && (
					<p className="text-sm text-red-500">{formErrors.quote}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="date">Date *</Label>
				<Input
					id="date"
					type="date"
					value={formData.date}
					onChange={(e) => handleInputChange("date", e.target.value)}
					className={formErrors.date ? "border-red-500" : ""}
				/>
				{formErrors.date && (
					<p className="text-sm text-red-500">{formErrors.date}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={formData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger id="status">
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						{quoteStatuses.map((status) => (
							<SelectItem key={status.value} value={status.value}>
								{status.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{formErrors.status && (
					<p className="text-sm text-red-500">{formErrors.status}</p>
				)}
			</div>
			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Quote"}
				</Button>
			</div>
			{formErrors._submit && (
				<p className="text-sm text-red-500 mt-2">{formErrors._submit}</p>
			)}
		</div>
	);
}
