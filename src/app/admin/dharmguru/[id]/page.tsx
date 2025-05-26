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

export default function DharmguruDetailPage() {
	const params = useParams();
	const router = useRouter();
	const dharmguruId = params.id as string;

	const [dharmguru, setDharmguru] = useState<any>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editedDharmguru, setEditedDharmguru] = useState<any>(null);
	const [imageError, setImageError] = useState(false);

	// Memoize the fetch function and add proper dependencies
	const fetchDharmguruData = useCallback(() => {
		// In a real app, you would fetch dharmguru data from an API
		const dharmguruData =
			mockDharmguruDetails[dharmguruId as keyof typeof mockDharmguruDetails];
		if (dharmguruData) {
			setDharmguru(dharmguruData);
			setEditedDharmguru({ ...dharmguruData });
		} else {
			// If dharmguru not found, redirect to dharmgurus list
			router.push("/admin/dharmguru");
		}
	}, [dharmguruId, router]);

	// Call the memoized function
	useEffect(() => {
		fetchDharmguruData();
	}, [fetchDharmguruData]);

	if (!dharmguru) {
		return <div className="p-6">Loading dharmguru details...</div>;
	}

	const handleSaveChanges = () => {
		setDharmguru(editedDharmguru);
		setIsEditing(false);
		// In a real app, you would save changes to the backend
		alert("Dharmguru details updated successfully!");
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		}).format(date);
	};

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
								<img
									src={dharmguru.avatar}
									alt={dharmguru.name}
									className="w-full h-full rounded-full object-cover"
									onError={() => setImageError(true)}
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
										Update dharmguru's personal details and contact information.
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
														value={editedDharmguru.name}
														onChange={(e) =>
															setEditedDharmguru({
																...editedDharmguru,
																name: e.target.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="email">Email</Label>
													<Input
														id="email"
														type="email"
														value={editedDharmguru.email}
														onChange={(e) =>
															setEditedDharmguru({
																...editedDharmguru,
																email: e.target.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="phone">Phone</Label>
													<Input
														id="phone"
														value={editedDharmguru.phone}
														onChange={(e) =>
															setEditedDharmguru({
																...editedDharmguru,
																phone: e.target.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="category">Category</Label>
													<Select
														value={editedDharmguru.category}
														onValueChange={(value) =>
															setEditedDharmguru({
																...editedDharmguru,
																category: value,
															})
														}
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
												</div>
												<div className="space-y-2">
													<Label htmlFor="rank">Rank</Label>
													<Select
														value={editedDharmguru.rank}
														onValueChange={(value) =>
															setEditedDharmguru({
																...editedDharmguru,
																rank: value,
															})
														}
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
												</div>
												<div className="space-y-2">
													<Label htmlFor="status">Status</Label>
													<Select
														value={editedDharmguru.status}
														onValueChange={(value) =>
															setEditedDharmguru({
																...editedDharmguru,
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
													value={editedDharmguru.address}
													onChange={(e) =>
														setEditedDharmguru({
															...editedDharmguru,
															address: e.target.value,
														})
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="bio">Bio</Label>
												<Textarea
													id="bio"
													value={editedDharmguru.bio}
													onChange={(e) =>
														setEditedDharmguru({
															...editedDharmguru,
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
														checked={editedDharmguru.preferences.notifications}
														onChange={(e) =>
															setEditedDharmguru({
																...editedDharmguru,
																preferences: {
																	...editedDharmguru.preferences,
																	notifications: e.target.checked,
																},
															})
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
														checked={editedDharmguru.preferences.newsletter}
														onChange={(e) =>
															setEditedDharmguru({
																...editedDharmguru,
																preferences: {
																	...editedDharmguru.preferences,
																	newsletter: e.target.checked,
																},
															})
														}
														className="h-4 w-4"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="language">Preferred Language</Label>
													<Select
														value={editedDharmguru.preferences.language}
														onValueChange={(value) =>
															setEditedDharmguru({
																...editedDharmguru,
																preferences: {
																	...editedDharmguru.preferences,
																	language: value,
																},
															})
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
											(activity: any, index: number) => (
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
