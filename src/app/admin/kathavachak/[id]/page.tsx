"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import {
	getRankColor,
	getCategoryColor,
} from "@/app/admin/components/kathavachak/KathavachakTable";
import KathavachakProfileCard from "@/app/admin/components/kathavachak/KathavachakProfileCard";
import KathavachakDetailsTab from "@/app/admin/components/kathavachak/KathavachakDetailsTab";
import KathavachakBiographyTab from "@/app/admin/components/kathavachak/KathavachakBiographyTab";
import KathavachakPostsTab from "@/app/admin/components/kathavachak/KathavachakPostsTab";
import KathavachakPreferencesTab from "@/app/admin/components/kathavachak/KathavachakPreferencesTab";
import KathavachakActivityTab from "@/app/admin/components/kathavachak/KathavachakActivityTab";

// Interface definitions for type safety
interface Activity {
	date: string;
	action: string;
}

interface KathavachakPreferences {
	notifications: boolean;
	newsletter: boolean;
	language: string;
}

interface Address {
	id?: string; // Optional because new addresses won't have an ID yet
	type: "home" | "work" | "other";
	label?: string; // Required only for "other" type addresses
	line1: string;
	line2?: string;
	city: string;
	state?: string;
	country: string;
	pincode?: string;
	createdAt?: string | Date;
	updatedAt?: string | Date;
}

