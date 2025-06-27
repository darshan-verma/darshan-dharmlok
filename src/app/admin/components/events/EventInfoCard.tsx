import { useRef } from "react";
import Image from "next/image";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
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
import { Save, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import {
	Event,
	eventCategories,
	eventTypes,
	statusOptions,
	extractGoogleMapsSrc,
} from "./types";

interface EventInfoCardProps {
	event: Event | null;
	editedEvent: Event | null;
	setEditedEvent: React.Dispatch<React.SetStateAction<Event | null>>;
	isEditing: boolean;
	isSaving: boolean;
	errors: Record<string, string>;
	isUploadingBanner: boolean;
	setIsUploadingBanner: React.Dispatch<React.SetStateAction<boolean>>;
	isUploadingRelated: boolean;
	setIsUploadingRelated: React.Dispatch<React.SetStateAction<boolean>>;
	onSave: () => Promise<void>;
}

export function EventInfoCard({
	event,
	editedEvent,
	setEditedEvent,
	isEditing,
	isSaving,
	errors,
	isUploadingBanner,
	setIsUploadingBanner,
	isUploadingRelated,
	setIsUploadingRelated,
	onSave,
}: EventInfoCardProps) {
	const bannerFileInputRef = useRef<HTMLInputElement>(null);
	const relatedFileInputRef = useRef<HTMLInputElement>(null);

	if (!event || !editedEvent) return null;

	const handleRemoveBanner = () => {
		setEditedEvent({
			...editedEvent,
			bannerImage: "",
		});
	};

	const handleRemoveRelatedImage = (url: string) => {
		setEditedEvent({
			...editedEvent,
			relatedImages: (editedEvent.relatedImages || []).filter(
				(img) => img !== url
			),
		});
	};

	const handleBannerFileUpload = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setIsUploadingBanner(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			const resp = await fetch("/api/upload/profile-image", {
				method: "POST",
				body: formData,
			});
			if (!resp.ok) throw new Error("Failed to upload image");
			const { imageUrl } = await resp.json();
			setEditedEvent({ ...editedEvent, bannerImage: imageUrl });
			toast.success("Banner image uploaded!");
		} catch {
			toast.error("Failed to upload banner image");
		} finally {
			setIsUploadingBanner(false);
			if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
		}
	};

	const handleRelatedFileUpload = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = e.target.files;
		if (!files) return;
		setIsUploadingRelated(true);
		try {
			const uploadedUrls: string[] = [];
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const formData = new FormData();
				formData.append("file", file);
				const resp = await fetch("/api/upload/profile-image", {
					method: "POST",
					body: formData,
				});
				if (!resp.ok) throw new Error("Failed to upload image");
				const { imageUrl } = await resp.json();
				uploadedUrls.push(imageUrl);
			}
			setEditedEvent({
				...editedEvent,
				relatedImages: [...(editedEvent.relatedImages || []), ...uploadedUrls],
			});
			toast.success(
				uploadedUrls.length > 1
					? "Related images uploaded!"
					: "Related image uploaded!"
			);
		} catch {
			toast.error("Failed to upload related image(s)");
		} finally {
			setIsUploadingRelated(false);
			if (relatedFileInputRef.current) relatedFileInputRef.current.value = "";
		}
	};

	return (
		<>
			{isEditing ? (
				<Card>
					<CardHeader>
						<CardTitle>Edit Event</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Event Title *</Label>
							<Input
								id="title"
								value={editedEvent.title}
								onChange={(e) =>
									setEditedEvent({
										...editedEvent,
										title: e.target.value,
									})
								}
								className={errors.title ? "border-red-500" : ""}
							/>
							{errors.title && (
								<p className="text-sm text-red-500">{errors.title}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Event Description</Label>
							<Input
								id="description"
								value={editedEvent.description || ""}
								onChange={(e) =>
									setEditedEvent({
										...editedEvent,
										description: e.target.value,
									})
								}
								placeholder="Enter event description"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="bookingUrl">Event Booking URL</Label>
							<Input
								id="bookingUrl"
								value={editedEvent.bookingUrl || ""}
								onChange={(e) =>
									setEditedEvent({
										...editedEvent,
										bookingUrl: e.target.value,
									})
								}
								placeholder="Enter booking URL"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="address">Event Address</Label>
							<Input
								id="address"
								value={editedEvent.address || ""}
								onChange={(e) =>
									setEditedEvent({
										...editedEvent,
										address: e.target.value,
									})
								}
								placeholder="Enter event address"
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="fromDate">From Date *</Label>
								<Input
									id="fromDate"
									type="date"
									value={editedEvent.fromDate}
									onChange={(e) =>
										setEditedEvent({
											...editedEvent,
											fromDate: e.target.value,
										})
									}
									className={errors.fromDate ? "border-red-500" : ""}
								/>
								{errors.fromDate && (
									<p className="text-sm text-red-500">{errors.fromDate}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="fromTime">From Time</Label>
								<Input
									id="fromTime"
									type="time"
									value={editedEvent.fromTime || ""}
									onChange={(e) =>
										setEditedEvent({
											...editedEvent,
											fromTime: e.target.value,
										})
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="toDate">To Date *</Label>
								<Input
									id="toDate"
									type="date"
									value={editedEvent.toDate}
									onChange={(e) =>
										setEditedEvent({
											...editedEvent,
											toDate: e.target.value,
										})
									}
									className={errors.toDate ? "border-red-500" : ""}
								/>
								{errors.toDate && (
									<p className="text-sm text-red-500">{errors.toDate}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="toTime">To Time</Label>
								<Input
									id="toTime"
									type="time"
									value={editedEvent.toTime || ""}
									onChange={(e) =>
										setEditedEvent({
											...editedEvent,
											toTime: e.target.value,
										})
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="place">Event Place</Label>
							<Input
								id="place"
								value={editedEvent.place || ""}
								onChange={(e) =>
									setEditedEvent({
										...editedEvent,
										place: e.target.value,
									})
								}
								placeholder="Enter event place"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="location">
								Event Location (Google Maps embed src URL or iframe HTML)
							</Label>
							<Input
								id="location"
								value={editedEvent.location || ""}
								onChange={(e) =>
									setEditedEvent({
										...editedEvent,
										location: e.target.value,
									})
								}
								placeholder="Paste Google Maps embed src URL or iframe HTML"
							/>
							{/* Map Preview */}
							{extractGoogleMapsSrc(editedEvent.location) ? (
								<div className="mt-2 border rounded overflow-hidden">
									<iframe
										src={extractGoogleMapsSrc(editedEvent.location)}
										width="100%"
										height="250"
										style={{ border: 0 }}
										allowFullScreen
										loading="lazy"
									/>
								</div>
							) : null}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="category">Category *</Label>
								<Select
									value={editedEvent.category}
									onValueChange={(value) =>
										setEditedEvent({
											...editedEvent,
											category: value,
										})
									}
								>
									<SelectTrigger
										id="category"
										className={errors.category ? "border-red-500" : ""}
									>
										<SelectValue placeholder="Select category" />
									</SelectTrigger>
									<SelectContent>
										{eventCategories.map((cat) => (
											<SelectItem key={cat} value={cat}>
												{cat}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.category && (
									<p className="text-sm text-red-500">{errors.category}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="type">Event Type *</Label>
								<Select
									value={editedEvent.type}
									onValueChange={(value) =>
										setEditedEvent({
											...editedEvent,
											type: value,
										})
									}
								>
									<SelectTrigger
										id="type"
										className={errors.type ? "border-red-500" : ""}
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
								{errors.type && (
									<p className="text-sm text-red-500">{errors.type}</p>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="price">Event Price</Label>
							<Input
								id="price"
								type="number"
								min={0}
								value={editedEvent.price ?? ""}
								onChange={(e) =>
									setEditedEvent({
										...editedEvent,
										price: e.target.value ? Number(e.target.value) : undefined,
									})
								}
								placeholder="Enter event price"
							/>
						</div>

						<div className="space-y-2">
							<Label>Banner Image</Label>
							<div className="flex gap-2 items-center">
								<Input
									ref={bannerFileInputRef}
									type="file"
									accept="image/*"
									onChange={handleBannerFileUpload}
									disabled={isUploadingBanner}
								/>
								{isUploadingBanner && (
									<span className="text-xs text-blue-600">Uploading...</span>
								)}
							</div>
							{editedEvent.bannerImage && (
								<div className="relative w-40 h-24 mt-2 rounded border overflow-hidden flex items-center justify-center bg-muted">
									<Image
										src={editedEvent.bannerImage}
										alt="Banner"
										fill
										sizes="160px"
										style={{ objectFit: "cover" }}
										className="object-cover w-full h-full"
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={handleRemoveBanner}
										className="absolute top-1 right-1 bg-white/80"
									>
										<Trash2 className="h-4 w-4 text-red-500" />
									</Button>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label>Related Images</Label>
							<div className="flex gap-2 items-center">
								<Input
									ref={relatedFileInputRef}
									type="file"
									accept="image/*"
									multiple
									onChange={handleRelatedFileUpload}
									disabled={isUploadingRelated}
								/>
								{isUploadingRelated && (
									<span className="text-xs text-blue-600">Uploading...</span>
								)}
							</div>
							<div className="flex flex-wrap gap-3 mt-2">
								{editedEvent.relatedImages &&
									editedEvent.relatedImages.map((img, idx) => (
										<div
											key={img}
											className="relative w-32 h-20 rounded border overflow-hidden flex items-center justify-center bg-muted"
										>
											<Image
												src={img}
												alt={`Related Image ${idx + 1}`}
												fill
												sizes="128px"
												style={{ objectFit: "cover" }}
												className="object-cover w-full h-full"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => handleRemoveRelatedImage(img)}
												className="absolute top-1 right-1 bg-white/80"
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										</div>
									))}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="status">Status *</Label>
							<Select
								value={editedEvent.status}
								onValueChange={(value) =>
									setEditedEvent({ ...editedEvent, status: value })
								}
							>
								<SelectTrigger
									id="status"
									className={errors.status ? "border-red-500" : ""}
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
							{errors.status && (
								<p className="text-sm text-red-500">{errors.status}</p>
							)}
						</div>
					</CardContent>
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
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Event Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-muted-foreground">
								Description
							</h3>
							<p className="font-medium text-foreground whitespace-pre-wrap">
								{event.description || "No description provided"}
							</p>
						</div>
						{event.bookingUrl && (
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Booking URL
								</h3>
								<p className="font-medium text-foreground break-all">
									<a
										href={event.bookingUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 underline"
									>
										{event.bookingUrl}
									</a>
								</p>
							</div>
						)}
						{event.address && (
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Address
								</h3>
								<p className="font-medium text-foreground">{event.address}</p>
							</div>
						)}
						{event.place && (
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Place
								</h3>
								<p className="font-medium text-foreground">{event.place}</p>
							</div>
						)}
						{extractGoogleMapsSrc(event.location) && (
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Event Location
								</h3>
								<div className="w-full border rounded overflow-hidden">
									<iframe
										src={extractGoogleMapsSrc(event.location)}
										width="100%"
										height="250"
										style={{ border: 0 }}
										allowFullScreen
										loading="lazy"
									/>
								</div>
							</div>
						)}
						{event.bannerImage && (
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Banner Image
								</h3>
								<div className="relative w-40 h-24 rounded border overflow-hidden flex items-center justify-center bg-muted">
									<Image
										src={event.bannerImage}
										alt="Banner"
										fill
										sizes="160px"
										style={{ objectFit: "cover" }}
										className="object-cover w-full h-full"
									/>
								</div>
							</div>
						)}
						{event.relatedImages && event.relatedImages.length > 0 && (
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									Related Images
								</h3>
								<div className="flex flex-wrap gap-3">
									{event.relatedImages.map((img, idx) => (
										<div
											key={img}
											className="relative w-32 h-20 rounded border overflow-hidden flex items-center justify-center bg-muted"
										>
											<Image
												src={img}
												alt={`Related Image ${idx + 1}`}
												fill
												sizes="128px"
												style={{ objectFit: "cover" }}
												className="object-cover w-full h-full"
											/>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</>
	);
}
