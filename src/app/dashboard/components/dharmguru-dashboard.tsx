"use client";
import React, { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import DharmguruProfileForm from "./dharmguru-profile-form";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ResponsiveContainer,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	LineChart,
	Line,
} from "recharts";
import {
	Plus,
	Calendar,
	Star,
	MapPin,
	Users,
	TrendingUp,
	Eye,
	Edit2,
	// Phone,
	Book,
	Video,
	Heart,
	MessageSquare,
	// Award,
	Zap,
} from "lucide-react";

// --- Type Definitions ---
import type { Address } from "@/types/user";
export interface DharmguruProfile {
	id: string;
	name: string;
	profileImageUrl?: string;
	bannerImageUrl?: string;
	contact: string;
	email?: string;
	addresses?: Address[];
	rating: number;
	bio?: string;
	specialization: string;
	experience: number;
}

export interface Summary {
	label: string;
	value: number | string;
	icon?: React.ReactNode;
	color?: string;
}

export interface Discourse {
	id: string;
	title: string;
	date: string;
	venue: string;
	attendees: number;
	status: "Upcoming" | "Completed" | "Cancelled";
	type: "Online" | "Offline";
}

export interface Teaching {
	id: string;
	title: string;
	category: string;
	students: number;
	rating: number;
	status: "Active" | "Completed" | "Draft";
}

export interface Consultation {
	id: string;
	seeker: string;
	date: string;
	topic: string;
	status: "Scheduled" | "Completed" | "Cancelled";
	type: "Online" | "In-Person";
}

export interface Content {
	id: string;
	title: string;
	type: "Video" | "Article" | "Audio";
	views: number;
	likes: number;
	publishDate: string;
}

export interface StudyRequest {
	id: string;
	student: string;
	course: string;
	requestDate: string;
	status: "Pending" | "Approved" | "Rejected";
}

import { useSession } from "next-auth/react";
import { userService } from "@/services/userService";
import type { FullUser } from "@/types/user";
// --- Mock API Utilities ---
function useMockFetch<T>(
	fetcher: () => Promise<T>,
	deps: React.DependencyList = []
) {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		setLoading(true);
		fetcher().then((d) => {
			setData(d);
			setLoading(false);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
	return { data, loading };
}

// --- Utility: Date Formatting ---
function formatDate(dateStr: string) {
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) return dateStr;
	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

// --- Subcomponents ---

// Summary Cards
function SummaryCards({
	summaries,
	loading,
}: {
	summaries: Summary[];
	loading: boolean;
}) {
	const iconMap: Record<string, React.ReactNode> = {
		"Total Discourses": <Calendar className="h-5 w-5 text-orange-600" />,
		"Active Teachings": <Book className="h-5 w-5 text-blue-600" />,
		Consultations: <Users className="h-5 w-5 text-green-600" />,
		"Published Content": <Video className="h-5 w-5 text-purple-600" />,
		"Student Followers": <Heart className="h-5 w-5 text-red-600" />,
		"Study Requests": <MessageSquare className="h-5 w-5 text-indigo-600" />,
	};

	return (
		<div className="grid grid-cols-2 md:grid-cols-2 gap-4 w-full">
			{loading
				? Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-28 w-full rounded" />
				  ))
				: summaries.map((s, i) => (
						<Card
							key={i}
							className="hover:shadow-md transition-shadow duration-200 border-l-4"
							style={{ borderLeftColor: s.color }}
						>
							<CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
								<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
									{s.label}
								</CardTitle>
								{iconMap[s.label] || s.icon}
							</CardHeader>
							<CardContent className="space-y-1">
								<div className="text-2xl font-bold" style={{ color: s.color }}>
									{s.value}
								</div>
								<div className="flex items-center text-xs text-gray-500">
									<TrendingUp className="h-3 w-3 mr-1" />
									<span>+8.1% from last month</span>
								</div>
							</CardContent>
						</Card>
				  ))}
		</div>
	);
}

