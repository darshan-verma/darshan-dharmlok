"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import {
	HotelDharamshala,
	FormErrors,
} from "@/app/admin/components/hotel_dharamshala_vendor/types";
import ProfileCard from "@/app/admin/components/hotel_dharamshala_vendor/ProfileCard";
import DetailsTab from "@/app/admin/components/hotel_dharamshala_vendor/DetailsTab";
import BiographyTab from "@/app/admin/components/hotel_dharamshala_vendor/BiographyTab";
import PostsTab from "@/app/admin/components/hotel_dharamshala_vendor/PostsTab";
import PreferencesTab from "@/app/admin/components/hotel_dharamshala_vendor/PreferencesTab";
import ActivityTab from "@/app/admin/components/hotel_dharamshala_vendor/ActivityTab";

export default function HotelDharamshalaDetailPage() {
	const params = useParams();
	const router = useRouter();
	const HotelDharamshalaId = (params?.id ?? "") as string;

	const [HotelDharamshala, setHotelDharamshala] =
		useState<HotelDharamshala | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedHotelDharamshala, setEditedHotelDharamshala] =
		useState<Partial<HotelDharamshala> | null>(null);
	const [imageError, setImageError] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [addressesToDelete, setAddressesToDelete] = useState<string[]>([]);
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	const [showVideoUpload, setShowVideoUpload] = useState(false);
	const [showImageUpload, setShowImageUpload] = useState(false);
	const [postImages, setPostImages] = useState<string[]>([]);
	const [postVideos, setPostVideos] = useState<string[]>([]);
	const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
	const [isUploadingPostVideo, setIsUploadingPostVideo] = useState(false);
	const [isSavingPosts, setIsSavingPosts] = useState(false);

	const [existingImages, setExistingImages] = useState<string[]>([]);
	const [newImages, setNewImages] = useState<string[]>([]);
	const [deletedImages, setDeletedImages] = useState<string[]>([]);
	const [videosToDelete, setVideosToDelete] = useState<string[]>([]);

	const [isSavingBiography, setIsSavingBiography] = useState(false);

	const hotelDharamshalaId = params?.id as string;

	// Fetch HotelDharamshala data from API
	const fetchHotelDharamshalaData = useCallback(async () => {
		try {
			// Validate MongoDB ObjectId format
			if (HotelDharamshalaId && !/^[0-9a-fA-F]{24}$/.test(HotelDharamshalaId)) {
				toast.error("Invalid HotelDharamshala ID format");
				router.push("/admin/HotelDharamshala");
				return;
			}

			const loadingToast = toast.loading("Loading HotelDharamshala details...");

			// Add timeout to prevent hanging requests
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			try {
				const response = await fetch(`/api/users/${HotelDharamshalaId}`, {
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

					throw new Error(
						errorData.error || "Failed to fetch HotelDharamshala"
					);
				}

				const HotelDharamshalaData = await response.json();

				// Create a complete HotelDharamshala object with fallbacks for missing properties
				const completeHotelDharamshala: HotelDharamshala = {
					...HotelDharamshalaData,
					id: HotelDharamshalaData.id,
					name: HotelDharamshalaData.name || "",
					email: HotelDharamshalaData.email || "",
					phone: HotelDharamshalaData.phone || "",
					addresses: HotelDharamshalaData.addresses || [],
					HotelDharamshalaType:
						HotelDharamshalaData.HotelDharamshalaType || "Regular",
					status: HotelDharamshalaData.status || "Active",
					isLoggedIn: HotelDharamshalaData.isLoggedIn || false,
					bio: HotelDharamshalaData.bio || "",
					createdAt: HotelDharamshalaData.createdAt || new Date().toISOString(),
					// Add client-side only properties
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};

				setHotelDharamshala(completeHotelDharamshala);
				setEditedHotelDharamshala({ ...completeHotelDharamshala });
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
					: "Failed to load HotelDharamshala details"
			);

			// Create a mock HotelDharamshala as fallback for development
			if (process.env.NODE_ENV !== "production") {
				const mockHotelDharamshala: HotelDharamshala = {
					id: HotelDharamshalaId || "mock-id",
					name: "Test HotelDharamshala",
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
					HotelDharamshalaType: "Regular",
					status: "Active",
					isLoggedIn: false,
					bio: "This is a test HotelDharamshala bio.",
					createdAt: new Date().toISOString(),
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};
				setHotelDharamshala(mockHotelDharamshala);
				setEditedHotelDharamshala({ ...mockHotelDharamshala });
				return;
			}

			router.push("/admin/hotel_dharamshala_vendor");
		}
	}, [HotelDharamshalaId, router]);

	// Call the fetch function when component mounts
	useEffect(() => {
		if (HotelDharamshalaId) {
			fetchHotelDharamshalaData();
		}
	}, [HotelDharamshalaId, fetchHotelDharamshalaData]);

	// Fetch posts (images/videos) on mount or hotelDharamshalaId change
	// useEffect(() => {
	// 	const fetchPosts = async () => {
	// 		if (!hotelDharamshalaId) return;
	// 		try {
	// 			const res = await fetch(`/api/users/${hotelDharamshalaId}`);
	// 			if (!res.ok) return;
	// 			const data = await res.json();
	// 			setExistingImages(
	// 				Array.isArray(data.images)
	// 					? data.images
	// 					: data.images
	// 					? [data.images]
	// 					: []
	// 			);
	// 			setPostImages(
	// 				Array.isArray(data.images)
	// 					? data.images
	// 					: data.images
	// 					? [data.images]
	// 					: []
	// 			);
	// 			setPostVideos(
	// 				Array.isArray(data.videos)
	// 					? data.videos
	// 					: data.videos
	// 					? [data.videos]
	// 					: []
	// 			);
	// 		} catch {}
	// 	};
	// 	fetchPosts();
	// }, [hotelDharamshalaId]);

	// Fetch videos for the hotel/dharamshala from videos API
	useEffect(() => {
		const fetchVideos = async () => {
			if (!hotelDharamshalaId) return;
			try {
				const res = await fetch(`/api/videos?userId=${hotelDharamshalaId}`);
				if (!res.ok) return;
				const data = await res.json();
				// Set videos from the video API
				setPostVideos(data.videos.map((v: any) => v.videoUrl));
			} catch (error) {
				console.error("Error fetching videos:", error);
			}
		};
		fetchVideos();
	}, [hotelDharamshalaId]);

	const validateForm = (
		HotelDharamshalaData: Partial<HotelDharamshala>
	): boolean => {
		const newErrors: FormErrors = {};

		if (!HotelDharamshalaData.name?.trim()) {
			newErrors.name = "Name is required";
		}

		if (!HotelDharamshalaData.email?.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(HotelDharamshalaData.email)) {
			newErrors.email = "Email is invalid";
		}

		if (!HotelDharamshalaData.phone?.trim()) {
			newErrors.phone = "Phone number is required";
		} else {
			const phoneRegex = /^(\+91[\s-]?)?[0-9]{10}$/;
			if (!phoneRegex.test(HotelDharamshalaData.phone.replace(/[\s-]/g, ""))) {
				newErrors.phone =
					"Please enter a valid 10-digit phone number with optional +91 prefix";
			}
		}

		if (HotelDharamshalaData.addresses) {
			HotelDharamshalaData.addresses.forEach((address, index) => {
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
		if (!editedHotelDharamshala) return;

		if (!validateForm(editedHotelDharamshala)) {
			return;
		}

		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");

		try {
			// Prepare data for API
			const dataToSave = {
				name: editedHotelDharamshala.name,
				email: editedHotelDharamshala.email,
				phone: editedHotelDharamshala.phone,
				addresses: editedHotelDharamshala.addresses,
				addressesToDelete,
				bio: editedHotelDharamshala.bio || null,
				profileImageUrl:
					editedHotelDharamshala.profileImageUrl === undefined
						? null // <-- send null if removed
						: editedHotelDharamshala.profileImageUrl,
			};

			const response = await fetch(`/api/users/${HotelDharamshalaId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSave),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update HotelDharamshala");
			}

			const updatedHotelDharamshala = await response.json();

			setHotelDharamshala(updatedHotelDharamshala);
			setEditedHotelDharamshala(updatedHotelDharamshala);
			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("HotelDharamshala details updated successfully!");
			setAddressesToDelete([]);
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update HotelDharamshala details"
			);
		} finally {
			setIsSaving(false);
		}
	};

	// Image upload function
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
			formData.append("userId", HotelDharamshalaId);

			const response = await fetch("/api/upload/profile-image", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to upload image");
			}

			const { imageUrl } = await response.json();

			setEditedHotelDharamshala((prev) =>
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

	// --- Posts handlers ---
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
				formData.append("userId", hotelDharamshalaId);
				const response = await fetch("/api/upload/hotel-dharamshala-image", {
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
				formData.append("userId", hotelDharamshalaId);
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
		// Add video URL to the deletion list
		setVideosToDelete((prev) => [...prev, url]);
		// Remove from UI
		setPostVideos((prev) => prev.filter((vid) => vid !== url));
	};

	async function handleSavePosts(
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	): Promise<void> {
		event.preventDefault();
		if (!hotelDharamshalaId) {
			toast.error("Invalid Hotel Dharamshala ID");
			return;
		}
		setIsSavingPosts(true);
		const loadingToast = toast.loading("Saving posts...");
		try {
			// First handle image updates
			const response = await fetch(`/api/users/${hotelDharamshalaId}`, {
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
				const videosRes = await fetch(
					`/api/videos?userId=${hotelDharamshalaId}`
				);
				if (!videosRes.ok) {
					throw new Error("Failed to fetch videos for deletion");
				}
				const videosData = await videosRes.json();

				// Find and delete videos that match URLs in videosToDelete
				const deletePromises = videosToDelete.map(async (urlToDelete) => {
					const videoToDelete = videosData.videos.find(
						(v: any) => v.videoUrl === urlToDelete
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

	// Remove profile image
	const handleRemoveImage = () => {
		setEditedHotelDharamshala((prev) =>
			prev ? { ...prev, profileImageUrl: undefined } : null
		);
		setImageError(false);
		toast.success("Profile image removed");
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

	// const getHotelDharamshalaStatus = (HotelDharamshala: HotelDharamshala) => {
	// 	if (!HotelDharamshala.status || HotelDharamshala.status === "Inactive")
	// 		return "Inactive";
	// 	return HotelDharamshala.isLoggedIn ? "Active (Online)" : "Active (Offline)";
	// };

	// const getStatusColor = (status: string) => {
	// 	if (status === "Inactive") return "bg-red-100 text-red-800";
	// 	if (status === "Active (Online)") return "bg-green-100 text-green-800";
	// 	return "bg-blue-100 text-blue-800"; // Active (Offline)
	// };

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

	// Add handleSaveBiography
	const handleSaveBiography = async () => {
		setIsSavingBiography(true);
		try {
			const response = await fetch(`/api/users/${hotelDharamshalaId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bio: editedHotelDharamshala?.bio || "",
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save biography");
			}
			const updated = await response.json();
			setHotelDharamshala(updated);
			setEditedHotelDharamshala(updated);
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

	function handleBlockNoteChange(field: "bio", val: string): void {
		setEditedHotelDharamshala((prev) =>
			prev ? { ...prev, [field]: val } : prev
		);
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

	// Reset edit states when isEditing changes to false
	useEffect(() => {
		if (!isEditing) {
			// Reset video deletion tracking when exiting edit mode
			setVideosToDelete([]);
			// Also reset other temporary states
			setNewImages([]);
			setDeletedImages([]);
		}
	}, [isEditing]);

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/hotel_dharamshala_vendor")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Hotel Dharamshala Details</h1>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<ProfileCard
					HotelDharamshala={HotelDharamshala}
					editedHotelDharamshala={editedHotelDharamshala}
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleImageUpload={handleImageUpload}
					handleRemoveImage={handleRemoveImage}
					isUploadingImage={isUploadingImage}
					imageError={imageError}
					setImageError={setImageError}
				/>
				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid grid-cols-5 mb-4">
							<TabsTrigger value="details">
								Hotel Dharamshala Details
							</TabsTrigger>
							<TabsTrigger value="biography">Biography</TabsTrigger>
							<TabsTrigger value="posts">Posts</TabsTrigger>
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="activity">Activity Log</TabsTrigger>
						</TabsList>
						<TabsContent value="details" className="space-y-4">
							<DetailsTab
								HotelDharamshala={HotelDharamshala}
								editedHotelDharamshala={editedHotelDharamshala}
								setEditedHotelDharamshala={setEditedHotelDharamshala}
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
								editedHotelDharamshala={editedHotelDharamshala}
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
								showImageUpload={showImageUpload}
								setShowImageUpload={setShowImageUpload}
								showVideoUpload={showVideoUpload}
								setShowVideoUpload={setShowVideoUpload}
							/>
						</TabsContent>
						<TabsContent value="preferences" className="space-y-4">
							<PreferencesTab
								HotelDharamshala={HotelDharamshala}
								editedHotelDharamshala={editedHotelDharamshala}
								setEditedHotelDharamshala={setEditedHotelDharamshala}
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
