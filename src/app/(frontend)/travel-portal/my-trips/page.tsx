"use client";
import { useEffect, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, Search } from "lucide-react";
import Link from "next/link";

interface Booking {
	id: string;
	destination: {
		name: string;
		location?: string;
	};
	date: string;
	status: string;
}

export default function MyTripsPage() {
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("all");

	useEffect(() => {
		setLoading(true);
		fetch("/api/bookings")
			.then((res) => res.json())
			.then((data) => {
				setBookings(data);
			})
			.catch((error) => {
				console.error("Error fetching bookings:", error);
				setBookings([]);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	const filteredBookings = bookings.filter((booking) => {
		if (statusFilter === "all") return true;
		return booking.status.toLowerCase() === statusFilter.toLowerCase();
	});

	const getStatusVariant = (status: string) => {
		switch (status.toUpperCase()) {
			case "CONFIRMED":
				return "default";
			case "PENDING":
				return "secondary";
			case "COMPLETED":
				return "outline";
			case "CANCELLED":
				return "destructive";
			default:
				return "secondary";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status.toUpperCase()) {
			case "CONFIRMED":
				return "text-green-600 bg-green-50 dark:bg-green-950/20";
			case "PENDING":
				return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20";
			case "COMPLETED":
				return "text-blue-600 bg-blue-50 dark:bg-blue-950/20";
			case "CANCELLED":
				return "text-red-600 bg-red-50 dark:bg-red-950/20";
			default:
				return "";
		}
	};

	const upcomingTrips = bookings.filter(
		(b) => new Date(b.date) > new Date() && b.status !== "CANCELLED"
	).length;

	const completedTrips = bookings.filter(
		(b) => b.status === "COMPLETED"
	).length;

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-2">My Trips</h1>
					<p className="text-muted-foreground">
						Manage and track all your bookings
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Total Bookings
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold">{bookings.length}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Upcoming Trips
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-green-600">
								{upcomingTrips}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Completed
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-blue-600">
								{completedTrips}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filters and Table */}
				<Card>
					<CardHeader>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<CardTitle>Booking History</CardTitle>
							<div className="flex items-center gap-3">
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Filter by status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Status</SelectItem>
										<SelectItem value="pending">Pending</SelectItem>
										<SelectItem value="confirmed">Confirmed</SelectItem>
										<SelectItem value="completed">Completed</SelectItem>
										<SelectItem value="cancelled">Cancelled</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<div className="space-y-3">
								{[...Array(5)].map((_, i) => (
									<div key={i} className="flex items-center gap-4">
										<Skeleton className="h-12 flex-1" />
										<Skeleton className="h-12 w-32" />
										<Skeleton className="h-12 w-24" />
									</div>
								))}
							</div>
						) : filteredBookings.length === 0 ? (
							<div className="py-12 text-center">
								<div className="flex justify-center mb-4">
									<div className="rounded-full bg-secondary p-4">
										<Search className="h-8 w-8 text-muted-foreground" />
									</div>
								</div>
								<h3 className="text-lg font-semibold mb-2">
									{bookings.length === 0
										? "No trips yet"
										: "No trips match your filters"}
								</h3>
								<p className="text-muted-foreground mb-6">
									{bookings.length === 0
										? "Start planning your spiritual journey today!"
										: "Try adjusting your filters to see more results"}
								</p>
								{bookings.length === 0 && (
									<Link href="/travel-portal/destinations">
										<Button>Explore Destinations</Button>
									</Link>
								)}
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Destination</TableHead>
											<TableHead>Location</TableHead>
											<TableHead>Travel Date</TableHead>
											<TableHead>Booked On</TableHead>
											<TableHead>Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredBookings.map((booking) => (
											<TableRow key={booking.id}>
												<TableCell className="font-medium">
													{booking.destination.name}
												</TableCell>
												<TableCell>
													<div className="flex items-center text-muted-foreground">
														<MapPin className="h-4 w-4 mr-1" />
														<span>{booking.destination.location || "N/A"}</span>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center">
														<Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
														{new Date(booking.date).toLocaleDateString(
															"en-IN",
															{
																year: "numeric",
																month: "short",
																day: "numeric",
															}
														)}
													</div>
												</TableCell>
												<TableCell className="text-muted-foreground text-sm">
													{new Date(booking.date).toLocaleDateString("en-IN", {
														year: "numeric",
														month: "short",
														day: "numeric",
													})}
												</TableCell>
												<TableCell>
													<Badge
														variant={getStatusVariant(booking.status)}
														className={getStatusColor(booking.status)}
													>
														{booking.status}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
