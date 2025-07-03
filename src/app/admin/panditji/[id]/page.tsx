"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import { Panditji, FormErrors } from "@/app/admin/components/panditji/types";
import ProfileCard from "@/app/admin/components/panditji/ProfileCard";
import DetailsTab from "@/app/admin/components/panditji/DetailsTab";
import BiographyTab from "@/app/admin/components/panditji/BiographyTab";
import PostsTab from "@/app/admin/components/panditji/PostsTab";
import PreferencesTab from "@/app/admin/components/panditji/PreferencesTab";
import ActivityTab from "@/app/admin/components/panditji/ActivityTab";

export default function PanditjiDetailPage() {
	const params = useParams();
	const router = useRouter();
	const panditjiId = (params?.id ?? "") as string;

	const [panditji, setPanditji] = useState<Panditji | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedPanditji, setEditedPanditji] =
		useState<Partial<Panditji> | null>(null);
	const [imageError, setImageError] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [addressesToDelete, setAddressesToDelete] = useState<string[]>([]);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [isSavingBiography, setIsSavingBiography] = useState(false);

	const [postImages, setPostImages] = useState<string[]>([]);
	const [postVideos, setPostVideos] = useState<string[]>([]);
	const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
	const [isUploadingPostVideo, setIsUploadingPostVideo] = useState(false);
	const [isSavingPosts, setIsSavingPosts] = useState(false);
	const [videosToDelete, setVideosToDelete] = useState<string[]>([]);

	const [existingImages, setExistingImages] = useState<string[]>([]);
	const [newImages, setNewImages] = useState<string[]>([]);
	const [deletedImages, setDeletedImages] = useState<string[]>([]);

	// Fetch posts (images/videos) on mount or panditjiId change
	useEffect(() => {
		const fetchPosts = async () => {
			if (!panditjiId) return;
			try {
				// Fetch user data for images
				const res = await fetch(`/api/users/${panditjiId}`);
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

				// Fetch videos from Video model
				const videoRes = await fetch(`/api/videos?userId=${panditjiId}`);
				if (videoRes.ok) {
					const videoData = await videoRes.json();
					setPostVideos(
						Array.isArray(videoData.videos)
							? videoData.videos.map((v: { videoUrl: string }) => v.videoUrl)
							: []
					);
				}
			} catch (error) {
				console.error("Error fetching posts:", error);
			}
		};
		fetchPosts();
	}, [panditjiId]);

	// Fetch Panditji data from API
	const fetchPanditjiData = useCallback(async () => {
		try {
			if (panditjiId && !/^[0-9a-fA-F]{24}$/.test(panditjiId)) {
				toast.error("Invalid Panditji ID format");
				router.push("/admin/panditji");
				return;
			}
			const loadingToast = toast.loading("Loading Panditji details...");
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			try {
				const response = await fetch(`/api/users/${panditjiId}`, {
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
					throw new Error(errorData.error || "Failed to fetch Panditji");
				}

				const PanditjiData = await response.json();
				const completePanditji: Panditji = {
					...PanditjiData,
					id: PanditjiData.id,
					name: PanditjiData.name || "",
					email: PanditjiData.email || "",
					phone: PanditjiData.phone || "",
					addresses: PanditjiData.addresses || [],
					PanditjiType: PanditjiData.PanditjiType || "Regular",
					status: PanditjiData.status || "Active",
					isLoggedIn: PanditjiData.isLoggedIn || false,
					bio: PanditjiData.bio || "",
					createdAt: PanditjiData.createdAt || new Date().toISOString(),
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};
				setPanditji(completePanditji);
				setEditedPanditji({ ...completePanditji });
				toast.dismiss(loadingToast);
			} catch (error) {
				clearTimeout(timeoutId);
				if (error instanceof Error && error.name === "AbortError") {
					throw new Error("Request timed out. Please try again.");
				}
				throw error;
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to load Panditji details"
			);
			if (process.env.NODE_ENV !== "production") {
				const mockPanditji: Panditji = {
					id: panditjiId || "mock-id",
					name: "Test Panditji",
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
					PanditjiType: "Regular",
					status: "Active",
					isLoggedIn: false,
					bio: "This is a test Panditji bio.",
					createdAt: new Date().toISOString(),
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};
				setPanditji(mockPanditji);
				setEditedPanditji({ ...mockPanditji });
				return;
			}
			router.push("/admin/panditji");
		}
	}, [panditjiId, router]);

	// Call the fetch function when component mounts
	useEffect(() => {
		if (panditjiId) {
			fetchPanditjiData();
		}
	}, [panditjiId, fetchPanditjiData]);

	// Reset videosToDelete when edit mode changes
	useEffect(() => {
		if (!isEditing) {
			setVideosToDelete([]);
		}
	}, [isEditing]);

	// Effect to clean up videosToDelete when component unmounts
	useEffect(() => {
		return () => {
			setVideosToDelete([]);
		};
	}, []);

	const validateForm = (PanditjiData: Partial<Panditji>): boolean => {
		const newErrors: FormErrors = {};

		if (!PanditjiData.name?.trim()) {
			newErrors.name = "Name is required";
		}

		if (!PanditjiData.email?.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(PanditjiData.email)) {
			newErrors.email = "Email is invalid";
		}

		if (!PanditjiData.phone?.trim()) {
			newErrors.phone = "Phone number is required";
		} else {
			const phoneRegex = /^(\+91[\s-]?)?[0-9]{10}$/;
			if (!phoneRegex.test(PanditjiData.phone.replace(/[\s-]/g, ""))) {
				newErrors.phone =
					"Please enter a valid 10-digit phone number with optional +91 prefix";
			}
		}

		if (PanditjiData.addresses) {
			PanditjiData.addresses.forEach((address, index) => {
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
		if (!editedPanditji) return;

		if (!validateForm(editedPanditji)) {
			return;
		}

		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");

		try {
			// Prepare data for API
			const dataToSave = {
				name: editedPanditji.name,
				email: editedPanditji.email,
				phone: editedPanditji.phone,
				addresses: editedPanditji.addresses,
				addressesToDelete,
				bio: editedPanditji.bio || null,
				profileImageUrl:
					editedPanditji.profileImageUrl === undefined
						? null // <-- send null if removed
						: editedPanditji.profileImageUrl,
			};

			const response = await fetch(`/api/users/${panditjiId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSave),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update Panditji");
			}

			const updatedPanditji = await response.json();

			setPanditji(updatedPanditji);
			setEditedPanditji(updatedPanditji);
			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("Panditji details updated successfully!");
			setAddressesToDelete([]);
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update Panditji details"
			);
		} finally {
			setIsSaving(false);
		}
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
			formData.append("userId", panditjiId);

			const response = await fetch("/api/upload/profile-image", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to upload image");
			}

			const { imageUrl } = await response.json();

			setEditedPanditji((prev) =>
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
		setEditedPanditji((prev) =>
			prev ? { ...prev, profileImageUrl: undefined } : null
		);
		setImageError(false);
		toast.success("Profile image removed");
	};

	const handleBlockNoteChange = (field: "bio", val: string) => {
		setEditedPanditji((prev) => (prev ? { ...prev, [field]: val } : prev));
	};

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
				formData.append("userId", panditjiId);
				const response = await fetch("/api/upload/panditji-image", {
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
				formData.append("userId", panditjiId);
				// Use the correct video upload endpoint
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
		// Add to videos to delete list so we can delete from database on save
		console.log("Marking video for deletion:", url);
		setVideosToDelete((prev) => [...prev, url]);
		// Remove from UI
		setPostVideos((prev) => prev.filter((vid) => vid !== url));
	};

	async function handleSavePosts(
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	): Promise<void> {
		event.preventDefault();
		if (!panditjiId) {
			toast.error("Invalid Panditji ID");
			return;
		}
		setIsSavingPosts(true);
		const loadingToast = toast.loading("Saving posts...");
		try {
			// First save image changes to the user model
			const response = await fetch(`/api/users/${panditjiId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					newImages,
					deletedImages,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save posts");
			}

			// Delete videos that were removed from UI
			if (videosToDelete.length > 0) {
				// Find videos by URLs
				const videosRes = await fetch(`/api/videos?userId=${panditjiId}`);
				if (videosRes.ok) {
					const videoData = await videosRes.json();

					// Make sure we have the expected structure
					if (!videoData.videos || !Array.isArray(videoData.videos)) {
						console.error("Unexpected video response format:", videoData);
						throw new Error("Failed to get videos from server");
					}

					const { videos } = videoData;

					// Debug log
					console.log("Videos to delete:", videosToDelete);
					console.log("All videos from DB:", videos);

					// Find video IDs that match the URLs we want to delete
					const videoIdsToDelete = videos
						.filter((v: any) => videosToDelete.includes(v.videoUrl))
						.map((v: any) => v.id);

					console.log("Video IDs to delete:", videoIdsToDelete);

					// If no matching videos found, log a warning
					if (videoIdsToDelete.length === 0 && videosToDelete.length > 0) {
						console.warn(
							"No matching videos found in database for URLs:",
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
								console.log(`Successfully deleted video ${videoId}`);
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

					console.log("Video deletion results:", deleteResults);
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
	}

	const handleSaveBiography = async () => {
		setIsSavingBiography(true);
		try {
			const response = await fetch(`/api/users/${panditjiId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bio: editedPanditji?.bio || "",
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save biography");
			}
			const updated = await response.json();
			setPanditji(updated);
			setEditedPanditji(updated);
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
		const cleaned = value.replace(/\D/g, "");
		if (cleaned.startsWith("91") && cleaned.length >= 10) {
			return `+91 ${cleaned.substring(2, 12)}`;
		} else if (cleaned.length <= 10) {
			return cleaned;
		}
		return cleaned;
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/panditji")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Panditji Details</h1>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<ProfileCard
					panditji={panditji}
					editedPanditji={editedPanditji}
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
							<TabsTrigger value="details">Panditji Details</TabsTrigger>
							<TabsTrigger value="biography">Biography</TabsTrigger>
							<TabsTrigger value="posts">Posts</TabsTrigger>
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="activity">Activity Log</TabsTrigger>
						</TabsList>
						<TabsContent value="details" className="space-y-4">
							<DetailsTab
								panditji={panditji}
								editedPanditji={editedPanditji}
								setEditedPanditji={setEditedPanditji}
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
								editedPanditji={editedPanditji}
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
								panditji={panditji}
								editedPanditji={editedPanditji}
								setEditedPanditji={setEditedPanditji}
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
