"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { BalvidhyaDetailCard } from "@/app/admin/components/balvidhya/BalvidhyaDetailCard";
import { BalvidhyaInfoCard } from "@/app/admin/components/balvidhya/BalvidhyaInfoCard";
import { BalvidhyaData, Errors } from "@/app/admin/components/balvidhya/types";

export default function BalvidhyaDetailPage() {
	const params = useParams();
	const router = useRouter();
	const balvidhyaId = params?.id as string;

	const [balvidhya, setBalvidhya] = useState<BalvidhyaData | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedBalvidhya, setEditedBalvidhya] = useState<BalvidhyaData | null>(
		null
	);
	const [errors, setErrors] = useState<Errors>({});
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	const fetchBalvidhyaData = useCallback(async () => {
		try {
			if (balvidhyaId && !/^[0-9a-fA-F]{24}$/.test(balvidhyaId)) {
				toast.error("Invalid Balvidhya ID format");
				router.push("/admin/balvidhya");
				return;
			}
			const loadingToast = toast.loading("Loading content details...");
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);
			try {
				const response = await fetch(`/api/balvidhya/${balvidhyaId}`, {
					signal: controller.signal,
				});
				clearTimeout(timeoutId);
				if (!response.ok) throw new Error("Failed to fetch content");
				const balvidhyaData = await response.json();
				setBalvidhya(balvidhyaData);
				setEditedBalvidhya({ ...balvidhyaData });
				toast.dismiss(loadingToast);
			} catch (error) {
				clearTimeout(timeoutId);
				throw error;
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to load content details"
			);
			router.push("/admin/balvidhya");
		}
	}, [balvidhyaId, router]);

	useEffect(() => {
		if (balvidhyaId) fetchBalvidhyaData();
	}, [balvidhyaId, fetchBalvidhyaData]);

	const validateForm = (balvidhyaData: BalvidhyaData): boolean => {
		const newErrors: Errors = {};
		if (!balvidhyaData.name?.trim())
			newErrors.name = "Content name is required";
		else if (balvidhyaData.name.length < 3)
			newErrors.name = "Name must be at least 3 characters";
		else if (balvidhyaData.name.length > 100)
			newErrors.name = "Name must be less than 100 characters";
		if (!balvidhyaData.description?.trim())
			newErrors.description = "Description is required";
		else if (balvidhyaData.description.length < 10)
			newErrors.description = "Description must be at least 10 characters";
		else if (balvidhyaData.description.length > 500)
			newErrors.description = "Description must be less than 500 characters";
		if (!balvidhyaData.type) newErrors.type = "Content type is required";
		if (!balvidhyaData.category) newErrors.category = "Category is required";
		if (balvidhyaData.thumbnailUrl && balvidhyaData.thumbnailUrl.trim()) {
			try {
				new URL(balvidhyaData.thumbnailUrl);
			} catch {
				newErrors.thumbnailUrl = "Please enter a valid URL";
			}
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSaveChanges = async () => {
		if (!editedBalvidhya) return;
		if (!validateForm(editedBalvidhya)) return;
		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");
		try {
			const dataToSave = {
				name: editedBalvidhya.name,
				description: editedBalvidhya.description,
				type: editedBalvidhya.type,
				category: editedBalvidhya.category,
				status: editedBalvidhya.status,
				trending: !!editedBalvidhya.trending,
				thumbnailUrl: editedBalvidhya.thumbnailUrl || null,
				videoUrl: editedBalvidhya.videoUrl ?? null,
				bookFile: editedBalvidhya.bookFile ?? null,
				videoFile: editedBalvidhya.videoFile ?? null,
			};
			const response = await fetch(`/api/balvidhya/${balvidhyaId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSave),
			});
			if (!response.ok) throw new Error("Failed to update content");
			const updatedBalvidhya = await response.json();
			setBalvidhya(updatedBalvidhya);
			setEditedBalvidhya(updatedBalvidhya);
			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("Content updated successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to update content"
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/balvidhya")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Content Details</h1>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<BalvidhyaDetailCard
					balvidhya={balvidhya}
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					editedBalvidhya={editedBalvidhya}
					setEditedBalvidhya={setEditedBalvidhya}
					isUploadingImage={isUploadingImage}
					setIsUploadingImage={setIsUploadingImage}
				/>
				<div className="md:col-span-2">
					<BalvidhyaInfoCard
						balvidhya={balvidhya}
						editedBalvidhya={editedBalvidhya}
						setEditedBalvidhya={setEditedBalvidhya}
						isEditing={isEditing}
						isSaving={isSaving}
						errors={errors}
						onSave={handleSaveChanges}
					/>
				</div>
			</div>
		</div>
	);
}