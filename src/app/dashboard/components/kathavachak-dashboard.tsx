"use client";
import KathavachakProfileForm from "./kathavachak-profile-form";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { userService } from "@/services/userService";
import type { FullUser } from "@/types/user";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
} from "recharts";
import {
	Plus,
	Check,
	X,
	Download,
	Calendar,
	Star,
	MapPin,
	TrendingUp,
	Edit2,
	Bookmark,
	Clock,
} from "lucide-react";

// --- Type Definitions ---
export interface KathavachakProfile {
	id: string;
	name: string;
	avatarUrl?: string;
	contact: string;
	rating: number;
	bio?: string;
}

export interface Summary {
	label: string;
	value: number | string;
	icon?: React.ReactNode;
	color?: string;
}

export interface Event {
	id: string;
	name: string;
	date: string;
	location: string;
	status: "Upcoming" | "Completed" | "Cancelled";
}

export interface Booking {
	id: string;
	guest: string;
	date: string;
	status: "Pending" | "Confirmed" | "Completed";
	type: "Dharamshala" | "Temple";
	itemName: string;
}

export interface PoojaService {
	id: string;
	name: string;
	price: number;
	status: "Active" | "Inactive";
}

export interface Bookmark {
	id: string;
	type: "Temple" | "Event" | "Dharamshala" | "PoojaService";
	name: string;
}

export interface EventRequest {
	id: string;
	user: string;
	event: string;
	requestDate: string;
	status: "Pending" | "Approved" | "Rejected";
}

// --- Mock API Utilities ---
function useMockFetch<T>(fetcher: () => Promise<T>, deps: any[] = []) {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(false);
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

// Profile Card

// Summary Cards
function SummaryCards({
	summaries,
	loading,
}: {
	summaries: Summary[];
	loading: boolean;
}) {
	const iconMap: Record<string, React.ReactNode> = {
		"Total Events": <Calendar className="h-5 w-5 text-blue-600" />,
		"Dharamshala Bookings": <MapPin className="h-5 w-5 text-green-600" />,
		"Temple Bookings": <MapPin className="h-5 w-5 text-purple-600" />,
		"Pooja Services": <Star className="h-5 w-5 text-yellow-600" />,
		Bookmarks: <Bookmark className="h-5 w-5 text-red-600" />,
		"Active Requests": <Clock className="h-5 w-5 text-orange-600" />,
	};

	return (
		<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 w-full">
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
									<span>+5.2% from last month</span>
								</div>
							</CardContent>
						</Card>
				  ))}
		</div>
	);
}

// Events Table
function EventsTable({
	events,
	loading,
}: {
	events: Event[];
	loading: boolean;
}) {
	return (
		<Card className="hover:shadow-lg transition-shadow duration-200">
			<CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
				<div className="flex items-center gap-2">
					<Calendar className="h-5 w-5 text-blue-600" />
					<CardTitle>Upcoming Events</CardTitle>
				</div>
				<CardDescription>Recent and upcoming spiritual events</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto p-0">
				<Table>
					<TableHeader>
						<TableRow className="border-b">
							<TableHead className="font-semibold">Event Name</TableHead>
							<TableHead className="font-semibold">Date</TableHead>
							<TableHead className="font-semibold">Location</TableHead>
							<TableHead className="font-semibold">Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading
							? Array.from({ length: 4 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={4}>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
							))
							: events.map((event) => (
									<TableRow
										key={event.id}
										className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
									>
										<TableCell className="font-medium">{event.name}</TableCell>
										<TableCell className="flex items-center gap-1">
											<Calendar className="h-4 w-4 text-gray-500" />
											{event.date}
										</TableCell>
										<TableCell className="flex items-center gap-1">
											<MapPin className="h-4 w-4 text-gray-500" />
											{event.location}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													event.status === "Upcoming"
														? "default"
														: event.status === "Completed"
														? "secondary"
														: "destructive"
												}
												className={
													event.status === "Upcoming"
														? "bg-blue-100 text-blue-800 hover:bg-blue-200"
														: event.status === "Completed"
														? "bg-green-100 text-green-800 hover:bg-green-200"
														: "bg-red-100 text-red-800 hover:bg-red-200"
												}
											>
												{event.status}
											</Badge>
										</TableCell>
									</TableRow>
							  ))}
					</TableBody>
				</Table>
				<div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800">
					<span className="text-sm text-gray-600 dark:text-gray-400">
						{events.length} events total
					</span>
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							className="flex items-center gap-1"
						>
							<Plus className="h-4 w-4" />
							Add Event
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

