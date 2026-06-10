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
import { Yoga } from "./YogaTable";
import { ReligiousCategoryPills } from "@/components/admin/ReligiousCategoryPills";
import {
	resolveReligiousCategories,
	type ReligiousCategory,
} from "@/lib/religious-categories";

interface YogaFormProps {
	initialData?: Partial<Yoga>;
	onSubmit: (
		yogaData: Omit<Yoga, "id" | "createdAt" | "updatedAt">
	) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function YogaForm({
	initialData = {
		name: "",
		date: new Date(),
		description: "",
		status: "Active",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: YogaFormProps) {
	const initialReligious = resolveReligiousCategories({
		religiousCategories: initialData.religiousCategories,
	});

	const [yogaData, setYogaData] = useState<
		Omit<Yoga, "id" | "createdAt" | "updatedAt">
	>({
		name: initialData.name || "",
		date: initialData.date || new Date(),
		description: initialData.description || "",
		religiousCategories: initialReligious,
		status: initialData.status || "Active",
		images: initialData.images || [],
		videos: initialData.videos || [],
		coverImage: initialData.coverImage || "",
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [buttonLoading, setButtonLoading] = useState(false);

	const validateForm = (data: typeof yogaData) => {
		const errors: Record<string, string> = {};

		// Name validation
		if (!data.name?.trim()) {
			errors.name = "Name is required";
		} else if (data.name.length < 2) {
			errors.name = "Name must be at least 2 characters";
		}

		// Description validation
		if (!data.description?.trim()) {
			errors.description = "Description is required";
		} else if (data.description.length < 10) {
			errors.description = "Description must be at least 10 characters";
		}

		// Date validation
		if (!data.date) {
			errors.date = "Date is required";
		}

		return errors;
	};

	const handleSubmit = async () => {
		if (buttonLoading) return;
		setButtonLoading(true);
		const errors = validateForm(yogaData);
		setFormErrors(errors);

		// If there are errors, don't proceed
		if (Object.keys(errors).length > 0) {
			setButtonLoading(false);
			return;
		}

		try {
			await onSubmit(yogaData);
		} catch (error) {
			console.error("Error in form submission:", error);
		} finally {
			setButtonLoading(false);
		}
	};

	const handleInputChange = (
		field: keyof typeof yogaData,
		value: string | Date | ReligiousCategory[]
	) => {
		setYogaData({ ...yogaData, [field]: value });

		// Clear error for this field if it exists
		if (formErrors[field]) {
			setFormErrors({ ...formErrors, [field]: "" });
		}
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="name">Yoga Name *</Label>
				<Input
					id="name"
					value={yogaData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter yoga name"
					className={formErrors.name ? "border-red-500" : ""}
				/>
				{formErrors.name && (
					<p className="text-sm text-red-500">{formErrors.name}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="date">Date *</Label>
				<Input
					id="date"
					type="date"
					value={
						yogaData.date instanceof Date
							? yogaData.date.toISOString().split("T")[0]
							: ""
					}
					onChange={(e) => handleInputChange("date", new Date(e.target.value))}
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
					value={yogaData.description}
					onChange={(e) => handleInputChange("description", e.target.value)}
					placeholder="Enter yoga description"
					rows={4}
					className={formErrors.description ? "border-red-500" : ""}
				/>
				{formErrors.description && (
					<p className="text-sm text-red-500">{formErrors.description}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={yogaData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger id="status">
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Active">Active</SelectItem>
						<SelectItem value="Inactive">Inactive</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<ReligiousCategoryPills
				value={yogaData.religiousCategories || []}
				onChange={(value) => handleInputChange("religiousCategories", value)}
			/>

			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					type="submit"
					onClick={handleSubmit}
					disabled={isLoading || buttonLoading}
				>
					{isLoading || buttonLoading ? "Saving..." : "Save Yoga"}
				</Button>
			</div>
		</div>
	);
}
