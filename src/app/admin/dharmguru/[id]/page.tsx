"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Save,
	Phone,
	Mail,
	MapPin,
	Plus,
	Trash2,
	ChevronDown,
	BookOpen,
	Award,
	Upload,
	UserIcon, // Add Upload icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { toast } from "@/lib/toast";
import {
	getRankColor,
	getCategoryColor,
} from "@/app/admin/components/dharmguru/DharmguruTable";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";

interface Activity {
	date: string;
	action: string;
}

interface DharmguruPreferences {
	notifications: boolean;
	newsletter: boolean;
	language: string;
}

interface Address {
	id?: string;
	type: "home" | "work" | "other";
	label?: string;
	line1: string;
	line2?: string;
	city: string;
	state?: string;
	country: string;
	pincode?: string;
	createdAt?: string | Date;
	updatedAt?: string | Date;
}

interface Dharmguru {
	id: string;
	name: string;
	phone: string;
	email: string;
	KathavachakType?: string;
	typeVendor?: string;
	profileImageUrl?: string;
	bio?: string;
	coverImageUrl?: string;
	category?: string;
	addresses?: Address[];
	social?: number;
	active?: number;
	rank?: string;
	availability?: number;
	kycApproved?: number;
	status?: string;
	isLoggedIn: boolean;
	lastLogoutAt?: string | Date | null;
	lastActiveAt?: string | Date | null;
	lastLoginAt?: string | Date | null;
	createdAt: string | Date;
	// Client-side only properties
	preferences?: DharmguruPreferences;
	activities?: Activity[];
}

interface FormErrors {
	name?: string;
	email?: string;
	phone?: string;
	addresses?: {
		[key: string]: {
			line1?: string;
			city?: string;
			country?: string;
			label?: string;
		};
	};
}