// Bookings Table (Dharamshala/Temple)
function BookingsTable({
	bookings,
	loading,
	type,
}: {
	bookings: Booking[];
	loading: boolean;
	type: "Dharamshala" | "Temple";
}) {
	const [status, setStatus] = useState<string>("all");
	const filtered =
		status === "all" ? bookings : bookings.filter((b) => b.status === status);
	return (
		<Card>
			<CardHeader>
				<CardTitle>{type} Bookings</CardTitle>
				<CardDescription>Latest {type.toLowerCase()} bookings</CardDescription>
				<Tabs value={status} onValueChange={setStatus} className="mt-2">
					<TabsList>
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value="Pending">Pending</TabsTrigger>
						<TabsTrigger value="Confirmed">Confirmed</TabsTrigger>
						<TabsTrigger value="Completed">Completed</TabsTrigger>
					</TabsList>
				</Tabs>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								{type === "Dharamshala" ? "Guest" : "Temple"}
							</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading
							? Array.from({ length: 3 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={3}>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
							  ))
							: filtered.map((b) => (
									<TableRow key={b.id}>
										<TableCell>{b.itemName}</TableCell>
										<TableCell>{formatDate(b.date)}</TableCell>
										<TableCell>
											<Badge
												variant={
													b.status === "Pending"
														? "secondary"
														: b.status === "Confirmed"
														? "default"
														: b.status === "Completed"
														? "default"
														: "outline"
												}
											>
												{b.status}
											</Badge>
										</TableCell>
									</TableRow>
							  ))}
					</TableBody>
				</Table>
				<div className="flex justify-end mt-2">
					<Button size="sm" variant="ghost">
						View All
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// Pooja Services List
function PoojaServicesList({
	services,
	loading,
}: {
	services: PoojaService[];
	loading: boolean;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Pooja Services</CardTitle>
				<CardDescription>Active pooja services</CardDescription>
				<Button size="sm" variant="outline" className="mt-2">
					<Plus className="h-4 w-4 mr-1" />
					Add Service
				</Button>
			</CardHeader>
			<CardContent>
				{loading
					? Array.from({ length: 2 }).map((_, i) => (
							<Skeleton key={i} className="h-8 w-full rounded mb-2" />
					  ))
					: services.map((s) => (
							<div
								key={s.id}
								className="flex items-center justify-between border-b py-2 last:border-b-0"
							>
								<span>{s.name}</span>
								<div className="flex items-center gap-2">
									<Badge
										variant={s.status === "Active" ? "default" : "secondary"}
									>
										{s.status}
									</Badge>
									<span className="text-sm text-muted-foreground">
										₹{s.price}
									</span>
									<Button size="icon" variant="ghost">
										<Edit2 className="h-4 w-4" />
									</Button>
									<Button size="icon" variant="ghost">
										<X />
									</Button>
								</div>
							</div>
					  ))}
			</CardContent>
		</Card>
	);
}

// Bookmarks List
function BookmarksList({
	bookmarks,
	loading,
}: {
	bookmarks: Bookmark[];
	loading: boolean;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Bookmarks</CardTitle>
				<CardDescription>Bookmarked items</CardDescription>
			</CardHeader>
			<CardContent>
				{loading
					? Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className="h-6 w-full rounded mb-2" />
					  ))
					: bookmarks.map((b) => (
							<div key={b.id} className="flex items-center gap-2 mb-2">
								<Badge>{b.type}</Badge>
								<span>{b.name}</span>
							</div>
					  ))}
			</CardContent>
		</Card>
	);
}

