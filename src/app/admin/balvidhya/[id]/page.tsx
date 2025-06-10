"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Save,
	Image as ImageIcon,
	Calendar,
	Play,
	BookOpen,
	TrendingUp,
	Upload,
	Plus,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { toast } from "@/lib/toast";
import {
	getTypeColor,
	getCategoryColor,
	balvidhyaTypes,
	balvidhyaCategories,
} from "@/app/admin/components/balvidhya/BalvidhyaTable";

// Interface definitions for type safety
interface Activity {
	date: string;
	action: string;
}

interface BalvidhyaPreferences {
	notifications: boolean;
	newsletter: boolean;
	language: string;
}

interface Balvidhya {
	id: string;
	name: string;
	description: string;
	type: string;
	category: string;
	status: string;
	trending: boolean;
	thumbnailUrl?: string;
	dateAdded: string | Date;
	createdAt?: string | Date;
	updatedAt?: string | Date;
	// Client-side only properties
	preferences?: BalvidhyaPreferences;
	activities?: Activity[];
}

interface FormErrors {
	name?: string;
	description?: string;
	type?: string;
	category?: string;
	thumbnailUrl?: string;
}

export default function BalvidhyaDetailPage() {
	const params = useParams();
	const router = useRouter();
	const balvidhyaId = params.id as string;

	// State management
	const [balvidhya, setBalvidhya] = useState<Balvidhya | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedBalvidhya, setEditedBalvidhya] =
		useState<Partial<Balvidhya> | null>(null);
	const [imageError, setImageError] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	// Fetch Balvidhya data from API
	const fetchBalvidhyaData = useCallback(async () => {
		try {
			// Validate MongoDB ObjectId format
			if (balvidhyaId && !/^[0-9a-fA-F]{24}$/.test(balvidhyaId)) {
				toast.error("Invalid Balvidhya ID format");
				router.push("/admin/balvidhya");
				return;
			}

			const loadingToast = toast.loading("Loading content details...");

			// Add timeout to prevent hanging requests
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			try {
				const response = await fetch(`/api/balvidhya/${balvidhyaId}`, {
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

					throw new Error(errorData.error || "Failed to fetch content");
				}

				const balvidhyaData = await response.json();

				// Create a complete Balvidhya object with fallbacks
				const completeBalvidhya: Balvidhya = {
					...balvidhyaData,
					id: balvidhyaData.id,
					name: balvidhyaData.name || "",
					description: balvidhyaData.description || "",
					type: balvidhyaData.type || "",
					category: balvidhyaData.category || "",
					status: balvidhyaData.status || "Draft",
					trending: balvidhyaData.trending || false,
					thumbnailUrl: balvidhyaData.thumbnailUrl || "",
					dateAdded:
						balvidhyaData.dateAdded ||
						balvidhyaData.createdAt ||
						new Date().toISOString(),
					createdAt: balvidhyaData.createdAt || new Date().toISOString(),
					// Add client-side only properties
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};

				setBalvidhya(completeBalvidhya);
				setEditedBalvidhya({ ...completeBalvidhya });
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
					: "Failed to load content details"
			);

			// Create mock data as fallback for development
			if (process.env.NODE_ENV !== "production") {
				const mockBalvidhya: Balvidhya = {
					id: balvidhyaId || "mock-id",
					name: "Stories from Ramayana for Kids",
					description:
						"Engaging animated stories from the epic Ramayana specially designed for children aged 5-12. Features colorful animations, simple language, and moral lessons.",
					type: "Video",
					category: "Ramayana for Kids",
					status: "Active",
					trending: true,
					thumbnailUrl:
						"https://tulsibooks.com/wp-content/uploads/2023/06/untold-stories-of-krishna.jpg",
					dateAdded: new Date("2024-01-15"),
					createdAt: new Date("2024-01-15"),
					preferences: {
						notifications: true,
						newsletter: false,
						language: "English",
					},
					activities: [],
				};
				setBalvidhya(mockBalvidhya);
				setEditedBalvidhya({ ...mockBalvidhya });
				return;
			}

			router.push("/admin/balvidhya");
		}
	}, [balvidhyaId, router]);

	// Call fetch function when component mounts
	useEffect(() => {
		if (balvidhyaId) {
			fetchBalvidhyaData();
		}
	}, [balvidhyaId, fetchBalvidhyaData]);

	// Form validation
	const validateForm = (balvidhyaData: Partial<Balvidhya>): boolean => {
		const newErrors: FormErrors = {};

		if (!balvidhyaData.name?.trim()) {
			newErrors.name = "Content name is required";
		} else if (balvidhyaData.name.length < 3) {
			newErrors.name = "Name must be at least 3 characters";
		} else if (balvidhyaData.name.length > 100) {
			newErrors.name = "Name must be less than 100 characters";
		}

		if (!balvidhyaData.description?.trim()) {
			newErrors.description = "Description is required";
		} else if (balvidhyaData.description.length < 10) {
			newErrors.description = "Description must be at least 10 characters";
		} else if (balvidhyaData.description.length > 500) {
			newErrors.description = "Description must be less than 500 characters";
		}

		if (!balvidhyaData.type) {
			newErrors.type = "Content type is required";
		}

		if (!balvidhyaData.category) {
			newErrors.category = "Category is required";
		}

		// Thumbnail URL validation (optional but if provided, should be valid)
		if (balvidhyaData.thumbnailUrl && balvidhyaData.thumbnailUrl.trim()) {
			try {
				new URL(balvidhyaData.thumbnailUrl);
			} catch {
				newErrors.thumbnailUrl = "Please enter a valid URL";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Handle saving changes
	const handleSaveChanges = async () => {
		if (!editedBalvidhya) return;

		if (!validateForm(editedBalvidhya)) {
			return;
		}

		setIsSaving(true);
		const loadingToast = toast.loading("Saving changes...");

		try {
			const dataToSave = {
				name: editedBalvidhya.name,
				description: editedBalvidhya.description,
				type: editedBalvidhya.type,
				category: editedBalvidhya.category,
				status: editedBalvidhya.status,
				trending: editedBalvidhya.trending,
				thumbnailUrl: editedBalvidhya.thumbnailUrl || null,
			};

			const response = await fetch(`/api/balvidhya/${balvidhyaId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSave),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update content");
			}

			const updatedBalvidhya = await response.json();

			setBalvidhya(updatedBalvidhya);
			setEditedBalvidhya(updatedBalvidhya);
			setIsEditing(false);

			toast.dismiss(loadingToast);
			toast.success("Content updated successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to update content"
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
			formData.append("contentId", balvidhyaId);

			const response = await fetch("/api/upload/content-image", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to upload image");
			}

			const { imageUrl } = await response.json();

			setEditedBalvidhya((prev) =>
				prev ? { ...prev, thumbnailUrl: imageUrl } : null
			);
			setImageError(false);

			toast.dismiss(loadingToast);
			toast.success("Thumbnail updated successfully!");
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(
				error instanceof Error ? error.message : "Failed to upload image"
			);
		} finally {
			setIsUploadingImage(false);
		}
	};

	// Remove thumbnail function
	const handleRemoveImage = () => {
		setEditedBalvidhya((prev) =>
			prev ? { ...prev, thumbnailUrl: undefined } : null
		);
		setImageError(false);
		toast.success("Thumbnail removed");
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

	const getStatusColor = (status: string) => {
		if (status === "Active") return "bg-green-100 text-green-800";
		if (status === "Draft") return "bg-yellow-100 text-yellow-800";
		return "bg-red-100 text-red-800"; // Inactive
	};

	// Function to get icon based on type
	const getTypeIcon = (type: string) => {
		switch (type) {
			case "Video":
				return <Play className="h-3.5 w-3.5" />;
			case "Book":
				return <BookOpen className="h-3.5 w-3.5" />;
			case "Audio":
			case "Podcast":
				return <Play className="h-3.5 w-3.5" />;
			default:
				return <ImageIcon className="h-3.5 w-3.5" />;
		}
	};

	return (
		<div className="p-6 space-y-6">
			{/* Header with back button and title */}
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/balvidhya")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Content Details</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Left sidebar - Content Profile Card */}
				<Card className="md:col-span-1 h-fit">
					<CardHeader className="text-center p-4 pb-2">
						{/* Thumbnail with upload functionality */}
						<div className="relative w-20 h-20 mx-auto mb-3">
							<div className="w-full h-full rounded-lg bg-muted flex items-center justify-center overflow-hidden">
								{(isEditing
									? editedBalvidhya?.thumbnailUrl
									: balvidhya?.thumbnailUrl) && !imageError ? (
									<Image
										src={
											isEditing
												? editedBalvidhya?.thumbnailUrl!
												: balvidhya?.thumbnailUrl!
										}
										alt={
											isEditing
												? editedBalvidhya?.name || "Content"
												: balvidhya?.name || "Content"
										}
										width={80}
										height={80}
										className="w-full h-full rounded-lg object-cover"
										onError={() => setImageError(true)}
										unoptimized={true}
									/>
								) : (
									<ImageIcon className="h-10 w-10 text-muted-foreground" />
								)}
							</div>

							{/* Upload overlay - only shown in edit mode */}
							{isEditing && (
								<div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group">
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
							{isEditing && !editedBalvidhya?.thumbnailUrl && !imageError && (
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
							{isEditing && editedBalvidhya?.thumbnailUrl && !imageError && (
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
							{balvidhya?.name}
						</CardTitle>

						{/* Status and trending badges */}
						<CardDescription className="flex flex-wrap justify-center items-center gap-1.5">
							<span
								className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
									balvidhya
										? getStatusColor(balvidhya.status)
										: "bg-red-100 text-red-800"
								}`}
							>
								{balvidhya?.status || "Unknown"}
							</span>
							{balvidhya?.trending && (
								<span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
									<TrendingUp className="h-2.5 w-2.5" />
									Trending
								</span>
							)}
						</CardDescription>
					</CardHeader>

					{/* Content information */}
					<CardContent className="space-y-3 p-4 pt-0">
						{/* Type and category display */}
						<div className="pt-2 space-y-2">
							<div className="flex items-center gap-2 text-sm">
								{getTypeIcon(balvidhya?.type || "")}
								<div className="flex-1">
									<span className="text-xs text-muted-foreground">Type: </span>
									<span
										className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
											balvidhya?.type || ""
										)} w-20`}
									>
										{balvidhya?.type || "Not specified"}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
								<div className="flex-1">
									<span className="text-xs text-muted-foreground">
										Category:{" "}
									</span>
									<span
										className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
											balvidhya?.category || ""
										)} w-20`}
									>
										{balvidhya?.category || "Not specified"}
									</span>
								</div>
							</div>
						</div>

						{/* Date information */}
						<div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
							<Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
							<div>
								<div>
									Added:{" "}
									{balvidhya?.dateAdded
										? formatDate(balvidhya.dateAdded.toString())
										: "N/A"}
								</div>
								{balvidhya?.updatedAt && (
									<div>
										Updated: {formatDate(balvidhya.updatedAt.toString())}
									</div>
								)}
							</div>
						</div>
					</CardContent>

					{/* Edit/Cancel button */}
					<CardFooter className="p-4 pt-0">
						<Button
							className="w-full text-sm h-8"
							variant={isEditing ? "outline" : "default"}
							onClick={() => setIsEditing(!isEditing)}
						>
							{isEditing ? "Cancel" : "Edit Content"}
						</Button>
					</CardFooter>
				</Card>

				{/* Right side - Tabbed content area */}
				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid grid-cols-3 mb-4">
							<TabsTrigger value="details">Content Details</TabsTrigger>
							<TabsTrigger value="preferences">Settings</TabsTrigger>
							<TabsTrigger value="activity">Activity Log</TabsTrigger>
						</TabsList>

						{/* Main details tab */}
						<TabsContent value="details" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Content Information</CardTitle>
									<CardDescription>
										Update content details and metadata.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{isEditing ? (
										<>
											{/* Edit mode - Form fields */}
											<div className="space-y-4">
												{/* Content Name */}
												<div className="space-y-2">
													<Label htmlFor="name">Content Name *</Label>
													<Input
														id="name"
														value={editedBalvidhya?.name || ""}
														onChange={(e) =>
															setEditedBalvidhya({
																...editedBalvidhya,
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

												{/* Description */}
												<div className="space-y-2">
													<Label htmlFor="description">Description *</Label>
													<Textarea
														id="description"
														value={editedBalvidhya?.description || ""}
														onChange={(e) =>
															setEditedBalvidhya({
																...editedBalvidhya,
																description: e.target.value,
															})
														}
														rows={4}
														className={
															errors.description ? "border-red-500" : ""
														}
													/>
													{errors.description && (
														<p className="text-sm text-red-500">
															{errors.description}
														</p>
													)}
													<p className="text-xs text-gray-500">
														{(editedBalvidhya?.description || "").length}/500
														characters
													</p>
												</div>

												{/* Type and Category */}
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label htmlFor="type">Content Type *</Label>
														<Select
															value={editedBalvidhya?.type || ""}
															onValueChange={(value) =>
																setEditedBalvidhya({
																	...editedBalvidhya,
																	type: value,
																})
															}
														>
															<SelectTrigger
																id="type"
																className={errors.type ? "border-red-500" : ""}
															>
																<SelectValue placeholder="Select content type" />
															</SelectTrigger>
															<SelectContent>
																{balvidhyaTypes.map((type) => (
																	<SelectItem key={type} value={type}>
																		{type}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														{errors.type && (
															<p className="text-sm text-red-500">
																{errors.type}
															</p>
														)}
													</div>

													<div className="space-y-2">
														<Label htmlFor="category">Category *</Label>
														<Select
															value={editedBalvidhya?.category || ""}
															onValueChange={(value) =>
																setEditedBalvidhya({
																	...editedBalvidhya,
																	category: value,
																})
															}
														>
															<SelectTrigger
																id="category"
																className={
																	errors.category ? "border-red-500" : ""
																}
															>
																<SelectValue placeholder="Select category" />
															</SelectTrigger>
															<SelectContent>
																{balvidhyaCategories.map((category) => (
																	<SelectItem key={category} value={category}>
																		{category}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														{errors.category && (
															<p className="text-sm text-red-500">
																{errors.category}
															</p>
														)}
													</div>
												</div>

												{/* Thumbnail URL */}
												<div className="space-y-2">
													<Label htmlFor="thumbnailUrl">
														Thumbnail URL (Optional)
													</Label>
													<Input
														id="thumbnailUrl"
														type="url"
														value={editedBalvidhya?.thumbnailUrl || ""}
														onChange={(e) =>
															setEditedBalvidhya({
																...editedBalvidhya,
																thumbnailUrl: e.target.value,
															})
														}
														placeholder="https://example.com/image.jpg"
														className={
															errors.thumbnailUrl ? "border-red-500" : ""
														}
													/>
													{errors.thumbnailUrl && (
														<p className="text-sm text-red-500">
															{errors.thumbnailUrl}
														</p>
													)}
													<p className="text-xs text-gray-500">
														Provide a direct link to the content thumbnail image
													</p>
												</div>

												{/* Status and Trending */}
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label htmlFor="status">Status *</Label>
														<Select
															value={editedBalvidhya?.status || ""}
															onValueChange={(value) =>
																setEditedBalvidhya({
																	...editedBalvidhya,
																	status: value,
																})
															}
														>
															<SelectTrigger id="status">
																<SelectValue placeholder="Select status" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="Active">Active</SelectItem>
																<SelectItem value="Inactive">
																	Inactive
																</SelectItem>
																<SelectItem value="Draft">Draft</SelectItem>
															</SelectContent>
														</Select>
													</div>

													<div className="space-y-2">
														<Label className="text-sm font-medium">
															Content Settings
														</Label>
														<div className="flex items-center space-x-2 py-2">
															<input
																type="checkbox"
																id="trending"
																checked={editedBalvidhya?.trending || false}
																onChange={(e) =>
																	setEditedBalvidhya({
																		...editedBalvidhya,
																		trending: e.target.checked,
																	})
																}
																className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
															/>
															<Label
																htmlFor="trending"
																className="text-sm font-medium text-gray-700"
															>
																Mark as Trending
															</Label>
														</div>
													</div>
												</div>
											</div>
										</>
									) : (
										// View mode - Display data
										<div className="space-y-6">
											{/* Content information grid */}
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Content Name
													</h3>
													<p className="font-medium text-foreground">
														{balvidhya?.name}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Type
													</h3>
													<span
														className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(
															balvidhya?.type || ""
														)}`}
													>
														{getTypeIcon(balvidhya?.type || "")}
														{balvidhya?.type || "Not specified"}
													</span>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Category
													</h3>
													<span
														className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(
															balvidhya?.category || ""
														)}`}
													>
														{balvidhya?.category || "Not specified"}
													</span>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Status
													</h3>
													<span
														className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
															balvidhya?.status || ""
														)}`}
													>
														{balvidhya?.status || "Unknown"}
													</span>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Trending
													</h3>
													<span
														className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
															balvidhya?.trending
																? "bg-orange-100 text-orange-800"
																: "bg-gray-100 text-gray-800"
														}`}
													>
														{balvidhya?.trending ? (
															<>
																<TrendingUp className="h-3 w-3" />
																Trending
															</>
														) : (
															"Normal"
														)}
													</span>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Date Added
													</h3>
													<p className="font-medium text-foreground">
														{balvidhya?.dateAdded
															? formatDate(balvidhya.dateAdded)
															: "N/A"}
													</p>
												</div>
											</div>

											{/* Description section */}
											<div className="space-y-2 pt-2 border-t border-border">
												<h3 className="text-sm font-medium text-muted-foreground">
													Description
												</h3>
												<p className="font-medium text-foreground whitespace-pre-wrap">
													{balvidhya?.description || "No description provided"}
												</p>
											</div>

											{/* Thumbnail section */}
											{balvidhya?.thumbnailUrl && (
												<div className="space-y-2 pt-2 border-t border-border">
													<h3 className="text-sm font-medium text-muted-foreground">
														Thumbnail
													</h3>
													<div className="w-32 h-20 rounded-lg overflow-hidden border">
														<Image
															src={balvidhya.thumbnailUrl}
															alt={balvidhya.name}
															width={128}
															height={80}
															className="w-full h-full object-cover"
															unoptimized={true}
														/>
													</div>
												</div>
											)}
										</div>
									)}
								</CardContent>
								{/* Save button - only shown in edit mode */}
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

						{/* Settings tab */}
						<TabsContent value="preferences" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Content Settings</CardTitle>
									<CardDescription>
										Manage content visibility and notification settings.
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
															editedBalvidhya?.preferences?.notifications ||
															false
														}
														onChange={(e) =>
															setEditedBalvidhya((prev) =>
																prev
																	? {
																			...prev,
																			preferences: {
																				...prev.preferences,
																				notifications: e.target.checked,
																				language:
																					prev.preferences?.language ||
																					"English",
																				newsletter:
																					prev.preferences?.newsletter || false,
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
														Include in Newsletter
													</Label>
													<input
														type="checkbox"
														id="newsletter"
														checked={
															editedBalvidhya?.preferences?.newsletter || false
														}
														onChange={(e) =>
															setEditedBalvidhya((prev) =>
																prev
																	? {
																			...prev,
																			preferences: {
																				...prev.preferences,
																				newsletter: e.target.checked,
																				language:
																					prev.preferences?.language ||
																					"English",
																				notifications:
																					prev.preferences?.notifications ||
																					false,
																			},
																	  }
																	: null
															)
														}
														className="h-4 w-4"
													/>
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
															{balvidhya?.preferences?.notifications
																? "Enabled"
																: "Disabled"}
														</p>
													</div>
													<div>
														<h3 className="text-sm text-muted-foreground">
															Newsletter
														</h3>
														<p className="font-medium">
															{balvidhya?.preferences?.newsletter
																? "Included"
																: "Not Included"}
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
											Save Settings
										</Button>
									</CardFooter>
								)}
							</Card>
						</TabsContent>

						{/* Activity log tab */}
						<TabsContent value="activity" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Activity Log</CardTitle>
									<CardDescription>
										Recent content activities and updates.
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
