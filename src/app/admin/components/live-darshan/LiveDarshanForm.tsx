"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface LiveDarshanFormData {
	title: string;
	description: string;
	youtubeUrl: string;
	thumbnailUrl?: string;
	status: string;
}

interface LiveDarshanFormProps {
	initialData?: Partial<LiveDarshanFormData>;
	onSubmit: (data: LiveDarshanFormData) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function LiveDarshanForm({
	initialData = {
		title: "",
		description: "",
		youtubeUrl: "",
		thumbnailUrl: "",
		status: "Active",
	},
	onSubmit,
	onCancel,
	isLoading = false,
}: LiveDarshanFormProps) {
	const stableInitialData = useMemo(
		() => ({
			title: initialData.title || "",
			description: initialData.description || "",
			youtubeUrl: initialData.youtubeUrl || "",
			thumbnailUrl: initialData.thumbnailUrl || "",
			status: initialData.status || "Active",
		}),
		[
			initialData.title,
			initialData.description,
			initialData.youtubeUrl,
			initialData.thumbnailUrl,
			initialData.status,
		],
	);

	const [formData, setFormData] =
		useState<LiveDarshanFormData>(stableInitialData);
	const [errors, setErrors] = useState<
		Partial<Record<keyof LiveDarshanFormData, string>>
	>({});

	useEffect(() => {
		setFormData(stableInitialData);
		setErrors({});
	}, [stableInitialData]);

	const validate = () => {
		const nextErrors: Partial<Record<keyof LiveDarshanFormData, string>> = {};

		if (!formData.title.trim()) {
			nextErrors.title = "Title is required.";
		}
		if (!formData.description.trim()) {
			nextErrors.description = "Description is required.";
		}
		if (!formData.youtubeUrl.trim()) {
			nextErrors.youtubeUrl = "YouTube live link is required.";
		}
		if (!formData.status.trim()) {
			nextErrors.status = "Status is required.";
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!validate()) return;
		await onSubmit(formData);
	};

	return (
		<form onSubmit={handleSubmit} className="grid gap-4 py-4">
			<div className="grid gap-4">
				<div className="grid gap-2">
					<Label htmlFor="title">Title *</Label>
					<Input
						id="title"
						value={formData.title}
						onChange={(event) =>
							setFormData((prev) => ({ ...prev, title: event.target.value }))
						}
					/>
					{errors.title && (
						<p className="text-sm text-red-500">{errors.title}</p>
					)}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="youtubeUrl">YouTube Live Link *</Label>
					<Input
						id="youtubeUrl"
						value={formData.youtubeUrl}
						onChange={(event) =>
							setFormData((prev) => ({
								...prev,
								youtubeUrl: event.target.value,
							}))
						}
						placeholder="https://www.youtube.com/watch?v=..."
					/>
					{errors.youtubeUrl && (
						<p className="text-sm text-red-500">{errors.youtubeUrl}</p>
					)}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="description">Description *</Label>
					<Textarea
						id="description"
						value={formData.description}
						onChange={(event) =>
							setFormData((prev) => ({
								...prev,
								description: event.target.value,
							}))
						}
						rows={4}
					/>
					{errors.description && (
						<p className="text-sm text-red-500">{errors.description}</p>
					)}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
					<Input
						id="thumbnailUrl"
						value={formData.thumbnailUrl ?? ""}
						onChange={(event) =>
							setFormData((prev) => ({
								...prev,
								thumbnailUrl: event.target.value,
							}))
						}
						placeholder="https://.../thumbnail.jpg"
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="status">Status *</Label>
					<select
						id="status"
						value={formData.status}
						onChange={(event) =>
							setFormData((prev) => ({ ...prev, status: event.target.value }))
						}
						className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="Active">Active</option>
						<option value="Inactive">Inactive</option>
					</select>
					{errors.status && (
						<p className="text-sm text-red-500">{errors.status}</p>
					)}
				</div>
			</div>

			<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
				<Button variant="outline" type="button" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" disabled={isLoading}>
					{isLoading ? "Saving..." : "Save"}
				</Button>
			</div>
		</form>
	);
}
