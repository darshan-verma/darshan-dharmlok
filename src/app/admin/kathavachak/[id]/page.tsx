"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
	Kathavachak,
	FormErrors,
	ImageObject,
	VideoObject,
} from "../../components/kathavachak/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KathavachakProfileCard from "@/app/admin/components/kathavachak/KathavachakProfileCard";
import KathavachakDetailsTab from "@/app/admin/components/kathavachak/KathavachakDetailsTab";
import KathavachakBiographyTab from "@/app/admin/components/kathavachak/KathavachakBiographyTab";
import KathavachakPostsTab from "@/app/admin/components/kathavachak/KathavachakPostsTab";
import KathavachakPreferencesTab from "@/app/admin/components/kathavachak/KathavachakPreferencesTab";
import KathavachakActivityTab from "@/app/admin/components/kathavachak/KathavachakActivityTab";
import {
	getRankColor,
	getCategoryColor,
} from "@/app/admin/components/kathavachak/KathavachakTable";

export default function KathavachakDetailPage() {
	const params = useParams();
	const router = useRouter();
	const KathavachakId = (params?.id ?? "") as string;

	// State management for the component
	const [kathavachak, setKathavachak] = useState<Kathavachak | null>(null); // Original kathavachak data from server
	const [isEditing, setIsEditing] = useState(false); // Controls whether form is in edit mode
	const [editedKathavachak, setEditedKathavachak] =
		useState<Partial<Kathavachak> | null>(null); // Draft data being edited
	const [imageError, setImageError] = useState(false); // Handles profile image loading errors
	const [errors, setErrors] = useState<FormErrors>({}); // Form validation errors
	const [showAddresses, setShowAddresses] = useState(false); // Controls address dropdown visibility
	const [addressesToDelete, setAddressesToDelete] = useState<string[]>([]);
	const [isUploadingImage, setIsUploadingImage] = useState(false); // Add image upload state
	const [isSavingBiography, setIsSavingBiography] = useState(false);

	// --- Posts Tab: Images & Videos State ---
	const [showImageUpload, setShowImageUpload] = useState(false);
	const [showVideoUpload, setShowVideoUpload] = useState(false);
	const [isUploadingPostVideo, setIsUploadingPostVideo] = useState(false);
	const [isSavingPosts, setIsSavingPosts] = useState(false);

	// Directly manage existing/new arrays and derive post arrays from them
	// This prevents unnecessary state updates and re-renders
	const [newImages, setNewImages] = useState<ImageObject[]>([]);
	const [deletedImages, setDeletedImages] = useState<string[]>([]);
	const [existingVideos, setExistingVideos] = useState<VideoObject[]>([]);
	const [newVideos, setNewVideos] = useState<VideoObject[]>([]);
	const [videosToDelete, setVideosToDelete] = useState<string[]>([]);
	const [isSaving, setIsSaving] = useState(false); // Loading state for save operation

	// Reset videos to delete when edit mode changes
	useEffect(() => {
		if (!isEditing) {
			setVideosToDelete([]);
		}
	}, [isEditing]);

	const kathavachakId = params?.id as string;

	// Fetch posts (images/videos) on mount or kathavachakId change
	useEffect(() => {
		if (!kathavachakId) return;
		const fetchPosts = async () => {
			try {
				const res = await fetch(`/api/users/${kathavachakId}`);
				if (res.ok) {
					// No action needed for user data here
				}

				// Fetch videos from the Video table
				const videoRes = await fetch(`/api/videos?userId=${kathavachakId}`);
				if (videoRes.ok) {
					const videoData = await videoRes.json();
					// Convert Video records to VideoObject format
					const processedVideos: VideoObject[] = Array.isArray(videoData.videos)
						? videoData.videos.map(
								(v: {
									videoUrl: string;
									title: string;
									description: string;
									id: string;
								}) => ({
									url: v.videoUrl,
									title: v.title,
									description: v.description,
									id: v.id,
								})
						  )
						: [];

					setExistingVideos(processedVideos);
				}
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

	// Derived post images and videos with useMemo for stability

	const postVideos = useMemo(
		() => [...existingVideos, ...newVideos],
		[existingVideos, newVideos]
	);

	// --- Video Upload Handler ---
	const handlePostVideoUpload = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const files = event.target.files;
			if (!files || files.length === 0) return;
			setIsUploadingPostVideo(true);
			const uploaded: VideoObject[] = [];
			try {
				for (let i = 0; i < files.length; i++) {
					const file = files[i];
					const formData = new FormData();
					formData.append("file", file);
					formData.append("userId", KathavachakId);
					const response = await fetch("/api/upload/video", {
						method: "POST",
						body: formData,
					});
					if (!response.ok) throw new Error("Failed to upload video");
					const { videoUrl, video } = await response.json();
					const videoObj: VideoObject = {
						url: videoUrl,
						title: file.name.split(".")[0] || "",
						description: "",
						id: video?.id,
					};
					uploaded.push(videoObj);
				}
				setNewVideos((prev) => [...prev, ...uploaded]);
				toast.success("Video(s) uploaded successfully!");
			} catch {
				toast.error("Failed to upload video(s)");
			} finally {
				setIsUploadingPostVideo(false);
			}
		},
		[KathavachakId]
	);

	const handleRemovePostVideo = (video: VideoObject) => {
		const videoUrl = typeof video === "string" ? video : video.url;
		const videoId = typeof video === "string" ? undefined : video.id;

		// Add to videos to delete list so we can delete from database on save
		if (videoId || videoUrl) {
			setVideosToDelete((prev) => [...prev, videoId || videoUrl]);
		}

		// Remove from existing videos
		setExistingVideos((prev) => prev.filter((vid) => vid.url !== videoUrl));

		// Remove from new videos
		setNewVideos((prev) => prev.filter((vid) => vid.url !== videoUrl));
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

	const handleSavePosts = useCallback(async (): Promise<void> => {
		if (!kathavachakId) {
			toast.error("Invalid Kathavachak ID");
			return;
		}
		setIsSavingPosts(true);
		const loadingToast = toast.loading("Saving posts...");
		try {
			// Only save image-related changes to the user model
			// Videos are already saved as Video records through the upload endpoint
			const response = await fetch(`/api/users/${kathavachakId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					newImages,
					deletedImages,
					// Don't send videos to be saved on the user model
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save posts");
			}

			// Update video titles and descriptions
			const videosToUpdate = postVideos.filter(
				(v) => typeof v !== "string" && v.id
			);
			for (const video of videosToUpdate) {
				if (typeof video !== "string" && video.id) {
					try {
						const videoResponse = await fetch(`/api/videos/${video.id}`, {
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								title: video.title,
								description: video.description,
							}),
						});

						if (!videoResponse.ok) {
							console.error(`Failed to update video ${video.id}`);
						}
					} catch (error) {
						console.error(`Error updating video ${video.id}:`, error);
					}
				}
			}

			// Delete videos that were removed from UI
			if (videosToDelete.length > 0) {
				// Find videos by URLs or IDs
				const videosRes = await fetch(`/api/videos?userId=${kathavachakId}`);
				if (videosRes.ok) {
					const videoData = await videosRes.json();

					// Make sure we have the expected structure
					if (!videoData.videos || !Array.isArray(videoData.videos)) {
						console.error("Unexpected video response format:", videoData);
						throw new Error("Failed to get videos from server");
					}

					const { videos } = videoData;

					// Find video IDs that match the URLs or IDs we want to delete
					const videoIdsToDelete = videos
						.filter((v: { videoUrl: string; id: string }) => {
							// Check if the URL is in our delete list
							if (videosToDelete.includes(v.videoUrl)) return true;
							// Check if the ID is in our delete list
							if (videosToDelete.includes(v.id)) return true;
							return false;
						})
						.map((v: { id: string }) => v.id);

					// If no matching videos found, log a warning
					if (videoIdsToDelete.length === 0 && videosToDelete.length > 0) {
						console.warn(
							"No matching videos found in database for URLs or IDs:",
							videosToDelete
						);
					}

					// Delete each video by ID
					const deleteResults = [];
					for (const videoId of videoIdsToDelete) {
						try {
							const deleteResponse = await fetch(`/api/videos/${videoId}`, {
								method: "DELETE",
							});

							if (!deleteResponse.ok) {
								const errorText = await deleteResponse.text();
								console.error(`Failed to delete video ${videoId}:`, errorText);
								deleteResults.push({
									id: videoId,
									success: false,
									error: errorText,
								});
							} else {
								deleteResults.push({ id: videoId, success: true });
							}
						} catch (error) {
							console.error(`Error deleting video ${videoId}:`, error);
							deleteResults.push({
								id: videoId,
								success: false,
								error: error instanceof Error ? error.message : String(error),
							});
						}
					}
				}
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
	}, [
		kathavachakId,
		newImages,
		deletedImages,
		postVideos,
		videosToDelete,
		setIsEditing,
		setIsSavingPosts,
		setDeletedImages,
		setVideosToDelete,
	]);
	async function handleSaveBiography(): Promise<void> {
		if (!editedKathavachak) return;
		setIsSavingBiography(true);
		const loadingToast = toast.loading("Saving biography...");
		try {
			const response = await fetch(`/api/users/${KathavachakId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bio: editedKathavachak.bio ?? "",
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save biography");
			}
			const updated = await response.json();
			setKathavachak(updated);
			setEditedKathavachak(updated);
			toast.dismiss(loadingToast);
			toast.success("Biography updated successfully!");
			setIsEditing(false);
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to save biography"
			);
		} finally {
			setIsSavingBiography(false);
		}
	}

	// New handlers for video title and description changes
	const handleVideoTitleChange = useCallback(
		(vid: VideoObject, title: string) => {
			// Update in existingVideos or newVideos as appropriate
			if (existingVideos.some((existVid) => existVid.url === vid.url)) {
				setExistingVideos((prev) =>
					prev.map((video) => {
						if (video.url === vid.url) {
							return { ...video, title };
						}
						return video;
					})
				);
			}

			if (newVideos.some((newVid) => newVid.url === vid.url)) {
				setNewVideos((prev) =>
					prev.map((video) => {
						if (video.url === vid.url) {
							return { ...video, title };
						}
						return video;
					})
				);
			}
		},
		[existingVideos, newVideos]
	);

	const handleVideoDescriptionChange = useCallback(
		(vid: VideoObject, description: string) => {
			// Update in existingVideos or newVideos as appropriate
			if (existingVideos.some((existVid) => existVid.url === vid.url)) {
				setExistingVideos((prev) =>
					prev.map((video) => {
						if (video.url === vid.url) {
							return { ...video, description };
						}
						return video;
					})
				);
			}

			if (newVideos.some((newVid) => newVid.url === vid.url)) {
				setNewVideos((prev) =>
					prev.map((video) => {
						if (video.url === vid.url) {
							return { ...video, description };
						}
						return video;
					})
				);
			}
		},
		[existingVideos, newVideos]
	);

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
								editedKathavachak={editedKathavachak}
								isEditing={isEditing}
								handleBlockNoteChange={handleBlockNoteChange}
								onSave={handleSaveBiography}
								isSaving={isSavingBiography}
							/>
						</TabsContent>

						<TabsContent value="posts" className="space-y-4">
							{/* Wrap KathavachakPostsTab in useMemo to prevent unnecessary re-renders */}
							{useMemo(
								() => (
									<KathavachakPostsTab
										isEditing={isEditing}
										postVideos={postVideos}
										isUploadingPostVideo={isUploadingPostVideo}
										handlePostVideoUpload={handlePostVideoUpload}
										handleRemovePostVideo={handleRemovePostVideo}
										isSavingPosts={isSavingPosts}
										handleSavePosts={handleSavePosts}
										showImageUpload={showImageUpload}
										setShowImageUpload={setShowImageUpload}
										showVideoUpload={showVideoUpload}
										setShowVideoUpload={setShowVideoUpload}
										handleVideoTitleChange={handleVideoTitleChange}
										handleVideoDescriptionChange={handleVideoDescriptionChange}
										userId={kathavachakId}
									/>
								),
								[
									isEditing,
									postVideos,
									isUploadingPostVideo,
									isSavingPosts,
									showImageUpload,
									showVideoUpload,
									handlePostVideoUpload,
									handleSavePosts,
									handleVideoTitleChange,
									handleVideoDescriptionChange,
									kathavachakId,
								]
							)}
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
