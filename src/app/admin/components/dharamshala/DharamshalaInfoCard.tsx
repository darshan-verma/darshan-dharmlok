"use client";

import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Plus, Trash2, Video as VideoIcon, Save } from "lucide-react";
import {
	DharamshalaData,
	Faq,
	TravelFieldSetter,
	BlockNoteField,
} from "./types";
import { toast } from "@/lib/toast";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect } from "react";

type Props = {
	editedDharamshala: DharamshalaData | null;
	isEditing: boolean;
	isSaving: boolean;
	errors: Record<string, string>;
	amenityInput: string;
	setAmenityInput: (val: string) => void;
	amenities: string[];
	setAmenities: (val: string[] | ((prev: string[]) => string[])) => void;
	dharamshalaFaqs: Faq[];
	setDharamshalaFaqs: (val: Faq[] | ((prev: Faq[]) => Faq[])) => void;
	imageFiles: string[];
	setImageFiles: (val: string[] | ((prev: string[]) => string[])) => void;
	videoFiles: string[];
	setVideoFiles: (val: string[] | ((prev: string[]) => string[])) => void;
	isUploadingImage: boolean;
	setIsUploadingImage: (val: boolean) => void;
	isUploadingVideo: boolean;
	setIsUploadingVideo: (val: boolean) => void;
	travelByAir: string[];
	setTravelByAir: (val: string[] | ((prev: string[]) => string[])) => void;
	travelByTrain: string[];
	setTravelByTrain: (val: string[] | ((prev: string[]) => string[])) => void;
	travelByBus: string[];
	setTravelByBus: (val: string[] | ((prev: string[]) => string[])) => void;
	travelByRoad: string[];
	setTravelByRoad: (val: string[] | ((prev: string[]) => string[])) => void;
	setEditedDharamshala: (
		cb: (prev: DharamshalaData | null) => DharamshalaData | null
	) => void;
	onSave: () => void;
};

