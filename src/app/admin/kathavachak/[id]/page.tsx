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
	BookOpen,
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

// Mock kathavachak data - in a real app, you would fetch this from an API
const mockKathavachakDetails = {
	"1": {
		id: "1",
		name: "Pandit Ramesh Sharma",
		category: "Bhagavad Gita",
		phone: "+91 9876543210",
		email: "ramesh.sharma@gmail.com",
		status: "Active",
		rank: "Senior",
		address: "123 Ganga Nagar, New Delhi, 110001",
		joinedDate: "2023-05-15",
		lastActive: "2023-06-24T08:30:00",
		avatar: "/avatars/ramesh.jpg",
		bio: "Experienced Kathavachak with 15 years of expertise in Bhagavad Gita discourses. Has conducted over 200 sessions across India.",
		preferences: {
			notifications: true,
			newsletter: true,
			language: "Hindi",
		},
		activities: [
			{ date: "2023-06-20", action: "Conducted Gita session" },
			{ date: "2023-06-15", action: "Published new article" },
			{ date: "2023-06-10", action: "Attended Dharma conference" },
		],
	},
	"2": {
		id: "2",
		name: "Acharya Priya Joshi",
		category: "Ramayana",
		phone: "+91 8765432109",
		email: "priya.joshi@gmail.com",
		status: "Active",
		rank: "Expert",
		address: "456 Krishna Colony, Mumbai, 400001",
		joinedDate: "2023-04-10",
		lastActive: "2023-06-22T14:15:00",
		avatar: "/avatars/priya.jpg",
		bio: "Renowned Ramayana expert with deep knowledge of ancient texts and interpretations. Popular speaker at cultural and religious events.",
		preferences: {
			notifications: true,
			newsletter: false,
			language: "English",
		},
		activities: [
			{ date: "2023-06-18", action: "Conducted Ramayana workshop" },
			{ date: "2023-06-05", action: "Released audio lecture series" },
			{ date: "2023-05-25", action: "Participated in panel discussion" },
		],
	},
	"3": {
		id: "3",
		name: "Swami Amit Trivedi",
		category: "Vedas",
		phone: "+91 7654321098",
		email: "amit.trivedi@gmail.com",
		status: "Inactive",
		rank: "Master",
		address: "789 Ram Nagar, Bangalore, 560001",
		joinedDate: "2023-03-22",
		lastActive: "2023-05-10T11:45:00",
		avatar: "/avatars/amit.jpg",
		bio: "Vedic scholar with extensive knowledge of Sanskrit and ancient texts. Has authored several books on Vedic philosophy and practices.",
		preferences: {
			notifications: false,
			newsletter: true,
			language: "Sanskrit",
		},
		activities: [
			{ date: "2023-05-08", action: "Published research paper" },
			{ date: "2023-04-30", action: "Conducted Vedic chanting workshop" },
			{ date: "2023-04-15", action: "Gave interview for documentary" },
		],
	},
	"4": {
		id: "4",
		name: "Pandit Deepika Singh",
		category: "Puranas",
		phone: "+91 6543210987",
		email: "deepika.singh@gmail.com",
		status: "Active",
		rank: "Senior",
		address: "321 Shiva Lane, Chennai, 600001",
		joinedDate: "2023-02-14",
		lastActive: "2023-06-23T16:20:00",
		avatar: "/avatars/deepika.jpg",
		bio: "Specialist in Puranic literature with a focus on Shiva Purana and Bhagavata Purana. Known for engaging storytelling style.",
		preferences: {
			notifications: true,
			newsletter: true,
			language: "Tamil",
		},
		activities: [
			{ date: "2023-06-20", action: "Conducted Purana discourse series" },
			{ date: "2023-06-12", action: "Released new book" },
			{ date: "2023-06-01", action: "Organized youth workshop" },
		],
	},
	"5": {
		id: "5",
		name: "Acharya Vikram Mehta",
		category: "Upanishads",
		phone: "+91 5432109876",
		email: "vikram.mehta@gmail.com",
		status: "Inactive",
		rank: "Junior",
		address: "654 Hanuman Road, Jaipur, 302001",
		joinedDate: "2023-01-30",
		lastActive: "2023-04-15T09:10:00",
		avatar: "/avatars/vikram.jpg",
		bio: "Emerging scholar of Upanishadic philosophy with modern interpretations. Specializes in making ancient wisdom accessible to contemporary audiences.",
		preferences: {
			notifications: false,
			newsletter: false,
			language: "English",
		},
		activities: [
			{ date: "2023-04-12", action: "Started online course" },
			{ date: "2023-03-28", action: "Gave lecture at university" },
			{ date: "2023-03-10", action: "Published article in journal" },
		],
	},
};

