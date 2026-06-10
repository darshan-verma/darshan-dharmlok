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
import { AudioLibrary } from "./AudioLibraryTable";
import { ReligiousCategoryPills } from "@/components/admin/ReligiousCategoryPills";
import {
	resolveReligiousCategories,
	type ReligiousCategory,
} from "@/lib/religious-categories";

interface AudioLibraryFormProps {
	initialData?: Partial<AudioLibrary>;
	onSubmit: (audioLibraryData: Omit<AudioLibrary, "id">) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

const categories = [
	"Bhajan",
	"Kirtan",
	"Mantra",
	"Spiritual",
	"Devotional",
	"Other",
];

const statusOptions = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

export default function AudioLibraryForm({
	initialData = {
		name: "",
		date: "",
		category: "",
		status: "Active",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: AudioLibraryFormProps) {
	const initialReligious = resolveReligiousCategories({
		religiousCategories: initialData.religiousCategories,
	});

	const [audioLibraryData, setAudioLibraryData] = useState<
		Omit<AudioLibrary, "id">
	>({
		name: initialData.name || "",
		date: initialData.date || "",
		category: initialData.category || "",
		status: initialData.status || "Active",
		religiousCategories: initialReligious,
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: typeof audioLibraryData) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Name is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.category?.trim()) errors.category = "Category is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSubmit = async () => {
		const errors = validateForm(audioLibraryData);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;
		try {
			await onSubmit(audioLibraryData);
		} catch (error) {
			console.error("Error in form submission:", error);
		}
	};

	const handleInputChange = (
		field: keyof typeof audioLibraryData,
		value: string | ReligiousCategory[]
	) => {
		setAudioLibraryData({ ...audioLibraryData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="name">Audio Library Name *</Label>
				<Input
					id="name"
					value={audioLibraryData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter audio library name"
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
					value={audioLibraryData.date}
					onChange={(e) => handleInputChange("date", e.target.value)}
					className={formErrors.date ? "border-red-500" : ""}
				/>
				{formErrors.date && (
					<p className="text-sm text-red-500">{formErrors.date}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="category">Category *</Label>
				<Select
					value={audioLibraryData.category}
					onValueChange={(value) => handleInputChange("category", value)}
				>
					<SelectTrigger
						id="category"
						className={formErrors.category ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select category" />
					</SelectTrigger>
					<SelectContent>
						{categories.map((cat) => (
							<SelectItem key={cat} value={cat}>
								{cat}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{formErrors.category && (
					<p className="text-sm text-red-500">{formErrors.category}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={audioLibraryData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger id="status">
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						{statusOptions.map((status) => (
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
			<ReligiousCategoryPills
				value={audioLibraryData.religiousCategories || []}
				onChange={(value) => handleInputChange("religiousCategories", value)}
			/>
			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Audio Library"}
				</Button>
			</div>
		</div>
	);
}
