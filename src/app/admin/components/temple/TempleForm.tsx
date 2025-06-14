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
import { Temple } from "./TempleTable";

interface TempleFormProps {
	initialData?: Partial<Temple>;
	onSubmit: (templeData: Omit<Temple, "id">) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function TempleForm({
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
}: TempleFormProps) {
	const [templeData, setTempleData] = useState<Omit<Temple, "id">>({
		name: initialData.name || "",
		date: initialData.date || "",
		state: initialData.state || "",
		city: initialData.city || "",
		status: initialData.status || "Active",
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: typeof templeData) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Name is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.state?.trim()) errors.state = "State is required";
		if (!data.city?.trim()) errors.city = "City is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSubmit = async () => {
		const errors = validateForm(templeData);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;
		try {
			await onSubmit(templeData);
		} catch (error) {
			console.error("Error in form submission:", error);
		}
	};

	const handleInputChange = (field: keyof typeof templeData, value: string) => {
		setTempleData({ ...templeData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="name">Temple Name *</Label>
				<Input
					id="name"
					value={templeData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter temple name"
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
					value={templeData.date}
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
					value={templeData.state}
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
					value={templeData.city}
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
					value={templeData.status}
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
					{isLoading ? "Saving..." : "Save Temple"}
				</Button>
			</div>
		</div>
	);
}
