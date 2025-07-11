"use client";
import React, { useEffect, useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Plus, Check, X, Download } from "lucide-react";

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

// Profile Card
function ProfileCard({
	profile,
	loading,
}: {
	profile: KathavachakProfile | null;
	loading: boolean;
}) {
	return (
		<Card className="flex flex-row items-center gap-4 p-4">
			{loading ? (
				<Skeleton className="h-16 w-16 rounded-full" />
			) : (
				<Avatar className="h-16 w-16">
					{profile?.avatarUrl ? (
						<AvatarImage src={profile.avatarUrl} alt={profile.name} />
					) : (
						<AvatarFallback>{profile?.name?.[0]}</AvatarFallback>
					)}
				</Avatar>
			)}
			<div className="flex flex-col gap-1">
				<span className="font-semibold text-lg">
					{profile?.name || <Skeleton className="h-6 w-32" />}
				</span>
				<span className="text-sm text-muted-foreground">
					{profile?.contact || <Skeleton className="h-4 w-24" />}
				</span>
				<div className="flex items-center gap-1 mt-1">
					<Badge variant="secondary">
						⭐ {profile?.rating?.toFixed(2) ?? <Skeleton className="h-4 w-8" />}
					</Badge>
				</div>
			</div>
		</Card>
	);
}

// Summary Cards
function SummaryCards({
	summaries,
	loading,
}: {
	summaries: Summary[];
	loading: boolean;
}) {
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
			{loading
				? Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-24 w-full rounded" />
				  ))
				: summaries.map((s, i) => (
						<Card key={i} className="flex-1 min-w-[120px]">
							<CardHeader className="pb-2 flex flex-row items-center justify-between">
								<CardTitle className="text-sm font-medium">{s.label}</CardTitle>
								{s.icon}
							</CardHeader>
							<CardContent>
								<span className="text-2xl font-bold" style={{ color: s.color }}>
									{s.value}
								</span>
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
		<Card>
			<CardHeader>
				<CardTitle>Upcoming Events</CardTitle>
				<CardDescription>Recent or upcoming events</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Location</TableHead>
							<TableHead>Status</TableHead>
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
									<TableRow key={event.id}>
										<TableCell>{event.name}</TableCell>
										<TableCell>{event.date}</TableCell>
										<TableCell>{event.location}</TableCell>
										<TableCell>
											<Badge
												variant={
													event.status === "Upcoming"
														? "default"
														: event.status === "Completed"
														? "secondary"
														: "destructive"
												}
											>
												{event.status}
											</Badge>
										</TableCell>
									</TableRow>
							  ))}
					</TableBody>
				</Table>
				<div className="flex justify-end mt-2 gap-2">
					<Button size="sm" variant="outline">
						<Plus className="h-4 w-4 mr-1" />
						Add Event
					</Button>
					<Button size="sm" variant="ghost">
						View All
					</Button>
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
										<EditIcon />
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
		<Card>
			<CardHeader>
				<CardTitle>Bookings & Events Analytics</CardTitle>
				<CardDescription>Distribution of booking types</CardDescription>
			</CardHeader>
			<CardContent className="h-64 flex flex-col md:flex-row gap-4 items-center justify-center">
				{loading ? (
					<Skeleton className="w-full h-56 rounded" />
				) : (
					<>
						<ResponsiveContainer width="50%" height={220}>
							<PieChart>
								<Pie
									data={data}
									dataKey="value"
									nameKey="type"
									cx="50%"
									cy="50%"
									outerRadius={70}
									label
								>
									{data.map((_, idx) => (
										<Cell
											key={`cell-${idx}`}
											fill={PIE_COLORS[idx % PIE_COLORS.length]}
										/>
									))}
								</Pie>
								<Legend />
							</PieChart>
						</ResponsiveContainer>
						<ResponsiveContainer width="50%" height={220}>
							<BarChart data={data} margin={{ left: 20 }}>
								<XAxis dataKey="type" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</>
				)}
			</CardContent>
		</Card>
	);
}

// --- Main KathavachakDashboard Component ---
export default function KathavachakDashboard() {
	// Simulate async fetches
	const { data: profile, loading: profileLoading } = useMockFetch(async () => {
		await new Promise((r) => setTimeout(r, 500));
		return {
			id: "kathavachak-1",
			name: "Swami Vivekananda",
			avatarUrl: undefined,
			contact: "+91-9876543210",
			rating: 4.92,
			bio: "Spiritual orator and kathavachak.",
		};
	}, []);

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

	// --- Layout ---
	return (
		<div className="flex flex-col gap-6 w-full">
			{/* Top: Profile + Summary */}
			<div className="flex flex-col md:flex-row gap-4 w-full">
				<div className="md:w-1/4 w-full">
					<ProfileCard profile={profile} loading={profileLoading} />
				</div>
				<div className="flex-1">
					<SummaryCards
						summaries={summaries || []}
						loading={summariesLoading}
					/>
				</div>
			</div>

			{/* Analytics Chart */}
			<AnalyticsCharts data={analytics || []} loading={analyticsLoading} />

			{/* Main Grid: Events, Bookings, Services, Bookmarks, Requests */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
				<BookingsTable
					bookings={
						Array.isArray(dharamshalaBookings)
							? dharamshalaBookings.map(
									(b) =>
										({
											...b,
											status: b.status as "Pending" | "Confirmed" | "Completed",
											type: b.type as "Dharamshala" | "Temple",
										} as Booking)
							  )
							: []
					}
					loading={dharamshalaLoading}
					type="Dharamshala"
				/>
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

// --- Icon for Edit (inline, shadcn style) ---
function EditIcon() {
	return (
		<svg
			width="16"
			height="16"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth="2"
			className="h-4 w-4 text-muted-foreground"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.94l-4.243 1.415 1.415-4.243a4 4 0 01.94-1.414z"
			/>
		</svg>
	);
}

// --- Example Usage ---
// import KathavachakDashboard from "./kathavachak-dashboard";
// <KathavachakDashboard />
