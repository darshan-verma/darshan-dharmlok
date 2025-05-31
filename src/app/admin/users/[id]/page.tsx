"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Save,
	User,
	Phone,
	Mail,
	Calendar,
	MapPin,
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
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { toast } from "@/lib/toast";

interface Activity {
	date: string;
	action: string;
}

interface UserPreferences {
	notifications: boolean;
	newsletter: boolean;
	language: string;
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
	address?: string;
	city?: string;
	state?: string;
	country?: string;
	social?: number;
	active?: number;
	rank?: number;
	pincode?: string;
	availability?: number;
	kycApproved?: number;
	status?: string;
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
	address?: string;
}

export default function UserDetailPage() {
	const params = useParams();
	const router = useRouter();
	const userId = params.id as string;

	const [user, setUser] = useState<User | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedUser, setEditedUser] = useState<Partial<User> | null>(null);
	const [imageError, setImageError] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});

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
					address: userData.address || "",
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
					address: "123 Test Street",
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

		if (!userData.address?.trim()) {
			newErrors.address = "Address is required";
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
				address: editedUser.address,
				bio: editedUser.bio || null,
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
			setIsEditing(false);
			toast.dismiss(loadingToast);
			toast.success("User details updated successfully!");
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
				{/* User Profile Card */}
				<Card className="md:col-span-1">
					<CardHeader className="text-center">
						<div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
							{user?.profileImageUrl && !imageError ? (
								<Image
									src={user.profileImageUrl}
									alt={user.name}
									width={96}
									height={96}
									className="w-full h-full rounded-full object-cover"
									onError={() => setImageError(true)}
									unoptimized={true} // Only needed if using external URLs
								/>
							) : (
								<User className="h-12 w-12 text-muted-foreground" />
							)}
						</div>
						<CardTitle className="text-center">{user?.name}</CardTitle>
						<CardDescription className="flex flex-wrap justify-center items-center gap-2">
							<span
								className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
									user ? getUserStatus(user) : "Inactive"
								)}`}
							>
								{user ? getUserStatus(user) : "Inactive"}
							</span>
							{user?.userType && (
								<span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
									{user.userType}
								</span>
							)}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<Phone className="h-4 w-4 text-muted-foreground" />
							<span>{user?.phone}</span>
						</div>
						<div className="flex items-center gap-3">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<span>{user?.email}</span>
						</div>
						<div className="flex items-center gap-3">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span>
								Created At:{" "}
								{user?.createdAt
									? formatDate(user.createdAt.toString())
									: "N/A"}
							</span>
						</div>
						<div className="flex items-center gap-3">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span>
								Last Active:{" "}
								{user?.lastActiveAt
									? formatDate(user.lastActiveAt.toString())
									: "N/A"}
								{user?.isLoggedIn && " (Now)"}
							</span>
						</div>
						{user?.isLoggedIn && user?.lastLoginAt && (
							<div className="flex items-center gap-3">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span>
									Logged In: {formatDate(user.lastLoginAt.toString())}
								</span>
							</div>
						)}
						{!user?.isLoggedIn && user?.lastLogoutAt && (
							<div className="flex items-center gap-3">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span>
									Logged Out: {formatDate(user.lastLogoutAt.toString())}
								</span>
							</div>
						)}
						<div className="flex items-center gap-3">
							<MapPin className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">{user?.address}</span>
						</div>
					</CardContent>
					<CardFooter>
						<Button
							className="w-full"
							variant={isEditing ? "outline" : "default"}
							onClick={() => setIsEditing(!isEditing)}
						>
							{isEditing ? "Cancel Editing" : "Edit User"}
						</Button>
					</CardFooter>
				</Card>

				{/* Tabs Section */}
				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid grid-cols-3 mb-4">
							<TabsTrigger value="details">User Details</TabsTrigger>
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="activity">Activity Log</TabsTrigger>
						</TabsList>

						<TabsContent value="details" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Personal Information</CardTitle>
									<CardDescription>
										Update user&apos;s personal details and contact information.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{isEditing ? (
										<>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="name">Full Name</Label>
													<Input
														id="name"
														value={editedUser?.name || ""}
														onChange={(e) =>
															setEditedUser({
																...editedUser,
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
												<div className="space-y-2">
													<Label htmlFor="email">Email</Label>
													<Input
														id="email"
														type="email"
														value={editedUser?.email || ""}
														onChange={(e) =>
															setEditedUser({
																...editedUser,
																email: e.target.value,
															})
														}
														className={errors.email ? "border-red-500" : ""}
													/>
													{errors.email && (
														<p className="text-sm text-red-500">
															{errors.email}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="phone">Phone</Label>
													<div className="relative">
														<Input
															id="phone"
															type="tel"
															value={editedUser?.phone || ""}
															onChange={(e) => {
																// Format the input value
																const formatted = formatPhoneNumber(
																	e.target.value
																);
																setEditedUser({
																	...editedUser,
																	phone: formatted,
																});
																// Clear error when typing
																if (errors.phone) {
																	setErrors({
																		...errors,
																		phone: undefined,
																	});
																}
															}}
															placeholder="+91 9876543210"
															className={`pl-12 ${
																errors.phone ? "border-red-500" : ""
															}`}
														/>
														<span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
															+91
														</span>
													</div>
													{errors.phone && (
														<p className="text-sm text-red-500">
															{errors.phone}
														</p>
													)}
												</div>
												{/* <div className="space-y-2">
													<Label htmlFor="userType">User Type</Label>
													<Select
														value={editedUser?.userType}
														onValueChange={(value) =>
															setEditedUser({
																...editedUser,
																userType: value,
															})
														}
													>
														<SelectTrigger id="userType">
															<SelectValue placeholder="Select userType" />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																<SelectItem value="User">User</SelectItem>
																<SelectItem value="Vendor">Vendor</SelectItem>
																<SelectItem value="Kathavachak">
																	Kathavachak
																</SelectItem>
																<SelectItem value="Dharmguru">
																	Dharmguru
																</SelectItem>
																<SelectItem value="Seller">Seller</SelectItem>
																<SelectItem value="Hotel/Dharamshala">
																	Hotel/Dharamshala
																</SelectItem>
																<SelectItem value="Pandit Ji">
																	Pandit Ji
																</SelectItem>
															</SelectGroup>
														</SelectContent>
													</Select>
												</div> */}
											</div>
											<div className="space-y-2">
												<Label htmlFor="address">Address</Label>
												<Input
													id="address"
													value={editedUser?.address || ""}
													onChange={(e) =>
														setEditedUser({
															...editedUser,
															address: e.target.value,
														})
													}
													className={errors.address ? "border-red-500" : ""}
												/>
												{errors.address && (
													<p className="text-sm text-red-500">
														{errors.address}
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="bio">Bio</Label>
												<Textarea
													id="bio"
													value={editedUser?.bio || ""}
													onChange={(e) =>
														setEditedUser({
															...editedUser,
															bio: e.target.value,
														})
													}
													rows={4}
													placeholder="Tell us about yourself"
												/>
											</div>
										</>
									) : (
										<div className="space-y-6">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Full Name
													</h3>
													<p className="font-medium text-foreground">
														{user?.name}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Email
													</h3>
													<p className="font-medium text-foreground">
														{user?.email}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Phone
													</h3>
													<p className="font-medium text-foreground">
														{user?.phone}
													</p>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														User Type
													</h3>
													<div className="flex items-center">
														<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
															{user?.userType || "Not specified"}
														</span>
													</div>
												</div>
												<div className="space-y-2">
													<h3 className="text-sm font-medium text-muted-foreground">
														Status
													</h3>
													<div className="flex items-center">
														<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
															{user?.status || "Not specified"}
														</span>
													</div>
												</div>
											</div>

											<div className="space-y-2 pt-2 border-t border-border">
												<h3 className="text-sm font-medium text-muted-foreground">
													Address
												</h3>
												<p className="font-medium text-foreground">
													{user?.address || "No address provided"}
												</p>
											</div>

											<div className="space-y-2 pt-2 border-t border-border">
												<h3 className="text-sm font-medium text-muted-foreground">
													Bio
												</h3>
												<p className="font-medium text-foreground whitespace-pre-wrap">
													{user?.bio || "No bio provided"}
												</p>
											</div>
										</div>
									)}
								</CardContent>
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

						<TabsContent value="preferences" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>User Preferences</CardTitle>
									<CardDescription>
										Manage notification settings and user preferences.
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
															editedUser?.preferences?.notifications || false
														}
														onChange={(e) =>
															setEditedUser((prev) =>
																prev
																	? {
																			...prev,
																			preferences: {
																				...prev.preferences,
																				notifications: e.target.checked,
																				language: e.target.value,
																				newsletter: e.target.checked,
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
														Subscribe to Newsletter
													</Label>
													<input
														type="checkbox"
														id="newsletter"
														checked={
															editedUser?.preferences?.newsletter || false
														}
														onChange={(e) =>
															setEditedUser((prev) =>
																prev
																	? {
																			...prev,
																			preferences: {
																				...prev.preferences,
																				notifications: e.target.checked,
																				language: e.target.value,
																				newsletter: e.target.checked,
																			},
																	  }
																	: null
															)
														}
														className="h-4 w-4"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="language">Preferred Language</Label>
													<Select
														value={editedUser?.preferences?.language || ""}
														onValueChange={(value) =>
															setEditedUser((prev) =>
																prev
																	? {
																			...prev,
																			preferences: {
																				...prev.preferences,
																				language: value,
																				notifications:
																					prev.preferences?.notifications ??
																					false, // Provide default value
																				newsletter:
																					prev.preferences?.newsletter ?? false, // Provide default value
																			},
																	  }
																	: null
															)
														}
													>
														<SelectTrigger id="language">
															<SelectValue placeholder="Select language" />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																<SelectItem value="Hindi">Hindi</SelectItem>
																<SelectItem value="English">English</SelectItem>
																<SelectItem value="Sanskrit">
																	Sanskrit
																</SelectItem>
																<SelectItem value="Tamil">Tamil</SelectItem>
																<SelectItem value="Bengali">Bengali</SelectItem>
															</SelectGroup>
														</SelectContent>
													</Select>
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
															{user?.preferences?.notifications
																? "Enabled"
																: "Disabled"}
														</p>
													</div>
													<div>
														<h3 className="text-sm text-muted-foreground">
															Newsletter
														</h3>
														<p className="font-medium">
															{user?.preferences?.newsletter
																? "Subscribed"
																: "Not Subscribed"}
														</p>
													</div>
													<div>
														<h3 className="text-sm text-muted-foreground">
															Preferred Language
														</h3>
														<p className="font-medium">
															{user?.preferences?.language}
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
											Save Preferences
										</Button>
									</CardFooter>
								)}
							</Card>
						</TabsContent>

						<TabsContent value="activity" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Activity Log</CardTitle>
									<CardDescription>
										Recent user activities and interactions.
									</CardDescription>
								</CardHeader>
								{/* <CardContent>
									<div className="space-y-4">
										{user?.activities.map(
											(activity: Activity, index: number) => (
												<div
													key={index}
													className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
												>
													<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
														<Calendar className="h-4 w-4 text-primary" />
													</div>
													<div>
														<p className="font-medium">{activity.action}</p>
														<p className="text-sm text-muted-foreground">
															{formatDate(activity.date)}
														</p>
													</div>
												</div>
											)
										)}
									</div>
								</CardContent> */}
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
