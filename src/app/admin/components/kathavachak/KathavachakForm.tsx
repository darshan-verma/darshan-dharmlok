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
import {
	Kathavachak,
	kathavachakCategories,
	kathavachakRanks,
} from "./KathavachakTable";

interface KathavachakFormProps {
	initialData?: Partial<Kathavachak>;
	onSubmit: (kathavachakData: Omit<Kathavachak, "id">) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function KathavachakForm({
	initialData = {
		name: "",
		category: "",
		phone: "",
		email: "",
		status: "Active",
		rank: "",
		isApproved: false,
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: KathavachakFormProps) {
	const [kathavachakData, setKathavachakData] = useState<
		Omit<Kathavachak, "id">
	>({
		name: initialData.name || "",
		category: initialData.category || "",
		phone: initialData.phone || "",
		email: initialData.email || "",
		status: initialData.status || "Active",
		rank: initialData.rank || "",
		isApproved:
			initialData.isApproved !== undefined ? initialData.isApproved : false,
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: typeof kathavachakData) => {
		const errors: Record<string, string> = {};

		// Name validation
		if (!data.name?.trim()) {
			errors.name = "Name is required";
		} else if (data.name.length < 2) {
			errors.name = "Name must be at least 2 characters";
		}

		// Category validation
		if (!data.category) {
			errors.category = "Category is required";
		}

		// Email validation
		if (!data.email) {
			errors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
			errors.email = "Please enter a valid email address";
		}

		// Phone validation (Indian format)
		if (!data.phone) {
			errors.phone = "Phone number is required";
		} else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, ""))) {
			errors.phone = "Please enter a valid 10-digit Indian phone number";
		}

		// Rank validation
		if (!data.rank) {
			errors.rank = "Rank is required";
		}

		return errors;
	};

	const handleSubmit = async () => {
		console.log("Form submit triggered with data:", kathavachakData);
		const errors = validateForm(kathavachakData);
		setFormErrors(errors);

		// If there are errors, don't proceed
		if (Object.keys(errors).length > 0) {
			console.log("Form validation errors:", errors);
			return;
		}

		try {
			await onSubmit(kathavachakData);
		} catch (error) {
			console.error("Error in form submission:", error);
		}
	};

	const handleInputChange = (
		field: keyof typeof kathavachakData,
		value: string | boolean
	) => {
		console.log(`Field ${field} changed to:`, value);
		setKathavachakData({ ...kathavachakData, [field]: value });

		// Clear error for this field if it exists
		if (formErrors[field]) {
			setFormErrors({ ...formErrors, [field]: "" });
		}
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="name">Full Name *</Label>
				<Input
					id="name"
					value={kathavachakData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter full name"
					className={formErrors.name ? "border-red-500" : ""}
				/>
				{formErrors.name && (
					<p className="text-sm text-red-500">{formErrors.name}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="email">Email *</Label>
				<Input
					id="email"
					type="email"
					value={kathavachakData.email}
					onChange={(e) => handleInputChange("email", e.target.value)}
					placeholder="Enter email address"
					className={formErrors.email ? "border-red-500" : ""}
				/>
				{formErrors.email && (
					<p className="text-sm text-red-500">{formErrors.email}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="phone">Phone Number *</Label>
				<Input
					id="phone"
					type="tel"
					value={kathavachakData.phone}
					onChange={(e) => handleInputChange("phone", e.target.value)}
					placeholder="Enter phone number"
					className={formErrors.phone ? "border-red-500" : ""}
				/>
				{formErrors.phone && (
					<p className="text-sm text-red-500">{formErrors.phone}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="category">Category *</Label>
				<Select
					value={kathavachakData.category}
					onValueChange={(value) => handleInputChange("category", value)}
				>
					<SelectTrigger
						id="category"
						className={formErrors.category ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select category" />
					</SelectTrigger>
					<SelectContent>
						{kathavachakCategories.map((category) => (
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

			<div className="space-y-2">
				<Label htmlFor="rank">Rank *</Label>
				<Select
					value={kathavachakData.rank}
					onValueChange={(value) => handleInputChange("rank", value)}
				>
					<SelectTrigger
						id="rank"
						className={formErrors.rank ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select rank" />
					</SelectTrigger>
					<SelectContent>
						{kathavachakRanks.map((rank) => (
							<SelectItem key={rank} value={rank}>
								{rank}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{formErrors.rank && (
					<p className="text-sm text-red-500">{formErrors.rank}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={kathavachakData.status}
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

			<div className="flex items-center space-x-2 py-2">
				<input
					type="checkbox"
					id="isApproved"
					checked={kathavachakData.isApproved}
					onChange={(e) => handleInputChange("isApproved", e.target.checked)}
					className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
				/>
				<Label
					htmlFor="isApproved"
					className="text-sm font-medium text-gray-700"
				>
					Approved
				</Label>
			</div>

			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Kathavachak"}
				</Button>
			</div>
		</div>
	);
}
