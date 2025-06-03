"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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
import { toast } from "@/lib/toast";

// Mock dharmguru data - in a real app, you would fetch this from an API
const mockDharmguruDetails = {
	"1": {
		id: "1",
		name: "Swami Anand Sharma",
		category: "Spiritual Guidance",
		phone: "+91 9876543210",
		email: "anand.sharma@gmail.com",
		status: "Active",
		rank: "Senior",
		address: "123 Ashram Road, Rishikesh, 249201",
		joinedDate: "2023-05-15",
		lastActive: "2023-06-24T08:30:00",
		avatar: "/avatars/anand.jpg",
		bio: "Experienced spiritual guide with 20 years of expertise in Vedantic philosophy. Has conducted over 300 workshops across India and abroad.",
		preferences: {
			notifications: true,
			newsletter: true,
			language: "Hindi",
		},
		activities: [
			{ date: "2023-06-20", action: "Conducted meditation workshop" },
			{ date: "2023-06-15", action: "Published new spiritual article" },
			{ date: "2023-06-10", action: "Attended Dharma conference" },
		],
	},
	"2": {
		id: "2",
		name: "Acharya Sunita Joshi",
		category: "Meditation",
		phone: "+91 8765432109",
		email: "sunita.joshi@gmail.com",
		status: "Active",
		rank: "Expert",
		address: "456 Shanti Nagar, Varanasi, 221001",
		joinedDate: "2023-04-10",
		lastActive: "2023-06-22T14:15:00",
		avatar: "/avatars/sunita.jpg",
		bio: "Meditation expert with deep knowledge of various meditation techniques. Specializes in mindfulness and transcendental meditation practices.",
		preferences: {
			notifications: true,
			newsletter: false,
			language: "English",
		},
		activities: [
			{ date: "2023-06-18", action: "Conducted meditation retreat" },
			{ date: "2023-06-05", action: "Released guided meditation series" },
			{ date: "2023-05-25", action: "Participated in wellness summit" },
		],
	},
	"3": {
		id: "3",
		name: "Guru Rajesh Trivedi",
		category: "Yoga",
		phone: "+91 7654321098",
		email: "rajesh.trivedi@gmail.com",
		status: "Inactive",
		rank: "Master",
		address: "789 Yoga Path, Mysore, 570001",
		joinedDate: "2023-03-22",
		lastActive: "2023-05-10T11:45:00",
		avatar: "/avatars/rajesh.jpg",
		bio: "Yoga master with expertise in Ashtanga and Hatha yoga. Has trained thousands of yoga practitioners and teachers worldwide.",
		preferences: {
			notifications: false,
			newsletter: true,
			language: "Sanskrit",
		},
		activities: [
			{ date: "2023-05-08", action: "Published yoga research paper" },
			{ date: "2023-04-30", action: "Conducted advanced asana workshop" },
			{ date: "2023-04-15", action: "Gave interview for yoga documentary" },
		],
	},
	"4": {
		id: "4",
		name: "Swamini Deepa Singh",
		category: "Vedanta",
		phone: "+91 6543210987",
		email: "deepa.singh@gmail.com",
		status: "Active",
		rank: "Senior",
		address: "321 Vedanta Bhavan, Haridwar, 249401",
		joinedDate: "2023-02-14",
		lastActive: "2023-06-23T16:20:00",
		avatar: "/avatars/deepa.jpg",
		bio: "Vedanta scholar with deep understanding of Advaita philosophy. Known for making complex philosophical concepts accessible to modern audiences.",
		preferences: {
			notifications: true,
			newsletter: true,
			language: "Hindi",
		},
		activities: [
			{ date: "2023-06-20", action: "Conducted Vedanta discourse series" },
			{ date: "2023-06-12", action: "Released new book on Advaita" },
			{ date: "2023-06-01", action: "Organized youth philosophy workshop" },
		],
	},
	"5": {
		id: "5",
		name: "Acharya Vikram Mehta",
		category: "Ayurveda",
		phone: "+91 5432109876",
		email: "vikram.mehta@gmail.com",
		status: "Inactive",
		rank: "Junior",
		address: "654 Ayush Marg, Jaipur, 302001",
		joinedDate: "2023-01-30",
		lastActive: "2023-04-15T09:10:00",
		avatar: "/avatars/vikram.jpg",
		bio: "Ayurvedic practitioner specializing in holistic wellness and natural remedies. Focuses on integrating ancient Ayurvedic wisdom with modern healthcare approaches.",
		preferences: {
			notifications: false,
			newsletter: false,
			language: "English",
		},
		activities: [
			{ date: "2023-04-12", action: "Started online Ayurveda course" },
			{ date: "2023-03-28", action: "Gave lecture at Ayurveda conference" },
			{ date: "2023-03-10", action: "Published article in wellness journal" },
		],
	},
};

