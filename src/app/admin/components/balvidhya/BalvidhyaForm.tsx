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
import {
	Balvidhya,
	balvidhyaTypes,
	balvidhyaCategories,
} from "./BalvidhyaTable";

interface BalvidhyaFormProps {
	initialData?: Partial<Balvidhya>;
	onSubmit: (balvidhyaData: Omit<Balvidhya, "id">) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function BalvidhyaForm({
	initialData = {
		name: "",
		description: "",
		type: "",
		category: "",
		status: "Active",
		trending: false,
		thumbnailUrl: "",
		dateAdded: new Date(),
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: BalvidhyaFormProps) {
	const [balvidhyaData, setBalvidhyaData] = useState<Omit<Balvidhya, "id">>({
		name: initialData.name || "",
		description: initialData.description || "",
		type: initialData.type || "",
		category: initialData.category || "",
		status: initialData.status || "Active",
		trending: initialData.trending !== undefined ? initialData.trending : false,
		thumbnailUrl: initialData.thumbnailUrl || "",
		dateAdded: initialData.dateAdded || new Date(),
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: typeof balvidhyaData) => {
		const errors: Record<string, string> = {};

		// Name validation
		if (!data.name?.trim()) {
			errors.name = "Content name is required";
		} else if (data.name.length < 3) {
			errors.name = "Name must be at least 3 characters";
		} else if (data.name.length > 100) {
			errors.name = "Name must be less than 100 characters";
		}

		// Description validation
		if (!data.description?.trim()) {
			errors.description = "Description is required";
		} else if (data.description.length < 10) {
			errors.description = "Description must be at least 10 characters";
		} else if (data.description.length > 500) {
			errors.description = "Description must be less than 500 characters";
		}

		// Type validation
		if (!data.type) {
			errors.type = "Content type is required";
		}

		// Category validation
		if (!data.category) {
			errors.category = "Category is required";
		}

		// Thumbnail URL validation (optional but if provided, should be valid)
		if (data.thumbnailUrl && data.thumbnailUrl.trim()) {
			try {
				new URL(data.thumbnailUrl);
			} catch {
				errors.thumbnailUrl = "Please enter a valid URL";
			}
		}

		return errors;
	};

	const handleSubmit = async () => {
		console.log("Form submit triggered with data:", balvidhyaData);
		const errors = validateForm(balvidhyaData);
		setFormErrors(errors);

		// If there are errors, don't proceed
		if (Object.keys(errors).length > 0) {
			console.log("Form validation errors:", errors);
			return;
		}

		try {
			// Ensure dateAdded is properly set
			const submitData = {
				...balvidhyaData,
				dateAdded: balvidhyaData.dateAdded || new Date(),
			};
			await onSubmit(submitData);
		} catch (error) {
			console.error("Error in form submission:", error);
		}
	};

	const handleInputChange = (
		field: keyof typeof balvidhyaData,
		value: string | boolean | Date
	) => {
		console.log(`Field ${field} changed to:`, value);
		setBalvidhyaData({ ...balvidhyaData, [field]: value });

		// Clear error for this field if it exists
		if (formErrors[field]) {
			setFormErrors({ ...formErrors, [field]: "" });
		}
	};

	return (
		<div className="grid gap-4 py-4">
			{/* Content Name */}
			<div className="space-y-2">
				<Label htmlFor="name">Content Name *</Label>
				<Input
					id="name"
					value={balvidhyaData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter content name"
					className={formErrors.name ? "border-red-500" : ""}
				/>
				{formErrors.name && (
					<p className="text-sm text-red-500">{formErrors.name}</p>
				)}
			</div>

			{/* Description */}
			<div className="space-y-2">
				<Label htmlFor="description">Description *</Label>
				<Textarea
					id="description"
					value={balvidhyaData.description}
					onChange={(e) => handleInputChange("description", e.target.value)}
					placeholder="Enter detailed description of the content"
					rows={4}
					className={formErrors.description ? "border-red-500" : ""}
				/>
				{formErrors.description && (
					<p className="text-sm text-red-500">{formErrors.description}</p>
				)}
				<p className="text-xs text-gray-500">
					{balvidhyaData.description.length}/500 characters
				</p>
			</div>

			{/* Content Type and Category Row */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Content Type */}
				<div className="space-y-2">
					<Label htmlFor="type">Content Type *</Label>
					<Select
						value={balvidhyaData.type}
						onValueChange={(value) => handleInputChange("type", value)}
					>
						<SelectTrigger
							id="type"
							className={formErrors.type ? "border-red-500" : ""}
						>
							<SelectValue placeholder="Select content type" />
						</SelectTrigger>
						<SelectContent>
							{balvidhyaTypes.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{formErrors.type && (
						<p className="text-sm text-red-500">{formErrors.type}</p>
					)}
				</div>

				{/* Category */}
				<div className="space-y-2">
					<Label htmlFor="category">Category *</Label>
					<Select
						value={balvidhyaData.category}
						onValueChange={(value) => handleInputChange("category", value)}
					>
						<SelectTrigger
							id="category"
							className={formErrors.category ? "border-red-500" : ""}
						>
							<SelectValue placeholder="Select category" />
						</SelectTrigger>
						<SelectContent>
							{balvidhyaCategories.map((category) => (
								<SelectItem key={category} value={category}>
									{category}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{formErrors.category && (
						<p className="text-sm text-red-500">{formErrors.category}</p>
					)}
				</div>
			</div>

			{/* Thumbnail URL */}
			<div className="space-y-2">
				<Label htmlFor="thumbnailUrl">Thumbnail URL (Optional)</Label>
				<Input
					id="thumbnailUrl"
					type="url"
					value={balvidhyaData.thumbnailUrl}
					onChange={(e) => handleInputChange("thumbnailUrl", e.target.value)}
					placeholder="https://example.com/image.jpg"
					className={formErrors.thumbnailUrl ? "border-red-500" : ""}
				/>
				{formErrors.thumbnailUrl && (
					<p className="text-sm text-red-500">{formErrors.thumbnailUrl}</p>
				)}
				<p className="text-xs text-gray-500">
					Provide a direct link to the content thumbnail image
				</p>
			</div>

			{/* Status and Trending Row */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Status */}
				<div className="space-y-2">
					<Label htmlFor="status">Status *</Label>
					<Select
						value={balvidhyaData.status}
						onValueChange={(value) => handleInputChange("status", value)}
					>
						<SelectTrigger id="status">
							<SelectValue placeholder="Select status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Active">Active</SelectItem>
							<SelectItem value="Inactive">Inactive</SelectItem>
							<SelectItem value="Draft">Draft</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Trending Checkbox */}
				<div className="space-y-2">
					<Label className="text-sm font-medium">Content Settings</Label>
					<div className="flex items-center space-x-2 py-2">
						<input
							type="checkbox"
							id="trending"
							checked={balvidhyaData.trending}
							onChange={(e) => handleInputChange("trending", e.target.checked)}
							className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
						/>
						<Label
							htmlFor="trending"
							className="text-sm font-medium text-gray-700"
						>
							Mark as Trending
						</Label>
					</div>
				</div>
			</div>

			{/* Date Added (Read-only for existing content) */}
			{initialData.dateAdded && (
				<div className="space-y-2">
					<Label htmlFor="dateAdded">Date Added</Label>
					<Input
						id="dateAdded"
						type="text"
						value={
							balvidhyaData.dateAdded
								? new Date(balvidhyaData.dateAdded).toLocaleDateString(
										"en-IN",
										{
											day: "2-digit",
											month: "short",
											year: "numeric",
										}
								  )
								: ""
						}
						disabled
						className="bg-gray-50"
					/>
					<p className="text-xs text-gray-500">
						Content creation date (automatically set)
					</p>
				</div>
			)}

			{/* Form Actions */}
			<div className="flex justify-end gap-2 mt-6 pt-4 border-t">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Content"}
				</Button>
			</div>

			{/* Form Help Text */}
			<div className="text-xs text-gray-500 mt-2 p-3 bg-gray-50 rounded">
				<p className="font-medium mb-1">Form Guidelines:</p>
				<ul className="space-y-1">
					<li>• All fields marked with (*) are required</li>
					<li>• Name should be descriptive and under 100 characters</li>
					<li>• Description should provide clear content overview</li>
					<li>• Thumbnail URL should be a direct link to an image file</li>
					<li>• Trending content will be featured prominently</li>
				</ul>
			</div>
		</div>
	);
}