// Discourses Table
function DiscoursesTable({
	discourses,
	loading,
}: {
	discourses: Discourse[];
	loading: boolean;
}) {
	return (
		<Card className="hover:shadow-lg transition-shadow duration-200">
			<CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
				<div className="flex items-center gap-2">
					<Calendar className="h-5 w-5 text-orange-600" />
					<CardTitle>Spiritual Discourses</CardTitle>
				</div>
				<CardDescription>
					Upcoming and recent spiritual discourses
				</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto p-0">
				<Table>
					<TableHeader>
						<TableRow className="border-b">
							<TableHead className="font-semibold">Title</TableHead>
							<TableHead className="font-semibold">Date</TableHead>
							<TableHead className="font-semibold">Venue</TableHead>
							<TableHead className="font-semibold">Attendees</TableHead>
							<TableHead className="font-semibold">Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading
							? Array.from({ length: 4 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={5}>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
							  ))
							: discourses.map((discourse) => (
									<TableRow
										key={discourse.id}
										className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
									>
										<TableCell className="font-medium">
											{discourse.title}
										</TableCell>
										<TableCell className="flex items-center gap-1">
											<Calendar className="h-4 w-4 text-gray-500" />
											{discourse.date}
										</TableCell>
										<TableCell className="flex items-center gap-1">
											<MapPin className="h-4 w-4 text-gray-500" />
											{discourse.venue}
										</TableCell>
										<TableCell className="flex items-center gap-1">
											<Users className="h-4 w-4 text-gray-500" />
											{discourse.attendees}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													discourse.status === "Upcoming"
														? "default"
														: discourse.status === "Completed"
														? "secondary"
														: "destructive"
												}
												className={
													discourse.status === "Upcoming"
														? "bg-orange-100 text-orange-800 hover:bg-orange-200"
														: discourse.status === "Completed"
														? "bg-green-100 text-green-800 hover:bg-green-200"
														: "bg-red-100 text-red-800 hover:bg-red-200"
												}
											>
												{discourse.status}
											</Badge>
										</TableCell>
									</TableRow>
							  ))}
					</TableBody>
				</Table>
				<div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800">
					<span className="text-sm text-gray-600 dark:text-gray-400">
						{discourses.length} discourses total
					</span>
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							className="flex items-center gap-1"
						>
							<Plus className="h-4 w-4" />
							Schedule Discourse
						</Button>
						<Button size="sm" variant="ghost">
							View All
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Teachings List
function TeachingsList({
	teachings,
	loading,
}: {
	teachings: Teaching[];
	loading: boolean;
}) {
	return (
		<Card className="hover:shadow-lg transition-shadow duration-200">
			<CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
				<div className="flex items-center gap-2">
					<Book className="h-5 w-5 text-blue-600" />
					<CardTitle>Teachings & Courses</CardTitle>
				</div>
				<CardDescription>
					Active and completed spiritual teachings
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 p-6">
				{loading
					? Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className="h-16 w-full rounded" />
					  ))
					: teachings.map((teaching) => (
							<div
								key={teaching.id}
								className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
							>
								<div className="space-y-1">
									<h4 className="font-medium">{teaching.title}</h4>
									<div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
										<span className="flex items-center gap-1">
											<Book className="h-4 w-4" />
											{teaching.category}
										</span>
										<span className="flex items-center gap-1">
											<Users className="h-4 w-4" />
											{teaching.students} students
										</span>
										<span className="flex items-center gap-1">
											<Star className="h-4 w-4 fill-current text-yellow-500" />
											{teaching.rating.toFixed(1)}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Badge
										variant={
											teaching.status === "Active"
												? "default"
												: teaching.status === "Completed"
												? "secondary"
												: "outline"
										}
										className={
											teaching.status === "Active"
												? "bg-green-100 text-green-800"
												: teaching.status === "Completed"
												? "bg-blue-100 text-blue-800"
												: "bg-gray-100 text-gray-800"
										}
									>
										{teaching.status}
									</Badge>
									<Button size="icon" variant="ghost">
										<Edit2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
					  ))}
				<div className="pt-4 border-t">
					<Button
						size="sm"
						variant="outline"
						className="w-full flex items-center gap-1"
					>
						<Plus className="h-4 w-4" />
						Create New Teaching
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// Content Performance Chart
function ContentPerformanceChart({
	data,
	loading,
}: {
	data: { month: string; views: number; likes: number }[];
	loading: boolean;
}) {
	return (
		<Card className="hover:shadow-lg transition-shadow duration-200">
			<CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
				<div className="flex items-center gap-2">
					<TrendingUp className="h-5 w-5 text-purple-600" />
					<CardTitle>Content Performance</CardTitle>
				</div>
				<CardDescription>
					Views and likes over the last 6 months
				</CardDescription>
			</CardHeader>
			<CardContent className="p-6">
				{loading ? (
					<Skeleton className="w-full h-64 rounded" />
				) : (
					<ResponsiveContainer width="100%" height={280}>
						<LineChart
							data={data}
							margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
						>
							<XAxis
								dataKey="month"
								tick={{ fontSize: 12 }}
								tickLine={{ stroke: "#e5e7eb" }}
								axisLine={{ stroke: "#e5e7eb" }}
							/>
							<YAxis
								tick={{ fontSize: 12 }}
								tickLine={{ stroke: "#e5e7eb" }}
								axisLine={{ stroke: "#e5e7eb" }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "#fff",
									border: "1px solid #e5e7eb",
									borderRadius: "8px",
									boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
								}}
							/>
							<Legend />
							<Line
								type="monotone"
								dataKey="views"
								stroke="#8b5cf6"
								strokeWidth={2}
								dot={{ fill: "#8b5cf6" }}
							/>
							<Line
								type="monotone"
								dataKey="likes"
								stroke="#ec4899"
								strokeWidth={2}
								dot={{ fill: "#ec4899" }}
							/>
						</LineChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}

// Recent Content Table
function RecentContentTable({
	content,
	loading,
}: {
	content: Content[];
	loading: boolean;
}) {
	return (
		<Card className="hover:shadow-lg transition-shadow duration-200">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Video className="h-5 w-5 text-purple-600" />
					<CardTitle>Recent Content</CardTitle>
				</div>
				<CardDescription>Latest published spiritual content</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Views</TableHead>
							<TableHead>Likes</TableHead>
							<TableHead>Published</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading
							? Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={5}>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
							  ))
							: content.map((item) => (
									<TableRow
										key={item.id}
										className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
									>
										<TableCell className="font-medium">{item.title}</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className="flex items-center gap-1 w-fit"
											>
												{item.type === "Video" && <Video className="h-3 w-3" />}
												{item.type === "Article" && (
													<Book className="h-3 w-3" />
												)}
												{item.type === "Audio" && <Zap className="h-3 w-3" />}
												{item.type}
											</Badge>
										</TableCell>
										<TableCell className="flex items-center gap-1">
											<Eye className="h-4 w-4 text-gray-500" />
											{item.views.toLocaleString()}
										</TableCell>
										<TableCell className="flex items-center gap-1">
											<Heart className="h-4 w-4 text-gray-500" />
											{item.likes.toLocaleString()}
										</TableCell>
										<TableCell>{formatDate(item.publishDate)}</TableCell>
									</TableRow>
							  ))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

// --- Main DharmguruDashboard Component ---
export default function DharmguruDashboard() {
	// Get session for real user profile image
	const { data: session } = useSession();
	const [profile, setProfile] = useState<DharmguruProfile | null>(null);
	const [profileLoading, setProfileLoading] = useState(true);
	useEffect(() => {
		async function fetchProfile() {
			if (session?.user?.id) {
				setProfileLoading(true);
				try {
					const user = (await userService.getUserById(
						session.user.id
					)) as FullUser;
					setProfile({
						id: user.id,
						name: user.name || "Dharmguru",
						profileImageUrl: user.profileImageUrl || undefined,
						bannerImageUrl: user.bannerImageUrl || "",
						contact: user.phone || "", // Use phone if available
						email: user.email || "",
						addresses: user.addresses || [],
						rating: 4.95, // Not available on FullUser, fallback to default
						bio: "", // Not available on FullUser, fallback to empty string
						specialization: user.category || "Dharmguru",
						experience: 0, // Not available on FullUser, fallback to 0
					});
				} catch {
					setProfile({
						id: session.user.id,
						name: session.user.name || "Dharmguru",
						profileImageUrl: session.user.image || undefined,
						contact: "",
						email: session.user.email || "",
						addresses: [],
						rating: 4.95,
						bio: "",
						specialization: "Dharmguru",
						experience: 0,
					});
				} finally {
					setProfileLoading(false);
				}
			} else {
				setProfile({
					id: "dharmguru-1",
					name: "Swami Ramdev",
					profileImageUrl: undefined,
					contact: "+91-9876543210",
					email: "swami.ramdev@example.com",
					addresses: [],
					rating: 4.95,
					bio: "Spiritual teacher and meditation master",
					specialization: "Vedantic Philosophy",
					experience: 25,
				});
				setProfileLoading(false);
			}
		}
		fetchProfile();
	}, [session]);

	const { data: summaries, loading: summariesLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 600));
			return [
				{ label: "Total Discourses", value: 24, color: "#ea580c" },
				{ label: "Active Teachings", value: 8, color: "#2563eb" },
				{ label: "Consultations", value: "12/30", color: "#059669" },
				{ label: "Published Content", value: 156, color: "#7c3aed" },
				{ label: "Student Followers", value: "2.4k", color: "#dc2626" },
				{ label: "Study Requests", value: 6, color: "#4338ca" },
			];
		}, []);

	const { data: discourses, loading: discoursesLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 700));
			return [
				{
					id: "d1",
					title: "Bhagavad Gita Discourse",
					date: "2025-07-20",
					venue: "Rishikesh Ashram",
					attendees: 250,
					status: "Upcoming",
					type: "Offline",
				},
				{
					id: "d2",
					title: "Meditation & Mindfulness",
					date: "2025-07-18",
					venue: "Online Platform",
					attendees: 180,
					status: "Upcoming",
					type: "Online",
				},
				{
					id: "d3",
					title: "Vedantic Philosophy",
					date: "2025-07-15",
					venue: "Haridwar",
					attendees: 320,
					status: "Completed",
					type: "Offline",
				},
			];
		}, []);

	const { data: teachings, loading: teachingsLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 800));
			return [
				{
					id: "t1",
					title: "Advanced Meditation Techniques",
					category: "Meditation",
					students: 145,
					rating: 4.9,
					status: "Active",
				},
				{
					id: "t2",
					title: "Sanskrit for Beginners",
					category: "Language",
					students: 89,
					rating: 4.7,
					status: "Active",
				},
				{
					id: "t3",
					title: "Yoga Philosophy",
					category: "Philosophy",
					students: 234,
					rating: 4.8,
					status: "Completed",
				},
			];
		}, []);

	const { data: contentPerformance, loading: performanceLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 900));
			return [
				{ month: "Jan", views: 1200, likes: 340 },
				{ month: "Feb", views: 1450, likes: 420 },
				{ month: "Mar", views: 1680, likes: 510 },
				{ month: "Apr", views: 1920, likes: 650 },
				{ month: "May", views: 2240, likes: 780 },
				{ month: "Jun", views: 2680, likes: 920 },
			];
		}, []);

	const { data: recentContent, loading: contentLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 1000));
			return [
				{
					id: "c1",
					title: "Morning Meditation Practices",
					type: "Video",
					views: 4200,
					likes: 310,
					publishDate: "2025-07-10",
				},
				{
					id: "c2",
					title: "Understanding Karma Yoga",
					type: "Article",
					views: 2800,
					likes: 190,
					publishDate: "2025-07-08",
				},
				{
					id: "c3",
					title: "Guided Breathing Exercise",
					type: "Audio",
					views: 3600,
					likes: 280,
					publishDate: "2025-07-05",
				},
			];
		}, []);

	// Handle profile save to refresh data
	const handleProfileSave = async (_data?: unknown) => {
		// Ignore passed data and refetch the profile to get the updated data including new image
		if (session?.user?.id) {
			try {
				const user = (await userService.getUserById(
					session.user.id
				)) as FullUser;
				setProfile({
					id: user.id,
					name: user.name || "Dharmguru",
					profileImageUrl: user.profileImageUrl || undefined,
					bannerImageUrl: user.bannerImageUrl || "",
					contact: user.phone || "",
					email: user.email || "",
					addresses: user.addresses || [],
					rating: 4.95,
					bio: "",
					specialization: user.category || "Dharmguru",
					experience: 0,
				});
			} catch (error) {
				console.error("Failed to refresh profile:", error);
			}
		}
	};

	// --- Layout ---
	return (
		<div className="flex flex-col gap-8 w-full min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
			{/* Top: Profile + Summary */}
			<div className="flex flex-col xl:flex-row gap-6 w-full">
				<div className="xl:w-2/5 w-full">
					<DharmguruProfileForm
						profile={
							profile
								? {
										id: profile.id,
										name: profile.name,
										email: profile.email || "",
										phone: profile.contact,
										addresses: profile.addresses || [],
										profileImageUrl: profile.profileImageUrl,
										bannerImageUrl: profile.bannerImageUrl || "",
								  }
								: null
						}
						loading={profileLoading}
						onSave={handleProfileSave}
					/>
				</div>
				<div className="flex-1">
					<SummaryCards
						summaries={summaries || []}
						loading={summariesLoading}
					/>
				</div>
			</div>

			{/* Content Performance Chart */}
			<ContentPerformanceChart
				data={contentPerformance || []}
				loading={performanceLoading}
			/>

			{/* Main Grid: Discourses, Teachings, Content */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				<div className="lg:col-span-2 xl:col-span-2">
					<DiscoursesTable
						discourses={
							Array.isArray(discourses)
								? discourses.map(
										(d) =>
											({
												...d,
												status: d.status as
													| "Upcoming"
													| "Completed"
													| "Cancelled",
												type: d.type as "Online" | "Offline",
											} as Discourse)
								  )
								: []
						}
						loading={discoursesLoading}
					/>
				</div>

				<div className="space-y-6">
					<TeachingsList
						teachings={
							Array.isArray(teachings)
								? teachings.map(
										(t) =>
											({
												...t,
												status: t.status as "Active" | "Completed" | "Draft",
											} as Teaching)
								  )
								: []
						}
						loading={teachingsLoading}
					/>
				</div>
			</div>

			{/* Recent Content */}
			<RecentContentTable
				content={
					Array.isArray(recentContent)
						? recentContent.map(
								(c) =>
									({
										...c,
										type: c.type as "Video" | "Article" | "Audio",
									} as Content)
						  )
						: []
				}
				loading={contentLoading}
			/>
		</div>
	);
}
