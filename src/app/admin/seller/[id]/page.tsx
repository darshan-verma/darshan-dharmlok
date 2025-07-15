"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import { Seller, FormErrors } from "@/app/admin/components/seller/types";
import ProfileCard from "@/app/admin/components/seller/ProfileCard";
import DetailsTab from "@/app/admin/components/seller/DetailsTab";
import BiographyTab from "@/app/admin/components/seller/BiographyTab";
import PostsTab from "@/app/admin/components/seller/PostsTab";
import PreferencesTab from "@/app/admin/components/seller/PreferencesTab";
import ActivityTab from "@/app/admin/components/seller/ActivityTab";

export default function SellerDetailPage() {
	const params = useParams();
	const router = useRouter();
	const sellerId = (params?.id ?? "") as string;

	const [seller, setSeller] = useState<Seller | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedSeller, setEditedSeller] = useState<Partial<Seller> | null>(
		null
	);
	const [imageError, setImageError] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [addressesToDelete, setAddressesToDelete] = useState<string[]>([]);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [isSavingBiography, setIsSavingBiography] = useState(false);
	// --- Posts Tab: Images & Videos State ---
	const [postImages, setPostImages] = useState<string[]>([]);
	const [postVideos, setPostVideos] = useState<string[]>([]);
	const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
	const [isUploadingPostVideo, setIsUploadingPostVideo] = useState(false);
	const [isSavingPosts, setIsSavingPosts] = useState(false);

	const [existingImages, setExistingImages] = useState<string[]>([]);
	const [newImages, setNewImages] = useState<string[]>([]);
	const [deletedImages, setDeletedImages] = useState<string[]>([]);
	const [videosToDelete, setVideosToDelete] = useState<string[]>([]);

	// Fetch seller data from API
	const fetchSellerData = useCallback(async () => {
		try {
			// Validate MongoDB ObjectId format
			if (sellerId && !/^[0-9a-fA-F]{24}$/.test(sellerId)) {
				toast.error("Invalid seller ID format");
				router.push("/admin/seller");
				return;
			}

			const loadingToast = toast.loading("Loading seller details...");

			// Add timeout to prevent hanging requests
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			try {
				const response = await fetch(`/api/users/${sellerId}`, {
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

					throw new Error(errorData.error || "Failed to fetch seller");
				}

				const SellerData = await response.json();

				// Create a complete seller object with fallbacks for missing properties
				const completeSeller: Seller = {
					...SellerData,
					id: SellerData.id,
					name: SellerData.name || "",
					email: SellerData.email || "",
					phone: SellerData.phone || "",
					addresses: SellerData.addresses || [],
					SellerType: SellerData.SellerType || "Regular",
					status: SellerData.status || "Active",
					isLoggedIn: SellerData.isLoggedIn || false,
					bio: SellerData.bio || "",
					createdAt: SellerData.createdAt || new Date().toISOString(),
					// Add client-side only properties
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};

				setSeller(completeSeller);
				setEditedSeller({ ...completeSeller });
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
				error instanceof Error ? error.message : "Failed to load seller details"
			);

			// Create a mock seller as fallback for development
			if (process.env.NODE_ENV !== "production") {
				const mockSeller: Seller = {
					id: sellerId || "mock-id",
					name: "Test seller",
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
					SellerType: "Regular",
					status: "Active",
					isLoggedIn: false,
					bio: "This is a test seller bio.",
					createdAt: new Date().toISOString(),
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};
				setSeller(mockSeller);
				setEditedSeller({ ...mockSeller });
				return;
			}

			router.push("/admin/seller");
		}
	}, [sellerId, router]);

	// Reset all edit states when isEditing changes to false
	useEffect(() => {
		if (!isEditing) {
			// Reset video deletion tracking when exiting edit mode
			setVideosToDelete([]);
			// Also reset other temporary states
			setNewImages([]);
			setDeletedImages([]);
		}
	}, [isEditing]);

	// Call the fetch function when component mounts
	useEffect(() => {
		if (sellerId) {
			fetchSellerData();
		}
	}, [sellerId, fetchSellerData]);

	const validateForm = (SellerData: Partial<Seller>): boolean => {
		const newErrors: FormErrors = {};

		if (!SellerData.name?.trim()) {
			newErrors.name = "Name is required";
		}

		if (!SellerData.email?.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(SellerData.email)) {
			newErrors.email = "Email is invalid";
		}

		if (!SellerData.phone?.trim()) {
			newErrors.phone = "Phone number is required";
		} else {
			const phoneRegex = /^(\+91[\s-]?)?[0-9]{10}$/;
			if (!phoneRegex.test(SellerData.phone.replace(/[\s-]/g, ""))) {
				newErrors.phone =
					"Please enter a valid 10-digit phone number with optional +91 prefix";
			}
		}

		if (SellerData.addresses) {
			SellerData.addresses.forEach((address, index) => {
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
		if (!editedSeller) return;

		if (!validateForm(editedSeller)) {
			return;
		}

		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");

		try {
			// Prepare data for API
			const dataToSave = {
				name: editedSeller.name,
				email: editedSeller.email,
				phone: editedSeller.phone,
				addresses: editedSeller.addresses,
				addressesToDelete,
				bio: editedSeller.bio || null,
				profileImageUrl:
					editedSeller.profileImageUrl === undefined
						? null // <-- send null if removed
						: editedSeller.profileImageUrl,
			};

			const response = await fetch(`/api/users/${sellerId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSave),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update seller");
			}

			const updatedSeller = await response.json();

			setSeller(updatedSeller);
			setEditedSeller(updatedSeller);
			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("Seller details updated successfully!");
			setAddressesToDelete([]);
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update seller details"
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleSaveBiography = async () => {
		setIsSavingBiography(true);
		try {
			const response = await fetch(`/api/users/${sellerId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bio: editedSeller?.bio || "",
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save biography");
			}
			const updated = await response.json();
			setSeller(updated);
			setEditedSeller(updated);
			toast.success("Biography saved!");
			setIsEditing(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save biography"
			);
		} finally {
			setIsSavingBiography(false);
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
			formData.append("userId", sellerId);

			const response = await fetch("/api/upload/profile-image", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to upload image");
			}

			const { imageUrl } = await response.json();

			setEditedSeller((prev) =>
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

	const handleRemoveImage = () => {
		setEditedSeller((prev) =>
			prev ? { ...prev, profileImageUrl: undefined } : null
		);
		setImageError(false);
		toast.success("Profile image removed");
	};

	function handleBlockNoteChange(field: "bio", val: string): void {
		setEditedSeller((prev) => (prev ? { ...prev, [field]: val } : prev));
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
	// Add this near your other useEffect hooks
	useEffect(() => {
		const fetchVideos = async () => {
			if (!sellerId) return;
			try {
				const res = await fetch(`/api/videos?userId=${sellerId}`);
				if (!res.ok) return;
				const data = await res.json();
				// Set videos from the video API
				setPostVideos(data.videos.map((v: { videoUrl: string }) => v.videoUrl));
			} catch (error) {
				console.error("Error fetching videos:", error);
			}
		};
		fetchVideos();
	}, [sellerId]);

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
				formData.append("userId", sellerId);
				const response = await fetch("/api/upload/seller-image", {
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
				formData.append("userId", sellerId);
				const response = await fetch("/api/upload/video", {
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
		setVideosToDelete((prev) => [...prev, url]);
		setPostVideos((prev) => prev.filter((vid) => vid !== url));
	};

	async function handleSavePosts(
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	): Promise<void> {
		event.preventDefault();
		if (!sellerId) {
			toast.error("Invalid Seller ID");
			return;
		}
		setIsSavingPosts(true);
		const loadingToast = toast.loading("Saving posts...");
		try {
			// First handle image updates
			const response = await fetch(`/api/users/${sellerId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					newImages,
					deletedImages,
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save posts");
			}

			// Then handle video deletions
			if (videosToDelete.length > 0) {
				// Fetch all videos for this user
				const videosRes = await fetch(`/api/videos?userId=${sellerId}`);
				if (!videosRes.ok) {
					throw new Error("Failed to fetch videos for deletion");
				}
				const videosData = await videosRes.json();

				// Find and delete videos that match URLs in videosToDelete
				const deletePromises = videosToDelete.map(async (urlToDelete) => {
					const videoToDelete = videosData.videos.find(
						(v: { videoUrl: string }) => v.videoUrl === urlToDelete
					);
					if (videoToDelete) {
						const deleteRes = await fetch(`/api/videos/${videoToDelete.id}`, {
							method: "DELETE",
						});
						if (!deleteRes.ok) {
							console.error(`Failed to delete video: ${videoToDelete.id}`);
						}
					}
				});

				await Promise.all(deletePromises);
			}

			toast.dismiss(loadingToast);
			toast.success("Posts saved successfully!");
			setIsEditing(false);
			setIsSavingPosts(false);
			setNewImages([]);
			setDeletedImages([]);
			setVideosToDelete([]);
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
					onClick={() => router.push("/admin/seller")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Seller Details</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<ProfileCard
					seller={seller}
					editedSeller={editedSeller}
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleImageUpload={handleImageUpload}
					handleRemoveImage={handleRemoveImage}
					isUploadingImage={isUploadingImage}
					imageError={imageError}
					setImageError={setImageError}
				/>

				{/* Tabs Section */}
				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid grid-cols-5 mb-4">
							<TabsTrigger value="details">Seller Details</TabsTrigger>
							<TabsTrigger value="biography">Biography</TabsTrigger>
							<TabsTrigger value="posts">Posts</TabsTrigger>
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="activity">Activity Log</TabsTrigger>
						</TabsList>

						<TabsContent value="details" className="space-y-4">
							<DetailsTab
								seller={seller}
								editedSeller={editedSeller}
								setEditedSeller={setEditedSeller}
								isEditing={isEditing}
								isSaving={isSaving}
								errors={errors}
								setErrors={setErrors}
								handleSaveChanges={handleSaveChanges}
								formatDate={formatDate}
								formatPhoneNumber={formatPhoneNumber}
								setAddressesToDelete={setAddressesToDelete}
							/>
						</TabsContent>

						<TabsContent value="biography" className="space-y-4">
							<BiographyTab
								editedSeller={editedSeller}
								isEditing={isEditing}
								handleBlockNoteChange={handleBlockNoteChange}
								safeBlockNoteHtml={safeBlockNoteHtml}
								onSave={handleSaveBiography}
								isSaving={isSavingBiography}
							/>
						</TabsContent>

						<TabsContent value="posts" className="space-y-4">
							<PostsTab
								isEditing={isEditing}
								postImages={postImages}
								postVideos={postVideos}
								handlePostImageUpload={handlePostImageUpload}
								handleRemovePostImage={handleRemovePostImage}
								isUploadingPostImage={isUploadingPostImage}
								handlePostVideoUpload={handlePostVideoUpload}
								handleRemovePostVideo={handleRemovePostVideo}
								isUploadingPostVideo={isUploadingPostVideo}
								handleSavePosts={handleSavePosts}
								isSavingPosts={isSavingPosts}
							/>
						</TabsContent>

						<TabsContent value="preferences" className="space-y-4">
							<PreferencesTab
								seller={seller}
								editedSeller={editedSeller}
								setEditedSeller={setEditedSeller}
								isEditing={isEditing}
								handleSaveChanges={handleSaveChanges}
							/>
						</TabsContent>

						<TabsContent value="activity" className="space-y-4">
							<ActivityTab />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