interface Kathavachak {
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
	// Client-side only properties (not stored in database)
	preferences?: KathavachakPreferences;
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

export default function KathavachakDetailPage() {
	const params = useParams();
	const router = useRouter();
	const KathavachakId = (params?.id ?? "") as string;

	// State management for the component
	const [kathavachak, setKathavachak] = useState<Kathavachak | null>(null); // Original kathavachak data from server
	const [isEditing, setIsEditing] = useState(false); // Controls whether form is in edit mode
	const [isSaving, setIsSaving] = useState(false); // Loading state for save operation
	const [editedKathavachak, setEditedKathavachak] =
		useState<Partial<Kathavachak> | null>(null); // Draft data being edited
	const [imageError, setImageError] = useState(false); // Handles profile image loading errors
	const [errors, setErrors] = useState<FormErrors>({}); // Form validation errors
	const [showAddresses, setShowAddresses] = useState(false); // Controls address dropdown visibility
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

	const kathavachakId = params?.id as string;

	// Fetch posts (images/videos) on mount or kathavachakId change
	useEffect(() => {
		const fetchPosts = async () => {
			if (!kathavachakId) return;
			try {
				const res = await fetch(`/api/users/${kathavachakId}`);
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
	}, [kathavachakId]);

	// Fetch Kathavachak data from API
	const fetchKathavachakData = useCallback(async () => {
		try {
			// Validate MongoDB ObjectId format before making API call
			if (KathavachakId && !/^[0-9a-fA-F]{24}$/.test(KathavachakId)) {
				toast.error("Invalid Kathavachak ID format");
				router.push("/admin/kathavachak");
				return;
			}

			const loadingToast = toast.loading("Loading Kathavachak details...");

			// Add timeout to prevent hanging requests (10 second timeout)
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			try {
				const response = await fetch(`/api/users/${KathavachakId}`, {
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

					throw new Error(errorData.error || "Failed to fetch Kathavachak");
				}

				const KathavachakData = await response.json();

				// Create a complete Kathavachak object with fallbacks for missing properties
				const completeKathavachak: Kathavachak = {
					...KathavachakData,
					id: KathavachakData.id,
					name: KathavachakData.name || "",
					email: KathavachakData.email || "",
					phone: KathavachakData.phone || "",
					addresses: KathavachakData.addresses || [],
					KathavachakType: KathavachakData.KathavachakType || "Regular",
					status: KathavachakData.status || "Active",
					isLoggedIn: KathavachakData.isLoggedIn || false,
					bio: KathavachakData.bio || "",
					createdAt: KathavachakData.createdAt || new Date().toISOString(),
					// Add client-side only properties (not stored in database)
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};

				// Set both original and edited data to the fetched data
				setKathavachak(completeKathavachak);
				setEditedKathavachak({ ...completeKathavachak });
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
					: "Failed to load Kathavachak details"
			);

			// Create a mock Kathavachak as fallback for development environment
			if (process.env.NODE_ENV !== "production") {
				const mockKathavachak: Kathavachak = {
					id: KathavachakId || "mock-id",
					name: "Test Kathavachak",
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
					bio: "This is a test Kathavachak bio.",
					createdAt: new Date().toISOString(),
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};
				setKathavachak(mockKathavachak);
				setEditedKathavachak({ ...mockKathavachak });
				return;
			}

			// Redirect to kathavachak list if loading fails in production
			router.push("/admin/kathavachak");
		}
	}, [KathavachakId, router]);

	// Call the fetch function when component mounts or ID changes
	useEffect(() => {
		if (KathavachakId) {
			fetchKathavachakData();
		}
	}, [KathavachakId, fetchKathavachakData]);

	// Form validation function
	const validateForm = (KathavachakData: Partial<Kathavachak>): boolean => {
		const newErrors: FormErrors = {};

		// Validate required fields
		if (!KathavachakData.name?.trim()) {
			newErrors.name = "Name is required";
		}

		if (!KathavachakData.email?.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(KathavachakData.email)) {
			newErrors.email = "Email is invalid";
		}

		if (!KathavachakData.phone?.trim()) {
			newErrors.phone = "Phone number is required";
		} else {
			// Validate Indian phone number format
			const phoneRegex = /^(\+91[\s-]?)?[0-9]{10}$/;
			if (!phoneRegex.test(KathavachakData.phone.replace(/[\s-]/g, ""))) {
				newErrors.phone =
					"Please enter a valid 10-digit phone number with optional +91 prefix";
			}
		}

		// Validate addresses if they exist
		if (KathavachakData.addresses) {
			KathavachakData.addresses.forEach((address, index) => {
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

	// Handle saving changes to the kathavachak
	const handleSaveChanges = async () => {
		if (!editedKathavachak) return;

		// Validate form before saving
		if (!validateForm(editedKathavachak)) {
			return;
		}

		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");

		try {
			// Prepare data for API - only send necessary fields
			const dataToSave = {
				name: editedKathavachak.name,
				email: editedKathavachak.email,
				phone: editedKathavachak.phone,
				addresses: editedKathavachak.addresses, // Updated/new addresses
				addressesToDelete, // Array of address IDs to delete
				bio: editedKathavachak.bio || null,
				profileImageUrl:
					editedKathavachak.profileImageUrl === undefined
						? null // <-- send null if removed
						: editedKathavachak.profileImageUrl,
			};

			// Send PUT request to update user
			const response = await fetch(`/api/users/${KathavachakId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSave),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update Kathavachak");
			}

			const updatedKathavachak = await response.json();

			// Update local state with fresh data from server
			setKathavachak(updatedKathavachak);
			setEditedKathavachak(updatedKathavachak);
			setIsEditing(false);

			// Clear the deletion queue since changes are saved
			setAddressesToDelete([]);

			toast.dismiss(loadingToast);
			toast.success("Kathavachak details updated successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update Kathavachak details"
			);
		} finally {
			setIsSaving(false);
		}
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
			formData.append("userId", KathavachakId);

			const response = await fetch("/api/upload/profile-image", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to upload image");
			}

			const { imageUrl } = await response.json();

			setEditedKathavachak((prev) =>
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
		setEditedKathavachak((prev) =>
			prev ? { ...prev, profileImageUrl: undefined } : null
		);
		setImageError(false);
		toast.success("Profile image removed");
	};

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
				formData.append("userId", KathavachakId);
				const response = await fetch("/api/upload/kathavachak-image", {
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
				formData.append("userId", KathavachakId);
				// Replace with your actual upload endpoint
				const response = await fetch("/api/upload/kathavachak-video", {
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

	const getKathavachakStatus = (Kathavachak: Kathavachak) => {
		if (!Kathavachak.status || Kathavachak.status === "Inactive")
			return "Inactive";
		return Kathavachak.isLoggedIn ? "Active (Online)" : "Active (Offline)";
	};

	const getStatusColor = (status: string) => {
		if (status === "Inactive") return "bg-red-100 text-red-800";
		if (status === "Active (Online)") return "bg-green-100 text-green-800";
		return "bg-blue-100 text-blue-800"; // Active (Offline)
	};

	// Helper function to format phone numbers for display
	const formatPhoneNumber = (value: string): string => {
		// Remove all non-digit characters
		const cleaned = value.replace(/\D/g, "");

		// If it starts with 91, add +91 prefix
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

	function handleBlockNoteChange(field: "bio", val: string): void {
		setEditedKathavachak((prev) => (prev ? { ...prev, [field]: val } : prev));
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

	async function handleSavePosts(
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	): Promise<void> {
		event.preventDefault();
		if (!kathavachakId) {
			toast.error("Invalid Kathavachak ID");
			return;
		}
		setIsSavingPosts(true);
		const loadingToast = toast.loading("Saving posts...");
		try {
			const response = await fetch(`/api/users/${kathavachakId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					newImages,
					deletedImages,
					videos: postVideos, // You can optimize videos similarly if needed
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
			// After save, reset tracking
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
					onClick={() => router.push("/admin/kathavachak")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Kathavachak Details</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<KathavachakProfileCard
					{...{
						kathavachak,
						editedKathavachak,
						isEditing,
						setIsEditing,
						isUploadingImage,
						handleImageUpload,
						handleRemoveImage,
						imageError,
						setImageError,
						getStatusColor,
						getKathavachakStatus,
						getCategoryColor,
						getRankColor,
						showAddresses,
						setShowAddresses,
					}}
				/>

				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid grid-cols-5 mb-4">
							<TabsTrigger value="details">Kathavachak Details</TabsTrigger>
							<TabsTrigger value="biography">Biography</TabsTrigger>
							<TabsTrigger value="posts">Posts</TabsTrigger>
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="activity">Activity Log</TabsTrigger>
						</TabsList>

						<TabsContent value="details" className="space-y-4">
							<KathavachakDetailsTab
								{...{
									isEditing,
									editedKathavachak,
									setEditedKathavachak,
									errors,
									setErrors,
									handleSaveChanges,
									isSaving,
									formatPhoneNumber,
									getCategoryColor,
									getRankColor,
									setAddressesToDelete,
									kathavachak,
									formatDate,
								}}
							/>
						</TabsContent>

						<TabsContent value="biography" className="space-y-4">
							<KathavachakBiographyTab
								{...{
									isEditing,
									editedKathavachak,
									handleBlockNoteChange,
									safeBlockNoteHtml,
								}}
							/>
						</TabsContent>

						<TabsContent value="posts" className="space-y-4">
							<KathavachakPostsTab
								{...{
									isEditing,
									postImages,
									postVideos,
									isUploadingPostImage,
									isUploadingPostVideo,
									handlePostImageUpload,
									handleRemovePostImage,
									handlePostVideoUpload,
									handleRemovePostVideo,
									isSavingPosts,
									handleSavePosts,
									showImageUpload,
									setShowImageUpload,
									showVideoUpload,
									setShowVideoUpload,
								}}
							/>
						</TabsContent>

						<TabsContent value="preferences" className="space-y-4">
							<KathavachakPreferencesTab
								{...{
									isEditing,
									editedKathavachak,
									setEditedKathavachak,
									handleSaveChanges,
									kathavachak,
								}}
							/>
						</TabsContent>

						<TabsContent value="activity" className="space-y-4">
							<KathavachakActivityTab />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
