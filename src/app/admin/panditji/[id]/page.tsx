"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import {
	Panditji,
	FormErrors,
	ImageObject,
	VideoObject,
} from "@/app/admin/components/panditji/types";
import ProfileCard from "@/app/admin/components/panditji/ProfileCard";
import DetailsTab from "@/app/admin/components/panditji/DetailsTab";
import BiographyTab from "@/app/admin/components/panditji/BiographyTab";
import PanditjiPostsTab from "@/app/admin/components/panditji/PanditjiPostsTab";
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

	const [postImages, setPostImages] = useState<ImageObject[]>([]);
	const [postVideos, setPostVideos] = useState<VideoObject[]>([]);
	const [deletedImages, setDeletedImages] = useState<string[]>([]);
	const [deletedVideos, setDeletedVideos] = useState<string[]>([]);
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
				setPanditji(PanditjiData);
				setEditedPanditji(PanditjiData);

				// Preserve videos/images uploaded via dialog to avoid duplicates
				setPostImages((prevImages) => {
					const dialogImages = prevImages.filter((img) => img._isFromDialog);
					const serverImages = PanditjiData.images || [];
					// Merge server images with dialog images, avoiding duplicates by URL
					const mergedImages = [...serverImages];
					dialogImages.forEach((dialogImg) => {
						if (
							!serverImages.some(
								(serverImg: ImageObject) => serverImg.url === dialogImg.url
							)
						) {
							mergedImages.push(dialogImg);
						}
					});
					return mergedImages;
				});

				setPostVideos((prevVideos) => {
					const dialogVideos = prevVideos.filter((vid) => vid._isFromDialog);
					const serverVideos = PanditjiData.videos || [];
					// Merge server videos with dialog videos, avoiding duplicates by URL
					const mergedVideos = [...serverVideos];
					dialogVideos.forEach((dialogVid) => {
						if (
							!serverVideos.some(
								(serverVid: VideoObject) => serverVid.url === dialogVid.url
							)
						) {
							mergedVideos.push(dialogVid);
						}
					});
					return mergedVideos;
				});

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

	// Effect to clean up when component unmounts
	useEffect(() => {
		return () => {
			// cleanup logic if needed
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
			// --- Save Details Tab Data ---
			// Filter out images/videos that were uploaded via dialog (already saved)
			const imagesToSave = postImages.filter((img) => !img._isFromDialog);
			const videosToSave = postVideos.filter((vid) => !vid._isFromDialog);

			const dataToSave = {
				...editedPanditji,
				images: imagesToSave,
				videos: videosToSave,
				deletedImages,
				deletedVideos,
				addressesToDelete,
			};

			const response = await fetch(`/api/users/${panditjiId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSave),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update Panditji");
			}

			// After saving, refetch Panditji data to ensure images/videos are up-to-date
			await fetchPanditjiData();

			setDeletedImages([]);
			setDeletedVideos([]);
			setAddressesToDelete([]);

			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("All changes saved successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to save changes"
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

		const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		if (!validTypes.includes(file.type)) {
			toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
			return;
		}

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

	if (!panditji || !editedPanditji) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-lg font-semibold">Loading Panditji details...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4">
			<div className="mb-4 flex items-center justify-between">
				<Button variant="ghost" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Panditjis
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-1">
					<ProfileCard
						panditji={panditji}
						editedPanditji={editedPanditji}
						handleImageUpload={handleImageUpload}
						handleRemoveImage={handleRemoveImage}
						isUploadingImage={isUploadingImage}
						imageError={imageError}
						isEditing={isEditing}
						setIsEditing={setIsEditing}
						setImageError={setImageError}
					/>
				</div>
				<div className="lg:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
							<TabsTrigger value="details">Details</TabsTrigger>
							<TabsTrigger value="biography">Biography</TabsTrigger>
							<TabsTrigger value="posts">Posts</TabsTrigger>
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="activity">Activity</TabsTrigger>
						</TabsList>
						<TabsContent value="details">
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
						<TabsContent value="biography">
							<BiographyTab
								editedPanditji={editedPanditji}
								isEditing={isEditing}
								handleBlockNoteChange={handleBlockNoteChange}
								safeBlockNoteHtml={safeBlockNoteHtml}
								onSave={handleSaveBiography}
								isSaving={isSavingBiography}
							/>
						</TabsContent>
						<TabsContent value="posts">
							<PanditjiPostsTab
								userId={panditjiId}
								isEditing={isEditing}
								isSavingPosts={isSaving}
								onSavePosts={fetchPanditjiData}
								onEditDone={() => setIsEditing(false)}
							/>
						</TabsContent>
						<TabsContent value="preferences">
							<PreferencesTab
								panditji={panditji}
								editedPanditji={editedPanditji}
								setEditedPanditji={setEditedPanditji}
								isEditing={isEditing}
								handleSaveChanges={handleSaveChanges}
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