export function DharamshalaInfoCard({
	editedDharamshala,
	isEditing,
	isSaving,
	amenityInput,
	setAmenityInput,
	amenities,
	setAmenities,
	dharamshalaFaqs,
	setDharamshalaFaqs,
	imageFiles,
	setImageFiles,
	videoFiles,
	setVideoFiles,
	isUploadingImage,
	setIsUploadingImage,
	isUploadingVideo,
	setIsUploadingVideo,
	travelByAir,
	setTravelByAir,
	travelByTrain,
	setTravelByTrain,
	travelByBus,
	setTravelByBus,
	travelByRoad,
	setTravelByRoad,
	setEditedDharamshala,
	onSave,
}: Props) {
	const descriptionEditor = useCreateBlockNote();
	const additionalInfoEditor = useCreateBlockNote();

	useEffect(() => {
		if (!isEditing && descriptionEditor && editedDharamshala?.description) {
			try {
				const content = JSON.parse(editedDharamshala.description);

				descriptionEditor.replaceBlocks(
					descriptionEditor.topLevelBlocks,
					content
				);
			} catch (e) {
				console.error("Failed to parse description for BlockNote", e);
			}
		}
	}, [editedDharamshala?.description, isEditing, descriptionEditor]);

	useEffect(() => {
		if (
			!isEditing &&
			additionalInfoEditor &&
			editedDharamshala?.additionalInfo
		) {
			try {
				const content = JSON.parse(editedDharamshala.additionalInfo);

				additionalInfoEditor.replaceBlocks(
					additionalInfoEditor.topLevelBlocks,
					content
				);
			} catch (e) {
				console.error("Failed to parse additionalInfo for BlockNote", e);
			}
		}
	}, [editedDharamshala?.additionalInfo, isEditing, additionalInfoEditor]);

	if (!editedDharamshala) return null;

	// Helper functions
	const extractGoogleMapsSrc = (input?: string) => {
		if (!input) return "";
		const match = input.match(/src=["']([^"']+)["']/);
		if (match && match[1]) return match[1];
		return input.trim();
	};

	// Amenity handlers
	const handleAddAmenity = () => {
		const val = amenityInput.trim();
		if (!val) return;
		if (amenities.includes(val)) return;
		setAmenities((prev: string[]) => [...prev, val]);
		setAmenityInput("");
	};

	const handleRemoveAmenity = (name: string) => {
		setAmenities((prev) => prev.filter((a) => a !== name));
	};

	// FAQ handlers
	const handleAddFaq = () => {
		setDharamshalaFaqs((prev: Faq[]) => [
			...prev,
			{ question: "", answer: "" },
		]);
	};

	const handleRemoveFaq = (idx: number) => {
		setDharamshalaFaqs((prev) => prev.filter((_, i) => i !== idx));
	};

	const handleFaqChange = (
		idx: number,
		field: "question" | "answer",
		value: string
	) => {
		setDharamshalaFaqs((prev) =>
			prev.map((faq, i) => (i === idx ? { ...faq, [field]: value } : faq))
		);
	};

	// Travel field handlers
	const addTravelField = (setter: TravelFieldSetter) => {
		setter((prev) => [...prev, ""]);
	};

	const removeTravelField = (setter: TravelFieldSetter, idx: number) => {
		setter((prev) => prev.filter((_, i) => i !== idx));
	};

	// Image handling
	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;
		setIsUploadingImage(true);
		const uploaded: string[] = [];
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const formData = new FormData();
				formData.append("file", file);
				formData.append("dharamshalaId", editedDharamshala.id);
				const response = await fetch("/api/upload/dharamshala-image", {
					method: "POST",
					body: formData,
				});
				if (!response.ok) throw new Error("Failed to upload image");
				const { imageUrl } = await response.json();
				uploaded.push(imageUrl);
			}
			setImageFiles((prev: string[]) => [...prev, ...uploaded]);
			toast.success("Image(s) uploaded successfully!");
		} catch {
			toast.error("Failed to upload image(s)");
		} finally {
			setIsUploadingImage(false);
		}
	};

	// Banner Image handling
	const handleBannerImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setIsUploadingImage(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("dharamshalaId", editedDharamshala.id);
			const response = await fetch("/api/upload/dharamshala-image", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) throw new Error("Failed to upload banner image");
			const { imageUrl } = await response.json();
			setEditedDharamshala((prev) =>
				prev ? { ...prev, bannerImage: imageUrl } : prev
			);
			toast.success("Banner image uploaded successfully!");
		} catch {
			toast.error("Failed to upload banner image");
		} finally {
			setIsUploadingImage(false);
		}
	};

	// Cover Image handling
	const handleCoverImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setIsUploadingImage(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("dharamshalaId", editedDharamshala.id);
			const response = await fetch("/api/upload/dharamshala-image", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) throw new Error("Failed to upload cover image");
			const { imageUrl } = await response.json();
			setEditedDharamshala((prev) =>
				prev ? { ...prev, coverImage: imageUrl } : prev
			);
			toast.success("Cover image uploaded successfully!");
		} catch {
			toast.error("Failed to upload cover image");
		} finally {
			setIsUploadingImage(false);
		}
	};

	// Video handling
	const handleVideoUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;
		setIsUploadingVideo(true);
		const uploaded: string[] = [];
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const formData = new FormData();
				formData.append("file", file);
				formData.append("dharamshalaId", editedDharamshala.id);
				const response = await fetch("/api/upload/dharamshala-video", {
					method: "POST",
					body: formData,
				});
				if (!response.ok) throw new Error("Failed to upload video");
				const { videoUrl } = await response.json();
				uploaded.push(videoUrl);
			}
			setVideoFiles((prev) => [...prev, ...uploaded]);
			toast.success("Video(s) uploaded successfully!");
		} catch {
			toast.error("Failed to upload video(s)");
		} finally {
			setIsUploadingVideo(false);
		}
	};

	const handleRemoveImage = (url: string) => {
		setImageFiles((prev) => prev.filter((img) => img !== url));
	};

	const handleRemoveVideo = (url: string) => {
		setVideoFiles((prev: string[]) =>
			prev.filter((vid: string) => vid !== url)
		);
	};

	// Rich text editor handler
	function handleBlockNoteChange(field: BlockNoteField, val: string): void {
		setEditedDharamshala((prev) => (prev ? { ...prev, [field]: val } : prev));
	}

	return (
		<>
			{/* Map Section */}
			<div className="mt-6">
				<Card>
					<CardHeader>
						<CardTitle>Dharamshala Location & Address</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-4 w-full md:w-2/3">
							<div className="space-y-2">
								<Label htmlFor="address">Address</Label>
								<Input
									id="address"
									value={editedDharamshala.address || ""}
									onChange={(e) =>
										setEditedDharamshala((prev) =>
											prev ? { ...prev, address: e.target.value } : prev
										)
									}
									placeholder="Enter dharamshala address"
									disabled={!isEditing}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="location">
									Dharamshala Location (Google Maps embed src URL or iframe
									HTML)
								</Label>
								<Input
									id="location"
									value={editedDharamshala.location || ""}
									onChange={(e) =>
										setEditedDharamshala((prev) =>
											prev ? { ...prev, location: e.target.value } : prev
										)
									}
									placeholder="Paste Google Maps embed src URL or iframe HTML"
									disabled={!isEditing}
								/>
								{/* Map Preview */}
								{extractGoogleMapsSrc(editedDharamshala.location) ? (
									<div className="mt-2 border rounded overflow-hidden">
										<iframe
											src={extractGoogleMapsSrc(editedDharamshala.location)}
											width="100%"
											height="250"
											style={{ border: 0 }}
											allowFullScreen
											loading="lazy"
										/>
									</div>
								) : null}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Dharamshala Info Card */}
			<Card className="mt-6">
				<CardContent className="space-y-6 pt-6">
					{/* Dharamshala Info Section */}
					<Card className="mb-4">
						<CardHeader>
							<CardTitle>Dharamshala Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Card>
									<CardHeader>
										<CardTitle>Description</CardTitle>
									</CardHeader>
									<CardContent>
										{isEditing ? (
											<BlockNoteEditor
												initialContent={editedDharamshala?.description || ""}
												onChange={(val: string) =>
													handleBlockNoteChange("description", val)
												}
												editable={isEditing}
											/>
										) : (
											<>
												{editedDharamshala?.description ? (
													<BlockNoteView
														editor={descriptionEditor}
														editable={false}
														theme="light" // or use `resolvedTheme` if you want to support dark mode
														className="p-3"
													/>
												) : (
													<p className="text-muted-foreground italic p-3">
														No biography has been added yet.
													</p>
												)}
											</>
										)}
									</CardContent>
								</Card>
								<div className="space-y-2">
									<Card>
										<CardHeader>
											<CardTitle>Additional Info</CardTitle>
										</CardHeader>
										<CardContent>
											{isEditing ? (
												<BlockNoteEditor
													initialContent={
														editedDharamshala?.additionalInfo || ""
													}
													onChange={(val: string) =>
														handleBlockNoteChange("additionalInfo", val)
													}
													editable={isEditing}
												/>
											) : (
												<>
													{editedDharamshala?.additionalInfo ? (
														<BlockNoteView
															editor={additionalInfoEditor}
															editable={false}
															theme="light" // or use `resolvedTheme` if you want to support dark mode
															className="p-3"
														/>
													) : (
														<p className="text-muted-foreground italic p-3">
															No biography has been added yet.
														</p>
													)}
												</>
											)}
										</CardContent>
									</Card>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="timings">Timings</Label>
								<Input
									id="timings"
									value={editedDharamshala?.timings || ""}
									onChange={(e) =>
										setEditedDharamshala((prev) =>
											prev ? { ...prev, timings: e.target.value } : prev
										)
									}
									placeholder="e.g. 6:00 AM - 8:00 PM"
									disabled={!isEditing}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Travel Card */}
					<Card className="mb-4">
						<CardHeader>
							<CardTitle>Best Way of Travel</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* By Air */}
								<div className="space-y-2">
									<Label>Best Way by Air</Label>
									{travelByAir.map((val, idx) => (
										<div key={idx} className="flex gap-2 mb-1">
											<Input
												value={val}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
													setTravelByAir((arr: string[]) =>
														arr.map((v: string, i: number) =>
															i === idx ? e.target.value : v
														)
													)
												}
												placeholder="e.g. Nearest airport, flight info, etc."
												disabled={!isEditing}
											/>
											{isEditing && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => removeTravelField(setTravelByAir, idx)}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											)}
										</div>
									))}
									{isEditing && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="mt-1"
											onClick={() => addTravelField(setTravelByAir)}
										>
											Add Field
										</Button>
									)}
								</div>

								{/* By Train */}
								<div className="space-y-2">
									<Label>Best Way by Train</Label>
									{travelByTrain.map((val, idx) => (
										<div key={idx} className="flex gap-2 mb-1">
											<Input
												value={val}
												onChange={(e) =>
													setTravelByTrain((arr) =>
														arr.map((v, i) => (i === idx ? e.target.value : v))
													)
												}
												placeholder="e.g. Nearest railway station, train info, etc."
												disabled={!isEditing}
											/>
											{isEditing && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() =>
														removeTravelField(setTravelByTrain, idx)
													}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											)}
										</div>
									))}
									{isEditing && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="mt-1"
											onClick={() => addTravelField(setTravelByTrain)}
										>
											Add Field
										</Button>
									)}
								</div>

								{/* By Bus */}
								<div className="space-y-2">
									<Label>Best Way by Bus</Label>
									{travelByBus.map((val, idx) => (
										<div key={idx} className="flex gap-2 mb-1">
											<Input
												value={val}
												onChange={(e) =>
													setTravelByBus((arr) =>
														arr.map((v, i) => (i === idx ? e.target.value : v))
													)
												}
												placeholder="e.g. Bus stand, route info, etc."
												disabled={!isEditing}
											/>
											{isEditing && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => removeTravelField(setTravelByBus, idx)}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											)}
										</div>
									))}
									{isEditing && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="mt-1"
											onClick={() => addTravelField(setTravelByBus)}
										>
											Add Field
										</Button>
									)}
								</div>

								{/* By Road */}
								<div className="space-y-2">
									<Label>Best Way by Road</Label>
									{travelByRoad.map((val, idx) => (
										<div key={idx} className="flex gap-2 mb-1">
											<Input
												value={val}
												onChange={(e) =>
													setTravelByRoad((arr) =>
														arr.map((v, i) => (i === idx ? e.target.value : v))
													)
												}
												placeholder="e.g. Highway, driving directions, etc."
												disabled={!isEditing}
											/>
											{isEditing && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() =>
														removeTravelField(setTravelByRoad, idx)
													}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											)}
										</div>
									))}
									{isEditing && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="mt-1"
											onClick={() => addTravelField(setTravelByRoad)}
										>
											Add Field
										</Button>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Amenities & FAQ Card */}
					<Card className="mb-4">
						<CardHeader>
							<CardTitle>Amenities & FAQs</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Amenities */}
							<div className="space-y-2">
								<Label>Amenities Nearby</Label>
								<div className="flex gap-2">
									<Input
										value={amenityInput}
										onChange={(e) => setAmenityInput(e.target.value)}
										placeholder="Amenity name"
										disabled={!isEditing}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												if (isEditing) handleAddAmenity();
											}
										}}
									/>
									<Button
										type="button"
										onClick={handleAddAmenity}
										disabled={!isEditing || !amenityInput.trim()}
									>
										<Plus className="h-4 w-4 mr-1" />
										Add
									</Button>
								</div>
								<div className="flex flex-wrap gap-2 mt-2">
									{amenities.map((a) => (
										<span
											key={a}
											className="inline-flex items-center bg-gray-100 rounded px-2 py-1 text-xs font-medium"
										>
											{a}
											{isEditing && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveAmenity(a)}
													className="ml-1"
												>
													<Trash2 className="h-3 w-3 text-red-500" />
												</Button>
											)}
										</span>
									))}
								</div>
							</div>

							{/* FAQ Section */}
							<div className="space-y-2">
								<Label>FAQs</Label>
								{dharamshalaFaqs.map((faq, idx) => (
									<div
										key={idx}
										className="flex flex-col md:flex-row gap-2 items-start mb-2"
									>
										<Input
											className="flex-1"
											placeholder="Question"
											value={faq.question}
											onChange={(e) =>
												handleFaqChange(idx, "question", e.target.value)
											}
											disabled={!isEditing}
										/>
										<Input
											className="flex-1"
											placeholder="Answer"
											value={faq.answer}
											onChange={(e) =>
												handleFaqChange(idx, "answer", e.target.value)
											}
											disabled={!isEditing}
										/>
										{isEditing && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => handleRemoveFaq(idx)}
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										)}
									</div>
								))}
								{isEditing && (
									<Button type="button" onClick={handleAddFaq}>
										<Plus className="h-4 w-4 mr-1" />
										Add FAQ
									</Button>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Images & Videos Card */}
					<Card>
						<CardHeader>
							<CardTitle>Dharamshala Images & Videos</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Banner and Cover Images Section */}
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Banner Image */}
									<div className="space-y-2">
										<Label>Banner Image</Label>
										{editedDharamshala.bannerImage ? (
											<div className="relative w-full h-32 rounded border overflow-hidden">
												<Image
													src={editedDharamshala.bannerImage}
													alt="Banner Image"
													fill
													className="object-cover"
													sizes="400px"
												/>
												{isEditing && (
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() =>
															setEditedDharamshala((prev) =>
																prev ? { ...prev, bannerImage: "" } : prev
															)
														}
														className="absolute top-1 right-1 bg-white/80"
													>
														<Trash2 className="h-4 w-4 text-red-500" />
													</Button>
												)}
											</div>
										) : (
											isEditing && (
												<div className="w-full h-32 border-2 border-dashed rounded flex items-center justify-center bg-muted">
													<span className="text-sm text-gray-500">
														No banner image
													</span>
												</div>
											)
										)}
										{isEditing && (
											<Input
												type="file"
												accept="image/*"
												onChange={handleBannerImageUpload}
												disabled={isUploadingImage}
												className="w-full"
											/>
										)}
									</div>

									{/* Cover Image */}
									<div className="space-y-2">
										<Label>Cover Image</Label>
										{editedDharamshala.coverImage ? (
											<div className="relative w-full h-32 rounded border overflow-hidden">
												<Image
													src={editedDharamshala.coverImage}
													alt="Cover Image"
													fill
													className="object-cover"
													sizes="400px"
												/>
												{isEditing && (
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() =>
															setEditedDharamshala((prev) =>
																prev ? { ...prev, coverImage: "" } : prev
															)
														}
														className="absolute top-1 right-1 bg-white/80"
													>
														<Trash2 className="h-4 w-4 text-red-500" />
													</Button>
												)}
											</div>
										) : (
											isEditing && (
												<div className="w-full h-32 border-2 border-dashed rounded flex items-center justify-center bg-muted">
													<span className="text-sm text-gray-500">
														No cover image
													</span>
												</div>
											)
										)}
										{isEditing && (
											<Input
												type="file"
												accept="image/*"
												onChange={handleCoverImageUpload}
												disabled={isUploadingImage}
												className="w-full"
											/>
										)}
									</div>
								</div>
							</div>

							{/* Images Section */}
							<div className="space-y-2">
								<Label>Dharamshala Images</Label>
								<div className="flex flex-wrap gap-3">
									{imageFiles.map((img, idx) => (
										<div
											key={img}
											className="relative w-32 h-20 rounded border overflow-hidden flex items-center justify-center bg-muted"
										>
											<Image
												src={img}
												alt={`Dharamshala Image ${idx + 1}`}
												fill
												className="object-cover w-full h-full"
												sizes="128px"
												style={{ objectFit: "cover" }}
											/>
											{isEditing && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveImage(img)}
													className="absolute top-1 right-1 bg-white/80"
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											)}
										</div>
									))}
									{isEditing && (
										<label className="w-32 h-20 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
											<Plus className="h-6 w-6 text-gray-400" />
											<span className="text-xs text-gray-500">Add Image</span>
											<input
												type="file"
												accept="image/*"
												multiple
												className="hidden"
												onChange={handleImageUpload}
												disabled={isUploadingImage}
											/>
										</label>
									)}
								</div>
								{isUploadingImage && (
									<p className="text-xs text-blue-600">Uploading image(s)...</p>
								)}
							</div>

							{/* Videos Section */}
							<div className="space-y-2">
								<Label>Dharamshala Videos</Label>
								<div className="flex flex-wrap gap-3">
									{videoFiles.map((vid) => (
										<div
											key={vid}
											className="relative w-40 h-24 rounded border overflow-hidden flex items-center justify-center bg-muted"
										>
											<video
												src={vid}
												controls
												className="object-cover w-full h-full"
											/>
											{isEditing && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveVideo(vid)}
													className="absolute top-1 right-1 bg-white/80"
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											)}
										</div>
									))}
									{isEditing && (
										<label className="w-40 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
											<VideoIcon className="h-6 w-6 text-gray-400" />
											<span className="text-xs text-gray-500">Add Video</span>
											<input
												type="file"
												accept="video/mp4,video/webm,video/ogg"
												multiple
												className="hidden"
												onChange={handleVideoUpload}
												disabled={isUploadingVideo}
											/>
										</label>
									)}
								</div>
								{isUploadingVideo && (
									<p className="text-xs text-blue-600">Uploading video(s)...</p>
								)}
							</div>
						</CardContent>
					</Card>
				</CardContent>
				{isEditing && (
					<CardFooter>
						<Button onClick={onSave} disabled={isSaving}>
							{isSaving ? (
								<>
									<Save className="h-4 w-4 mr-2 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Save className="h-4 w-4 mr-2" />
									Save Changes
								</>
							)}
						</Button>
					</CardFooter>
				)}
			</Card>
		</>
	);
}