// Categories for Kathavachaks
const kathavachakCategories = [
	"Bhagavad Gita",
	"Ramayana",
	"Mahabharata",
	"Vedas",
	"Puranas",
	"Upanishads",
	"Bhakti Yoga",
	"Other",
];

// Ranks for Kathavachaks
const kathavachakRanks = ["Junior", "Senior", "Expert", "Master"];
interface Activity {
	date: string;
	action: string;
}
interface Kathavachak {
	id: string;
	name: string;
	email: string;
	phone: string;
	category: string;
	status: string;
	rank: string;
	address: string;
	joinedDate: string;
	avatar?: string;
	bio?: string;
	isApproved?: boolean;
	preferences: {
		notifications: boolean;
		newsletter: boolean;
		language: string;
	};
	activities: { date: string; action: string }[];
}

interface FormErrors {
	name?: string;
	email?: string;
	phone?: string;
	category?: string;
	address?: string;
	bio?: string;
}

export default function KathavachakDetailPage() {
	const params = useParams();
	const kathavachakId = params.id as string;
	const router = useRouter();

	const [kathavachak, setKathavachak] = useState<Kathavachak | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedKathavachak, setEditedKathavachak] =
		useState<Partial<Kathavachak> | null>(null);
	const [imageError, setImageError] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});

	const fetchKathavachakData = useCallback(() => {
		const loadingToast = toast.loading("Loading Kathavachak details...");
		try {
			// First check for detailed data in localStorage
			const detailedData = localStorage.getItem(`kathavachak_${kathavachakId}`);
			if (detailedData) {
				const kathavachakData = JSON.parse(detailedData);
				setKathavachak(kathavachakData);
				setEditedKathavachak({ ...kathavachakData });
				toast.dismiss(loadingToast);
				return;
			}

			// If no detailed data, check mock data
			let kathavachakData =
				mockKathavachakDetails[
					kathavachakId as keyof typeof mockKathavachakDetails
				];

			// If not found in mock data, check localStorage for basic data
			if (!kathavachakData && typeof window !== "undefined") {
				const savedKathavachaks = localStorage.getItem("kathavachaks");
				if (savedKathavachaks) {
					const allKathavachaks = JSON.parse(savedKathavachaks);
					kathavachakData = allKathavachaks.find(
						(k: Kathavachak) => k.id === kathavachakId
					);
				}
			}

			if (kathavachakData) {
				// Ensure preferences are properly initialized
				const kathavachakWithPreferences = {
					...kathavachakData,
					preferences: {
						notifications: kathavachakData.preferences?.notifications ?? true,
						newsletter: kathavachakData.preferences?.newsletter ?? true,
						language: kathavachakData.preferences?.language ?? "en",
					},
					activities: kathavachakData.activities || [],
					// Add any missing fields with default values
					address: kathavachakData.address || "",
					bio: kathavachakData.bio || "",
					joinedDate:
						kathavachakData.joinedDate ||
						new Date().toISOString().split("T")[0],
				};
				setKathavachak(kathavachakWithPreferences);
				setEditedKathavachak({ ...kathavachakWithPreferences });
			} else {
				// If kathavachak not found, redirect to kathavachaks list
				toast.dismiss(loadingToast);
				toast.error("Kathavachak not found");
				setTimeout(() => {
					router.push("/admin/kathavachak");
				}, 1500);
			}
		} catch {
			toast.dismiss(loadingToast);
			toast.error("Failed to load Kathavachak data");
			console.error("Error loading Kathavachak data:");
		}
	}, [kathavachakId, router]);

	useEffect(() => {
		fetchKathavachakData();
	}, [fetchKathavachakData]);

	const validateForm = (data: Partial<Kathavachak>): boolean => {
		const newErrors: FormErrors = {};

		if (!data.name?.trim()) {
			newErrors.name = "Name is required";
		}

		if (!data.email?.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(data.email)) {
			newErrors.email = "Email is invalid";
		}

		if (!data.phone?.trim()) {
			newErrors.phone = "Phone number is required";
		} else {
			const phoneRegex = /^(\+91[\s-]?)?[0-9]{10}$/;
			if (!phoneRegex.test(data.phone.replace(/[\s-]/g, ""))) {
				newErrors.phone =
					"Please enter a valid 10-digit phone number with optional +91 prefix";
			}
		}

		if (!data.category) {
			newErrors.category = "Category is required";
		}

		if (!data.address?.trim()) {
			newErrors.address = "Address is required";
		}

		if (!data.bio?.trim()) {
			newErrors.bio = "Bio is required";
		} else if (data.bio.length < 50) {
			newErrors.bio = "Bio should be at least 50 characters long";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSaveChanges = async () => {
		if (!editedKathavachak || !validateForm(editedKathavachak as Kathavachak)) {
			return;
		}

		setIsSaving(true);
		// Clear any existing toasts first
		toast.dismiss();
		const toastId = toast.loading("Saving changes...");

		try {
			// Prepare the simplified kathavachak data for the list view
			const simplifiedKathavachak = {
				id: editedKathavachak.id,
				name: editedKathavachak.name,
				category: editedKathavachak.category,
				phone: editedKathavachak.phone,
				email: editedKathavachak.email,
				status: editedKathavachak.status,
				rank: editedKathavachak.rank,
				isApproved: kathavachak?.isApproved || false, // Preserve the approval status
			};

			// Update the kathavachak in localStorage
			if (typeof window !== "undefined") {
				const savedKathavachaks = localStorage.getItem("kathavachaks");
				let allKathavachaks = [];

				if (savedKathavachaks) {
					allKathavachaks = JSON.parse(savedKathavachaks);
					// Find the index of the kathavachak to update
					const index = allKathavachaks.findIndex(
						(k: Kathavachak) => k.id === kathavachakId
					);
					if (index !== -1) {
						// Update existing kathavachak
						allKathavachaks[index] = simplifiedKathavachak;
					} else {
						// Add new kathavachak if not found
						allKathavachaks.push(simplifiedKathavachak);
					}
				} else {
					allKathavachaks = [simplifiedKathavachak];
				}

				localStorage.setItem("kathavachaks", JSON.stringify(allKathavachaks));

				// Also save the detailed data in a separate key for the detail view
				localStorage.setItem(
					`kathavachak_${kathavachakId}`,
					JSON.stringify(editedKathavachak)
				);

				// Update the local state with the saved data
				setKathavachak(editedKathavachak as Kathavachak);
				setIsEditing(false);

				// Dismiss the loading toast and show success
				toast.dismiss(toastId);
				const successToast = toast.success(
					"Kathavachak details updated successfully!"
				);
				setTimeout(() => {
					toast.dismiss(successToast);
					router.push("/admin/kathavachak");
				}, 2000);
			}
		} catch {
			console.error("Error saving Kathavachak data");
			toast.dismiss(toastId);
			const errorToast = toast.error(
				"Failed to save changes. Please try again."
			);
			setTimeout(() => {
				toast.dismiss(errorToast);
			}, 2000);
		} finally {
			setIsSaving(false);
		}
	};
	const handleInputChange = (field: keyof Kathavachak, value: string) => {
		if (!editedKathavachak) return;
		setEditedKathavachak({
			...editedKathavachak,
			[field]: value,
		});
	};

	if (!kathavachak) {
		return (
			<div className="p-6 flex items-center justify-center min-h-screen">
				<p className="text-muted-foreground">Loading kathavachak details...</p>
			</div>
		);
	}

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
				<Card className="md:col-span-1">
					<CardHeader className="text-center">
						<div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
							{kathavachak.avatar && !imageError ? (
								<Image
									src={kathavachak.avatar}
									alt={kathavachak.name}
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
						<CardTitle>{kathavachak.name}</CardTitle>
						<CardDescription>
							<div className="flex flex-col gap-2 items-center">
								<span
									className={`px-2 py-1 rounded-full text-xs font-medium ${
										kathavachak.status === "Active"
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}
								>
									{kathavachak.status}
								</span>
								<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									{kathavachak.rank}
								</span>
							</div>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<BookOpen className="h-4 w-4 text-muted-foreground" />
							<span>{kathavachak.category}</span>
						</div>
						<div className="flex items-center gap-3">
							<Phone className="h-4 w-4 text-muted-foreground" />
							<span>{kathavachak.phone}</span>
						</div>
						<div className="flex items-center gap-3">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<span>{kathavachak.email}</span>
						</div>
						<div className="flex items-center gap-3">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span>Joined: {kathavachak.joinedDate}</span>
						</div>
						<div className="flex items-center gap-3">
							<MapPin className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">{kathavachak.address}</span>
						</div>
					</CardContent>
					<CardFooter>
						<Button
							className="w-full"
							variant={isEditing ? "outline" : "default"}
							onClick={() => setIsEditing(!isEditing)}
						>
							{isEditing ? "Cancel Editing" : "Edit Kathavachak"}
						</Button>
					</CardFooter>
				</Card>

				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="details">Details</TabsTrigger>
							<TabsTrigger value="activity">Activity</TabsTrigger>
						</TabsList>

						<TabsContent value="details">
							<Card>
								<CardHeader>
									<CardTitle>Personal Information</CardTitle>
									<CardDescription>
										Update kathavachak&apos;s personal details and contact
										information.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{isEditing ? (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="name">Full Name</Label>
												<Input
													id="name"
													value={editedKathavachak?.name || ""}
													onChange={(e) =>
														handleInputChange("name", e.target.value)
													}
													className={errors.name ? "border-red-500" : ""}
												/>
												{errors.name && (
													<p className="text-sm text-red-500">{errors.name}</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="email">Email</Label>
												<Input
													id="email"
													type="email"
													value={editedKathavachak?.email || ""}
													onChange={(e) =>
														handleInputChange("email", e.target.value)
													}
													className={errors.email ? "border-red-500" : ""}
												/>
												{errors.email && (
													<p className="text-sm text-red-500">{errors.email}</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="phone">Phone</Label>
												<Input
													id="phone"
													value={editedKathavachak?.phone || ""}
													onChange={(e) =>
														handleInputChange("phone", e.target.value)
													}
													className={errors.phone ? "border-red-500" : ""}
												/>
												{errors.phone && (
													<p className="text-sm text-red-500">{errors.phone}</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="category">Category</Label>
												<Select
													value={editedKathavachak?.category || ""}
													onValueChange={(value) =>
														handleInputChange("category", value)
													}
												>
													<SelectTrigger id="category">
														<SelectValue placeholder="Select category" />
													</SelectTrigger>
													<SelectContent>
														<SelectGroup>
															{kathavachakCategories.map((category) => (
																<SelectItem key={category} value={category}>
																	{category}
																</SelectItem>
															))}
														</SelectGroup>
													</SelectContent>
												</Select>
												{errors.category && (
													<p className="text-sm text-red-500">
														{errors.category}
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="rank">Rank</Label>
												<Select
													value={editedKathavachak?.rank || ""}
													onValueChange={(value) =>
														handleInputChange("rank", value)
													}
												>
													<SelectTrigger id="rank">
														<SelectValue placeholder="Select rank" />
													</SelectTrigger>
													<SelectContent>
														<SelectGroup>
															{kathavachakRanks.map((rank) => (
																<SelectItem key={rank} value={rank}>
																	{rank}
																</SelectItem>
															))}
														</SelectGroup>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="status">Status</Label>
												<Select
													value={editedKathavachak?.status || ""}
													onValueChange={(value) =>
														handleInputChange("status", value)
													}
												>
													<SelectTrigger id="status">
														<SelectValue placeholder="Select status" />
													</SelectTrigger>
													<SelectContent>
														<SelectGroup>
															<SelectItem value="Active">Active</SelectItem>
															<SelectItem value="Inactive">Inactive</SelectItem>
														</SelectGroup>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="address">Address</Label>
												<Input
													id="address"
													value={editedKathavachak?.address || ""}
													onChange={(e) =>
														handleInputChange("address", e.target.value)
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
													value={editedKathavachak?.bio || ""}
													onChange={(e) =>
														handleInputChange("bio", e.target.value)
													}
													className={errors.bio ? "border-red-500" : ""}
												/>
												{errors.bio && (
													<p className="text-sm text-red-500">{errors.bio}</p>
												)}
											</div>
										</div>
									) : (
										<div className="space-y-4">
											<div className="p-4 bg-muted/30 rounded-lg">
												<h3 className="font-medium mb-2">About</h3>
												<p className="text-muted-foreground">
													{kathavachak.bio}
												</p>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
												<div>
													<h3 className="text-sm text-muted-foreground">
														Full Name
													</h3>
													<p className="font-medium">{kathavachak.name}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Email
													</h3>
													<p className="font-medium">{kathavachak.email}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Phone
													</h3>
													<p className="font-medium">{kathavachak.phone}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Category
													</h3>
													<p className="font-medium">{kathavachak.category}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Rank
													</h3>
													<p className="font-medium">{kathavachak.rank}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Status
													</h3>
													<p className="font-medium">{kathavachak.status}</p>
												</div>
												<div className="md:col-span-2">
													<h3 className="text-sm text-muted-foreground">
														Address
													</h3>
													<p className="font-medium">{kathavachak.address}</p>
												</div>
											</div>
										</div>
									)}
								</CardContent>
								{isEditing && (
									<CardFooter className="flex justify-end gap-2">
										<Button
											variant="outline"
											onClick={() => setIsEditing(false)}
											disabled={isSaving}
										>
											Cancel
										</Button>
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

						<TabsContent value="activity">
							<Card>
								<CardHeader>
									<CardTitle>Activity Log</CardTitle>
									<CardDescription>
										Recent kathavachak activities and interactions.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{kathavachak?.activities?.length ? (
											kathavachak.activities.map(
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
																{activity.date}
															</p>
														</div>
													</div>
												)
											)
										) : (
											<p className="text-muted-foreground text-center py-4">
												No activities found
											</p>
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
