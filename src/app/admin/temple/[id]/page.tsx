"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TempleDetailCard } from "@/app/admin/components/temple/TempleDetailCard";
import { TempleInfoCard } from "@/app/admin/components/temple/TempleInfoCard";
import { TempleData, Faq } from "@/app/admin/components/temple/types";
import type { ContentLang } from "@/lib/content-lang";
import {
	ADMIN_LOCALE_TAB_FIELDS,
	finalizeTranslationsPayload,
} from "@/lib/admin-locale-sync";

export default function TempleDetailPage() {
	const params = useParams();
	const router = useRouter();
	const templeId = params?.id as string;

	const [temple, setTemple] = useState<TempleData | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedTemple, setEditedTemple] = useState<TempleData | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [amenityInput, setAmenityInput] = useState("");
	const [amenities, setAmenities] = useState<string[]>([]);
	const [faqs, setFaqs] = useState<Faq[]>([]);
	const [imageFiles, setImageFiles] = useState<string[]>([]);
	const [videoFiles, setVideoFiles] = useState<string[]>([]);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [isUploadingVideo, setIsUploadingVideo] = useState(false);
	const [travelByAir, setTravelByAir] = useState<string[]>([]);
	const [travelByTrain, setTravelByTrain] = useState<string[]>([]);
	const [travelByBus, setTravelByBus] = useState<string[]>([]);
	const [travelByRoad, setTravelByRoad] = useState<string[]>([]);
	const [contentLocale, setContentLocale] = useState<ContentLang>("en");

	useEffect(() => {
		if (editedTemple) {
			setAmenities(
				Array.isArray(editedTemple.amenities) ? editedTemple.amenities : []
			);
			setTravelByAir(
				Array.isArray(editedTemple.travelByAir)
					? editedTemple.travelByAir
					: editedTemple.travelByAir
					? [editedTemple.travelByAir]
					: []
			);
			setTravelByTrain(
				Array.isArray(editedTemple.travelByTrain)
					? editedTemple.travelByTrain
					: editedTemple.travelByTrain
					? [editedTemple.travelByTrain]
					: []
			);
			setTravelByBus(
				Array.isArray(editedTemple.travelByBus)
					? editedTemple.travelByBus
					: editedTemple.travelByBus
					? [editedTemple.travelByBus]
					: []
			);
			setTravelByRoad(
				Array.isArray(editedTemple.travelByRoad)
					? editedTemple.travelByRoad
					: editedTemple.travelByRoad
					? [editedTemple.travelByRoad]
					: []
			);
		}
	}, [editedTemple]);

	const fetchTemple = useCallback(async () => {
		try {
			const response = await fetch(`/api/temple/${templeId}`);
			if (!response.ok) throw new Error("Failed to fetch temple");
			const data = await response.json();
			setTemple(data);
			setEditedTemple(data);
			setAmenities(data.amenities || []);
			setFaqs(data.templeFaq || []);
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
			toast.error("Failed to load temple details");
			router.push("/admin/temple");
		}
	}, [templeId, router]);

	useEffect(() => {
		if (templeId) fetchTemple();
	}, [templeId, fetchTemple]);

	const validateForm = (data: TempleData) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Name is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.state?.trim()) errors.state = "State is required";
		if (!data.city?.trim()) errors.city = "City is required";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSave = async () => {
		if (!editedTemple) return;
		const validation = validateForm(editedTemple);
		setErrors(validation);
		if (Object.keys(validation).length > 0) return;
		setIsSaving(true);
		try {
			const recordForTranslations = {
				...(editedTemple as unknown as Record<string, unknown>),
				amenities,
				travelByAir,
				travelByTrain,
				travelByBus,
				travelByRoad,
			};
			const translations = finalizeTranslationsPayload(
				recordForTranslations,
				"temple",
				contentLocale,
				ADMIN_LOCALE_TAB_FIELDS.temple
			);

			const response = await fetch(`/api/temple/${templeId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...editedTemple,
					translations,
					locale: contentLocale,
					amenities,
					templeFaq: faqs,
					imageFile: imageFiles,
					videoFile: videoFiles,
					travelByAir,
					travelByTrain,
					travelByBus,
					travelByRoad,
				}),
			});
			if (!response.ok) throw new Error("Failed to update temple");
			const updated = await response.json();
			setTemple(updated);
			setEditedTemple(updated);
			setAmenities(updated.amenities || []);
			setFaqs(updated.templeFaq || []);
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
			toast.success("Temple updated successfully!");
		} catch {
			toast.error("Failed to update temple");
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
					onClick={() => router.push("/admin/temple")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Temple Details</h1>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<TempleDetailCard
					temple={editedTemple ?? temple}
					isEditing={isEditing}
					errors={errors}
					onEdit={() => setIsEditing((v) => !v)}
					setEditedTemple={setEditedTemple}
				/>
				<div className="md:col-span-2">
					<TempleInfoCard
						editedTemple={editedTemple}
						isEditing={isEditing}
						isSaving={isSaving}
						errors={errors}
						amenityInput={amenityInput}
						setAmenityInput={setAmenityInput}
						amenities={amenities}
						setAmenities={setAmenities}
						faqs={faqs}
						setFaqs={setFaqs}
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
						setEditedTemple={setEditedTemple}
						contentLocale={contentLocale}
						onContentLocaleChange={setContentLocale}
						onSave={handleSave}
					/>
				</div>
			</div>
		</div>
	);
}
// }
// 			setImageFiles((prev) => [...prev, ...uploaded]);
// 			toast.success("Image(s) uploaded successfully!");
// 		} catch {
// 			toast.error("Failed to upload image(s)");
// 		} finally {
// 			setIsUploadingImage(false);
// 		}
// 	};

// 	const handleRemoveImage = (url: string) => {
// 		setImageFiles((prev) => prev.filter((img) => img !== url));
// 	};

// 	// --- Video Upload ---
// 	const handleVideoUpload = async (
// 		event: React.ChangeEvent<HTMLInputElement>
// 	) => {
// 		const files = event.target.files;
// 		if (!files || files.length === 0) return;
// 		setIsUploadingVideo(true);
// 		const uploaded: string[] = [];
// 		try {
// 			for (let i = 0; i < files.length; i++) {
// 				const file = files[i];
// 				const formData = new FormData();
// 				formData.append("file", file);
// 				formData.append("templeId", templeId);
// 				const response = await fetch("/api/upload/temple-video", {
// 					method: "POST",
// 					body: formData,
// 				});
// 				if (!response.ok) throw new Error("Failed to upload video");
// 				const { videoUrl } = await response.json();
// 				uploaded.push(videoUrl);
// 			}
// 			setVideoFiles((prev) => [...prev, ...uploaded]);
// 			toast.success("Video(s) uploaded successfully!");
// 		} catch {
// 			toast.error("Failed to upload video(s)");
// 		} finally {
// 			setIsUploadingVideo(false);
// 		}
// 	};

// 	const handleRemoveVideo = (url: string) => {
// 		setVideoFiles((prev) => prev.filter((vid) => vid !== url));
// 	};

// 	// Validation
// 	const validateForm = (data: TempleData) => {
// 		const errors: Record<string, string> = {};
// 		if (!data.name?.trim()) errors.name =  "Name is required";
// 		if (!data.date?.trim()) errors.date = "Date is required";
// 		if (!data.state?.trim()) errors.state = "State is required";
// 		if (!data.city?.trim()) errors.city = "City is required";
// 		if (!data.status) errors.status = "Status is required";
// 		return errors;
// 	};

// 	const handleSave = async () => {
// 		if (!editedTemple) return;
// 		const validation = validateForm(editedTemple);
// 		setErrors(validation);
// 		if (Object.keys(validation).length > 0) return;
// 		setIsSaving(true);
// 		try {
// 			const response = await fetch(`/api/temple/${templeId}`, {
// 				method: "PUT",
// 				headers: { "Content-Type": "application/json" },
// 				body: JSON.stringify({
// 					...editedTemple,
// 					amenities,
// 					templeFaq: faqs, // <-- send as templeFaq
// 					imageFile: imageFiles,
// 					videoFile: videoFiles,
// 					travelByAir,
// 					travelByTrain,
// 					travelByBus,
// 					travelByRoad,
// 				}),
// 			});
// 			if (!response.ok) throw new Error("Failed to update temple");
// 			const updated = await response.json();
// 			setTemple(updated);
// 			setEditedTemple(updated);
// 			setAmenities(updated.amenities || []);
// 			setFaqs(updated.templeFaq || []); // <-- update from templeFaq
// 			setImageFiles(
// 				Array.isArray(updated.imageFile)
// 					? updated.imageFile
// 					: updated.imageFile
// 					? [updated.imageFile]
// 					: []
// 			);
// 			setVideoFiles(
// 				Array.isArray(updated.videoFile)
// 					? updated.videoFile
// 					: updated.videoFile
// 					? [updated.videoFile]
// 					: []
// 			);
// 			setIsEditing(false);
// 			toast.success("Temple updated successfully!");
// 		} catch {
// 			toast.error("Failed to update temple");
// 		} finally {
// 			setIsSaving(false);
// 		}
// 	};

// 	// Helper to extract src from iframe HTML or return direct URL
// 	const extractGoogleMapsSrc = (input?: string) => {
// 		if (!input) return "";
// 		const match = input.match(/src=["']([^"']+)["']/);
// 		if (match && match[1]) return match[1];
// 		return input.trim();
// 	};

// 	if (!temple || !editedTemple) {
// 		return (
// 			<div className="flex justify-center items-center h-40">Loading...</div>
// 		);
// 	}

// 	function handleBlockNoteChange(
// 		field: "description" | "history" | "additionalInfo" | "rituals",
// 		val: string
// 	): void {
// 		setEditedTemple((prev) => (prev ? { ...prev, [field]: val } : prev));
// 	}

// 	// Define a minimal BlockNote block type for safeBlockNoteHtml
// 	type BlockNoteBlock = {
// 		content?: { text: string }[];
// 		[key: string]: unknown;
// 	};

// 	function safeBlockNoteHtml(jsonString?: string) {
// 		try {
// 			if (!jsonString) return "";
// 			const blocks: BlockNoteBlock[] = JSON.parse(jsonString);
// 			if (!Array.isArray(blocks)) return "";
// 			return blocks
// 				.map((block) => block.content?.map?.((c) => c.text).join(" ") || "")
// 				.join("<br/>");
// 		} catch {
// 			return "";
// 		}
// 	}

// 	return (
// 		<div className="p-6 space-y-6">
// 			<div className="flex items-center gap-4">
// 				<Button
// 					variant="outline"
// 					size="icon"
// 					onClick={() => router.push("/admin/temple")}
// 				>
// 					<ArrowLeft className="h-4 w-4" />
// 				</Button>
// 				<h1 className="text-2xl font-bold">Temple Details</h1>
// 			</div>
// 			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// 				<Card className="md:col-span-1 h-fit">
// 					<CardHeader className="text-center p-4 pb-2">
// 						<CardTitle className="text-center text-lg">
// 							{temple?.name}
// 						</CardTitle>
// 						<CardDescription>
// 							<span
// 								className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
// 									temple.status === "Active"
// 										? "bg-green-100 text-green-800"
// 										: "bg-red-100 text-red-800"
// 								}`}
// 							>
// 								{temple.status}
// 							</span>
// 						</CardDescription>
// 					</CardHeader>
// 					<CardContent className="space-y-3 p-4 pt-0">
// 						<div className="flex items-center gap-2 text-sm">
// 							<span className="font-medium">State:</span>
// 							<span>{temple?.state}</span>
// 						</div>
// 						<div className="flex items-center gap-2 text-sm">
// 							<span className="font-medium">City:</span>
// 							<span>{temple?.city}</span>
// 						</div>
// 						<div className="flex items-center gap-2 text-sm">
// 							<span className="font-medium">Date:</span>
// 							<span>{temple?.date ? temple.date.split("T")[0] : "N/A"}</span>
// 						</div>
// 						{/* Error display for required fields */}
// 						{isEditing && errors.name && (
// 							<p className="text-sm text-red-500">{errors.name}</p>
// 						)}
// 						{isEditing && errors.date && (
// 							<p className="text-sm text-red-500">{errors.date}</p>
// 						)}
// 						{isEditing && errors.state && (
// 							<p className="text-sm text-red-500">{errors.state}</p>
// 						)}
// 						{isEditing && errors.city && (
// 							<p className="text-sm text-red-500">{errors.city}</p>
// 						)}
// 						{isEditing && errors.status && (
// 							<p className="text-sm text-red-500">{errors.status}</p>
// 						)}
// 					</CardContent>
// 					<CardFooter className="p-4 pt-0">
// 						<Button
// 							className="w-full text-sm h-8"
// 							variant={isEditing ? "outline" : "default"}
// 							onClick={() => setIsEditing(!isEditing)}
// 						>
// 							{isEditing ? "Cancel" : "Edit Temple"}
// 						</Button>
// 					</CardFooter>
// 				</Card>
// 			</div>
// 			{/* Map Section - Updated to use iframe */}
// 			<div className="mt-6">
// 				<Card>
// 					<CardHeader>
// 						<CardTitle>Temple Location & Address</CardTitle>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="flex flex-col gap-4 w-full md:w-2/3">
// 							<div className="space-y-2">
// 								<Label htmlFor="address">Address</Label>
// 								<Input
// 									id="address"
// 									value={editedTemple.address || ""}
// 									onChange={(e) =>
// 										setEditedTemple((prev) =>
// 											prev ? { ...prev, address: e.target.value } : prev
// 										)
// 									}
// 									placeholder="Enter temple address"
// 									disabled={!isEditing}
// 								/>
// 							</div>
// 							<div className="space-y-2">
// 								<Label htmlFor="location">
// 									Temple Location (Google Maps embed src URL or iframe HTML)
// 								</Label>
// 								<Input
// 									id="location"
// 									value={editedTemple.location || ""}
// 									onChange={(e) =>
// 										setEditedTemple((prev) =>
// 											prev ? { ...prev, location: e.target.value } : prev
// 										)
// 									}
// 									placeholder="Paste Google Maps embed src URL or iframe HTML"
// 									disabled={!isEditing}
// 								/>
// 								{/* Map Preview */}
// 								{extractGoogleMapsSrc(editedTemple.location) ? (
// 									<div className="mt-2 border rounded overflow-hidden">
// 										<iframe
// 											src={extractGoogleMapsSrc(editedTemple.location)}
// 											width="100%"
// 											height="250"
// 											style={{ border: 0 }}
// 											allowFullScreen
// 											loading="lazy"
// 										/>
// 									</div>
// 								) : null}
// 							</div>
// 						</div>
// 					</CardContent>
// 				</Card>
// 			</div>
// 			{/* Outer Card for all grouped sections */}
// 			<div className="mt-6">
// 				<Card>
// 					<CardContent className="space-y-6 pt-6">
// 						{/* Info Card: Description, History, Additional Info, Rituals, Timings */}
// 						<Card className="mb-4">
// 							<CardHeader>
// 								<CardTitle>Temple Information</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// 									{/* Description Card */}
// 									<Card>
// 										<CardHeader>
// 											<CardTitle>Description</CardTitle>
// 										</CardHeader>
// 										<CardContent>
// 											{isEditing ? (
// 												<BlockNoteEditor
// 													initialContent={editedTemple?.description || ""}
// 													onChange={(val: string) =>
// 														handleBlockNoteChange("description", val)
// 													}
// 													editable={isEditing}
// 												/>
// 											) : (
// 												<div
// 													className="prose prose-sm max-w-none"
// 													dangerouslySetInnerHTML={{
// 														__html: safeBlockNoteHtml(
// 															editedTemple?.description
// 														),
// 													}}
// 												/>
// 											)}
// 										</CardContent>
// 									</Card>
// 									{/* History Card */}
// 									<Card>
// 										<CardHeader>
// 											<CardTitle>History</CardTitle>
// 										</CardHeader>
// 										<CardContent>
// 											{isEditing ? (
// 												<BlockNoteEditor
// 													initialContent={editedTemple?.history || ""}
// 													onChange={(val: string) =>
// 														handleBlockNoteChange("history", val)
// 													}
// 													editable={isEditing}
// 												/>
// 											) : (
// 												<div
// 													className="prose prose-sm max-w-none"
// 													dangerouslySetInnerHTML={{
// 														__html: safeBlockNoteHtml(editedTemple?.history),
// 													}}
// 												/>
// 											)}
// 										</CardContent>
// 									</Card>
// 									{/* Additional Info Card */}
// 									<Card>
// 										<CardHeader>
// 											<CardTitle>Additional Info</CardTitle>
// 										</CardHeader>
// 										<CardContent>
// 											{isEditing ? (
// 												<BlockNoteEditor
// 													initialContent={editedTemple?.additionalInfo || ""}
// 													onChange={(val: string) =>
// 														handleBlockNoteChange("additionalInfo", val)
// 													}
// 													editable={isEditing}
// 												/>
// 											) : (
// 												<div
// 													className="prose prose-sm max-w-none"
// 													dangerouslySetInnerHTML={{
// 														__html: safeBlockNoteHtml(
// 															editedTemple?.additionalInfo
// 														),
// 													}}
// 												/>
// 											)}
// 										</CardContent>
// 									</Card>
// 									{/* Rituals Card */}
// 									<Card>
// 										<CardHeader>
// 											<CardTitle>Rituals</CardTitle>
// 										</CardHeader>
// 										<CardContent>
// 											{isEditing ? (
// 												<BlockNoteEditor
// 													initialContent={editedTemple?.rituals || ""}
// 													onChange={(val: string) =>
// 														handleBlockNoteChange("rituals", val)
// 													}
// 													editable={isEditing}
// 												/>
// 											) : (
// 												<div
// 													className="prose prose-sm max-w-none"
// 													dangerouslySetInnerHTML={{
// 														__html: safeBlockNoteHtml(editedTemple?.rituals),
// 													}}
// 												/>
// 											)}
// 										</CardContent>
// 									</Card>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="timings">Timings</Label>
// 									<Input
// 										id="timings"
// 										value={editedTemple?.timings || ""}
// 										onChange={(e) =>
// 											setEditedTemple((prev) =>
// 												prev ? { ...prev, timings: e.target.value } : prev
// 											)
// 										}
// 										placeholder="e.g. 6:00 AM - 8:00 PM"
// 										disabled={!isEditing}
// 									/>
// 								</div>
// 							</CardContent>
// 						</Card>
// 						{/* Travel Card */}
// 						<Card className="mb-4">
// 							<CardHeader>
// 								<CardTitle>Best Way of Travel</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// 									{/* By Air */}
// 									<div className="space-y-2">
// 										<Label>Best Way by Air</Label>
// 										{travelByAir.map((val, idx) => (
// 											<div key={idx} className="flex gap-2 mb-1">
// 												<Input
// 													value={val}
// 													onChange={(e) =>
// 														setTravelByAir((arr) =>
// 															arr.map((v, i) =>
// 																i === idx ? e.target.value : v
// 															)
// 														)
// 													}
// 													placeholder="e.g. Nearest airport, flight info, etc."
// 													disabled={!isEditing}
// 												/>
// 												{isEditing && (
// 													<Button
// 														type="button"
// 														variant="ghost"
// 													size="icon"
// 														onClick={() =>
// 															removeTravelField(setTravelByAir, idx)
// 														}
// 													>
// 														<Trash2 className="h-4 w-4 text-red-500" />
// 													</Button>
// 												)}
// 											</div>
// 										))}
// 										{isEditing && (
// 											<Button
// 												type="button"
// 												variant="outline"
// 												size="sm"
// 												className="mt-1"
// 												onClick={() => addTravelField(setTravelByAir)}
// 											>
// 												Add Field
// 											</Button>
// 										)}
// 									</div>
// 									{/* By Train */}
// 									<div className="space-y-2">
// 										<Label>Best Way by Train</Label>
// 										{travelByTrain.map((val, idx) => (
// 											<div key={idx} className="flex gap-2 mb-1">
// 												<Input
// 													value={val}
// 													onChange={(e) =>
// 														setTravelByTrain((arr) =>
// 															arr.map((v, i) =>
// 																i === idx ? e.target.value : v
// 															)
// 														)
// 													}
// 													placeholder="e.g. Nearest railway station, train info, etc."
// 													disabled={!isEditing}
// 												/>
// 												{isEditing && (
// 													<Button
// 														type="button"
// 														variant="ghost"
// 														size="icon"
// 														onClick={() =>
// 															removeTravelField(setTravelByTrain, idx)
// 														}
// 													>
// 														<Trash2 className="h-4 w-4 text-red-500" />
// 													</Button>
// 												)}
// 											</div>
// 										))}
// 										{isEditing && (
// 											<Button
// 												type="button"
// 												variant="outline"
// 											size="sm"
// 												className="mt-1"
// 												onClick={() => addTravelField(setTravelByTrain)}
// 											>
// 												Add Field
// 											</Button>
// 										)}
// 									</div>
// 									{/* By Bus */}
// 									<div className="space-y-2">
// 										<Label>Best Way by Bus</Label>
// 										{travelByBus.map((val, idx) => (
// 											<div key={idx} className="flex gap-2 mb-1">
// 												<Input
// 													value={val}
// 													onChange={(e) =>
// 														setTravelByBus((arr) =>
// 															arr.map((v, i) =>
// 																i === idx ? e.target.value : v
// 															)
// 														)
// 													}
// 													placeholder="e.g. Bus stand, route info, etc."
// 													disabled={!isEditing}
// 												/>
// 												{isEditing && (
// 													<Button
// 														type="button"
// 														variant="ghost"
// 														size="icon"
// 														onClick={() =>
// 															removeTravelField(setTravelByBus, idx)
// 														}
// 													>
// 														<Trash2 className="h-4 w-4 text-red-500" />
// 													</Button>
// 												)}
// 											</div>
// 										))}
// 										{isEditing && (
// 											<Button
// 												type="button"
// 												variant="outline"
// 												size="sm"
// 												className="mt-1"
// 												onClick={() => addTravelField(setTravelByBus)}
// 											>
// 												Add Field
// 											</Button>
// 										)}
// 									</div>
// 									{/* By Road */}
// 									<div className="space-y-2">
// 										<Label>Best Way by Road</Label>
// 										{travelByRoad.map((val, idx) => (
// 											<div key={idx} className="flex gap-2 mb-1">
// 												<Input
// 													value={val}
// 													onChange={(e) =>
// 														setTravelByRoad((arr) =>
// 															arr.map((v, i) =>
// 																i === idx ? e.target.value : v
// 															)
// 														)
// 													}
// 													placeholder="e.g. Highway, driving directions, etc."
// 													disabled={!isEditing}
// 												/>
// 												{isEditing && (
// 													<Button
// 														type="button"
// 														variant="ghost"
// 														size="icon"
// 														onClick={() =>
// 															removeTravelField(setTravelByRoad, idx)
// 														}
// 													>
// 														<Trash2 className="h-4 w-4 text-red-500" />
// 													</Button>
// 												)}
// 											</div>
// 										))}
// 										{isEditing && (
// 											<Button
// 												type="button"
// 												variant="outline"
// 												size="sm"
// 												className="mt-1"
// 												onClick={() => addTravelField(setTravelByRoad)}
// 											>
// 												Add Field
// 											</Button>
// 										)}
// 									</div>
// 								</div>
// 							</CardContent>
// 						</Card>
// 						{/* Amenities & FAQ Card */}
// 						<Card className="mb-4">
// 							<CardHeader>
// 								<CardTitle>Amenities & FAQs</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-6">
// 								{/* Amenities */}
// 								<div className="space-y-2">
// 									<Label>Amenities Nearby</Label>
// 									<div className="flex gap-2">
// 										<Input
// 											value={amenityInput}
// 											onChange={(e) => setAmenityInput(e.target.value)}
// 											placeholder="Amenity name"
// 											disabled={!isEditing}
// 											onKeyDown={(e) => {
// 												if (e.key === "Enter") {
// 													e.preventDefault();
// 													if (isEditing) handleAddAmenity();
// 												}
// 											}}
// 										/>
// 										<Button
// 											type="button"
// 											onClick={handleAddAmenity}
// 											disabled={!isEditing || !amenityInput.trim()}
// 										>
// 											<Plus className="h-4 w-4 mr-1" />
// 											Add
// 										</Button>
// 									</div>
// 									<div className="flex flex-wrap gap-2 mt-2">
// 										{amenities.map((a) => (
// 											<span
// 												key={a}
// 												className="inline-flex items-center bg-gray-100 rounded px-2 py-1 text-xs font-medium"
// 											>
// 												{a}
// 												{isEditing && (
// 													<Button
// 														type="button"
// 														variant="ghost"
// 														size="icon"
// 														onClick={() => handleRemoveAmenity(a)}
// 														className="ml-1"
// 													>
// 														<Trash2 className="h-3 w-3 text-red-500" />
// 													</Button>
// 												)}
// 											</span>
// 										))}
// 									</div>
// 								</div>
// 								{/* FAQ Section */}
// 								<div className="space-y-2">
// 									<Label>FAQs</Label>
// 									{faqs.map((faq, idx) => (
// 										<div
// 											key={idx}
// 											className="flex flex-col md:flex-row gap-2 items-start mb-2"
// 										>
// 											<Input
// 												className="flex-1"
// 												placeholder="Question"
// 												value={faq.question}
// 												onChange={(e) =>
// 													handleFaqChange(idx, "question", e.target.value)
// 												}
// 												disabled={!isEditing}
// 											/>
// 											<Input
// 												className="flex-1"
// 												placeholder="Answer"
// 												value={faq.answer}
// 												onChange={(e) =>
// 													handleFaqChange(idx, "answer", e.target.value)
// 												}
// 												disabled={!isEditing}
// 											/>
// 											{isEditing && (
// 												<Button
// 													type="button"
// 													variant="ghost"
// 													size="icon"
// 													onClick={() => handleRemoveFaq(idx)}
// 												>
// 													<Trash2 className="h-4 w-4 text-red-500" />
// 												</Button>
// 											)}
// 										</div>
// 									))}
// 									{isEditing && (
// 										<Button type="button" onClick={handleAddFaq}>
// 											<Plus className="h-4 w-4 mr-1" />
// 											Add FAQ
// 										</Button>
// 									)}
// 								</div>
// 							</CardContent>
// 						</Card>
// 						{/* Images & Videos Card */}
// 						<Card>
// 							<CardHeader>
// 								<CardTitle>Temple Images & Videos</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-6">
// 								{/* Images Section */}
// 								<div className="space-y-2">
// 									<Label>Temple Images</Label>
// 									<div className="flex flex-wrap gap-3">
// 										{imageFiles.map((img, idx) => (
// 											<div
// 												key={img}
// 												className="relative w-32 h-20 rounded border overflow-hidden flex items-center justify-center bg-muted"
// 											>
// 												<Image
// 													src={img}
// 													alt={`Temple Image ${idx + 1}`}
// 													fill
// 													sizes="128px"
// 													style={{ objectFit: "cover" }}
// 													className="object-cover w-full h-full"
// 												/>
// 												{isEditing && (
// 													<Button
// 														type="button"
// 														variant="ghost"
// 														size="icon"
// 														onClick={() => handleRemoveImage(img)}
// 														className="absolute top-1 right-1 bg-white/80"
// 													>
// 														<Trash2 className="h-4 w-4 text-red-500" />
// 													</Button>
// 												)}
// 											</div>
// 										))}
// 										{isEditing && (
// 											<label className="w-32 h-20 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
// 												<Plus className="h-6 w-6 text-gray-400" />
// 												<span className="text-xs text-gray-500">Add Image</span>
// 												<input
// 													type="file"
// 													accept="image/*"
// 													multiple
// 													className="hidden"
// 													onChange={handleImageUpload}
// 													disabled={isUploadingImage}
// 												/>
// 											</label>
// 										)}
// 									</div>
// 									{isUploadingImage && (
// 										<p className="text-xs text-blue-600">
// 											Uploading image(s)...
// 										</p>
// 									)}
// 								</div>
// 								{/* Videos Section */}
// 								<div className="space-y-2">
// 									<Label>Temple Videos</Label>
// 									<div className="flex flex-wrap gap-3">
// 										{videoFiles.map((vid) => (
// 											<div
// 												key={vid}
// 												className="relative w-40 h-24 rounded border overflow-hidden flex items-center justify-center bg-muted"
// 											>
// 												<video
// 													src={vid}
// 													controls
// 													className="object-cover w-full h-full"
// 												/>
// 												{isEditing && (
// 													<Button
// 														type="button"
// 														variant="ghost"
// 														size="icon"
// 														onClick={() => handleRemoveVideo(vid)}
// 														className="absolute top-1 right-1 bg-white/80"
// 													>
// 														<Trash2 className="h-4 w-4 text-red-500" />
// 													</Button>
// 												)}
// 											</div>
// 										))}
// 										{isEditing && (
// 											<label className="w-40 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
// 												<VideoIcon className="h-6 w-6 text-gray-400" />
// 												<span className="text-xs text-gray-500">Add Video</span>
// 												<input
// 													type="file"
// 													accept="video/mp4,video/webm,video/ogg"
// 													multiple
// 													className="hidden"
// 													onChange={handleVideoUpload}
// 													disabled={isUploadingVideo}
// 												/>
// 											</label>
// 										)}
// 									</div>
// 									{isUploadingVideo && (
// 										<p className="text-xs text-blue-600">
// 											Uploading video(s)...
// 										</p>
// 									)}
// 								</div>
// 							</CardContent>
// 						</Card>
// 					</CardContent>
// 					{isEditing && (
// 						<CardFooter>
// 							<Button onClick={handleSave} disabled={isSaving}>
// 								{isSaving ? (
// 									<>
// 										<Save className="h-4 w-4 mr-2 animate-spin" />
// 										Saving...
// 									</>
// 								) : (
// 									<>
// 										<Save className="h-4 w-4 mr-2" />
// 										Save Changes
// 									</>
// 								)}
// 							</Button>
// 						</CardFooter>
// 					)}
// 				</Card>
// 			</div>
// 		</div>
// 	);
// }