// Event Requests Table
function EventRequestsTable({
	requests,
	loading,
}: {
	requests: EventRequest[];
	loading: boolean;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Event Requests</CardTitle>
				<CardDescription>Pending event requests</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Event</TableHead>
							<TableHead>Request Date</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading
							? Array.from({ length: 3 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={5}>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
							  ))
							: requests.map((r) => (
									<TableRow key={r.id}>
										<TableCell>{r.user}</TableCell>
										<TableCell>{r.event}</TableCell>
										<TableCell>{r.requestDate}</TableCell>
										<TableCell>
											<Badge
												variant={
													r.status === "Pending"
														? "secondary"
														: r.status === "Approved"
														? "default"
														: "destructive"
												}
											>
												{r.status}
											</Badge>
										</TableCell>
										<TableCell>
											<Button size="icon" variant="ghost">
												<Check className="text-green-600" />
											</Button>
											<Button size="icon" variant="ghost">
												<X className="text-red-600" />
											</Button>
										</TableCell>
									</TableRow>
							  ))}
					</TableBody>
				</Table>
				<div className="flex justify-end mt-2">
					<Button size="sm" variant="ghost">
						Export CSV <Download className="h-4 w-4 ml-1" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// Analytics Chart (Pie + Bar)
const PIE_COLORS = ["#6366f1", "#22c55e", "#fbbf24", "#ef4444", "#a21caf"];
function AnalyticsCharts({
	data,
	loading,
}: {
	data: { type: string; value: number }[];
	loading: boolean;
}) {
	return (
		<Card className="hover:shadow-lg transition-shadow duration-200">
			<CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950">
				<div className="flex items-center gap-2">
					<TrendingUp className="h-5 w-5 text-indigo-600" />
					<CardTitle>Analytics Overview</CardTitle>
				</div>
				<CardDescription>
					Distribution of bookings and events data
				</CardDescription>
			</CardHeader>
			<CardContent className="p-6">
				{loading ? (
					<Skeleton className="w-full h-64 rounded" />
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="space-y-4">
							<h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
								Distribution
							</h4>
							<ResponsiveContainer width="100%" height={220}>
								<PieChart>
									<Pie
										data={data}
										dataKey="value"
										nameKey="type"
										cx="50%"
										cy="50%"
										outerRadius={80}
										innerRadius={40}
										strokeWidth={2}
										stroke="#fff"
									>
										{data.map((_, idx) => (
											<Cell
												key={`cell-${idx}`}
												fill={PIE_COLORS[idx % PIE_COLORS.length]}
											/>
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											backgroundColor: "#fff",
											border: "1px solid #e5e7eb",
											borderRadius: "8px",
											boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
										}}
									/>
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</div>

						<div className="space-y-4">
							<h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
								Comparison
							</h4>
							<ResponsiveContainer width="100%" height={220}>
								<BarChart
									data={data}
									margin={{ left: 20, right: 20, top: 20, bottom: 5 }}
								>
									<XAxis
										dataKey="type"
										tick={{ fontSize: 12 }}
										tickLine={{ stroke: "#e5e7eb" }}
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
									<Bar
										dataKey="value"
										fill="#6366f1"
										radius={[4, 4, 0, 0]}
										className="hover:opacity-80 transition-opacity"
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// --- Main KathavachakDashboard Component ---
export default function KathavachakDashboard() {
	const { data: session } = useSession();
	const [profile, setProfile] = useState<KathavachakProfile | null>(null);
	const [profileLoading, setProfileLoading] = useState(true);

	// Handler to save profile edits
	function handleProfileSave(data: {
		name: string;
		email: string;
		phone: string;
		addresses: any[];
	}) {
		// TODO: Connect to backend or update state as needed
		setProfile((prev) => (prev ? { ...prev, ...data } : prev));
		// Optionally, show a toast or notification
	}

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
						name: user.name || "Kathavachak",
						avatarUrl: user.profileImageUrl || undefined,
						contact: "+91-9876543210", // fallback, not on FullUser
						rating: 4.88, // fallback, not on FullUser
						bio: "Spiritual orator and kathavachak.", // fallback, not on FullUser
					});
				} catch {
					setProfile({
						id: session.user.id,
						name: session.user.name || "Kathavachak",
						avatarUrl: session.user.image || undefined,
						contact: "+91-9876543210",
						rating: 4.88,
						bio: "Spiritual orator and kathavachak.",
					});
				} finally {
					setProfileLoading(false);
				}
			} else {
				setProfile({
					id: "kathavachak-1",
					name: "Pt. Suresh Joshi",
					avatarUrl: undefined,
					contact: "+91-9876543210",
					rating: 4.88,
					bio: "Spiritual orator and kathavachak.",
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
				{ label: "Total Events", value: 18, color: "#6366f1" },
				{ label: "Dharamshala Bookings", value: "5/20", color: "#22c55e" },
				{ label: "Temple Bookings", value: "3/12", color: "#fbbf24" },
				{ label: "Pooja Services", value: "4/7", color: "#a21caf" },
				{ label: "Bookmarks", value: 14, color: "#ef4444" },
				{ label: "Active Requests", value: 2, color: "#0ea5e9" },
			];
		}, []);

	const { data: events, loading: eventsLoading } = useMockFetch(async () => {
		await new Promise((r) => setTimeout(r, 700));
		return [
			{
				id: "e1",
				name: "Ram Katha",
				date: "2025-07-15",
				location: "Ayodhya",
				status: "Upcoming",
			},
			{
				id: "e2",
				name: "Shiv Katha",
				date: "2025-07-20",
				location: "Varanasi",
				status: "Upcoming",
			},
			{
				id: "e3",
				name: "Bhagwat Katha",
				date: "2025-06-10",
				location: "Mathura",
				status: "Completed",
			},
		];
	}, []);

	const { data: dharamshalaBookings, loading: dharamshalaLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 800));
			return [
				{
					id: "d1",
					guest: "Rohit",
					date: "2025-07-12",
					status: "Pending",
					type: "Dharamshala",
					itemName: "Shree Dharamshala",
				},
				{
					id: "d2",
					guest: "Priya",
					date: "2025-07-13",
					status: "Confirmed",
					type: "Dharamshala",
					itemName: "Gita Bhawan",
				},
				{
					id: "d3",
					guest: "Suresh",
					date: "2025-07-10",
					status: "Completed",
					type: "Dharamshala",
					itemName: "Yatri Niwas",
				},
			];
		}, []);

	const { data: templeBookings, loading: templeLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 900));
			return [
				{
					id: "t1",
					guest: "Rohit",
					date: "2025-07-12",
					status: "Pending",
					type: "Temple",
					itemName: "Kashi Vishwanath",
				},
				{
					id: "t2",
					guest: "Priya",
					date: "2025-07-13",
					status: "Confirmed",
					type: "Temple",
					itemName: "Somnath",
				},
				{
					id: "t3",
					guest: "Suresh",
					date: "2025-07-10",
					status: "Completed",
					type: "Temple",
					itemName: "Mahakaleshwar",
				},
			];
		}, []);

	const { data: poojaServices, loading: poojaLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 700));
			return [
				{ id: "p1", name: "Rudrabhishek", price: 2100, status: "Active" },
				{ id: "p2", name: "Satyanarayan Katha", price: 1500, status: "Active" },
				{ id: "p3", name: "Navgrah Shanti", price: 2500, status: "Inactive" },
			];
		}, []);

	const { data: bookmarks, loading: bookmarksLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 600));
			return [
				{ id: "b1", type: "Temple", name: "Kashi Vishwanath" },
				{ id: "b2", type: "Event", name: "Ram Katha" },
				{ id: "b3", type: "Dharamshala", name: "Shree Dharamshala" },
			];
		}, []);

	const { data: eventRequests, loading: requestsLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 800));
			return [
				{
					id: "r1",
					user: "Amit",
					event: "Ram Katha",
					requestDate: "2025-07-10",
					status: "Pending",
				},
				{
					id: "r2",
					user: "Deepak",
					event: "Shiv Katha",
					requestDate: "2025-07-11",
					status: "Approved",
				},
			];
		}, []);

	const { data: analytics, loading: analyticsLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 900));
			return [
				{ type: "Dharamshala", value: 20 },
				{ type: "Temple", value: 12 },
				{ type: "Events", value: 18 },
				{ type: "Pooja", value: 7 },
				{ type: "Bookmarks", value: 14 },
			];
		}, []);

	// --- Render ---
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col xl:flex-row gap-6">
				<div className="xl:w-2/5 w-full">
					<KathavachakProfileForm
						profile={
							profile
								? {
										id: profile.id,
										name: profile.name ?? "",
										email: (profile as any).email ?? "",
										phone: (profile as any).phone ?? "",
										addresses: (profile as any).addresses ?? [],
								  }
								: null
						}
						loading={profileLoading}
						onSave={handleProfileSave}
					/>
				</div>
				<div className="xl:w-3/5 w-full">
					<SummaryCards
						summaries={summaries || []}
						loading={summariesLoading}
					/>
				</div>
			</div>

			{/* Analytics Chart */}
			<AnalyticsCharts data={analytics || []} loading={analyticsLoading} />

			{/* Main Grid: Events, Bookings, Services, Bookmarks, Requests */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				<div className="lg:col-span-2 xl:col-span-2">
					<EventsTable
						events={
							Array.isArray(events)
								? events.map(
										(e) =>
											({
												...e,
												status: e.status as
													| "Upcoming"
													| "Completed"
													| "Cancelled",
											} as Event)
								  )
								: []
						}
						loading={eventsLoading}
					/>
				</div>

				<div className="space-y-6">
					<BookingsTable
						bookings={
							Array.isArray(dharamshalaBookings)
								? dharamshalaBookings.map(
										(b) =>
											({
												...b,
												status: b.status as
													| "Pending"
													| "Confirmed"
													| "Completed",
												type: b.type as "Dharamshala" | "Temple",
											} as Booking)
								  )
								: []
						}
						loading={dharamshalaLoading}
						type="Dharamshala"
					/>

					<PoojaServicesList
						services={
							Array.isArray(poojaServices)
								? poojaServices.map(
										(s) =>
											({
												...s,
												status: s.status as "Active" | "Inactive",
											} as PoojaService)
								  )
								: []
						}
						loading={poojaLoading}
					/>
				</div>
			</div>

			{/* Bottom Row */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				<BookingsTable
					bookings={
						Array.isArray(templeBookings)
							? templeBookings.map(
									(b) =>
										({
											...b,
											status: b.status as "Pending" | "Confirmed" | "Completed",
											type: b.type as "Dharamshala" | "Temple",
										} as Booking)
							  )
							: []
					}
					loading={templeLoading}
					type="Temple"
				/>

				<BookmarksList
					bookmarks={
						Array.isArray(bookmarks)
							? bookmarks.map(
									(b) =>
										({
											...b,
											type: b.type as
												| "Temple"
												| "Event"
												| "Dharamshala"
												| "PoojaService",
										} as Bookmark)
							  )
							: []
					}
					loading={bookmarksLoading}
				/>

				<EventRequestsTable
					requests={
						Array.isArray(eventRequests)
							? eventRequests.map(
									(r) =>
										({
											...r,
											status: r.status as "Pending" | "Approved" | "Rejected",
										} as EventRequest)
							  )
							: []
					}
					loading={requestsLoading}
				/>
			</div>
		</div>
	);
}

// --- Example Usage ---
// import KathavachakDashboard from "./kathavachak-dashboard";
// <KathavachakDashboard />
