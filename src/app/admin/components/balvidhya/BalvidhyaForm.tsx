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

// These enums match your schema precisely
const balvidhyaTypes = [
	{ value: "video", label: "Video" },
	{ value: "book", label: "Book" },
];

const balvidhyaStatuses = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

const balvidhyaCategories = [
	{ value: "BhagavadGita", label: "Bhagavad Gita" },
	{ value: "Ramayana", label: "Ramayana" },
	{ value: "Mahabharata", label: "Mahabharata" },
	{ value: "Vedas", label: "Vedas" },
	{ value: "Puranas", label: "Puranas" },
	{ value: "Upanishads", label: "Upanishads" },
	{ value: "BhaktiYoga", label: "Bhakti Yoga" },
	{ value: "Other", label: "Other" },
];

// Define the shape of data the form will submit
export interface BalvidhyaSubmitData {
	name: string;
	description: string;
	type: string;
	category: string;
	status: string;
	trending: boolean;
	thumbnailUrl: string | null; // Allow null for clearing
}

interface BalvidhyaFormProps {
	initialData?: Partial<any>; // Accepts the mapped API object (can include dateAdded, id etc. for initialization)
	onSubmit: (balvidhyaData: BalvidhyaSubmitData) => Promise<void>; // onSubmit expects clean data
	onCancel: () => void;
	isLoading?: boolean;
}

export default function BalvidhyaForm({
	initialData = {
		// Default for when initialData prop is undefined
		name: "",
		description: "",
		type: "video",
		category: "Other",
		status: "Active",
		trending: false,
		thumbnailUrl: "",
		// dateAdded: new Date(), // Not strictly needed for form state if not displayed/edited
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: BalvidhyaFormProps) {
	const [balvidhyaData, setBalvidhyaData] = useState({
		// Form's internal state
		name: initialData.name || "",
		description: initialData.description || "",
		type: initialData.type || "video",
		category: initialData.category || "Other",
		status: initialData.status || "Active",
		trending: initialData.trending ?? false,
		thumbnailUrl: initialData.thumbnailUrl || "",
		// dateAdded: initialData.dateAdded || new Date(), // Can keep for internal use if needed, but won't be submitted via BalvidhyaSubmitData
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: typeof balvidhyaData) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Content name is required";
		else if (data.name.length < 3)
			errors.name = "Name must be at least 3 characters";
		else if (data.name.length > 100)
			errors.name = "Name must be less than 100 characters";

		if (!data.description?.trim())
			errors.description = "Description is required";
		else if (data.description.length < 10)
			errors.description = "Description must be at least 10 characters";
		else if (data.description.length > 500)
			errors.description = "Description must be less than 500 characters";

		if (!data.type) errors.type = "Content type is required";
		if (!data.category) errors.category = "Category is required";
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
		const errors = validateForm(balvidhyaData);
		setFormErrors(errors);

		if (Object.keys(errors).length > 0) return;
		try {
			// Prepare data for submission according to BalvidhyaSubmitData
			const dataToSubmit: BalvidhyaSubmitData = {
				name: balvidhyaData.name,
				description: balvidhyaData.description,
				type: balvidhyaData.type,
				status: balvidhyaData.status,
				category: balvidhyaData.category,
				trending: !!balvidhyaData.trending,
				thumbnailUrl: balvidhyaData.thumbnailUrl || null, // Ensure null if empty
			};
			await onSubmit(dataToSubmit);
		} catch (error) {
			console.error("Error in form submission:", error);
			// Optionally, set a general form error here if the submission fails at a higher level
			setFormErrors((prev) => ({
				...prev,
				_submit: "Failed to save content. Please try again.",
			}));
		}
	};

	const handleInputChange = (
		field: keyof typeof balvidhyaData & string, // Allows any key of balvidhyaData state
		value: string | boolean | Date // Accommodate potential date if kept in state
	) => {
		setBalvidhyaData({ ...balvidhyaData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	return (
		<div className="grid gap-4 py-4">
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
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
							{balvidhyaCategories.map((cat) => (
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
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
							{balvidhyaStatuses.map((status) => (
								<SelectItem key={status.value} value={status.value}>
									{status.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
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
			<div className="flex justify-end gap-2 mt-6 pt-4 border-t">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Content"}
				</Button>
			</div>
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
