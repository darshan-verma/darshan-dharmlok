"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import {
	Seller,
	FormErrors,
	ImageObject,
	VideoObject,
} from "@/app/admin/components/seller/types";
import ProfileCard from "@/app/admin/components/seller/ProfileCard";
import DetailsTab from "@/app/admin/components/seller/DetailsTab";
import BiographyTab from "@/app/admin/components/seller/BiographyTab";
import SellerPostsTab from "@/app/admin/components/seller/SellerPostsTab";
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
	const [postImages, setPostImages] = useState<ImageObject[]>([]);
	const [postVideos, setPostVideos] = useState<VideoObject[]>([]);
	const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
	const [isUploadingPostVideo, setIsUploadingPostVideo] = useState(false);
	const [isSavingPosts, setIsSavingPosts] = useState(false);

	const [existingImages, setExistingImages] = useState<ImageObject[]>([]);
	const [deletedImages, setDeletedImages] = useState<ImageObject[]>([]);
	const [videosToDelete, setVideosToDelete] = useState<VideoObject[]>([]);

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

				// Fetch images and videos
				try {
					const [imagesRes, videosRes] = await Promise.all([
						fetch(`/api/images?userId=${sellerId}&source=seller-post`),
						fetch(`/api/videos?userId=${sellerId}&source=seller-post`),
					]);

					if (imagesRes.ok) {
						const imagesData = await imagesRes.json();
						setPostImages(imagesData.images);
						setExistingImages(imagesData.images);
					}

					if (videosRes.ok) {
						const videosData = await videosRes.json();
						setPostVideos(videosData.videos);
					}
				} catch (error) {
					console.error("Failed to fetch media:", error);
					toast.error("Failed to load media gallery.");
				}

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

	const handleSavePreferences = async () => {
		if (!editedSeller?.preferences) return;

		setIsSaving(true);
		const loadingToast = toast.loading("Saving preferences...");

		try {
			const response = await fetch(`/api/users/${sellerId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					preferences: editedSeller.preferences,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save preferences");
			}

			const updatedSeller = await response.json();
			setSeller(updatedSeller);
			setEditedSeller(updatedSeller);
			toast.dismiss(loadingToast);
			toast.success("Preferences updated successfully!");
			setIsEditing(false);
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to save preferences"
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

	// Add this near your other useEffect hooks
	useEffect(() => {
		const fetchMedia = async () => {
			if (!sellerId) return;
			try {
				const [imagesRes, videosRes] = await Promise.all([
					fetch(`/api/images?userId=${sellerId}&source=seller-post`),
					fetch(`/api/videos?userId=${sellerId}&source=seller-post`),
				]);

				if (imagesRes.ok) {
					const imagesData = await imagesRes.json();
					setPostImages(imagesData.images || []);
					setExistingImages(imagesData.images || []);
				} else {
					setPostImages([]);
					setExistingImages([]);
				}

				if (videosRes.ok) {
					const videosData = await videosRes.json();
					setPostVideos(videosData.videos || []);
				} else {
					setPostVideos([]);
				}
			} catch (error) {
				console.error("Error fetching media:", error);
				setPostImages([]);
				setPostVideos([]);
			}
		};
		fetchMedia();
	}, [sellerId]);

	const handleImageAdded = (image: ImageObject) => {
		setPostImages((prev) => [...prev, image]);
	};

	const handleVideoAdded = (video: VideoObject) => {
		setPostVideos((prev) => [...prev, video]);
	};

	const handleImageTitleChange = (img: ImageObject, title: string) => {
		setPostImages((prev) =>
			prev.map((i) => (i.id === img.id ? { ...i, title } : i))
		);
	};

	const handleImageDescriptionChange = (
		img: ImageObject,
		description: string
	) => {
		setPostImages((prev) =>
			prev.map((i) => (i.id === img.id ? { ...i, description } : i))
		);
	};

	const handleVideoTitleChange = (vid: VideoObject, title: string) => {
		setPostVideos((prev) =>
			prev.map((v) => (v.id === vid.id ? { ...v, title } : v))
		);
	};

	const handleVideoDescriptionChange = (
		vid: VideoObject,
		description: string
	) => {
		setPostVideos((prev) =>
			prev.map((v) => (v.id === vid.id ? { ...v, description } : v))
		);
	};

	// --- Image Upload Handler ---
	const handlePostImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
		source: "gallery" | "post"
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;
		setIsUploadingPostImage(true);
		const uploaded: ImageObject[] = [];
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
				// Create an image object, assuming no title/desc for multi-upload
				const newImage: ImageObject = {
					url: imageUrl,
					userId: sellerId,
					source,
				};
				uploaded.push(newImage);
			}
			setPostImages((prev) => [...prev, ...uploaded]);
			toast.success("Image(s) uploaded successfully!");
		} catch {
			toast.error("Failed to upload image(s)");
		} finally {
			setIsUploadingPostImage(false);
		}
	};

	const handleRemovePostImage = (imageToRemove: ImageObject) => {
		// If the image has an ID, it's an existing one that needs to be marked for deletion
		if (imageToRemove.id) {
			setDeletedImages((prev) => [...prev, imageToRemove]);
		}
		// Filter out from the main display list
		setPostImages((prev) =>
			prev.filter((img) => img.url !== imageToRemove.url)
		);
	};

	// --- Video Upload Handler ---
	const handlePostVideoUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;
		setIsUploadingPostVideo(true);
		const uploaded: VideoObject[] = [];
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

				// Create a video object and save it to the database
				const createRes = await fetch("/api/videos", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						videoFile: videoUrl,
						userId: sellerId,
						title: file.name, // Default title
						description: "",
						source: "seller-post",
						category: "General",
						type: "post",
					}),
				});

				if (!createRes.ok) {
					throw new Error("Failed to save video metadata");
				}
				const newVideo = await createRes.json();
				uploaded.push(newVideo);
			}
			setPostVideos((prev) => [...prev, ...uploaded]);
			toast.success("Video(s) uploaded successfully!");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to upload video(s)"
			);
		} finally {
			setIsUploadingPostVideo(false);
		}
	};

	const handleRemovePostVideo = async (videoToRemove: VideoObject) => {
		if (!videoToRemove.id) return;
		setVideosToDelete((prev) => [...prev, videoToRemove]);
		setPostVideos((prev) => prev.filter((vid) => vid.id !== videoToRemove.id));
	};

	// --- Save Posts Handler ---
	const handleSavePosts = async () => {
		setIsSavingPosts(true);
		const loadingToast = toast.loading("Saving media changes...");

		try {
			// 1. Delete images marked for deletion
			if (deletedImages.length > 0) {
				const imageIds = deletedImages.map((img) => img.id).filter(Boolean);
				if (imageIds.length > 0) {
					await fetch("/api/images", {
						method: "DELETE",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ ids: imageIds }),
					});
				}
			}

			// 2. Delete videos marked for deletion
			if (videosToDelete.length > 0) {
				const videoIds = videosToDelete.map((vid) => vid.id).filter(Boolean);
				if (videoIds.length > 0) {
					await fetch("/api/videos", {
						method: "DELETE",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ ids: videoIds }),
					});
				}
			}

			// 3. Update existing images with new titles/descriptions
			const imagesToUpdate = postImages.filter(
				(img) =>
					img.id && // It's an existing image
					(img.title !== existingImages.find((i) => i.id === img.id)?.title ||
						img.description !==
							existingImages.find((i) => i.id === img.id)?.description)
			);

			if (imagesToUpdate.length > 0) {
				await Promise.all(
					imagesToUpdate.map((img) =>
						fetch(`/api/images/${img.id}`, {
							method: "PUT",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								title: img.title,
								description: img.description,
							}),
						})
					)
				);
			}

			// 4. Update videos with new titles/descriptions
			const videosToUpdate = postVideos.filter((vid) => vid.id); // All videos have IDs now
			if (videosToUpdate.length > 0) {
				await Promise.all(
					videosToUpdate.map((vid) =>
						fetch(`/api/videos/${vid.id}`, {
							method: "PUT",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								title: vid.title,
								description: vid.description,
							}),
						})
					)
				);
			}

			toast.dismiss(loadingToast);
			toast.success("Media gallery updated successfully!");
			setIsEditing(false);
			// Refetch all data to ensure consistency
			fetchSellerData();
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to save media changes."
			);
		} finally {
			setIsSavingPosts(false);
			setDeletedImages([]);
			setVideosToDelete([]);
		}
	};

	if (!seller) {
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
					<h1 className="text-2xl font-bold">Loading Seller Details...</h1>
				</div>
				{/* You can add a skeleton loader here */}
			</div>
		);
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

			<div className="flex flex-col lg:flex-row gap-6">
				<div className="lg:w-1/3">
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
				</div>

				<div className="flex-1 lg:max-w-4xl xl:max-w-6xl">
					<Tabs defaultValue="details" className="w-full">
						<TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
							<TabsTrigger value="details">Details</TabsTrigger>
							<TabsTrigger value="biography">Biography</TabsTrigger>
							<TabsTrigger value="posts">Posts</TabsTrigger>
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="activity">Activity</TabsTrigger>
						</TabsList>
						<TabsContent value="details">
							<DetailsTab
								isEditing={isEditing}
								editedSeller={editedSeller}
								errors={errors}
								setEditedSeller={setEditedSeller}
								setAddressesToDelete={setAddressesToDelete}
								handleSaveChanges={handleSaveChanges}
								isSaving={isSaving}
							/>
						</TabsContent>
						<TabsContent value="biography">
							<BiographyTab
								isEditing={isEditing}
								editedSeller={editedSeller}
								handleBlockNoteChange={handleBlockNoteChange}
								onSave={handleSaveBiography}
								isSaving={isSavingBiography}
							/>
						</TabsContent>
						<TabsContent value="posts">
							<SellerPostsTab
								isEditing={isEditing}
								postImages={postImages}
								postVideos={postVideos}
								isUploadingPostImage={isUploadingPostImage}
								handlePostImageUpload={(e) => handlePostImageUpload(e, "post")}
								handleRemovePostImage={handleRemovePostImage}
								isUploadingPostVideo={isUploadingPostVideo}
								handlePostVideoUpload={handlePostVideoUpload}
								handleRemovePostVideo={handleRemovePostVideo}
								isSavingPosts={isSavingPosts}
								handleSavePosts={handleSavePosts}
								userId={sellerId}
								onImageAdded={handleImageAdded}
								onVideoAdded={handleVideoAdded}
								handleImageTitleChange={handleImageTitleChange}
								handleImageDescriptionChange={handleImageDescriptionChange}
								handleVideoTitleChange={handleVideoTitleChange}
								handleVideoDescriptionChange={handleVideoDescriptionChange}
							/>
						</TabsContent>
						<TabsContent value="preferences">
							<PreferencesTab
								seller={seller}
								isEditing={isEditing}
								editedSeller={editedSeller}
								setEditedSeller={setEditedSeller}
								handleSaveChanges={handleSavePreferences}
							/>
						</TabsContent>
						<TabsContent value="activity">
							<ActivityTab />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
