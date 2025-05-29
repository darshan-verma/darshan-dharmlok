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
import { User } from "./UserTable";

interface UserFormProps {
	initialData?: Partial<User>;
	onSubmit: (userData: Omit<User, "id">) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function UserForm({
	initialData = {
		name: "",
		phone: "",
		email: "",
		status: "Active",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: UserFormProps) {
	const [userData, setUserData] = useState<Omit<User, "id">>({
		name: initialData.name || "",
		phone: initialData.phone || "",
		email: initialData.email || "",
		status: initialData.status || "Active",
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: typeof userData) => {
		const errors: Record<string, string> = {};

		// Name validation
		if (!data.name.trim()) {
			errors.name = "Name is required";
		} else if (data.name.length < 2) {
			errors.name = "Name must be at least 2 characters";
		}

		// Email validation
		if (!data.email) {
			errors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
			errors.email = "Please enter a valid email address";
		}

		// Phone validation (assuming Indian phone numbers)
		if (data.phone && !/^[6-9]\d{9}$/.test(data.phone.replace(/[^0-9]/g, ""))) {
			errors.phone = "Please enter a valid 10-digit phone number";
		}

		return errors;
	};

	const handleSubmit = async () => {
		const errors = validateForm(userData);
		setFormErrors(errors);

		// If there are errors, don't proceed
		if (Object.keys(errors).length > 0) {
			return;
		}

		await onSubmit(userData);
	};

	const handleInputChange = (field: keyof typeof userData, value: string) => {
		setUserData({ ...userData, [field]: value });

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
					value={userData.name}
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
					value={userData.email}
					onChange={(e) => handleInputChange("email", e.target.value)}
					placeholder="Enter email address"
					className={formErrors.email ? "border-red-500" : ""}
				/>
				{formErrors.email && (
					<p className="text-sm text-red-500">{formErrors.email}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="phone">Phone Number</Label>
				<Input
					id="phone"
					type="tel"
					value={userData.phone}
					onChange={(e) => handleInputChange("phone", e.target.value)}
					placeholder="Enter phone number"
					className={formErrors.phone ? "border-red-500" : ""}
				/>
				{formErrors.phone && (
					<p className="text-sm text-red-500">{formErrors.phone}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={userData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Active">Active</SelectItem>
						<SelectItem value="Inactive">Inactive</SelectItem>
						<SelectItem value="Suspended">Suspended</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save User"}
				</Button>
			</div>
		</div>
	);
}
