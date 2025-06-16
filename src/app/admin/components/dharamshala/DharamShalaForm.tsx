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
import { Dharamshala } from "./DharamShalaTable";

interface DharamshalaFormProps {
	initialData?: Partial<Dharamshala>;
	onSubmit: (dharamshalaData: Omit<Dharamshala, "id">) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function DharamshalaForm({
	initialData = {
		name: "",
		date: "",
		state: "",
		city: "",
		status: "Active",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: DharamshalaFormProps) {
	const [dharamshalaData, setDharamshalaData] = useState<
		Omit<Dharamshala, "id">
	>({
		name: initialData.name || "",
		date: initialData.date || "",
		state: initialData.state || "",
		city: initialData.city || "",
		status: initialData.status || "Active",
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: typeof dharamshalaData) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Name is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.state?.trim()) errors.state = "State is required";
		if (!data.city?.trim()) errors.city = "City is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSubmit = async () => {
		const errors = validateForm(dharamshalaData);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;
		try {
			await onSubmit(dharamshalaData);
		} catch (error) {
			console.error("Error in form submission:", error);
		}
	};

	const handleInputChange = (
		field: keyof typeof dharamshalaData,
		value: string
	) => {
		setDharamshalaData({ ...dharamshalaData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="name">Dharamshala Name *</Label>
				<Input
					id="name"
					value={dharamshalaData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter dharamshala name"
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
					value={dharamshalaData.date}
					onChange={(e) => handleInputChange("date", e.target.value)}
					className={formErrors.date ? "border-red-500" : ""}
				/>
				{formErrors.date && (
					<p className="text-sm text-red-500">{formErrors.date}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="state">State *</Label>
				<Input
					id="state"
					value={dharamshalaData.state}
					onChange={(e) => handleInputChange("state", e.target.value)}
					placeholder="Enter state"
					className={formErrors.state ? "border-red-500" : ""}
				/>
				{formErrors.state && (
					<p className="text-sm text-red-500">{formErrors.state}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="city">City *</Label>
				<Input
					id="city"
					value={dharamshalaData.city}
					onChange={(e) => handleInputChange("city", e.target.value)}
					placeholder="Enter city"
					className={formErrors.city ? "border-red-500" : ""}
				/>
				{formErrors.city && (
					<p className="text-sm text-red-500">{formErrors.city}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={dharamshalaData.status}
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
				{formErrors.status && (
					<p className="text-sm text-red-500">{formErrors.status}</p>
				)}
			</div>
			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Dharamshala"}
				</Button>
			</div>
		</div>
	);
}
