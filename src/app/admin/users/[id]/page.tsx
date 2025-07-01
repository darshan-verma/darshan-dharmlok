"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import UserProfileCard from "@/app/admin/components/users/UserProfileCard";
import UserDetailsTabs from "@/app/admin/components/users/UserDetailsTabs";

interface Activity {
	date: string;
	action: string;
}

interface UserPreferences {
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

interface User {
	id: string;
	name: string;
	phone: string;
	email: string;
	userType?: string;
	typeVendor?: string;
	profileImageUrl?: string;
	bio?: string;
	coverImageUrl?: string;
	category?: string;
	addresses?: Address[];
	social?: number;
	active?: number;
	rank?: number;
	availability?: number;
	kycApproved?: number;
	status?: "Active" | "Inactive" | "Suspended";
	isLoggedIn: boolean;
	lastLogoutAt?: string | Date | null;
	lastActiveAt?: string | Date | null;
	lastLoginAt?: string | Date | null;
	createdAt: string | Date;
	// Client-side only properties
	preferences?: UserPreferences;
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

export default function UserDetailPage() {
	const params = useParams();
	const router = useRouter();
	const userId = params?.id as string;

	const [user, setUser] = useState<User | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedUser, setEditedUser] = useState<Partial<User> | null>(null);
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

