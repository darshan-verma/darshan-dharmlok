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
import Image from "next/image";
import { Trash2, UploadCloud } from "lucide-react";

// Trainer specialities/categories
const trainerSpecialities = [
	"Hatha Yoga",
	"Vinyasa Flow",
	"Ashtanga Yoga",
	"Bikram Yoga",
	"Kundalini Yoga",
	"Yin Yoga",
	"Restorative Yoga",
	"Power Yoga",
	"Iyengar Yoga",
	"Meditation",
	"Pranayama",
	"Yoga Therapy",
	"Other",
];

const trainerStatuses = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

export interface TrainerFormData {
	name: string;
	email: string;
	phone: string;
	bio: string;
	category: string;
	status: string;
	coverImageUrl?: string | null;
	coverImageFile?: File | null;
}

interface TrainersFormProps {
	initialData?: Partial<TrainerFormData>;
	onSubmit: (trainerData: TrainerFormData) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function TrainersForm({
	initialData = {
		name: "",
		email: "",
		phone: "",
		bio: "",
		category: "",
		status: "Active",
		coverImageUrl: null,
		coverImageFile: null,
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: TrainersFormProps) {
	const [trainerData, setTrainerData] = useState<TrainerFormData>({
		name: initialData.name || "",
		email: initialData.email || "",
		phone: initialData.phone || "",
		bio: initialData.bio || "",
		category: initialData.category || "",
		status: initialData.status || "Active",
		coverImageUrl: initialData.coverImageUrl || null,
		coverImageFile: initialData.coverImageFile || null,
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
		initialData.coverImageUrl || null
	);

	useEffect(() => {
		// Update preview when initial data changes
		if (initialData.coverImageUrl && !trainerData.coverImageFile) {
			setImagePreviewUrl(initialData.coverImageUrl);
		} else if (!initialData.coverImageUrl && !trainerData.coverImageFile) {
			setImagePreviewUrl(null);
		}
	}, [initialData.coverImageUrl, trainerData.coverImageFile]);

	const validateForm = (data: TrainerFormData) => {
		const errors: Record<string, string> = {};

		// Name validation
		if (!data.name?.trim()) {
			errors.name = "Name is required";
		} else if (data.name.length < 2) {
			errors.name = "Name must be at least 2 characters";
		}

		// Email validation
		if (!data.email?.trim()) {
			errors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
			errors.email = "Please enter a valid email address";
		}

		// Phone validation
		if (!data.phone?.trim()) {
			errors.phone = "Phone number is required";
		} else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, ""))) {
			errors.phone = "Please enter a valid 10-digit Indian phone number";
		}

		// Bio validation
		if (!data.bio?.trim()) {
			errors.bio = "Bio/Description is required";
		} else if (data.bio.length < 10) {
			errors.bio = "Bio must be at least 10 characters";
		}

		// Category validation
		if (!data.category) {
			errors.category = "Speciality is required";
		}

		// Status validation
		if (!data.status) {
			errors.status = "Status is required";
		}

		// Image validation
		if (data.coverImageFile && data.coverImageFile.size > 5 * 1024 * 1024) {
			// 5MB limit
			errors.coverImageFile = "Image size should be less than 5MB.";
		}
		if (
			data.coverImageFile &&
			!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
				data.coverImageFile.type
			)
		) {
			errors.coverImageFile =
				"Invalid image format. Use JPG, PNG, WebP, or GIF.";
		}

		return errors;
	};

	const handleSubmit = async () => {
		const dataToSubmit: TrainerFormData = { ...trainerData };
		const errors = validateForm(dataToSubmit);
		setFormErrors(errors);

		if (Object.keys(errors).length > 0) return;

		try {
			await onSubmit(dataToSubmit);
		} catch {
			setFormErrors((prev) => ({
				...prev,
				_submit: "Failed to save trainer. Please try again.",
			}));
		}
	};

	const handleInputChange = (
		field: keyof Omit<TrainerFormData, "coverImageFile" | "coverImageUrl">,
		value: string
	) => {
		setTrainerData({ ...trainerData, [field]: value });
		if (formErrors[field]) setFormErrors({ ...formErrors, [field]: "" });
	};

