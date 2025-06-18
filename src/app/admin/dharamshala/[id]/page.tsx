"use client";

import { useState, useEffect,Dispatch, SetStateAction } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
	CardDescription,
} from "@/components/ui/card";
import {
	Save,
	ArrowLeft,
	Plus,
	Video as VideoIcon,
	Trash2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import type { LeafletMouseEvent, DragEndEvent } from "leaflet";

// For map, use leaflet (client-side only)
import dynamic from "next/dynamic";
import type * as L from "leaflet"; // <-- Add this import for L namespace
const Map = dynamic<MapContainerProps>(
	() => import("react-leaflet").then((mod) => mod.MapContainer),
	{ ssr: false }
);
const TileLayer = dynamic<TileLayerProps>(
	() => import("react-leaflet").then((mod) => mod.TileLayer),
	{ ssr: false }
);
const Marker = dynamic<MarkerProps>(
	() => import("react-leaflet").then((mod) => mod.Marker),
	{ ssr: false }
);
const Popup = dynamic<PopupProps>(
	() => import("react-leaflet").then((mod) => mod.Popup),
	{ ssr: false }
);
import "leaflet/dist/leaflet.css";
import {
	MapContainerProps,
	MarkerProps,
	PopupProps,
	TileLayerProps,
} from "react-leaflet";
import Image from "next/image";

type Faq = { id?: string; question: string; answer: string };
type DharamshalaData = {
	id: string;
	name: string;
	date: string;
	state: string;
	city: string;
	status: string;
	description?: string;
	additionalInfo?: string;
	latitude?: number | null;
	longitude?: number | null;
	travelByAir?: string[];
	travelByTrain?: string[];
	travelByBus?: string[];
	travelByRoad?: string[];
	timings?: string;
	amenities?: string[];
	dharamshalaFaqs?: Faq[];
	createdAt?: string;
	updatedAt?: string;
	imageFile?: string[];
	videoFile?: string[];
	placeName?: string;
};

// Fix: Use a unique key for MapContainer to force remount on markerPos/mapCenter change
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
	const [addressInput, setAddressInput] = useState("");
	const [isGeocoding, setIsGeocoding] = useState(false);

	// Amenities
	const [amenityInput, setAmenityInput] = useState("");
	const [amenities, setAmenities] = useState<string[]>([]);

	// FAQ
	const [dharamshalaFaqs, setDharamshalaFaqs] = useState<Faq[]>([]);

	// Map
	const [mapCenter, setMapCenter] = useState<[number, number]>([
		22.9734, 78.6569,
	]); // India center
	const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
	const [map, setMap] = useState<L.Map | null>(null);

	useEffect(() => {
		if (map) {
			setTimeout(() => map.invalidateSize(), 100);
		}
	}, [map]);

	// Images and Videos
	const [imageFiles, setImageFiles] = useState<string[]>([]);
	const [videoFiles, setVideoFiles] = useState<string[]>([]);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [isUploadingVideo, setIsUploadingVideo] = useState(false);

	// Travel fields state for editing
	const [travelByAir, setTravelByAir] = useState<string[]>([]);
	const [travelByTrain, setTravelByTrain] = useState<string[]>([]);
	const [travelByBus, setTravelByBus] = useState<string[]>([]);
	const [travelByRoad, setTravelByRoad] = useState<string[]>([]);

	// Sync travel fields from loaded data
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

	// Add/remove helpers
	const addTravelField = (setter: Dispatch<SetStateAction<string[]>>) => {
		setter((prev) => [...prev, ""]);
	};
	const removeTravelField = (
		setter: Dispatch<SetStateAction<string[]>>,
		idx: number
	) => {
		setter((prev) => prev.filter((_, i) => i !== idx));
	};

	// Fetch dharamshala data
	useEffect(() => {
		const fetchDharamshala = async () => {
			try {
				const response = await fetch(`/api/dharamshala/${dharamshalaId}`);
				if (!response.ok) throw new Error("Failed to fetch dharamshala");
				const data: DharamshalaData = await response.json();
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
				if (data.latitude && data.longitude) {
					setMapCenter([data.latitude, data.longitude]);
					setMarkerPos([data.latitude, data.longitude]);
				}
				// Prefer a saved place name if available, else fallback to city/state
				if (data.placeName) {
					setAddressInput(data.placeName);
				} else if (data.city && data.state) {
					setAddressInput(`${data.city}, ${data.state}`);
				} else if (data.city) {
					setAddressInput(data.city);
				} else if (data.state) {
					setAddressInput(data.state);
				} else {
					setAddressInput("");
				}
			} catch {
				toast.error("Failed to load dharamshala details");
				router.push("/admin/dharamshala");
			}
		};
		if (dharamshalaId) fetchDharamshala();
	}, [dharamshalaId, router]);

	// Geocode address input to lat/lng
	const handleGeocode = async () => {
		if (!addressInput.trim()) return;
		setIsGeocoding(true);
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
					addressInput
				)}`
			);
			const data: Array<{ lat: string; lon: string }> = await res.json();
			if (data && data.length > 0) {
				const lat = parseFloat(data[0].lat);
				const lon = parseFloat(data[0].lon);
				setMapCenter([lat, lon]);
				setMarkerPos([lat, lon]);
				setEditedDharamshala((prev) =>
					prev ? { ...prev, latitude: lat, longitude: lon } : prev
				);
				toast.success("Location found and set!");
			} else {
				toast.error("No location found for that address.");
			}
		} catch {
			toast.error("Failed to geocode address.");
		} finally {
			setIsGeocoding(false);
		}
	};

	// Map marker drag/click
	const handleMapClick = (e: LeafletMouseEvent) => {
		const { lat, lng } = e.latlng;
		setMarkerPos([lat, lng]);
		setEditedDharamshala((prev) =>
			prev ? { ...prev, latitude: lat, longitude: lng } : prev
		);
	};

	const handleMarkerDrag = (e: DragEndEvent) => {
		const { lat, lng } = e.target.getLatLng();
		setMarkerPos([lat, lng]);
		setEditedDharamshala((prev) =>
			prev ? { ...prev, latitude: lat, longitude: lng } : prev
		);
	};

	// Amenity add/remove
	const handleAddAmenity = () => {
		const val = amenityInput.trim();
		if (!val) return;
		if (amenities.includes(val)) return;
		setAmenities((prev) => [...prev, val]);
		setAmenityInput("");
	};
	const handleRemoveAmenity = (name: string) => {
		setAmenities((prev) => prev.filter((a) => a !== name));
	};

	// FAQ add/remove/update
	const handleAddFaq = () => {
		setDharamshalaFaqs((prev) => [...prev, { question: "", answer: "" }]);
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

	// --- Image Upload ---
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
				formData.append("dharamshalaId", dharamshalaId);
				const response = await fetch("/api/upload/dharamshala-image", {
					method: "POST",
					body: formData,
				});
				if (!response.ok) throw new Error("Failed to upload image");
				const { imageUrl } = await response.json();
				uploaded.push(imageUrl);
			}
			setImageFiles((prev) => [...prev, ...uploaded]);
			toast.success("Image(s) uploaded successfully!");
		} catch {
			toast.error("Failed to upload image(s)");
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleRemoveImage = (url: string) => {
		setImageFiles((prev) => prev.filter((img) => img !== url));
	};

	// --- Video Upload ---
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
				formData.append("dharamshalaId", dharamshalaId);
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

	const handleRemoveVideo = (url: string) => {
		setVideoFiles((prev) => prev.filter((vid) => vid !== url));
	};

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
					placeName: addressInput, // Always send the current addressInput as placeName
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
			setDharamshalaFaqs(updated.faqs || []);
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

	// Memoize the red pin icon so it doesn't recreate on every render
	const [redPinIcon, setRedPinIcon] = useState<L.DivIcon | undefined>(undefined);

	useEffect(() => {
		let isMounted = true;
		if (typeof window === "undefined") return;
		import("leaflet").then((L_) => {
			if (isMounted) {
				setRedPinIcon(
					L_.divIcon({
						className: "",
						html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
						iconSize: [32, 32],
						iconAnchor: [16, 32],
					})
				);
			}
		});
		return () => {
			isMounted = false;
		};
	}, []);

	if (!dharamshala || !editedDharamshala) {
		return (
			<div className="flex justify-center items-center h-40">Loading...</div>
		);
	}

	// Generate a unique key for MapContainer to avoid "container is being reused" error
	const mapKey = JSON.stringify(markerPos || mapCenter);

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
				<Card className="md:col-span-1 h-fit">
					<CardHeader className="text-center p-4 pb-2">
						<CardTitle className="text-center text-lg">
							{dharamshala?.name}
						</CardTitle>
						<CardDescription>
							<span
								className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
									dharamshala?.status === "Active"
										? "bg-green-100 text-green-800"
										: "bg-red-100 text-red-800"
								}`}
							>
								{dharamshala?.status}
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 p-4 pt-0">
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">State:</span>
							<span>{dharamshala?.state}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">City:</span>
							<span>{dharamshala?.city}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Date:</span>
							<span>
								{dharamshala?.date ? dharamshala.date.split("T")[0] : "N/A"}
							</span>
						</div>
						{/* Example error display for name */}
						{isEditing && errors.name && (
							<p className="text-sm text-red-500">{errors.name}</p>
						)}
						{/* Example error display for date */}
						{isEditing && errors.date && (
							<p className="text-sm text-red-500">{errors.date}</p>
						)}
						{/* Example error display for state */}
						{isEditing && errors.state && (
							<p className="text-sm text-red-500">{errors.state}</p>
						)}
						{/* Example error display for city */}
						{isEditing && errors.city && (
							<p className="text-sm text-red-500">{errors.city}</p>
						)}
						{/* Example error display for status */}
						{isEditing && errors.status && (
							<p className="text-sm text-red-500">{errors.status}</p>
						)}
					</CardContent>
					<CardFooter className="p-4 pt-0">
						<Button
							className="w-full text-sm h-8"
							variant={isEditing ? "outline" : "default"}
							onClick={() => setIsEditing(!isEditing)}
						>
							{isEditing ? "Cancel" : "Edit Dharamshala"}
						</Button>
					</CardFooter>
				</Card>
			</div>
			{/* Map Section */}
			<div className="mt-6">
				<Card>
					<CardContent>
						<div style={{ height: "400px", width: "100%" }}>
							<Map
								key={mapKey}
								center={markerPos || mapCenter}
								zoom={markerPos ? 15 : 5}
								style={{ height: "100%", width: "100%" }}
								whenReady={() => {
									// Use a timeout to ensure the map is available
									setTimeout(() => {
										const leaflet = require("leaflet");
										const mapElement = document.querySelector(".leaflet-container");
										if (mapElement && leaflet && leaflet.Map) {
											const mapInstance = (leaflet.Map.prototype._instances as L.Map[] | undefined)?.find(
												(m: L.Map) => m.getContainer && m.getContainer() === mapElement
											);
											if (mapInstance) setMap(mapInstance);
										}
									}, 0);
								}}
								// @ts-expect-error eventHandlers prop type mismatch with react-leaflet types
								eventHandlers={
									isEditing
										? {
												click: handleMapClick,
										}
										: undefined
								}
							>
								<TileLayer
									attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
									url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
								/>
								{markerPos && (
									<Marker
										position={markerPos}
										draggable={isEditing}
										eventHandlers={
											isEditing ? { dragend: handleMarkerDrag } : undefined
										}
										icon={redPinIcon}
									>
										<Popup>
											{editedDharamshala?.name || "Dharamshala Location"}
										</Popup>
									</Marker>
								)}
							</Map>
						</div>
						<div className="flex flex-col gap-2 w-full md:w-96 mt-4">
							<Label>Search Address/Place</Label>
							<Input
								value={addressInput}
								onChange={(e) => setAddressInput(e.target.value)}
								placeholder="Type address or place name"
								disabled={!isEditing}
							/>
							<Button
								type="button"
								onClick={handleGeocode}
								disabled={!isEditing || isGeocoding || !addressInput.trim()}
								className="w-full"
							>
								{isGeocoding ? "Searching..." : "Find & Set Location"}
							</Button>
							<div className="flex gap-2 mt-2">
								<Input
									type="number"
									step="any"
									value={editedDharamshala?.latitude ?? ""}
									onChange={(e) =>
										setEditedDharamshala((prev) =>
											prev
												? {
														...prev,
														latitude: parseFloat(e.target.value) || 0,
												  }
												: prev
										)
									}
									placeholder="Latitude"
									disabled={!isEditing}
								/>
								<Input
									type="number"
									step="any"
									value={editedDharamshala?.longitude ?? ""}
									onChange={(e) =>
										setEditedDharamshala((prev) =>
											prev
												? {
														...prev,
														longitude: parseFloat(e.target.value) || 0,
												  }
												: prev
										)
									}
									placeholder="Longitude"
									disabled={!isEditing}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
			{/* Outer Card for all grouped sections */}
			<div className="mt-6">
				<Card>
					<CardContent className="space-y-6 pt-6">
						{/* Info Card: Description, Additional Info, Timings */}
						<Card className="mb-4">
							<CardHeader>
								<CardTitle>Dharamshala Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="description">Description</Label>
										<Textarea
											id="description"
											value={editedDharamshala?.description || ""}
											onChange={(e) =>
												setEditedDharamshala((prev) =>
													prev ? { ...prev, description: e.target.value } : prev
												)
											}
											rows={3}
											disabled={!isEditing}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="additionalInfo">Additional Info</Label>
										<Textarea
											id="additionalInfo"
											value={editedDharamshala?.additionalInfo || ""}
											onChange={(e) =>
												setEditedDharamshala((prev) =>
													prev
														? { ...prev, additionalInfo: e.target.value }
														: prev
												)
											}
											rows={3}
											disabled={!isEditing}
										/>
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
													onChange={(e) =>
														setTravelByAir((arr) =>
															arr.map((v, i) =>
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
														onClick={() =>
															removeTravelField(setTravelByAir, idx)
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
															arr.map((v, i) =>
																i === idx ? e.target.value : v
															)
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
															arr.map((v, i) =>
																i === idx ? e.target.value : v
															)
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
														onClick={() =>
															removeTravelField(setTravelByBus, idx)
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
															arr.map((v, i) =>
																i === idx ? e.target.value : v
															)
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
										<p className="text-xs text-blue-600">
											Uploading image(s)...
										</p>
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
										<p className="text-xs text-blue-600">
											Uploading video(s)...
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					</CardContent>
					{isEditing && (
						<CardFooter>
							<Button onClick={handleSave} disabled={isSaving}>
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
			</div>
		</div>
	);
}