	// Fetch posts (images/videos) on mount or kathavachakId change
	useEffect(() => {
		const fetchPosts = async () => {
			if (!userId) return;
			try {
				const res = await fetch(`/api/users/${userId}`);
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
	}, [userId]);
	const handleRemovePostVideo = (url: string) => {
		setPostVideos((prev) => prev.filter((vid) => vid !== url));
	};

	// Fetch user data from API
	const fetchUserData = useCallback(async () => {
		try {
			console.log("Fetching user data for ID:", userId);

			// Validate MongoDB ObjectId format
			if (userId && !/^[0-9a-fA-F]{24}$/.test(userId)) {
				console.error("Invalid MongoDB ObjectId format:", userId);
				toast.error("Invalid user ID format");
				router.push("/admin/users");
				return;
			}

			const loadingToast = toast.loading("Loading user details...");

			console.log("Making API request to:", `/api/users/${userId}`);

			// Add timeout to prevent hanging requests
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			try {
				const response = await fetch(`/api/users/${userId}`, {
					signal: controller.signal,
				});
				clearTimeout(timeoutId);

				console.log("API response status:", response.status);

				if (!response.ok) {
					const errorText = await response.text();
					console.error("Error response text:", errorText);

					let errorData;
					try {
						errorData = JSON.parse(errorText);
						console.error("Parsed error data:", errorData);
					} catch (parseError) {
						console.error(
							"Failed to parse error response as JSON:",
							parseError
						);
						errorData = { error: "Unknown error occurred" };
					}

					throw new Error(errorData.error || "Failed to fetch user");
				}

				const userData = await response.json();
				console.log("User data received:", userData);

				// Create a complete user object with fallbacks for missing properties
				const completeUser: User = {
					...userData,
					id: userData.id,
					name: userData.name || "",
					email: userData.email || "",
					phone: userData.phone || "",
					addresses: userData.addresses || [],
					userType: userData.userType || "Regular",
					status: userData.status || "Active",
					isLoggedIn: userData.isLoggedIn || false,
					bio: userData.bio || "",
					createdAt: userData.createdAt || new Date().toISOString(),
					// Add client-side only properties
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};

				setUser(completeUser);
				setEditedUser({ ...completeUser });
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
			console.error("Error loading user:", error);
			console.error(
				"Error details:",
				error instanceof Error
					? {
							name: error.name,
							message: error.message,
							stack: error.stack,
					  }
					: "Unknown error type"
			);

			toast.error(
				error instanceof Error ? error.message : "Failed to load user details"
			);

			// Create a mock user as fallback for development
			if (process.env.NODE_ENV !== "production") {
				console.log("Using mock data as fallback in development");
				const mockUser: User = {
					id: userId || "mock-id",
					name: "Test User",
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
					userType: "Regular",
					status: "Active",
					isLoggedIn: false,
					bio: "This is a test user bio.",
					createdAt: new Date().toISOString(),
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};
				setUser(mockUser);
				setEditedUser({ ...mockUser });
				return;
			}

			router.push("/admin/users");
		}
	}, [userId, router]);

	// Call the fetch function when component mounts
	useEffect(() => {
		if (userId) {
			fetchUserData();
		}
	}, [userId, fetchUserData]);

	const validateForm = (userData: Partial<User>): boolean => {
		const newErrors: FormErrors = {};

		if (!userData.name?.trim()) {
			newErrors.name = "Name is required";
		}

		if (!userData.email?.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(userData.email)) {
			newErrors.email = "Email is invalid";
		}

		if (!userData.phone?.trim()) {
			newErrors.phone = "Phone number is required";
		} else {
			const phoneRegex = /^(\+91[\s-]?)?[0-9]{10}$/;
			if (!phoneRegex.test(userData.phone.replace(/[\s-]/g, ""))) {
				newErrors.phone =
					"Please enter a valid 10-digit phone number with optional +91 prefix";
			}
		}

		if (userData.addresses) {
			userData.addresses.forEach((address, index) => {
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
		if (!editedUser) return;

		if (!validateForm(editedUser)) {
			return;
		}

		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");

		try {
			// Prepare data for API
			const dataToSave = {
				name: editedUser.name,
				email: editedUser.email,
				phone: editedUser.phone,
				addresses: editedUser.addresses,
				addressesToDelete,
				bio: editedUser.bio || null,
				profileImageUrl:
					editedUser.profileImageUrl === undefined
						? null // <-- send null if removed
						: editedUser.profileImageUrl,
			};

			console.log("Sending data to API:", dataToSave); // Debug log

			const response = await fetch(`/api/users/${userId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSave),
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error("API Error:", errorData); // Debug log
				throw new Error(errorData.error || "Failed to update user");
			}

			const updatedUser = await response.json();
			console.log("Update successful:", updatedUser); // Debug log

			setUser(updatedUser);
			setEditedUser(updatedUser);
			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("User details updated successfully!");
			setAddressesToDelete([]);
		} catch (error) {
			console.error("Error saving user:", error);
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to update user details"
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

	const getUserStatus = (user: User) => {
		if (!user.status || user.status === "Inactive") return "Inactive";
		return user.isLoggedIn ? "Active (Online)" : "Active (Offline)";
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

		const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		if (!validTypes.includes(file.type)) {
			toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
			return;
		}

		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			toast.error("Image size must be less than 5MB");
			return;
		}

		setIsUploadingImage(true);
		const loadingToast = toast.loading("Uploading image...");

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/upload/profile-image", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to upload image");
			}

			const { imageUrl } = await response.json();

			setEditedUser((prev) =>
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
		setEditedUser((prev) =>
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
				formData.append("userId", userId);
				// Use the correct endpoint for users:
				const response = await fetch("/api/upload/user-post-image", {
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
				formData.append("userId", userId);
				// Use the correct endpoint for users:
				const response = await fetch("/api/upload/user-video", {
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

	function handleBlockNoteChange(field: "bio", val: string): void {
		setEditedUser((prev) => (prev ? { ...prev, [field]: val } : prev));
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
		if (!userId) {
			toast.error("Invalid Kathavachak ID");
			return;
		}
		setIsSavingPosts(true);
		const loadingToast = toast.loading("Saving posts...");
		try {
			const response = await fetch(`/api/users/${userId}`, {
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
					onClick={() => router.push("/admin/users")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">User Details</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<UserProfileCard
					user={user}
					editedUser={editedUser}
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					imageError={imageError}
					setImageError={setImageError}
					isUploadingImage={isUploadingImage}
					handleImageUpload={handleImageUpload}
					handleRemoveImage={handleRemoveImage}
					showAddresses={showAddresses}
					setShowAddresses={setShowAddresses}
					formatDate={formatDate}
					getUserStatus={getUserStatus}
					getStatusColor={getStatusColor}
				/>

				<div className="md:col-span-2">
					<UserDetailsTabs
						user={user}
						editedUser={editedUser}
						setEditedUser={setEditedUser}
						isEditing={isEditing}
						isSaving={isSaving}
						errors={errors}
						setErrors={setErrors}
						setAddressesToDelete={setAddressesToDelete}
						handleSaveChanges={handleSaveChanges}
						handleBlockNoteChange={handleBlockNoteChange}
						safeBlockNoteHtml={safeBlockNoteHtml}
						formatPhoneNumber={formatPhoneNumber}
						handlePostImageUpload={handlePostImageUpload}
						handleSavePosts={handleSavePosts}
						handleRemovePostImage={handleRemovePostImage}
						isUploadingPostImage={isUploadingPostImage}
						isUploadingPostVideo={isUploadingPostVideo}
						handlePostVideoUpload={handlePostVideoUpload}
						isSavingPosts={isSavingPosts}
						postImages={postImages}
						showVideoUpload={showVideoUpload}
						setShowVideoUpload={setShowVideoUpload}
						showImageUpload={showImageUpload}
						setShowImageUpload={setShowImageUpload}
						handleRemovePostVideo={handleRemovePostVideo}
						postVideos={postVideos}
					/>
				</div>
			</div>
		</div>
	);
}
