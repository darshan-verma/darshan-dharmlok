"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// These should match your EbookTable columns/types
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

export interface EbookFormData {
	title: string;
	date: string;
	description: string;
	type: string;
	category: string;
	detail: string;
	status: string;
}

interface EbookFormProps {
	initialData?: Partial<EbookFormData>;
	onSubmit: (ebookData: EbookFormData) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function EbookForm({
	initialData = {
		title: "",
		date: "",
		description: "",
		type: "",
		category: "",
		detail: "",
		status: "Active",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: EbookFormProps) {
	const [ebookData, setEbookData] = useState<EbookFormData>({
		title: initialData.title || "",
		date: initialData.date || "",
		description: initialData.description || "",
		type: initialData.type || "",
		category: initialData.category || "",
		detail: initialData.detail || "",
		status: initialData.status || "Active",
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: EbookFormData) => {
		const errors: Record<string, string> = {};
		if (!data.title?.trim()) errors.title = "Title is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.description?.trim())
			errors.description = "Description is required";
		if (!data.type) errors.type = "Type is required";
		if (!data.category) errors.category = "Category is required";
		if (!data.detail?.trim()) errors.detail = "Detail is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSubmit = async () => {
		const errors = validateForm(ebookData);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;
		try {
			await onSubmit(ebookData);
		} catch {
			setFormErrors((prev) => ({
				...prev,
				_submit: "Failed to save ebook. Please try again.",
			}));
		}
	};

	const handleInputChange = (field: keyof EbookFormData, value: string) => {
		setEbookData({ ...ebookData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="title">Title *</Label>
				<Input
					id="title"
					value={ebookData.title}
					onChange={(e) => handleInputChange("title", e.target.value)}
					placeholder="Enter ebook title"
					className={formErrors.title ? "border-red-500" : ""}
				/>
				{formErrors.title && (
					<p className="text-sm text-red-500">{formErrors.title}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="date">Date *</Label>
				<Input
					id="date"
					type="date"
					value={ebookData.date}
					onChange={(e) => handleInputChange("date", e.target.value)}
					className={formErrors.date ? "border-red-500" : ""}
				/>
				{formErrors.date && (
					<p className="text-sm text-red-500">{formErrors.date}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">Description *</Label>
				<Textarea
					id="description"
					value={ebookData.description}
					onChange={(e) => handleInputChange("description", e.target.value)}
					placeholder="Enter ebook description"
					rows={3}
					className={formErrors.description ? "border-red-500" : ""}
				/>
				{formErrors.description && (
					<p className="text-sm text-red-500">{formErrors.description}</p>
				)}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="type">Type *</Label>
					<Select
						value={ebookData.type}
						onValueChange={(value) => handleInputChange("type", value)}
					>
						<SelectTrigger
							id="type"
							className={formErrors.type ? "border-red-500" : ""}
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
					{formErrors.type && (
						<p className="text-sm text-red-500">{formErrors.type}</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="category">Category *</Label>
					<Select
						value={ebookData.category}
						onValueChange={(value) => handleInputChange("category", value)}
					>
						<SelectTrigger
							id="category"
							className={formErrors.category ? "border-red-500" : ""}
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
					{formErrors.category && (
						<p className="text-sm text-red-500">{formErrors.category}</p>
					)}
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="detail">Detail *</Label>
				<Textarea
					id="detail"
					value={ebookData.detail}
					onChange={(e) => handleInputChange("detail", e.target.value)}
					placeholder="Enter ebook detail"
					rows={3}
					className={formErrors.detail ? "border-red-500" : ""}
				/>
				{formErrors.detail && (
					<p className="text-sm text-red-500">{formErrors.detail}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={ebookData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger id="status">
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						{ebookStatuses.map((status) => (
							<SelectItem key={status.value} value={status.value}>
								{status.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Ebook"}
				</Button>
			</div>
			{formErrors._submit && (
				<p className="text-sm text-red-500 mt-2">{formErrors._submit}</p>
			)}
		</div>
	);
}
