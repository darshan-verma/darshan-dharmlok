"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import { Dharmguru, FormErrors } from "@/app/admin/components/dharmguru/types";
import ProfileCard from "@/app/admin/components/dharmguru/ProfileCard";
import DetailsTab from "@/app/admin/components/dharmguru/DetailsTab";
import BiographyTab from "@/app/admin/components/dharmguru/BiographyTab";
import PostsTab from "@/app/admin/components/dharmguru/DharmguruPostsTab";
import PreferencesTab from "@/app/admin/components/dharmguru/PreferencesTab";
import ActivityTab from "@/app/admin/components/dharmguru/ActivityTab";
import type {
	ImageObject,
	VideoObject,
} from "@/app/admin/components/dharmguru/types";

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
	const [addressesToDelete, setAddressesToDelete] = useState<string[]>([]);
	const [isUploadingImage, setIsUploadingImage] = useState(false); // Add image upload state
	const [isSavingBiography, setIsSavingBiography] = useState(false);

	// --- Posts Tab: Images & Videos State ---
	const [postImages, setPostImages] = useState<ImageObject[]>([]);
	const [postVideos, setPostVideos] = useState<VideoObject[]>([]);
	const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
	const [isUploadingPostVideo, setIsUploadingPostVideo] = useState(false);
	const [isSavingPosts, setIsSavingPosts] = useState(false);

	// Fetch images/videos as objects (with metadata)
	useEffect(() => {
		if (!dharmguruId) return;
		const fetchMedia = async () => {
			try {
				const [imgRes, vidRes] = await Promise.all([
					fetch(`/api/images?userId=${dharmguruId}`),
					fetch(`/api/videos?userId=${dharmguruId}`),
				]);
				if (imgRes.ok) {
					const data = await imgRes.json();
					setPostImages(data.images || []);
				}
				if (vidRes.ok) {
					const data = await vidRes.json();
					setPostVideos(data.videos || []);
				}
			} catch (e) {
				console.error("Failed to fetch media:", e);
			}
		};
		fetchMedia();
	}, [dharmguruId]);

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

	const handleSaveBiography = async () => {
		setIsSavingBiography(true);
		try {
			const response = await fetch(`/api/users/${dharmguruId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bio: editedDharmguru?.bio || "",
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save biography");
			}
			const updated = await response.json();
			setDharmguru(updated);
			setEditedDharmguru(updated);
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

	// --- Image Upload Handler ---
	const handlePostImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;
		setIsUploadingPostImage(true);
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const formData = new FormData();
				formData.append("file", file);
				formData.append("userId", dharmguruId);
				const uploadRes = await fetch("/api/upload/profile-image", {
					method: "POST",
					body: formData,
				});
				if (!uploadRes.ok) continue;
				const { imageUrl } = await uploadRes.json();
				// Create image object with empty title/description
				const createRes = await fetch("/api/images", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						url: imageUrl,
						userId: dharmguruId,
						title: "",
						description: "",
					}),
				});
				if (!createRes.ok) continue;
				const image = await createRes.json();
				setPostImages((prev) => [...prev, image]);
			}
			toast.success("Image(s) uploaded successfully!");
		} catch {
			toast.error("Failed to upload image(s)");
		} finally {
			setIsUploadingPostImage(false);
		}
	};

	const handleRemovePostImage = async (img: ImageObject) => {
		if (!img.id) return;
		try {
			const res = await fetch(`/api/images/${img.id}`, { method: "DELETE" });
			if (res.ok) {
				setPostImages((prev) => prev.filter((p) => p.id !== img.id));
			}
		} catch (e) {
			toast.error("Failed to remove image");
		}
	};

	const handleImageTitleChange = async (img: ImageObject, title: string) => {
		if (!img.id) return;
		const res = await fetch(`/api/images/${img.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title }),
		});
		if (res.ok) {
			const updated = await res.json();
			setPostImages((prev) =>
				prev.map((p) => (p.id === updated.id ? updated : p))
			);
		}
	};

	const handleImageDescriptionChange = async (
		img: ImageObject,
		description: string
	) => {
		if (!img.id) return;
		const res = await fetch(`/api/images/${img.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ description }),
		});
		if (res.ok) {
			const updated = await res.json();
			setPostImages((prev) =>
				prev.map((p) => (p.id === updated.id ? updated : p))
			);
		}
	};

	// --- Video Upload Handler ---
	const handlePostVideoUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;
		setIsUploadingPostVideo(true);
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const formData = new FormData();
				formData.append("file", file);
				formData.append("userId", dharmguruId);
				const uploadRes = await fetch("/api/upload/video", {
					method: "POST",
					body: formData,
				});
				if (!uploadRes.ok) continue;
				const { videoUrl } = await uploadRes.json();
				// Create video object with empty title/description
				const createRes = await fetch("/api/videos", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						url: videoUrl,
						userId: dharmguruId,
						title: "",
						description: "",
					}),
				});
				if (!createRes.ok) continue;
				const video = await createRes.json();
				setPostVideos((prev) => [...prev, video]);
			}
			toast.success("Video(s) uploaded successfully!");
		} catch {
			toast.error("Failed to upload video(s)");
		} finally {
			setIsUploadingPostVideo(false);
		}
	};

	const handleRemovePostVideo = async (vid: VideoObject) => {
		if (!vid.id) return;
		try {
			const res = await fetch(`/api/videos/${vid.id}`, { method: "DELETE" });
			if (res.ok) {
				setPostVideos((prev) => prev.filter((v) => v.id !== vid.id));
			}
		} catch (e) {
			toast.error("Failed to remove video");
		}
	};

	const handleVideoTitleChange = async (vid: VideoObject, title: string) => {
		if (!vid.id) return;
		const res = await fetch(`/api/videos/${vid.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title }),
		});
		if (res.ok) {
			const updated = await res.json();
			setPostVideos((prev) =>
				prev.map((v) => (v.id === updated.id ? updated : v))
			);
		}
	};

	const handleVideoDescriptionChange = async (
		vid: VideoObject,
		description: string
	) => {
		if (!vid.id) return;
		const res = await fetch(`/api/videos/${vid.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ description }),
		});
		if (res.ok) {
			const updated = await res.json();
			setPostVideos((prev) =>
				prev.map((v) => (v.id === updated.id ? updated : v))
			);
		}
	};

	async function handleSavePosts(): Promise<void> {
		setIsSavingPosts(true);
		const loadingToast = toast.loading("Saving posts...");
		try {
			// No need to send arrays, as all changes are persisted on each action
			toast.dismiss(loadingToast);
			toast.success("Posts saved successfully!");
			setIsEditing(false);
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to save posts"
			);
		} finally {
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
				<ProfileCard
					dharmguru={dharmguru}
					editedDharmguru={editedDharmguru}
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
							<TabsTrigger value="details">Dharmguru Details</TabsTrigger>
							<TabsTrigger value="biography">Biography</TabsTrigger>
							<TabsTrigger value="posts">Posts</TabsTrigger>
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="activity">Activity Log</TabsTrigger>
						</TabsList>

						<TabsContent value="details" className="space-y-4">
							<DetailsTab
								dharmguru={dharmguru}
								editedDharmguru={editedDharmguru}
								setEditedDharmguru={setEditedDharmguru}
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
								editedDharmguru={editedDharmguru}
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
								userId={dharmguruId}
								handleImageTitleChange={handleImageTitleChange}
								handleImageDescriptionChange={handleImageDescriptionChange}
								handleVideoTitleChange={handleVideoTitleChange}
								handleVideoDescriptionChange={handleVideoDescriptionChange}
								onImageAdded={(img) => setPostImages((prev) => [...prev, img])}
								onVideoAdded={vid => setPostVideos(prev => [...prev, vid])}
							/>
						</TabsContent>

						<TabsContent value="preferences" className="space-y-4">
							<PreferencesTab
								dharmguru={dharmguru}
								editedDharmguru={editedDharmguru}
								setEditedDharmguru={setEditedDharmguru}
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
