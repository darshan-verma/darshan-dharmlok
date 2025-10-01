"use client";

import { useState, useEffect } from "react";
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
import { YogaSession } from "./BookYogaTable";

interface Trainer {
	id: string;
	name: string;
	userType?: string;
}

interface ApiUser {
	id: string;
	name: string;
	userType?: string;
	// Add other fields as needed
}

interface BookYogaFormProps {
	initialData?: Partial<YogaSession>;
	onSubmit: (
		sessionData: Omit<
			YogaSession,
			"id" | "createdAt" | "updatedAt" | "trainerName"
		>
	) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function BookYogaForm({
	initialData = {
		trainerId: "",
		name: "",
		date: new Date(),
		serviceType: "",
		description: "",
		status: "Active",
		bannerImage: "",
		coverImage: "",
		images: [],
		videos: [],
		price: 0,
		duration: 60,
		capacity: 10,
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: BookYogaFormProps) {
	const [sessionData, setSessionData] = useState<
		Omit<YogaSession, "id" | "createdAt" | "updatedAt" | "trainerName">
	>({
		trainerId: initialData.trainerId || "",
		name: initialData.name || "",
		date: initialData.date || new Date(),
		serviceType: initialData.serviceType || "",
		description: initialData.description || "",
		status: initialData.status || "Active",
		bannerImage: initialData.bannerImage || "",
		coverImage: initialData.coverImage || "",
		images: initialData.images || [],
		videos: initialData.videos || [],
		price: initialData.price || 0,
		duration: initialData.duration || 60,
		capacity: initialData.capacity || 10,
	});

	const [trainers, setTrainers] = useState<Trainer[]>([]);
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [buttonLoading, setButtonLoading] = useState(false);

	// Fetch trainers (users that can be yoga instructors)
	useEffect(() => {
		const fetchTrainers = async () => {
			try {
				const response = await fetch("/api/users?limit=1000"); // Get all users
				if (response.ok) {
					const data = await response.json();
					// Filter users that could be trainers (you can adjust this logic)
					const trainers: Trainer[] = (data.users as ApiUser[]).filter(
						(user) =>
							user.userType &&
							(user.userType.toLowerCase().includes("yoga") ||
								user.userType.toLowerCase().includes("trainer") ||
								user.userType.toLowerCase().includes("instructor") ||
								user.userType === "panditji" || // Assuming panditji can also teach yoga
								user.userType === "dharmguru")
					);
					setTrainers(trainers);
				}
			} catch (error) {
				console.error("Error fetching trainers:", error);
			}
		};
		fetchTrainers();
	}, []);

	const validateForm = (data: typeof sessionData) => {
		const errors: Record<string, string> = {};

		// Trainer validation
		if (!data.trainerId?.trim()) {
			errors.trainerId = "Trainer is required";
		}

		// Name validation
		if (!data.name?.trim()) {
			errors.name = "Session name is required";
		} else if (data.name.length < 2) {
			errors.name = "Session name must be at least 2 characters";
		}

		// Service type validation
		if (!data.serviceType?.trim()) {
			errors.serviceType = "Service type is required";
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

		// Price validation
		if (data.price !== undefined && data.price < 0) {
			errors.price = "Price cannot be negative";
		}

		// Duration validation
		if (data.duration !== undefined && data.duration <= 0) {
			errors.duration = "Duration must be greater than 0";
		}

		// Capacity validation
		if (data.capacity !== undefined && data.capacity <= 0) {
			errors.capacity = "Capacity must be greater than 0";
		}

		return errors;
	};

	const handleSubmit = async () => {
		if (buttonLoading) return;
		setButtonLoading(true);
		const errors = validateForm(sessionData);
		setFormErrors(errors);

		// If there are errors, don't proceed
		if (Object.keys(errors).length > 0) {
			setButtonLoading(false);
			return;
		}

		try {
			await onSubmit(sessionData);
		} catch (error) {
			console.error("Error in form submission:", error);
		} finally {
			setButtonLoading(false);
		}
	};

	const handleInputChange = (
		field: keyof typeof sessionData,
		value: string | Date | number
	) => {
		setSessionData({ ...sessionData, [field]: value });

		// Clear error for this field if it exists
		if (formErrors[field]) {
			setFormErrors({ ...formErrors, [field]: "" });
		}
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="trainerId">Trainer *</Label>
				<Select
					value={sessionData.trainerId}
					onValueChange={(value) => handleInputChange("trainerId", value)}
				>
					<SelectTrigger
						id="trainerId"
						className={formErrors.trainerId ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select a trainer" />
					</SelectTrigger>
					<SelectContent>
						{trainers.map((trainer) => (
							<SelectItem key={trainer.id} value={trainer.id}>
								{trainer.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{formErrors.trainerId && (
					<p className="text-sm text-red-500">{formErrors.trainerId}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="name">Session Name *</Label>
				<Input
					id="name"
					value={sessionData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter session name"
					className={formErrors.name ? "border-red-500" : ""}
				/>
				{formErrors.name && (
					<p className="text-sm text-red-500">{formErrors.name}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="serviceType">Service Type *</Label>
				<Select
					value={sessionData.serviceType}
					onValueChange={(value) => handleInputChange("serviceType", value)}
				>
					<SelectTrigger
						id="serviceType"
						className={formErrors.serviceType ? "border-red-500" : ""}
					>
						<SelectValue placeholder="Select service type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Hatha Yoga">Hatha Yoga</SelectItem>
						<SelectItem value="Vinyasa Yoga">Vinyasa Yoga</SelectItem>
						<SelectItem value="Ashtanga Yoga">Ashtanga Yoga</SelectItem>
						<SelectItem value="Iyengar Yoga">Iyengar Yoga</SelectItem>
						<SelectItem value="Kundalini Yoga">Kundalini Yoga</SelectItem>
						<SelectItem value="Bikram Yoga">Bikram Yoga</SelectItem>
						<SelectItem value="Yin Yoga">Yin Yoga</SelectItem>
						<SelectItem value="Restorative Yoga">Restorative Yoga</SelectItem>
						<SelectItem value="Power Yoga">Power Yoga</SelectItem>
						<SelectItem value="Other">Other</SelectItem>
					</SelectContent>
				</Select>
				{formErrors.serviceType && (
					<p className="text-sm text-red-500">{formErrors.serviceType}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="date">Date *</Label>
				<Input
					id="date"
					type="date"
					value={
						sessionData.date instanceof Date
							? sessionData.date.toISOString().split("T")[0]
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
					value={sessionData.description}
					onChange={(e) => handleInputChange("description", e.target.value)}
					placeholder="Enter session description"
					rows={4}
					className={formErrors.description ? "border-red-500" : ""}
				/>
				{formErrors.description && (
					<p className="text-sm text-red-500">{formErrors.description}</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="price">Price (₹)</Label>
					<Input
						id="price"
						type="number"
						value={sessionData.price || ""}
						onChange={(e) =>
							handleInputChange("price", parseFloat(e.target.value) || 0)
						}
						placeholder="0"
						min="0"
						step="0.01"
						className={formErrors.price ? "border-red-500" : ""}
					/>
					{formErrors.price && (
						<p className="text-sm text-red-500">{formErrors.price}</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="duration">Duration (minutes)</Label>
					<Input
						id="duration"
						type="number"
						value={sessionData.duration || ""}
						onChange={(e) =>
							handleInputChange("duration", parseInt(e.target.value) || 60)
						}
						placeholder="60"
						min="1"
						className={formErrors.duration ? "border-red-500" : ""}
					/>
					{formErrors.duration && (
						<p className="text-sm text-red-500">{formErrors.duration}</p>
					)}
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="capacity">Capacity</Label>
				<Input
					id="capacity"
					type="number"
					value={sessionData.capacity || ""}
					onChange={(e) =>
						handleInputChange("capacity", parseInt(e.target.value) || 10)
					}
					placeholder="10"
					min="1"
					className={formErrors.capacity ? "border-red-500" : ""}
				/>
				{formErrors.capacity && (
					<p className="text-sm text-red-500">{formErrors.capacity}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={sessionData.status}
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
					{isLoading || buttonLoading ? "Saving..." : "Save Session"}
				</Button>
			</div>
		</div>
	);
}