	const handleImageUrlChange = (value: string) => {
		setTrainerData({
			...trainerData,
			coverImageUrl: value,
			coverImageFile: null,
		});
		setImagePreviewUrl(value);
		if (formErrors.coverImageUrl)
			setFormErrors({ ...formErrors, coverImageUrl: "" });
		if (formErrors.coverImageFile)
			setFormErrors({ ...formErrors, coverImageFile: "" });
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setTrainerData({
				...trainerData,
				coverImageFile: file,
				coverImageUrl: null,
			});
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreviewUrl(reader.result as string);
			};
			reader.readAsDataURL(file);
			if (formErrors.coverImageFile)
				setFormErrors({ ...formErrors, coverImageFile: "" });
			if (formErrors.coverImageUrl)
				setFormErrors({ ...formErrors, coverImageUrl: "" });
		}
	};

	const handleRemoveImage = () => {
		setTrainerData({
			...trainerData,
			coverImageFile: null,
			coverImageUrl: null,
		});
		setImagePreviewUrl(null);
		const fileInput = document.getElementById(
			"coverImageFile"
		) as HTMLInputElement;
		if (fileInput) {
			fileInput.value = "";
		}
		const imageUrlInput = document.getElementById(
			"coverImageUrl"
		) as HTMLInputElement;
		if (imageUrlInput) {
			imageUrlInput.value = "";
		}
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="name">Name *</Label>
					<Input
						id="name"
						value={trainerData.name}
						onChange={(e) => handleInputChange("name", e.target.value)}
						placeholder="Enter trainer name"
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
						value={trainerData.email}
						onChange={(e) => handleInputChange("email", e.target.value)}
						placeholder="Enter email address"
						className={formErrors.email ? "border-red-500" : ""}
					/>
					{formErrors.email && (
						<p className="text-sm text-red-500">{formErrors.email}</p>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="phone">Phone *</Label>
					<Input
						id="phone"
						value={trainerData.phone}
						onChange={(e) => handleInputChange("phone", e.target.value)}
						placeholder="Enter phone number"
						className={formErrors.phone ? "border-red-500" : ""}
					/>
					{formErrors.phone && (
						<p className="text-sm text-red-500">{formErrors.phone}</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="category">Speciality *</Label>
					<Select
						value={trainerData.category}
						onValueChange={(value) => handleInputChange("category", value)}
					>
						<SelectTrigger
							id="category"
							className={formErrors.category ? "border-red-500" : ""}
						>
							<SelectValue placeholder="Select speciality" />
						</SelectTrigger>
						<SelectContent>
							{trainerSpecialities.map((speciality) => (
								<SelectItem key={speciality} value={speciality}>
									{speciality}
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
				<Label htmlFor="bio">Bio/Description *</Label>
				<Textarea
					id="bio"
					value={trainerData.bio}
					onChange={(e) => handleInputChange("bio", e.target.value)}
					placeholder="Enter trainer bio and description"
					rows={4}
					className={formErrors.bio ? "border-red-500" : ""}
				/>
				{formErrors.bio && (
					<p className="text-sm text-red-500">{formErrors.bio}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="coverImageFile">Cover Image (Upload or URL)</Label>
				<div className="flex items-center gap-4">
					{imagePreviewUrl && (
						<div className="relative w-24 h-16 rounded border overflow-hidden shrink-0">
							<Image
								src={imagePreviewUrl}
								alt="Cover image preview"
								layout="fill"
								objectFit="cover"
								onError={() => {
									if (trainerData.coverImageUrl && !trainerData.coverImageFile)
										setImagePreviewUrl(null);
								}}
							/>
						</div>
					)}
					{!imagePreviewUrl && (
						<div className="w-24 h-16 rounded border bg-muted flex items-center justify-center shrink-0">
							<UploadCloud className="w-8 h-8 text-gray-400" />
						</div>
					)}
					<div className="flex-grow space-y-2">
						<Input
							id="coverImageFile"
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							onChange={handleFileChange}
							className={`file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 ${
								formErrors.coverImageFile ? "border-red-500" : ""
							}`}
						/>
						<Input
							id="coverImageUrl"
							type="url"
							value={trainerData.coverImageUrl || ""}
							onChange={(e) => handleImageUrlChange(e.target.value)}
							placeholder="Or paste image URL here"
							className={formErrors.coverImageUrl ? "border-red-500" : ""}
							disabled={!!trainerData.coverImageFile}
						/>
					</div>
					{(imagePreviewUrl || trainerData.coverImageUrl) && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={handleRemoveImage}
							title="Remove image"
							className="shrink-0"
						>
							<Trash2 className="h-4 w-4 text-red-500" />
						</Button>
					)}
				</div>
				{formErrors.coverImageFile && (
					<p className="text-sm text-red-500 mt-1">
						{formErrors.coverImageFile}
					</p>
				)}
				{formErrors.coverImageUrl && (
					<p className="text-sm text-red-500 mt-1">
						{formErrors.coverImageUrl}
					</p>
				)}
				<p className="text-xs text-gray-500 mt-1">
					Upload an image (max 5MB) or provide a direct URL. Upload takes
					precedence.
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="status">Status *</Label>
				<Select
					value={trainerData.status}
					onValueChange={(value) => handleInputChange("status", value)}
				>
					<SelectTrigger id="status">
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						{trainerStatuses.map((status) => (
							<SelectItem key={status.value} value={status.value}>
								{status.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleSubmit} disabled={isLoading}>
					{isLoading ? "Saving..." : "Save Trainer"}
				</Button>
			</div>
			{formErrors._submit && (
				<p className="text-sm text-red-500 mt-2">{formErrors._submit}</p>
			)}
		</div>
	);
}