export default function DharmguruDetailPage() {
	const params = useParams();
	const router = useRouter();
	const dharmguruId = params?.id as string;

	const [dharmguru, setDharmguru] = useState<Dharmguru | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedDharmguru, setEditedDharmguru] =
		useState<Partial<Dharmguru> | null>(null);
	const [imageError, setImageError] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [showAddresses, setShowAddresses] = useState(false);
	const [addressesToDelete, setAddressesToDelete] = useState<string[]>([]);
	const [isUploadingImage, setIsUploadingImage] = useState(false); // Add image upload state

	// --- Posts Tab: Images & Videos State ---
	const [showImageUpload, setShowImageUpload] = useState(false);
	const [showVideoUpload, setShowVideoUpload] = useState(false);
	const [postImages, setPostImages] = useState<string[]>([]);
	const [postVideos, setPostVideos] = useState<string[]>([]);
	const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
	const [isUploadingPostVideo, setIsUploadingPostVideo] = useState(false);
	const [isSavingPosts, setIsSavingPosts] = useState(false);

	const [existingImages, setExistingImages] = useState<string[]>([]);
	const [newImages, setNewImages] = useState<string[]>([]);
	const [deletedImages, setDeletedImages] = useState<string[]>([]);

	// Fetch Kathavachak data from API
	const fetchDharmguruData = useCallback(async () => {
		try {
			// Validate MongoDB ObjectId format
			if (dharmguruId && !/^[0-9a-fA-F]{24}$/.test(dharmguruId)) {
				toast.error("Invalid Kathavachak ID format");
				router.push("/admin/dharmguru");
				return;
			}

			const loadingToast = toast.loading("Loading Kathavachak details...");

			// Add timeout to prevent hanging requests
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			try {
				const response = await fetch(`/api/users/${dharmguruId}`, {
					signal: controller.signal,
				});
				clearTimeout(timeoutId);

				if (!response.ok) {
					const errorText = await response.text();

					let errorData;
					try {
						errorData = JSON.parse(errorText);
					} catch {
						errorData = { error: "Unknown error occurred" };
					}

					throw new Error(errorData.error || "Failed to fetch Dharmguru");
				}

				const DharmguruData = await response.json();

				// Create a complete Kathavachak object with fallbacks for missing properties
				const completeDharmguru: Dharmguru = {
					...DharmguruData,
					id: DharmguruData.id,
					name: DharmguruData.name || "",
					email: DharmguruData.email || "",
					phone: DharmguruData.phone || "",
					addresses: DharmguruData.addresses || [],
					KathavachakType: DharmguruData.KathavachakType || "Regular",
					status: DharmguruData.status || "Active",
					isLoggedIn: DharmguruData.isLoggedIn || false,
					bio: DharmguruData.bio || "",
					createdAt: DharmguruData.createdAt || new Date().toISOString(),
					// Add client-side only properties
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};

				setDharmguru(completeDharmguru);
				setEditedDharmguru({ ...completeDharmguru });
				toast.dismiss(loadingToast);
			} catch (error) {
				clearTimeout(timeoutId);
				if (error instanceof Error) {
					if (error.name === "AbortError") {
						throw new Error("Request timed out. Please try again.");
					}
				}
				throw error;
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to load Dharmguru details"
			);

			// Create a mock Dharmguru as fallback for development
			if (process.env.NODE_ENV !== "production") {
				const mockDharmguru: Dharmguru = {
					id: dharmguruId || "mock-id",
					name: "Test Dharmguru",
					email: "test@example.com",
					phone: "1234567890",
					addresses: [
						{
							type: "home",
							line1: "123 Test Street",
							city: "Test City",
							country: "India",
						},
					],
					KathavachakType: "Regular",
					status: "Active",
					isLoggedIn: false,
					bio: "This is a test Dharmguru bio.",
					createdAt: new Date().toISOString(),
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};
				setDharmguru(mockDharmguru);
				setEditedDharmguru({ ...mockDharmguru });
				return;
			}

			router.push("/admin/dharmguru");
		}
	}, [dharmguruId, router]);

	// Call the fetch function when component mounts
	useEffect(() => {
		if (dharmguruId) {
			fetchDharmguruData();
		}
	}, [dharmguruId, fetchDharmguruData]);

	const validateForm = (DharmguruData: Partial<Dharmguru>): boolean => {
		const newErrors: FormErrors = {};

		if (!DharmguruData.name?.trim()) {
			newErrors.name = "Name is required";
		}

		if (!DharmguruData.email?.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(DharmguruData.email)) {
			newErrors.email = "Email is invalid";
		}

		if (!DharmguruData.phone?.trim()) {
			newErrors.phone = "Phone number is required";
		} else {
			const phoneRegex = /^(\+91[\s-]?)?[0-9]{10}$/;
			if (!phoneRegex.test(DharmguruData.phone.replace(/[\s-]/g, ""))) {
				newErrors.phone =
					"Please enter a valid 10-digit phone number with optional +91 prefix";
			}
		}

		if (DharmguruData.addresses) {
			DharmguruData.addresses.forEach((address, index) => {
				if (!address.line1?.trim()) {
					newErrors.addresses = newErrors.addresses || {};
					newErrors.addresses[index] = newErrors.addresses[index] || {};
					newErrors.addresses[index].line1 = "Address line 1 is required";
				}

				if (!address.city?.trim()) {
					newErrors.addresses = newErrors.addresses || {};
					newErrors.addresses[index] = newErrors.addresses[index] || {};
					newErrors.addresses[index].city = "City is required";
				}

				if (!address.country?.trim()) {
					newErrors.addresses = newErrors.addresses || {};
					newErrors.addresses[index] = newErrors.addresses[index] || {};
					newErrors.addresses[index].country = "Country is required";
				}
			});
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSaveChanges = async () => {
		if (!editedDharmguru) return;

		if (!validateForm(editedDharmguru)) {
			return;
		}

		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");

		try {
			// Prepare data for API
			const dataToSave = {
				name: editedDharmguru.name,
				email: editedDharmguru.email,
				phone: editedDharmguru.phone,
				addresses: editedDharmguru.addresses,
				addressesToDelete,
				bio: editedDharmguru.bio || null,
				profileImageUrl:
					editedDharmguru.profileImageUrl === undefined
						? null // <-- send null if removed
						: editedDharmguru.profileImageUrl,
			};

			const response = await fetch(`/api/users/${dharmguruId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSave),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update Dharmguru");
			}

			const updatedDharmguru = await response.json();

			setDharmguru(updatedDharmguru);
			setEditedDharmguru(updatedDharmguru);
			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("Dharmguru details updated successfully!");
			setAddressesToDelete([]);
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update Dharmguru details"
			);
		} finally {
			setIsSaving(false);
		}
	};

	const formatDate = (dateString: string | Date) => {
		if (!dateString) return "N/A";
		const date =
			typeof dateString === "string" ? new Date(dateString) : dateString;
		return new Intl.DateTimeFormat("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		}).format(date);
	};

	const getDharmguruStatus = (Dharmguru: Dharmguru) => {
		if (!Dharmguru.status || Dharmguru.status === "Inactive") return "Inactive";
		return Dharmguru.isLoggedIn ? "Active (Online)" : "Active (Offline)";
	};

	const getStatusColor = (status: string) => {
		if (status === "Inactive") return "bg-red-100 text-red-800";
		if (status === "Active (Online)") return "bg-green-100 text-green-800";
		return "bg-blue-100 text-blue-800"; // Active (Offline)
	};

	const formatPhoneNumber = (value: string): string => {
		// Remove all non-digit characters
		const cleaned = value.replace(/\D/g, "");

		// If it starts with 91, add +91
		if (cleaned.startsWith("91") && cleaned.length >= 10) {
			return `+91 ${cleaned.substring(2, 12)}`;
		}
		// If it's 10 digits, format as is
		else if (cleaned.length <= 10) {
			return cleaned;
		}
		// Default return the cleaned value
		return cleaned;
	};

	// Add image upload function
	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		if (!validTypes.includes(file.type)) {
			toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
			return;
		}

		// Validate file size (5MB limit)
		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error("Image size must be less than 5MB");
			return;
		}

		setIsUploadingImage(true);
		const loadingToast = toast.loading("Uploading image...");

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("userId", dharmguruId);

			const response = await fetch("/api/upload/profile-image", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to upload image");
			}

			const { imageUrl } = await response.json();

			setEditedDharmguru((prev) =>
				prev ? { ...prev, profileImageUrl: imageUrl } : null
			);
			setImageError(false);

			toast.dismiss(loadingToast);
			toast.success("Profile image updated successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to upload image"
			);
		} finally {
			setIsUploadingImage(false);
		}
	};

	// Add function to remove profile image
	const handleRemoveImage = () => {
		setEditedDharmguru((prev) =>
			prev ? { ...prev, profileImageUrl: undefined } : null
		);
		setImageError(false);
		toast.success("Profile image removed");
	};

	function handleBlockNoteChange(field: "bio", val: string): void {
		setEditedDharmguru((prev) => (prev ? { ...prev, [field]: val } : prev));
	}

	type BlockNoteBlock = {
		content?: { text: string }[];
		[key: string]: unknown;
	};

	function safeBlockNoteHtml(jsonString?: string) {
		try {
			if (!jsonString) return "";
			const blocks: BlockNoteBlock[] = JSON.parse(jsonString);
			if (!Array.isArray(blocks)) return "";
			return blocks
				.map((block) => block.content?.map?.((c) => c.text).join(" ") || "")
				.join("<br/>");
		} catch {
			return "";
		}
	}

	// Fetch posts (images/videos) on mount or dharmguruId change
	useEffect(() => {
		const fetchPosts = async () => {
			if (!dharmguruId) return;
			try {
				const res = await fetch(`/api/users/${dharmguruId}`);
				if (!res.ok) return;
				const data = await res.json();
				setExistingImages(
					Array.isArray(data.images)
						? data.images
						: data.images
						? [data.images]
						: []
				);
				setPostImages(
					Array.isArray(data.images)
						? data.images
						: data.images
						? [data.images]
						: []
				);
				setPostVideos(
					Array.isArray(data.videos)
						? data.videos
						: data.videos
						? [data.videos]
						: []
				);
			} catch {}
		};
		fetchPosts();
	}, [dharmguruId]);

	// --- Image Upload Handler ---
	const handlePostImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;
		setIsUploadingPostImage(true);
		const uploaded: string[] = [];
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const formData = new FormData();
				formData.append("file", file);
				formData.append("userId", dharmguruId);
				const response = await fetch("/api/upload/dharmguru-image", {
					method: "POST",
					body: formData,
				});
				if (!response.ok) throw new Error("Failed to upload image");
				const { imageUrl } = await response.json();
				uploaded.push(imageUrl);
			}
			setNewImages((prev) => [...prev, ...uploaded]);
			setPostImages((prev) => [...prev, ...uploaded]);
			toast.success("Image(s) uploaded successfully!");
		} catch {
			toast.error("Failed to upload image(s)");
		} finally {
			setIsUploadingPostImage(false);
		}
	};

	const handleRemovePostImage = (url: string) => {
		if (existingImages.includes(url)) {
			setDeletedImages((prev) => [...prev, url]);
			setExistingImages((prev) => prev.filter((img) => img !== url));
		}
		if (newImages.includes(url)) {
			setNewImages((prev) => prev.filter((img) => img !== url));
		}
		setPostImages((prev) => prev.filter((img) => img !== url));
	};

	// --- Video Upload Handler ---
	const handlePostVideoUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;
		setIsUploadingPostVideo(true);
		const uploaded: string[] = [];
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const formData = new FormData();
				formData.append("file", file);
				formData.append("userId", dharmguruId);
				const response = await fetch("/api/upload/dharmguru-video", {
					method: "POST",
					body: formData,
				});
				if (!response.ok) throw new Error("Failed to upload video");
				const { videoUrl } = await response.json();
				uploaded.push(videoUrl);
			}
			setPostVideos((prev) => [...prev, ...uploaded]);
			toast.success("Video(s) uploaded successfully!");
		} catch {
			toast.error("Failed to upload video(s)");
		} finally {
			setIsUploadingPostVideo(false);
		}
	};

	const handleRemovePostVideo = (url: string) => {
		setPostVideos((prev) => prev.filter((vid) => vid !== url));
	};

	async function handleSavePosts(
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	): Promise<void> {
		event.preventDefault();
		if (!dharmguruId) {
			toast.error("Invalid Dharmguru ID");
			return;
		}
		setIsSavingPosts(true);
		const loadingToast = toast.loading("Saving posts...");
		try {
			const response = await fetch(`/api/users/${dharmguruId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					newImages,
					deletedImages,
					videos: postVideos,
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save posts");
			}
			toast.dismiss(loadingToast);
			toast.success("Posts saved successfully!");
			setIsEditing(false);
			setIsSavingPosts(false);
			setNewImages([]);
			setDeletedImages([]);
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to save posts"
			);
			setIsSavingPosts(false);
		}
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/dharmguru")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Dharmguru Details</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Dharmguru Profile Card */}
				<Card className="md:col-span-1 h-fit">
					<CardHeader className="text-center p-4 pb-2">
						{/* Profile image with upload functionality */}
						<div className="relative w-20 h-20 mx-auto mb-3">
							<div className="w-full h-full rounded-lg bg-muted flex items-center justify-center overflow-hidden">
								{(isEditing
									? editedDharmguru?.profileImageUrl
									: dharmguru?.profileImageUrl) && !imageError ? (
									<Image
										src={
											isEditing
												? editedDharmguru?.profileImageUrl || "/placeholder.png"
												: dharmguru?.profileImageUrl || "/placeholder.png"
										}
										alt={
											isEditing
												? editedDharmguru?.name || "Dharmguru"
												: dharmguru?.name || "Dharmguru"
										}
										width={80}
										height={80}
										className="w-full h-full rounded-lg object-cover"
										onError={() => setImageError(true)}
										unoptimized={true}
									/>
								) : (
									<UserIcon className="h-10 w-10 text-muted-foreground" />
								)}
							</div>

							{/* Upload overlay - only shown in edit mode */}
							{isEditing && (
								<div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group">
									<input
										type="file"
										accept="image/jpeg,image/jpg,image/png,image/webp"
										onChange={handleImageUpload}
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
										disabled={isUploadingImage}
									/>
									{isUploadingImage ? (
										<div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
									) : (
										<Upload className="h-6 w-6 text-white" />
									)}
								</div>
							)}

							{/* Plus icon for adding image when no image exists */}
							{isEditing &&
								!editedDharmguru?.profileImageUrl &&
								!imageError && (
									<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
										<input
											type="file"
											accept="image/jpeg,image/jpg,image/png,image/webp"
											onChange={handleImageUpload}
											className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
											disabled={isUploadingImage}
										/>
										<Plus className="h-3 w-3 text-primary-foreground" />
									</div>
								)}

							{/* Remove image button */}
							{isEditing && editedDharmguru?.profileImageUrl && !imageError && (
								<Button
									type="button"
									variant="destructive"
									size="sm"
									className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
									onClick={handleRemoveImage}
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							)}
						</div>
						<CardTitle className="text-center text-lg">
							{dharmguru?.name}
						</CardTitle>
						<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
							<span
								className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
									dharmguru
										? getStatusColor(getDharmguruStatus(dharmguru))
										: "bg-red-100 text-red-800"
								}`}
							>
								{dharmguru ? getDharmguruStatus(dharmguru) : "Inactive"}
							</span>
							{dharmguru?.KathavachakType && (
								<span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-800">
									{dharmguru.KathavachakType}
								</span>
							)}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-3 p-4 pt-0">
						<div className="flex items-center gap-2 text-sm">
							<Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
							<span className="truncate">{dharmguru?.phone}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
							<span className="truncate">{dharmguru?.email}</span>
						</div>
						<div className="pt-2 space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
								<div className="flex-1">
									<span className="text-xs text-muted-foreground">
										Category:{" "}
									</span>
									<span
										className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
											dharmguru?.category || ""
										)} w-20`}
									>
										{dharmguru?.category || "Not specified"}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Award className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
								<div className="flex-1">
									<span className="text-xs text-muted-foreground">Rank: </span>
									<span
										className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankColor(
											dharmguru?.rank || ""
										)} w-20`}
									>
										{dharmguru?.rank || "Not specified"}
									</span>
								</div>
							</div>
						</div>

						{/* Addresses Box – Compact Version */}
						{dharmguru?.addresses && dharmguru.addresses.length > 0 && (
							<div className="mt-3 pt-3 border-t border-border">
								<button
									onClick={() => setShowAddresses(!showAddresses)}
									className="w-full flex items-center gap-1.5 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 rounded-md p-1 -ml-1 -mb-1"
								>
									<MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
									<span>Addresses ({dharmguru.addresses.length})</span>
									<ChevronDown
										className={`h-3.5 w-3.5 text-muted-foreground ml-auto transition-transform ${
											showAddresses ? "rotate-180" : ""
										}`}
									/>
								</button>
								<div
									className={`overflow-hidden transition-all duration-200 ease-in-out ${
										showAddresses
											? "max-h-[500px] opacity-100 mt-1"
											: "max-h-0 opacity-0"
									}`}
								>
									<div className="space-y-2 text-sm">
										{dharmguru.addresses.map((address, index) => (
											<div
												key={index}
												className="border border-border/50 rounded p-2 text-xs"
											>
												<div className="font-medium text-foreground/90">
													{address.type.charAt(0).toUpperCase() +
														address.type.slice(1)}
													{address.type === "other" && address.label
														? ` (${address.label})`
														: ""}
												</div>
												<div className="mt-1 space-y-0.5 text-muted-foreground">
													<p className="truncate">{address.line1}</p>
													{address.line2 && (
														<p className="truncate">{address.line2}</p>
													)}
													<p className="truncate">
														{address.city}
														{address.state && `, ${address.state}`}
														{address.pincode && ` - ${address.pincode}`}
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						)}
					</CardContent>

					<CardFooter className="p-4 pt-0">
						<Button
							className="w-full text-sm h-8"
							variant={isEditing ? "outline" : "default"}
							onClick={() => setIsEditing(!isEditing)}
						>
							{isEditing ? "Cancel" : "Edit Dharmguru"}
						</Button>
					</CardFooter>
				</Card>

				{/* Tabs Section */}
				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid grid-cols-5 mb-4">
							<TabsTrigger value="details">Dharmguru Details</TabsTrigger>
							<TabsTrigger value="biography">Biography</TabsTrigger>
							<TabsTrigger value="posts">Posts</TabsTrigger>
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="activity">Activity Log</TabsTrigger>
						</TabsList>

						{/* Main details tab */}
						<TabsContent value="details" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Personal Information</CardTitle>
									<CardDescription>
										Update Dharmguru&apos;s personal details and contact
										information.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{isEditing ? (
										<>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="name">Full Name</Label>
													<Input
														id="name"
														value={editedDharmguru?.name || ""}
														onChange={(e) =>
															setEditedDharmguru({
																...editedDharmguru,
																name: e.target.value,
															})
														}
														className={errors.name ? "border-red-500" : ""}
													/>
													{errors.name && (
														<p className="text-sm text-red-500">
															{errors.name}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="email">Email</Label>
													<Input
														id="email"
														type="email"
														value={editedDharmguru?.email || ""}
														onChange={(e) =>
															setEditedDharmguru({
																...editedDharmguru,
																email: e.target.value,
															})
														}
														className={errors.email ? "border-red-500" : ""}
													/>
													{errors.email && (
														<p className="text-sm text-red-500">
															{errors.email}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="phone">Phone</Label>
													<div className="relative">
														<Input
															id="phone"
															type="tel"
															value={editedDharmguru?.phone || ""}
															onChange={(e) => {
																// Format the input value
																const formatted = formatPhoneNumber(
																	e.target.value
																);
																setEditedDharmguru({
																	...editedDharmguru,
																	phone: formatted,
																});
																// Clear error when typing
																if (errors.phone) {
																	setErrors({
																		...errors,
																		phone: undefined,
																	});
																}
															}}
															placeholder="+91 9876543210"
															className={`pl-12 ${
																errors.phone ? "border-red-500" : ""
															}`}
														/>
														<span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
															+91
														</span>
													</div>
													{errors.phone && (
														<p className="text-sm text-red-500">
															{errors.phone}
														</p>
													)}
												</div>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
												<div className="space-y-2">
													<Label>Category</Label>
													<span
														className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
															dharmguru?.category || ""
														)} w-20`}
													>
														{dharmguru?.category || "Not specified"}
													</span>
												</div>
												<div className="space-y-2">
													<Label>Rank</Label>
													<span
														className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankColor(
															dharmguru?.rank || ""
														)} w-20`}
													>
														{dharmguru?.rank || "Not specified"}
													</span>
												</div>
											</div>
											{dharmguru?.addresses && (
												<div className="space-y-6 border p-4 rounded-lg">
													<div className="flex justify-between items-center">
														<h3 className="text-base font-medium">Addresses</h3>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => {
																setEditedDharmguru((prev) => {
																	if (!prev) return prev;
																	return {
																		...prev,
																		addresses: [
																			...(prev.addresses || []),
																			{
																				type: "home",
																				line1: "",
																				city: "",
																				country: "India",
																			},
																		],
																	};
																});
															}}
														>
															<Plus className="h-4 w-4 mr-2" />
															Add Address
														</Button>
													</div>

													{editedDharmguru?.addresses?.map((address, index) => (
														<div
															key={index}
															className="space-y-4 border-t pt-4 first:border-t-0 first:pt-0"
														>
															<div className="flex justify-between items-center">
																<div className="flex items-center gap-2">
																	<MapPin className="h-4 w-4 text-muted-foreground" />
																	<h4 className="font-medium">
																		{address.type.charAt(0).toUpperCase() +
																			address.type.slice(1)}{" "}
																		Address
																		{address.type === "other" && address.label
																			? ` (${address.label})`
																			: ""}
																	</h4>
																</div>
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	className="text-red-500 hover:text-red-700 hover:bg-red-50"
																	onClick={() => {
																		setEditedDharmguru((prev) => {
																			if (!prev) return prev;
																			const addr = prev.addresses?.[index];
																			if (addr?.id) {
																				setAddressesToDelete((prevDel) => [
																					...prevDel,
																					addr.id!,
																				]);
																			}
																			return {
																				...prev,
																				addresses:
																					prev.addresses?.filter(
																						(_, addrIndex) =>
																							addrIndex !== index
																					) || [],
																			};
																		});
																	}}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</div>

															<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																<div className="space-y-2">
																	<Label htmlFor={`address-type-${index}`}>
																		Address Type
																	</Label>
																	<Select
																		value={address.type}
																		onValueChange={(value) => {
																			setEditedDharmguru((prev) => {
																				if (!prev) return prev;
																				return {
																					...prev,
																					addresses: prev.addresses?.map(
																						(addr, addrIndex) =>
																							addrIndex === index
																								? {
																										...addr,
																										type: value as
																											| "home"
																											| "work"
																											| "other",
																										// Clear label if not "other" type
																										label:
																											value === "other"
																												? addr.label
																												: undefined,
																								  }
																								: addr
																					),
																				};
																			});
																		}}
																	>
																		<SelectTrigger id={`address-type-${index}`}>
																			<SelectValue placeholder="Select address type" />
																		</SelectTrigger>
																		<SelectContent>
																			<SelectItem value="home">Home</SelectItem>
																			<SelectItem value="work">Work</SelectItem>
																			<SelectItem value="other">
																				Other
																			</SelectItem>
																		</SelectContent>
																	</Select>
																</div>

																{address.type === "other" && (
																	<div className="space-y-2">
																		<Label htmlFor={`address-label-${index}`}>
																			Label
																		</Label>
																		<Input
																			id={`address-label-${index}`}
																			value={address.label || ""}
																			onChange={(e) => {
																				setEditedDharmguru((prev) => {
																					if (!prev) return prev;
																					return {
																						...prev,
																						addresses: prev.addresses?.map(
																							(addr, addrIndex) =>
																								addrIndex === index
																									? {
																											...addr,
																											label: e.target.value,
																									  }
																									: addr
																						),
																					};
																				});
																			}}
																			placeholder="e.g., Parent's Home, Office"
																			className={
																				errors.addresses?.[index]?.label
																					? "border-red-500"
																					: ""
																			}
																		/>
																		{errors.addresses?.[index]?.label && (
																			<p className="text-sm text-red-500">
																				{errors.addresses[index].label}
																			</p>
																		)}
																	</div>
																)}
															</div>

															<div className="space-y-2">
																<Label htmlFor={`address-line1-${index}`}>
																	Address Line 1
																</Label>
																<Input
																	id={`address-line1-${index}`}
																	value={address.line1 || ""}
																	onChange={(e) => {
																		setEditedDharmguru((prev) => {
																			if (!prev) return prev;
																			return {
																				...prev,
																				addresses: prev.addresses?.map(
																					(addr, addrIndex) =>
																						addrIndex === index
																							? {
																									...addr,
																									line1: e.target.value,
																							  }
																							: addr
																				),
																			};
																		});
																	}}
																	placeholder="Street address, P.O. box, etc."
																	className={
																		errors.addresses?.[index]?.line1
																			? "border-red-500"
																			: ""
																	}
																/>
																{errors.addresses?.[index]?.line1 && (
																	<p className="text-sm text-red-500">
																		{errors.addresses[index].line1}
																	</p>
																)}
															</div>

															<div className="space-y-2">
																<Label htmlFor={`address-line2-${index}`}>
																	Address Line 2 (Optional)
																</Label>
																<Input
																	id={`address-line2-${index}`}
																	value={address.line2 || ""}
																	onChange={(e) => {
																		setEditedDharmguru((prev) => {
																			if (!prev) return prev;
																			return {
																				...prev,
																				addresses: prev.addresses?.map(
																					(addr, addrIndex) =>
																						addrIndex === index
																							? {
																									...addr,
																									line2: e.target.value,
																							  }
																							: addr
																				),
																			};
																		});
																	}}
																	placeholder="Apartment, suite, unit, building, floor, etc."
																/>
															</div>

															<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
																<div className="space-y-2">
																	<Label htmlFor={`address-city-${index}`}>
																		City
																	</Label>
																	<Input
																		id={`address-city-${index}`}
																		value={address.city || ""}
																		onChange={(e) => {
																			setEditedDharmguru((prev) => {
																				if (!prev) return prev;
																				return {
																					...prev,
																					addresses: prev.addresses?.map(
																						(addr, addrIndex) =>
																							addrIndex === index
																								? {
																										...addr,
																										city: e.target.value,
																								  }
																								: addr
																					),
																				};
																			});
																		}}
																		className={
																			errors.addresses?.[index]?.city
																				? "border-red-500"
																				: ""
																		}
																	/>
																	{errors.addresses?.[index]?.city && (
																		<p className="text-sm text-red-500">
																			{errors.addresses[index].city}
																		</p>
																	)}
																</div>

																<div className="space-y-2">
																	<Label htmlFor={`address-state-${index}`}>
																		State/Province (Optional)
																	</Label>
																	<Input
																		id={`address-state-${index}`}
																		value={address.state || ""}
																		onChange={(e) => {
																			setEditedDharmguru((prev) => {
																				if (!prev) return prev;
																				return {
																					...prev,
																					addresses: prev.addresses?.map(
																						(addr, addrIndex) =>
																							addrIndex === index
																								? {
																										...addr,
																										state: e.target.value,
																								  }
																								: addr
																					),
																				};
																			});
																		}}
																	/>
																</div>

																<div className="space-y-2">
																	<Label htmlFor={`address-pincode-${index}`}>
																		PIN Code (Optional)
																	</Label>
																	<Input
																		id={`address-pincode-${index}`}
																		value={address.pincode || ""}
																		onChange={(e) => {
																			setEditedDharmguru((prev) => {
																				if (!prev) return prev;
																				return {
																					...prev,
																					addresses: prev.addresses?.map(
																						(addr, addrIndex) =>
																							addrIndex === index
																								? {
																										...addr,
																										pincode: e.target.value,
																								  }
																								: addr
																					),
																				};
																			});
																		}}
																	/>
																</div>
															</div>

															<div className="space-y-2">
																<Label htmlFor={`address-country-${index}`}>
																	Country
																</Label>
																<Input
																	id={`address-country-${index}`}
																	value={address.country || ""}
																	onChange={(e) => {
																		setEditedDharmguru((prev) => {
																			if (!prev) return prev;
																			return {
																				...prev,
																				addresses: prev.addresses?.map(
																					(addr, addrIndex) =>
																						addrIndex === index
																							? {
																									...addr,
																									country: e.target.value,
																							  }
																							: addr
																				),
																			};
																		});
																	}}
																	className={
																		errors.addresses?.[index]?.country
																			? "border-red-500"
																			: ""
																	}
																/>
																{errors.addresses?.[index]?.country && (
																	<p className="text-sm text-red-500">
																		{errors.addresses[index].country}
																	</p>
																)}
															</div>
														</div>
													))}

													{editedDharmguru?.addresses?.length === 0 && (
														<div className="text-center py-4 text-muted-foreground">
															No addresses added. Click &ldquo;Add
															Address&rdquo; to add one.
														</div>
													)}
												</div>
											)}
											<div className="space-y-2">
												<Card>
													<CardHeader>
														<CardTitle>Biography</CardTitle>
													</CardHeader>
													<CardContent>
														{isEditing ? (
															<BlockNoteEditor
																initialContent={editedDharmguru?.bio || ""}
																onChange={(val: string) =>
																	handleBlockNoteChange("bio", val)
																}
																editable={isEditing}
															/>
														) : (
															<div
																className="prose prose-sm max-w-none"
																dangerouslySetInnerHTML={{
																	__html: safeBlockNoteHtml(
																		editedDharmguru?.bio
																	),
																}}
															/>
														)}
													</CardContent>
												</Card>
											</div>
										</>
									) : (
										<div className="space-y-6">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Full Name
													</h3>
													<p className="font-medium text-foreground">
														{dharmguru?.name}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Email
													</h3>
													<p className="font-medium text-foreground">
														{dharmguru?.email}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Phone
													</h3>
													<p className="font-medium text-foreground">
														{dharmguru?.phone}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Member Since
													</h3>
													<p className="font-medium text-foreground">
														{dharmguru?.createdAt
															? formatDate(dharmguru.createdAt)
															: "N/A"}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Last Login
													</h3>
													<p className="font-medium text-foreground">
														{dharmguru?.lastLoginAt
															? formatDate(dharmguru.lastLoginAt)
															: "Never"}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Last Logout
													</h3>
													<p className="font-medium text-foreground">
														{dharmguru?.lastLogoutAt
															? formatDate(dharmguru.lastLogoutAt)
															: "N/A"}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Dharmguru Type
													</h3>
													<div className="flex items-center">
														<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
															{dharmguru?.KathavachakType || "Not specified"}
														</span>
													</div>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Status
													</h3>
													<div className="flex items-center">
														<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
															{dharmguru?.status || "Not specified"}
														</span>
													</div>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Category
													</h3>
													<span
														className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
															dharmguru?.category || ""
														)} w-20`}
													>
														{dharmguru?.category || "Not specified"}
													</span>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Rank
													</h3>
													<span
														className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankColor(
															dharmguru?.rank || ""
														)} w-20`}
													>
														{dharmguru?.rank || "Not specified"}
													</span>
												</div>
											</div>
											
											{dharmguru?.addresses &&
												dharmguru.addresses.length > 0 && (
													<div className="space-y-4 pt-2 border-t border-border">
														<h3 className="text-sm font-medium text-muted-foreground">
															Addresses
														</h3>
														<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
															{dharmguru.addresses.map((address, index) => (
																<Card key={index} className="border-border">
																	<CardHeader className="pb-2">
																		<div className="flex items-center gap-2">
																			<MapPin className="h-4 w-4 text-muted-foreground" />
																			<CardTitle className="text-base">
																				{address.type.charAt(0).toUpperCase() +
																					address.type.slice(1)}
																				{address.type === "other" &&
																				address.label
																					? ` (${address.label})`
																					: ""}
																			</CardTitle>
																		</div>
																	</CardHeader>
																	<CardContent className="text-sm space-y-1">
																		<p className="font-medium">
																			{address.line1}
																			{address.line2 && `, ${address.line2}`}
																		</p>
																		<p>
																			{address.city}
																			{address.state && `, ${address.state}`}
																			{address.pincode &&
																				` - ${address.pincode}`}
																		</p>
																		<p>{address.country}</p>
																	</CardContent>
																</Card>
															))}
														</div>
													</div>
												)}
										</div>
									)}
								</CardContent>
								{isEditing && (
									<CardFooter>
										<Button onClick={handleSaveChanges} disabled={isSaving}>
											{isSaving ? (
												<>
													<svg
														className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
													>
														<circle
															className="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															strokeWidth="4"
														></circle>
														<path
															className="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														></path>
													</svg>
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
						</TabsContent>

						{/* Biography tab */}
						<TabsContent value="biography" className="space-y-4">
							<Card>
								<CardContent className="px-1">
									<div className="space-y-1 ">
										{isEditing ? (
											<div>
												<BlockNoteEditor
													initialContent={editedDharmguru?.bio || ""}
													onChange={(val: string) =>
														handleBlockNoteChange("bio", val)
													}
													editable={isEditing}
												/>
											</div>
										) : (
											<div>
												{editedDharmguru?.bio &&
												safeBlockNoteHtml(editedDharmguru?.bio) ? (
													<div
														className="prose prose-sm max-w-none text-foreground p-3"
														dangerouslySetInnerHTML={{
															__html: safeBlockNoteHtml(editedDharmguru?.bio),
														}}
													/>
												) : (
													<p className="text-muted-foreground italic">
														No biography has been added yet.
													</p>
												)}
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Posts tab */}
						<TabsContent value="posts" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Dharmguru Posts</CardTitle>
									<CardDescription>
										Add and manage images and videos for posts.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* Images Section */}
									<div>
										<div className="flex items-center justify-between mb-2">
											<h3 className="font-medium">Images</h3>
											{isEditing && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => setShowImageUpload((v) => !v)}
												>
													{showImageUpload ? "Hide" : "Add Image"}
												</Button>
											)}
										</div>
										{isEditing && showImageUpload && (
											<div className="space-y-2 mb-2">
												<label className="w-32 h-20 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
													<Plus className="h-6 w-6 text-gray-400" />
													<span className="text-xs text-gray-500">
														Add Image
													</span>
													<input
														type="file"
														accept="image/*"
														multiple
														className="hidden"
														onChange={handlePostImageUpload}
														disabled={isUploadingPostImage}
													/>
												</label>
												{isUploadingPostImage && (
													<p className="text-xs text-blue-600">
														Uploading image(s)...
													</p>
												)}
											</div>
										)}
										<div className="flex flex-wrap gap-3 mt-2">
											{postImages.map((img, idx) => (
												<div
													key={img}
													className="relative w-32 h-20 rounded border overflow-hidden flex items-center justify-center bg-muted"
												>
													<Image
														src={img}
														alt={`Post Image ${idx + 1}`}
														fill
														sizes="128px"
														style={{ objectFit: "cover" }}
														className="object-cover w-full h-full"
													/>
													{isEditing && (
														<Button
															type="button"
															variant="ghost"
															size="icon"
															onClick={() => handleRemovePostImage(img)}
															className="absolute top-1 right-1 bg-white/80"
														>
															<Trash2 className="h-4 w-4 text-red-500" />
														</Button>
													)}
												</div>
											))}
											{!isEditing && postImages.length === 0 && (
												<p className="text-xs text-muted-foreground">
													No images added.
												</p>
											)}
										</div>
									</div>
									{/* Videos Section */}
									<div>
										<div className="flex items-center justify-between mb-2">
											<h3 className="font-medium">Videos</h3>
											{isEditing && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => setShowVideoUpload((v) => !v)}
												>
													{showVideoUpload ? "Hide" : "Add Video"}
												</Button>
											)}
										</div>
										{isEditing && showVideoUpload && (
											<div className="space-y-2 mb-2">
												<label className="w-40 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
													<Plus className="h-6 w-6 text-gray-400" />
													<span className="text-xs text-gray-500">
														Add Video
													</span>
													<input
														type="file"
														accept="video/mp4,video/webm,video/ogg"
														multiple
														className="hidden"
														onChange={handlePostVideoUpload}
														disabled={isUploadingPostVideo}
													/>
												</label>
												{isUploadingPostVideo && (
													<p className="text-xs text-blue-600">
														Uploading video(s)...
													</p>
												)}
											</div>
										)}
										<div className="flex flex-wrap gap-3 mt-2">
											{postVideos.map((vid) => (
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
															onClick={() => handleRemovePostVideo(vid)}
															className="absolute top-1 right-1 bg-white/80"
														>
															<Trash2 className="h-4 w-4 text-red-500" />
														</Button>
													)}
												</div>
											))}
											{!isEditing && postVideos.length === 0 && (
												<p className="text-xs text-muted-foreground">
													No videos added.
												</p>
											)}
										</div>
									</div>
									{/* Save Posts Button */}
									{isEditing && (
										<div className="pt-4">
											<Button
												onClick={handleSavePosts}
												disabled={isSavingPosts}
											>
												{isSavingPosts ? (
													<>
														<Save className="h-4 w-4 mr-2 animate-spin" />
														Saving...
													</>
												) : (
													<>
														<Save className="h-4 w-4 mr-2" />
														Save Posts
													</>
												)}
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="preferences" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Dharmguru Preferences</CardTitle>
									<CardDescription>
										Manage notification settings and Dharmguru preferences.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{isEditing ? (
											<div className="space-y-4">
												<div className="flex items-center justify-between">
													<Label htmlFor="notifications">
														Email Notifications
													</Label>
													<input
														type="checkbox"
														id="notifications"
														checked={
															editedDharmguru?.preferences?.notifications ||
															false
														}
														onChange={(e) =>
															setEditedDharmguru((prev) =>
																prev
																	? {
																			...prev,
																			preferences: {
																				...prev.preferences,
																				notifications: e.target.checked,
																				language: e.target.value,
																				newsletter: e.target.checked,
																			},
																	  }
																	: null
															)
														}
														className="h-4 w-4"
													/>
												</div>
												<div className="flex items-center justify-between">
													<Label htmlFor="newsletter">
														Subscribe to Newsletter
													</Label>
													<input
														type="checkbox"
														id="newsletter"
														checked={
															editedDharmguru?.preferences?.newsletter || false
														}
														onChange={(e) =>
															setEditedDharmguru((prev) =>
																prev
																	? {
																			...prev,
																			preferences: {
																				...prev.preferences,
																				notifications: e.target.checked,
																				language: e.target.value,
																				newsletter: e.target.checked,
																			},
																	  }
																	: null
															)
														}
														className="h-4 w-4"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="language">Preferred Language</Label>
													<Select
														value={editedDharmguru?.preferences?.language || ""}
														onValueChange={(value) =>
															setEditedDharmguru((prev) =>
																prev
																	? {
																			...prev,
																			preferences: {
																				...prev.preferences,
																				language: value,
																				notifications:
																					prev.preferences?.notifications ??
																					false, // Provide default value
																				newsletter:
																					prev.preferences?.newsletter ?? false, // Provide default value
																			},
																	  }
																	: null
															)
														}
													>
														<SelectTrigger id="language">
															<SelectValue placeholder="Select language" />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																<SelectItem value="Hindi">Hindi</SelectItem>
																<SelectItem value="English">English</SelectItem>
																<SelectItem value="Sanskrit">
																	Sanskrit
																</SelectItem>
																<SelectItem value="Tamil">Tamil</SelectItem>
																<SelectItem value="Bengali">Bengali</SelectItem>
															</SelectGroup>
														</SelectContent>
													</Select>
												</div>
											</div>
										) : (
											<div className="space-y-4">
												<div className="grid grid-cols-2 gap-4">
													<div>
														<h3 className="text-sm text-muted-foreground">
															Email Notifications
														</h3>
														<p className="font-medium">
															{dharmguru?.preferences?.notifications
																? "Enabled"
																: "Disabled"}
														</p>
													</div>
													<div>
														<h3 className="text-sm text-muted-foreground">
															Newsletter
														</h3>
														<p className="font-medium">
															{dharmguru?.preferences?.newsletter
																? "Subscribed"
																: "Not Subscribed"}
														</p>
													</div>
													<div>
														<h3 className="text-sm text-muted-foreground">
															Preferred Language
														</h3>
														<p className="font-medium">
															{dharmguru?.preferences?.language}
														</p>
													</div>
												</div>
											</div>
										)}
									</div>
								</CardContent>
								{isEditing && (
									<CardFooter>
										<Button onClick={handleSaveChanges} className="w-full">
											<Save className="h-4 w-4 mr-2" />
											Save Preferences
										</Button>
									</CardFooter>
								)}
							</Card>
						</TabsContent>

						<TabsContent value="activity" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Activity Log</CardTitle>
									<CardDescription>
										Recent Dharmguru activities and interactions.
									</CardDescription>
								</CardHeader>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
