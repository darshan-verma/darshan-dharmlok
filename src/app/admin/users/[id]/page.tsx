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
	status: string;
	address: string;
	joinedDate: string;
	lastActive: string;
	avatar?: string;
	bio: string;
	preferences: UserPreferences;
	activities: Activity[];
}

interface FormErrors {
	name?: string;
	email?: string;
	phone?: string;
	address?: string;
}

// Mock user data - in a real app, you would fetch this from an API
const mockUserDetails: Record<string, User> = {
	"1": {
		id: "1",
		name: "Rahul Sharma",
		phone: "+91 9876543210",
		email: "rahul.sharma@gmail.com",
		status: "Active",
		address: "123 Ganga Nagar, New Delhi, 110001",
		joinedDate: "2023-05-15",
		lastActive: "2023-06-24T08:30:00",
		avatar: "/avatars/rahul.jpg",
		bio: "Passionate about spiritual growth and seeking knowledge about Hindu traditions.",
		preferences: {
			notifications: true,
			newsletter: true,
			language: "Hindi",
		},
		activities: [
			{ date: "2023-06-20", action: "Booked temple visit" },
			{ date: "2023-06-15", action: "Purchased e-book" },
			{ date: "2023-06-10", action: "Attended online puja" },
		],
	},
	"2": {
		id: "2",
		name: "Priya Patel",
		phone: "+91 8765432109",
		email: "priya.patel@gmail.com",
		status: "Active",
		address: "456 Krishna Colony, Mumbai, 400001",
		joinedDate: "2023-04-10",
		lastActive: "2023-06-22T14:15:00",
		avatar: "/avatars/priya.jpg",
		bio: "Yoga practitioner and devotee interested in ancient scriptures.",
		preferences: {
			notifications: true,
			newsletter: false,
			language: "English",
		},
		activities: [
			{ date: "2023-06-18", action: "Registered for event" },
			{ date: "2023-06-05", action: "Downloaded audio book" },
			{ date: "2023-05-25", action: "Made donation" },
		],
	},
	"3": {
		id: "3",
		name: "Amit Kumar",
		phone: "+91 7654321098",
		email: "amit.kumar@gmail.com",
		status: "Inactive",
		address: "789 Ram Nagar, Bangalore, 560001",
		joinedDate: "2023-03-22",
		lastActive: "2023-05-10T11:45:00",
		avatar: "/avatars/amit.jpg",
		bio: "Scholar of Vedic studies with interest in comparative religion.",
		preferences: {
			notifications: false,
			newsletter: true,
			language: "Sanskrit",
		},
		activities: [
			{ date: "2023-05-08", action: "Asked question to Dharmguru" },
			{ date: "2023-04-30", action: "Booked pooja" },
			{ date: "2023-04-15", action: "Updated profile" },
		],
	},
	"4": {
		id: "4",
		name: "Deepika Singh",
		phone: "+91 6543210987",
		email: "deepika.singh@gmail.com",
		status: "Active",
		address: "321 Shiva Lane, Chennai, 600001",
		joinedDate: "2023-02-14",
		lastActive: "2023-06-23T16:20:00",
		avatar: "/avatars/deepika.jpg",
		bio: "Temple architecture enthusiast and regular volunteer at charitable events.",
		preferences: {
			notifications: true,
			newsletter: true,
			language: "Tamil",
		},
		activities: [
			{ date: "2023-06-20", action: "Booked dharamshala stay" },
			{ date: "2023-06-12", action: "Shared article" },
			{ date: "2023-06-01", action: "Added temple review" },
		],
	},
	"5": {
		id: "5",
		name: "Vikram Mehta",
		phone: "+91 5432109876",
		email: "vikram.mehta@gmail.com",
		status: "Inactive",
		address: "654 Hanuman Road, Jaipur, 302001",
		joinedDate: "2023-01-30",
		lastActive: "2023-04-15T09:10:00",
		avatar: "/avatars/vikram.jpg",
		bio: "Business professional with interest in dharmic principles and management.",
		preferences: {
			notifications: false,
			newsletter: false,
			language: "English",
		},
		activities: [
			{ date: "2023-04-12", action: "Purchased merchandise" },
			{ date: "2023-03-28", action: "Registered complaint" },
			{ date: "2023-03-10", action: "Created account" },
		],
	},
};

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

	// Fix: Memoize the fetch function and add proper dependencies
	const fetchUserData = useCallback(() => {
		try {
			const loadingToast = toast.loading("Loading user details...");
			// In a real app, you would fetch user data from an API
			setTimeout(() => {
				const userData =
					mockUserDetails[userId as keyof typeof mockUserDetails];
				if (userData) {
					setUser(userData);
					setEditedUser({ ...userData });
					toast.dismiss(loadingToast);
				} else {
					toast.dismiss(loadingToast);
					toast.error("User not found");
					router.push("/admin/users");
				}
			}, 500);
		} catch (error) {
			console.error("Error loading user:", error);
			toast.error("Failed to load user details");
		}
	}, [userId, router]);

	// Fix: Call the memoized function
	useEffect(() => {
		fetchUserData();
	}, [fetchUserData]);

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
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// In a real app, you would save changes to the backend here
			setUser(editedUser as User);
			setIsEditing(false);

			toast.dismiss(loadingToast);
			toast.success("User details updated successfully!");
		} catch (error) {
			console.error("Error saving user:", error);
			toast.dismiss(loadingToast);
			toast.error("Failed to update user details");
		} finally {
			setIsSaving(false);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
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
							{user?.avatar && !imageError ? (
								<Image
									src={user.avatar}
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
						<CardTitle>{user?.name}</CardTitle>
						<CardDescription>
							<span
								className={`px-2 py-1 rounded-full text-xs font-medium ${
									user?.status === "Active"
										? "bg-green-100 text-green-800"
										: "bg-red-100 text-red-800"
								}`}
							>
								{user?.status}
							</span>
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
								Joined: {user?.joinedDate ? formatDate(user.joinedDate) : "N/A"}
							</span>
						</div>
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
												<div className="space-y-2">
													<Label htmlFor="status">Status</Label>
													<Select
														value={editedUser?.status}
														onValueChange={(value) =>
															setEditedUser({
																...editedUser,
																status: value,
															})
														}
													>
														<SelectTrigger id="status">
															<SelectValue placeholder="Select status" />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																<SelectItem value="Active">Active</SelectItem>
																<SelectItem value="Inactive">
																	Inactive
																</SelectItem>
															</SelectGroup>
														</SelectContent>
													</Select>
												</div>
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
												/>
											</div>
										</>
									) : (
										<div className="space-y-4">
											<div className="p-4 bg-muted/30 rounded-lg">
												<h3 className="font-medium mb-2">About</h3>
												<p className="text-muted-foreground">{user?.bio}</p>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
												<div>
													<h3 className="text-sm text-muted-foreground">
														Full Name
													</h3>
													<p className="font-medium">{user?.name}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Email
													</h3>
													<p className="font-medium">{user?.email}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Phone
													</h3>
													<p className="font-medium">{user?.phone}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Status
													</h3>
													<p className="font-medium">{user?.status}</p>
												</div>
												<div className="md:col-span-2">
													<h3 className="text-sm text-muted-foreground">
														Address
													</h3>
													<p className="font-medium">{user?.address}</p>
												</div>
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
								<CardContent>
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
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
