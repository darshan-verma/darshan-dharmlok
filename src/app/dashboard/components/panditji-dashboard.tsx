"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { userService } from "@/services/userService";
import type { FullUser } from "@/types/user";
import PanditjiProfileForm from "./panditji-profile-form";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	TrendingUp,
	Calendar,
	Star,
	Plus,
	Download,
	Receipt,
} from "lucide-react";

// --- Type Definitions ---
interface PanditjiProfile {
	id: string;
	name: string;
	profileImageUrl?: string;
	category?: string;
}

interface Summary {
	label: string;
	value: number | string;
	icon?: React.ReactNode;
	color?: string;
}

interface Booking {
	id: string;
	guest: string;
	date: string;
	status: "Pending" | "Confirmed" | "Completed";
	type: "Pooja" | "Other";
	poojaName: string;
}

interface PoojaService {
	id: string;
	name: string;
	price: number;
	status: "Active" | "Inactive";
}

interface Billing {
	id: string;
	date: string;
	amount: number;
	status: "Paid" | "Pending";
	description: string;
}

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
function SummaryCards({
	summaries,
	loading,
}: {
	summaries: Summary[];
	loading: boolean;
}) {
	const iconMap: Record<string, React.ReactNode> = {
		Bookings: <Calendar className="h-5 w-5 text-blue-600" />,
		"My Poojas": <Star className="h-5 w-5 text-yellow-600" />,
		Billings: <Receipt className="h-5 w-5 text-green-600" />,
	};
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
			{loading
				? Array.from({ length: 3 }).map((_, i) => (
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
									<span>+2.1% from last month</span>
								</div>
							</CardContent>
						</Card>
				  ))}
		</div>
	);
}

function BookingsTable({
	bookings,
	loading,
}: {
	bookings: Booking[];
	loading: boolean;
}) {
	return (
		<Card className="hover:shadow-lg transition-shadow duration-200">
			<CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
				<div className="flex items-center gap-2">
					<Calendar className="h-5 w-5 text-blue-600" />
					<CardTitle>Recent Bookings</CardTitle>
				</div>
				<CardDescription>Latest pooja bookings</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Pooja</TableHead>
							<TableHead>Guest</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading
							? Array.from({ length: 3 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={4}>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
							  ))
							: bookings.map((b) => (
									<TableRow key={b.id}>
										<TableCell>{b.poojaName}</TableCell>
										<TableCell>{b.guest}</TableCell>
										<TableCell>{formatDate(b.date)}</TableCell>
										<TableCell>
											<Badge
												variant={
													b.status === "Completed"
														? "default"
														: b.status === "Confirmed"
														? "secondary"
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
				<div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-gray-800">
					<Button size="sm" variant="ghost">
						View All
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

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
				<CardTitle>My Poojas</CardTitle>
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
									<span className="text-sm font-semibold">₹{s.price}</span>
								</div>
							</div>
					  ))}
			</CardContent>
		</Card>
	);
}

function BillingsTable({
	billings,
	loading,
}: {
	billings: Billing[];
	loading: boolean;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Billings</CardTitle>
				<CardDescription>Recent transactions</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading
							? Array.from({ length: 3 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={4}>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
							  ))
							: billings.map((b) => (
									<TableRow key={b.id}>
										<TableCell>{formatDate(b.date)}</TableCell>
										<TableCell>{b.description}</TableCell>
										<TableCell>₹{b.amount}</TableCell>
										<TableCell>
											<Badge
												variant={b.status === "Paid" ? "default" : "secondary"}
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
						Export CSV <Download className="h-4 w-4 ml-1" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// --- Main PanditjiDashboard Component ---
export default function PanditjiDashboard() {
	// Get session for real user profile image
	const { data: session } = useSession();
	const [profile, setProfile] = useState<PanditjiProfile | null>(null);
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
						name: user.name || "Panditji",
						profileImageUrl: user.profileImageUrl || undefined,
						category: user.category || "Panditji",
					});
				} catch {
					setProfile({
						id: session.user.id,
						name: session.user.name || "Panditji",
						profileImageUrl: session.user.image || undefined,
						category: "Panditji",
					});
				} finally {
					setProfileLoading(false);
				}
			} else {
				setProfile({
					id: "panditji-1",
					name: "Pt. Ram Sharma",
					profileImageUrl: undefined,
					category: "Panditji",
				});
				setProfileLoading(false);
			}
		}
		fetchProfile();
	}, [session]);

	const { data: summaries, loading: summariesLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 500));
			return [
				{ label: "Bookings", value: 12, color: "#6366f1" },
				{ label: "My Poojas", value: 5, color: "#fbbf24" },
				{ label: "Billings", value: "₹8,500", color: "#22c55e" },
			];
		}, []);

	const { data: bookings, loading: bookingsLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 600));
			return [
				{
					id: "b1",
					guest: "Amit",
					date: "2025-07-12",
					status: "Pending" as const,
					type: "Pooja" as const,
					poojaName: "Satyanarayan Katha",
				},
				{
					id: "b2",
					guest: "Priya",
					date: "2025-07-13",
					status: "Confirmed" as const,
					type: "Pooja" as const,
					poojaName: "Rudrabhishek",
				},
				{
					id: "b3",
					guest: "Suresh",
					date: "2025-07-10",
					status: "Completed" as const,
					type: "Pooja" as const,
					poojaName: "Navgrah Shanti",
				},
			];
		}, []);

	const { data: poojaServices, loading: poojaLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 500));
			return [
				{
					id: "p1",
					name: "Rudrabhishek",
					price: 2100,
					status: "Active" as const,
				},
				{
					id: "p2",
					name: "Satyanarayan Katha",
					price: 1500,
					status: "Active" as const,
				},
				{
					id: "p3",
					name: "Navgrah Shanti",
					price: 2500,
					status: "Inactive" as const,
				},
			];
		}, []);

	const { data: billings, loading: billingsLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 700));
			return [
				{
					id: "bl1",
					date: "2025-07-10",
					amount: 2500,
					status: "Paid" as const,
					description: "Navgrah Shanti",
				},
				{
					id: "bl2",
					date: "2025-07-12",
					amount: 1500,
					status: "Pending" as const,
					description: "Satyanarayan Katha",
				},
				{
					id: "bl3",
					date: "2025-07-13",
					amount: 2100,
					status: "Paid" as const,
					description: "Rudrabhishek",
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
					name: user.name || "Panditji",
					profileImageUrl: user.profileImageUrl || undefined,
					category: user.category || "Panditji",
				});
			} catch (error) {
				console.error("Failed to refresh profile:", error);
			}
		}
	};

	// --- Layout ---
	return (
		<div className="flex flex-col gap-8 w-full p-6">
			{/* Top: Profile + Summary */}
			<div className="flex flex-col xl:flex-row gap-6 w-full">
				<div className="xl:w-2/5 w-full">
					<PanditjiProfileForm
						profile={
							profile
								? {
										id: profile.id,
										name: profile.name,
										email: "",
										phone: "",
										addresses: [],
										profileImageUrl: profile.profileImageUrl,
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

			{/* Main Grid: Bookings, My Poojas, Billings */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				<div className="lg:col-span-2 xl:col-span-2">
					<BookingsTable bookings={bookings || []} loading={bookingsLoading} />
				</div>
				<div className="space-y-6">
					<PoojaServicesList
						services={poojaServices || []}
						loading={poojaLoading}
					/>
					<BillingsTable billings={billings || []} loading={billingsLoading} />
				</div>
			</div>
		</div>
	);
}