// Categories for Dharmgurus
const dharmguruCategories = [
	"Spiritual Guidance",
	"Meditation",
	"Yoga",
	"Vedanta",
	"Ayurveda",
	"Astrology",
	"Life Coaching",
	"Other",
];

// Ranks for Dharmgurus
const dharmguruRanks = ["Junior", "Senior", "Expert", "Master"];

// Activity interface
interface Activity {
	date: string;
	action: string;
}

// Add Dharmguru interface
interface Dharmguru {
	id: string;
	name: string;
	email: string;
	phone: string;
	category: string;
	status: string;
	rank: string;
	address: string;
	joinedDate: string;
	isApproved?: boolean;
	avatar?: string;
	bio?: string;
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
	rank?: string;
	status?: string;
}

export default function DharmguruDetailPage() {
	const params = useParams();
	const router = useRouter();
	const dharmguruId = params.id as string;

	const [dharmguru, setDharmguru] = useState<Dharmguru | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedDharmguru, setEditedDharmguru] = useState<Dharmguru | null>(
		null
	);
	const [imageError, setImageError] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});

	// Memoize the fetch function and add proper dependencies
	const fetchDharmguruData = useCallback(() => {
		const loadingToast = toast.loading("Loading Dharmguru details...");
		try {
			// First check for detailed data in localStorage
			const detailedData = localStorage.getItem(`dharmguru_${dharmguruId}`);
			if (detailedData) {
				const dharmguruData = JSON.parse(detailedData);
				setDharmguru(dharmguruData);
				setEditedDharmguru({ ...dharmguruData });
				toast.dismiss(loadingToast);
				return;
			}

			// If no detailed data, check mock data
			let dharmguruData =
				mockDharmguruDetails[dharmguruId as keyof typeof mockDharmguruDetails];

			// If not found in mock data, check localStorage for basic data
			if (!dharmguruData && typeof window !== "undefined") {
				const savedDharmgurus = localStorage.getItem("dharmgurus");
				if (savedDharmgurus) {
					const allDharmgurus = JSON.parse(savedDharmgurus);
					dharmguruData = allDharmgurus.find(
						(d: Dharmguru) => d.id === dharmguruId
					);
				}
			}

			if (dharmguruData) {
				// Ensure preferences are properly initialized
				const dharmguruWithPreferences = {
					...dharmguruData,
					preferences: {
						notifications: dharmguruData.preferences?.notifications ?? true,
						newsletter: dharmguruData.preferences?.newsletter ?? true,
						language: dharmguruData.preferences?.language ?? "en",
					},
					activities: dharmguruData.activities || [],
					// Add any missing fields with default values
					address: dharmguruData.address || "",
					bio: dharmguruData.bio || "",
					joinedDate:
						dharmguruData.joinedDate || new Date().toISOString().split("T")[0],
				};
				setDharmguru(dharmguruWithPreferences);
				setEditedDharmguru({ ...dharmguruWithPreferences });
			} else {
				// If dharmguru not found, redirect to dharmgurus list
				toast.dismiss(loadingToast);
				toast.error("Dharmguru not found");
				setTimeout(() => {
					router.push("/admin/dharmguru");
				}, 1500);
			}
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error("Failed to load Dharmguru data");
			console.error("Error loading Dharmguru data:", error);
		}
	}, [dharmguruId, router]);

	// Call the memoized function
	useEffect(() => {
		fetchDharmguruData();
	}, [fetchDharmguruData]);

	const validateForm = (data: Partial<Dharmguru>): boolean => {
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

		if (!data.rank) {
			newErrors.rank = "Rank is required";
		}

		if (!data.address?.trim()) {
			newErrors.address = "Address is required";
		}

		if (!data.bio?.trim()) {
			newErrors.bio = "Bio is required";
		} else if (data.bio.length < 50) {
			newErrors.bio = "Bio should be at least 50 characters long";
		}

		if (!data.status) {
			newErrors.status = "Status is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSaveChanges = async () => {
		if (!editedDharmguru || !validateForm(editedDharmguru)) {
			return;
		}

		setIsSaving(true);
		const toastId = toast.loading("Saving changes...");

		try {
			// Prepare the simplified dharmguru data for the list view
			const simplifiedDharmguru = {
				id: editedDharmguru.id,
				name: editedDharmguru.name,
				category: editedDharmguru.category,
				phone: editedDharmguru.phone,
				email: editedDharmguru.email,
				status: editedDharmguru.status,
				rank: editedDharmguru.rank,
				isApproved: dharmguru?.isApproved || false, // Preserve the approval status
			};

			// Update the dharmguru in localStorage
			if (typeof window !== "undefined") {
				const savedDharmgurus = localStorage.getItem("dharmgurus");
				let allDharmgurus = [];

				if (savedDharmgurus) {
					allDharmgurus = JSON.parse(savedDharmgurus);
					// Find the index of the dharmguru to update
					const index = allDharmgurus.findIndex(
						(d: Dharmguru) => d.id === dharmguruId
					);
					if (index !== -1) {
						// Update existing dharmguru
						allDharmgurus[index] = simplifiedDharmguru;
					} else {
						// Add new dharmguru if not found
						allDharmgurus.push(simplifiedDharmguru);
					}
				} else {
					allDharmgurus = [simplifiedDharmguru];
				}

				localStorage.setItem("dharmgurus", JSON.stringify(allDharmgurus));

				// Also save the detailed data in a separate key for the detail view
				localStorage.setItem(
					`dharmguru_${dharmguruId}`,
					JSON.stringify(editedDharmguru)
				);

				// Update the local state with the saved data
				setDharmguru(editedDharmguru);
				setIsEditing(false);
				toast.dismiss(toastId);
				toast.success("Dharmguru details updated successfully!");

				// Redirect back to the list page
				router.push("/admin/dharmguru");
			}
		} catch (error) {
			console.error("Error saving Dharmguru data:", error);
			toast.dismiss(toastId);
			toast.error("Failed to save changes. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancelEdit = () => {
		if (dharmguru) {
			setEditedDharmguru({ ...dharmguru });
			setIsEditing(false);
			toast.info("Changes discarded");
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		if (!editedDharmguru) return;

		const { name, value } = e.target;
		setEditedDharmguru({
			...editedDharmguru,
			[name]: value,
		});
	};

	const handlePreferenceChange = (name: string, value: string | boolean) => {
		if (!editedDharmguru) return;

		setEditedDharmguru({
			...editedDharmguru,
			preferences: {
				...editedDharmguru.preferences,
				[name]: value,
			},
		});

		// Show feedback for preference changes
		if (typeof value === "boolean") {
			const preferenceName =
				name === "notifications" ? "Notifications" : "Newsletter";
			toast.info(`${preferenceName} ${value ? "enabled" : "disabled"}`);
		}
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return "Invalid date";
		return new Intl.DateTimeFormat("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		}).format(date);
	};

	if (!dharmguru) {
		return (
			<div className="p-6 flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
				<span className="ml-3">Loading dharmguru details...</span>
			</div>
		);
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
				{/* Dharmguru Profile Card */}
				<Card className="md:col-span-1">
					<CardHeader className="text-center">
						<div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
							{dharmguru.avatar && !imageError ? (
								<Image
									src={dharmguru.avatar}
									alt={dharmguru.name}
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
						<CardTitle>{dharmguru.name}</CardTitle>
						<CardDescription>
							<div className="flex flex-col gap-2 items-center">
								<span
									className={`px-2 py-1 rounded-full text-xs font-medium ${
										dharmguru.status === "Active"
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}
								>
									{dharmguru.status}
								</span>
								<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									{dharmguru.rank}
								</span>
							</div>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<BookOpen className="h-4 w-4 text-muted-foreground" />
							<span>{dharmguru.category}</span>
						</div>
						<div className="flex items-center gap-3">
							<Phone className="h-4 w-4 text-muted-foreground" />
							<span>{dharmguru.phone}</span>
						</div>
						<div className="flex items-center gap-3">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<span>{dharmguru.email}</span>
						</div>
						<div className="flex items-center gap-3">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span>Joined: {formatDate(dharmguru.joinedDate)}</span>
						</div>
						<div className="flex items-center gap-3">
							<MapPin className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">{dharmguru.address}</span>
						</div>
					</CardContent>
					<CardFooter>
						<Button
							className="w-full"
							variant={isEditing ? "outline" : "default"}
							onClick={() => setIsEditing(!isEditing)}
						>
							{isEditing ? "Cancel Editing" : "Edit Dharmguru"}
						</Button>
					</CardFooter>
				</Card>

				{/* Tabs Section */}
				<div className="md:col-span-2">
					<Tabs defaultValue="details">
						<TabsList className="grid grid-cols-3 mb-4">
							<TabsTrigger value="details">Dharmguru Details</TabsTrigger>
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="activity">Activity Log</TabsTrigger>
						</TabsList>

						<TabsContent value="details" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Personal Information</CardTitle>
									<CardDescription>
										Update dharmguru&apos;s personal details and contact
										information.
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
														name="name"
														value={editedDharmguru?.name || ""}
														onChange={handleInputChange}
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
														name="email"
														type="email"
														value={editedDharmguru?.email || ""}
														onChange={handleInputChange}
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
													<Input
														id="phone"
														name="phone"
														value={editedDharmguru?.phone || ""}
														onChange={handleInputChange}
														className={errors.phone ? "border-red-500" : ""}
													/>
													{errors.phone && (
														<p className="text-sm text-red-500">
															{errors.phone}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="category">Category</Label>
													<Select
														value={editedDharmguru?.category || ""}
														onValueChange={(value) =>
															setEditedDharmguru((prev) =>
																prev
																	? {
																			...prev,
																			category: value,
																	  }
																	: null
															)
														}
														// className={errors.category ? "border-red-500" : ""}
													>
														<SelectTrigger id="category">
															<SelectValue placeholder="Select category" />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																{dharmguruCategories.map((category) => (
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
														value={editedDharmguru?.rank || ""}
														onValueChange={(value) =>
															setEditedDharmguru((prev) =>
																prev
																	? {
																			...prev,
																			rank: value,
																	  }
																	: null
															)
														}
														// className={errors.rank ? "border-red-500" : ""}
													>
														<SelectTrigger id="rank">
															<SelectValue placeholder="Select rank" />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																{dharmguruRanks.map((rank) => (
																	<SelectItem key={rank} value={rank}>
																		{rank}
																	</SelectItem>
																))}
															</SelectGroup>
														</SelectContent>
													</Select>
													{errors.rank && (
														<p className="text-sm text-red-500">
															{errors.rank}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="status">Status</Label>
													<Select
														value={editedDharmguru?.status || ""}
														onValueChange={(value) =>
															setEditedDharmguru((prev) =>
																prev
																	? {
																			...prev,
																			status: value,
																	  }
																	: null
															)
														}
														// className={errors.status ? "border-red-500" : ""}
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
													{errors.status && (
														<p className="text-sm text-red-500">
															{errors.status}
														</p>
													)}
												</div>
											</div>
											<div className="space-y-2">
												<Label htmlFor="address">Address</Label>
												<Input
													id="address"
													name="address"
													value={editedDharmguru?.address || ""}
													onChange={handleInputChange}
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
													name="bio"
													value={editedDharmguru?.bio || ""}
													onChange={handleInputChange}
													rows={4}
													className={errors.bio ? "border-red-500" : ""}
												/>
												{errors.bio && (
													<p className="text-sm text-red-500">{errors.bio}</p>
												)}
											</div>
										</>
									) : (
										<div className="space-y-4">
											<div className="p-4 bg-muted/30 rounded-lg">
												<h3 className="font-medium mb-2">About</h3>
												<p className="text-muted-foreground">{dharmguru.bio}</p>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
												<div>
													<h3 className="text-sm text-muted-foreground">
														Full Name
													</h3>
													<p className="font-medium">{dharmguru.name}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Email
													</h3>
													<p className="font-medium">{dharmguru.email}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Phone
													</h3>
													<p className="font-medium">{dharmguru.phone}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Category
													</h3>
													<p className="font-medium">{dharmguru.category}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Rank
													</h3>
													<p className="font-medium">{dharmguru.rank}</p>
												</div>
												<div>
													<h3 className="text-sm text-muted-foreground">
														Status
													</h3>
													<p className="font-medium">{dharmguru.status}</p>
												</div>
												<div className="md:col-span-2">
													<h3 className="text-sm text-muted-foreground">
														Address
													</h3>
													<p className="font-medium">{dharmguru.address}</p>
												</div>
											</div>
										</div>
									)}
								</CardContent>
								{isEditing && (
									<CardFooter>
										<Button onClick={handleSaveChanges} className="w-full">
											<Save className="h-4 w-4 mr-2" />
											Save Changes
										</Button>
									</CardFooter>
								)}
							</Card>
						</TabsContent>

						<TabsContent value="preferences" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Dharmguru Preferences</CardTitle>
									<CardDescription>
										Manage notification settings and dharmguru preferences.
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
															editedDharmguru?.preferences.notifications ||
															false
														}
														onChange={(e) =>
															handlePreferenceChange(
																"notifications",
																e.target.checked
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
															editedDharmguru?.preferences.newsletter || false
														}
														onChange={(e) =>
															handlePreferenceChange(
																"newsletter",
																e.target.checked
															)
														}
														className="h-4 w-4"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="language">Preferred Language</Label>
													<Select
														value={editedDharmguru?.preferences.language || ""}
														onValueChange={(value) =>
															handlePreferenceChange("language", value)
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
															{dharmguru.preferences.notifications
																? "Enabled"
																: "Disabled"}
														</p>
													</div>
													<div>
														<h3 className="text-sm text-muted-foreground">
															Newsletter
														</h3>
														<p className="font-medium">
															{dharmguru.preferences.newsletter
																? "Subscribed"
																: "Not Subscribed"}
														</p>
													</div>
													<div>
														<h3 className="text-sm text-muted-foreground">
															Preferred Language
														</h3>
														<p className="font-medium">
															{dharmguru.preferences.language}
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
										Recent dharmguru activities and interactions.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{dharmguru.activities.map(
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
			<CardFooter className="flex justify-end gap-2">
				{isEditing ? (
					<>
						<Button
							variant="outline"
							onClick={handleCancelEdit}
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
								"Save Changes"
							)}
						</Button>
					</>
				) : (
					<Button onClick={() => setIsEditing(true)}>Edit Dharmguru</Button>
				)}
			</CardFooter>
		</div>
	);
}
