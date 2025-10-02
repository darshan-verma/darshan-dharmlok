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
import { MotivationSpeaker } from "./MotivationSpeakerTable";

interface MotivationSpeakerFormProps {
	initialData?: Partial<MotivationSpeaker>;
	onSubmit: (
		speakerData: Omit<MotivationSpeaker, "id" | "createdAt" | "updatedAt">
	) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function MotivationSpeakerForm({
	initialData = {
		name: "",
		date: new Date(),
		phone: "",
		email: "",
		timings: "",
		category: "",
		status: "Active",
		description: "",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: MotivationSpeakerFormProps) {
	const [speakerData, setSpeakerData] = useState<
		Omit<MotivationSpeaker, "id" | "createdAt" | "updatedAt">
	>({
		name: initialData.name || "",
		date: initialData.date || new Date(),
		phone: initialData.phone || "",
		email: initialData.email || "",
		timings: initialData.timings || "",
		category: initialData.category || "",
		status: initialData.status || "Active",
		coverImage: initialData.coverImage || "",
		bannerImage: initialData.bannerImage || "",
		images: initialData.images || [],
		videos: initialData.videos || [],
		description: initialData.description || "",
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [buttonLoading, setButtonLoading] = useState(false);

	const validateForm = (data: typeof speakerData) => {
		const errors: Record<string, string> = {};

		// Name validation
		if (!data.name?.trim()) {
			errors.name = "Name is required";
		} else if (data.name.length < 2) {
			errors.name = "Name must be at least 2 characters";
		}

		// Phone validation
		if (!data.phone?.trim()) {
			errors.phone = "Phone number is required";
		} else if (!/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
			errors.phone = "Please enter a valid phone number";
		}

		// Email validation
		if (!data.email?.trim()) {
			errors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
			errors.email = "Please enter a valid email address";
		}

		// Timings validation
		if (!data.timings?.trim()) {
			errors.timings = "Timings are required";
		}

		// Category validation
		if (!data.category?.trim()) {
			errors.category = "Category is required";
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
		const errors = validateForm(speakerData);
		setFormErrors(errors);

		// If there are errors, don't proceed
		if (Object.keys(errors).length > 0) {
			setButtonLoading(false);
			return;
		}

		try {
			await onSubmit(speakerData);
		} catch (error) {
			console.error("Error in form submission:", error);
		} finally {
			setButtonLoading(false);
		}
	};

	const handleInputChange = (
		field: keyof typeof speakerData,
		value: string | Date
	) => {
		setSpeakerData({ ...speakerData, [field]: value });

		// Clear error for this field if it exists
		if (formErrors[field]) {
			setFormErrors({ ...formErrors, [field]: "" });
		}
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="name">Speaker Name *</Label>
				<Input
					id="name"
					value={speakerData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter speaker name"
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
						speakerData.date instanceof Date
							? speakerData.date.toISOString().split("T")[0]
							: ""
					}
					onChange={(e) => handleInputChange("date", new Date(e.target.value))}
					className={formErrors.date ? "border-red-500" : ""}
				/>
				{formErrors.date && (
					<p className="text-sm text-red-500">{formErrors.date}</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="phone">Phone *</Label>
					<Input
						id="phone"
						value={speakerData.phone}
						onChange={(e) => handleInputChange("phone", e.target.value)}
						placeholder="Enter phone number"
						className={formErrors.phone ? "border-red-500" : ""}
					/>
					{formErrors.phone && (
						<p className="text-sm text-red-500">{formErrors.phone}</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="email">Email *</Label>
					<Input
						id="email"
						type="email"
						value={speakerData.email}
						onChange={(e) => handleInputChange("email", e.target.value)}
						placeholder="Enter email address"
						className={formErrors.email ? "border-red-500" : ""}
					/>
					{formErrors.email && (
						<p className="text-sm text-red-500">{formErrors.email}</p>
					)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="timings">Timings *</Label>
					<Input
						id="timings"
						value={speakerData.timings}
						onChange={(e) => handleInputChange("timings", e.target.value)}
						placeholder="e.g. 10:00 AM - 12:00 PM"
						className={formErrors.timings ? "border-red-500" : ""}
					/>
					{formErrors.timings && (
						<p className="text-sm text-red-500">{formErrors.timings}</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="category">Category *</Label>
					<Select
						value={speakerData.category}
						onValueChange={(value) => handleInputChange("category", value)}
					>
						<SelectTrigger
							id="category"
							className={formErrors.category ? "border-red-500" : ""}
						>
							<SelectValue placeholder="Select category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Spiritual">Spiritual</SelectItem>
							<SelectItem value="Motivational">Motivational</SelectItem>
							<SelectItem value="Life Skills">Life Skills</SelectItem>
							<SelectItem value="Personal Development">
								Personal Development
							</SelectItem>
							<SelectItem value="Leadership">Leadership</SelectItem>
							<SelectItem value="Other">Other</SelectItem>
						</SelectContent>
					</Select>
					{formErrors.category && (
						<p className="text-sm text-red-500">{formErrors.category}</p>
					)}
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={speakerData.description}
					onChange={(e) => handleInputChange("description", e.target.value)}
					placeholder="Enter speaker description"
					rows={4}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={speakerData.status}
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

			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					type="submit"
					onClick={handleSubmit}
					disabled={isLoading || buttonLoading}
				>
					{isLoading || buttonLoading ? "Saving..." : "Save Speaker"}
				</Button>
			</div>
		</div>
	);
}
