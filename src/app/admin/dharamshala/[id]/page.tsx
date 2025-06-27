"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";
import { DharamshalaDetailCard } from "@/app/admin/components/dharamshala/DharamshalaDetailCard";
import { DharamshalaInfoCard } from "@/app/admin/components/dharamshala/DharamshalaInfoCard";
import { DharamshalaData, Faq } from "@/app/admin/components/dharamshala/types";

export default function DharamshalaDetailPage() {
	const params = useParams();
	const router = useRouter();
	const dharamshalaId = params?.id as string;

	const [dharamshala, setDharamshala] = useState<DharamshalaData | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedDharamshala, setEditedDharamshala] =
		useState<DharamshalaData | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [amenityInput, setAmenityInput] = useState("");
	const [amenities, setAmenities] = useState<string[]>([]);
	const [dharamshalaFaqs, setDharamshalaFaqs] = useState<Faq[]>([]);
	const [imageFiles, setImageFiles] = useState<string[]>([]);
	const [videoFiles, setVideoFiles] = useState<string[]>([]);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [isUploadingVideo, setIsUploadingVideo] = useState(false);
	const [travelByAir, setTravelByAir] = useState<string[]>([]);
	const [travelByTrain, setTravelByTrain] = useState<string[]>([]);
	const [travelByBus, setTravelByBus] = useState<string[]>([]);
	const [travelByRoad, setTravelByRoad] = useState<string[]>([]);

	useEffect(() => {
		if (editedDharamshala) {
			setTravelByAir(
				Array.isArray(editedDharamshala.travelByAir)
					? editedDharamshala.travelByAir
					: editedDharamshala.travelByAir
					? [editedDharamshala.travelByAir]
					: []
			);
			setTravelByTrain(
				Array.isArray(editedDharamshala.travelByTrain)
					? editedDharamshala.travelByTrain
					: editedDharamshala.travelByTrain
					? [editedDharamshala.travelByTrain]
					: []
			);
			setTravelByBus(
				Array.isArray(editedDharamshala.travelByBus)
					? editedDharamshala.travelByBus
					: editedDharamshala.travelByBus
					? [editedDharamshala.travelByBus]
					: []
			);
			setTravelByRoad(
				Array.isArray(editedDharamshala.travelByRoad)
					? editedDharamshala.travelByRoad
					: editedDharamshala.travelByRoad
					? [editedDharamshala.travelByRoad]
					: []
			);
		}
	}, [editedDharamshala]);

	// Fetch dharamshala data
	useEffect(() => {
		const fetchDharamshala = async () => {
			try {
				const response = await fetch(`/api/dharamshala/${dharamshalaId}`);
				if (!response.ok) throw new Error("Failed to fetch dharamshala");
				const data = await response.json();
				setDharamshala(data);
				setEditedDharamshala(data);
				setAmenities(data.amenities || []);
				setDharamshalaFaqs(data.dharamshalaFaqs || []);
				setImageFiles(
					Array.isArray(data.imageFile)
						? data.imageFile
						: data.imageFile
						? [data.imageFile]
						: []
				);
				setVideoFiles(
					Array.isArray(data.videoFile)
						? data.videoFile
						: data.videoFile
						? [data.videoFile]
						: []
				);
			} catch {
				toast.error("Failed to load dharamshala details");
				router.push("/admin/dharamshala");
			}
		};
		if (dharamshalaId) fetchDharamshala();
	}, [dharamshalaId, router]);

	// Validation
	const validateForm = (data: DharamshalaData) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Name is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.state?.trim()) errors.state = "State is required";
		if (!data.city?.trim()) errors.city = "City is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSave = async () => {
		if (!editedDharamshala) return;
		const validation = validateForm(editedDharamshala);
		setErrors(validation);
		if (Object.keys(validation).length > 0) return;
		setIsSaving(true);
		try {
			const response = await fetch(`/api/dharamshala/${dharamshalaId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...editedDharamshala,
					amenities,
					dharamshalaFaqs,
					imageFile: imageFiles,
					videoFile: videoFiles,
					travelByAir,
					travelByTrain,
					travelByBus,
					travelByRoad,
				}),
			});
			if (!response.ok) throw new Error("Failed to update dharamshala");
			const updated = await response.json();
			setDharamshala(updated);
			setEditedDharamshala(updated);
			setAmenities(updated.amenities || []);
			setDharamshalaFaqs(updated.dharamshalaFaqs || []);
			setImageFiles(
				Array.isArray(updated.imageFile)
					? updated.imageFile
					: updated.imageFile
					? [updated.imageFile]
					: []
			);
			setVideoFiles(
				Array.isArray(updated.videoFile)
					? updated.videoFile
					: updated.videoFile
					? [updated.videoFile]
					: []
			);
			setIsEditing(false);
			toast.success("Dharamshala updated successfully!");
		} catch {
			toast.error("Failed to update dharamshala");
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
					onClick={() => router.push("/admin/dharamshala")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Dharamshala Details</h1>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<DharamshalaDetailCard
					dharamshala={dharamshala}
					isEditing={isEditing}
					errors={errors}
					onEdit={() => setIsEditing((v) => !v)}
				/>
				<div className="md:col-span-2">
					<DharamshalaInfoCard
						editedDharamshala={editedDharamshala}
						isEditing={isEditing}
						isSaving={isSaving}
						errors={errors}
						amenityInput={amenityInput}
						setAmenityInput={setAmenityInput}
						amenities={amenities}
						setAmenities={setAmenities}
						dharamshalaFaqs={dharamshalaFaqs}
						setDharamshalaFaqs={setDharamshalaFaqs}
						imageFiles={imageFiles}
						setImageFiles={setImageFiles}
						videoFiles={videoFiles}
						setVideoFiles={setVideoFiles}
						isUploadingImage={isUploadingImage}
						setIsUploadingImage={setIsUploadingImage}
						isUploadingVideo={isUploadingVideo}
						setIsUploadingVideo={setIsUploadingVideo}
						travelByAir={travelByAir}
						setTravelByAir={setTravelByAir}
						travelByTrain={travelByTrain}
						setTravelByTrain={setTravelByTrain}
						travelByBus={travelByBus}
						setTravelByBus={setTravelByBus}
						travelByRoad={travelByRoad}
						setTravelByRoad={setTravelByRoad}
						setEditedDharamshala={setEditedDharamshala}
						onSave={handleSave}
					/>
				</div>
			</div>
		</div>
	);
}