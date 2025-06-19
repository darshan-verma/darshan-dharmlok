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

export interface Event {
	id: string;
	title: string;
	date: string;
	category: string;
	fromDate: string;
	toDate: string;
	type: string;
	detail?: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

interface EventsFormProps {
	initialData?: Partial<Event>;
	onSubmit: (eventData: Omit<Event, "id">) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

const eventCategories = ["Sanatan", "Buddhism", "Sikh", "Jain"];

const eventTypes = ["Free", "Subscription"];

const statusOptions = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

export default function EventsForm({
	initialData = {
		title: "",
		date: "",
		category: "",
		fromDate: "",
		toDate: "",
		type: "",
		status: "Active",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: EventsFormProps) {
	const [eventData, setEventData] = useState<Omit<Event, "id">>({
		title: initialData.title || "",
		date: initialData.date || "",
		category: initialData.category || "",
		fromDate: initialData.fromDate || "",
		toDate: initialData.toDate || "",
		type: initialData.type || "",
		detail: initialData.detail || "",
		status: initialData.status || "Active",
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (data: typeof eventData) => {
		const errors: Record<string, string> = {};
		if (!data.title?.trim()) errors.title = "Title is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.category) errors.category = "Category is required";
		if (!data.fromDate?.trim()) errors.fromDate = "From date is required";
		if (!data.toDate?.trim()) errors.toDate = "To date is required";
		if (!data.type) errors.type = "Type is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSubmit = async () => {
		const errors = validateForm(eventData);
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;
		try {
			await onSubmit(eventData);
		} catch (error) {
			console.error("Error in form submission:", error);
		}
	};

	const handleInputChange = (field: keyof typeof eventData, value: string) => {
		setEventData({ ...eventData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="title">Title *</Label>
				<Input
					id="title"
					value={eventData.title}
					onChange={(e) => handleInputChange("title", e.target.value)}
					placeholder="Enter event title"
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
					value={eventData.date}
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
					value={eventData.category}
					onValueChange={(value) => handleInputChange("category", value)}
				>
					<SelectTrigger
						id="category"
						className={formErrors.category ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select category" />
					</SelectTrigger>
					<SelectContent>
						{eventCategories.map((category) => (
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
				<Label htmlFor="fromDate">From Date *</Label>
				<Input
					id="fromDate"
					type="date"
					value={eventData.fromDate}
					onChange={(e) => handleInputChange("fromDate", e.target.value)}
					className={formErrors.fromDate ? "border-red-500" : ""}
				/>
				{formErrors.fromDate && (
					<p className="text-sm text-red-500">{formErrors.fromDate}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="toDate">To Date *</Label>
				<Input
					id="toDate"
					type="date"
					value={eventData.toDate}
					onChange={(e) => handleInputChange("toDate", e.target.value)}
					className={formErrors.toDate ? "border-red-500" : ""}
				/>
				{formErrors.toDate && (
					<p className="text-sm text-red-500">{formErrors.toDate}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor="type">Type *</Label>
				<Select
					value={eventData.type}
					onValueChange={(value) => handleInputChange("type", value)}
				>
					<SelectTrigger
						id="type"
						className={formErrors.type ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select type" />
					</SelectTrigger>
					<SelectContent>
						{eventTypes.map((type) => (
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
			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={eventData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger
						id="status"
						className={formErrors.status ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						{statusOptions.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
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
					{isLoading ? "Saving..." : "Save Event"}
				</Button>
			</div>
		</div>
	);
}
