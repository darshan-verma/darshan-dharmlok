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
	} | null;
	date: string;
	travelDate?: string;
	returnDate?: string | null;
	status: string;
	source?: string | null;
	tboBookingId?: number | null;
	tboPnr?: string | null;
	leadFirstName?: string | null;
	leadLastName?: string | null;
	airIqPnr?: string | null;
	airlinePnr?: string | null;
	tripjackBookingId?: string | null;
	tripjackAirlinePnr?: string | null;
	fromLocation?: string | null;
	transportType?: string | null;
	bookingSnapshot?: unknown;
	hotelName?: string;
	checkIn?: string;
	checkOut?: string;
}

export default function MyTripsPage() {
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [authError, setAuthError] = useState(false);

	useEffect(() => {
		setLoading(true);
		setAuthError(false);
		fetch("/api/bookings")
			.then(async (res) => {
				const text = await res.text();
				let data: unknown;
				try {
					data = text ? JSON.parse(text) : {};
				} catch {
					throw new Error(res.ok ? "Invalid response" : res.statusText || "Failed to fetch bookings");
				}
				if (!res.ok) {
					if (res.status === 401) {
						setAuthError(true);
						setBookings([]);
						return [];
					}
					const message = typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
						? (data as { error: string }).error
						: res.statusText || "Failed to fetch bookings";
					throw new Error(message);
				}
				return Array.isArray(data) ? data : [];
			})
			.then((data) => {
				setBookings(Array.isArray(data) ? data : []);
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
		const st = booking.status.toLowerCase();
		if (statusFilter === "pending") {
			return (
				st.includes("pending") ||
				st.includes("hold") ||
				st.includes("payment")
			);
		}
		if (statusFilter === "confirmed") {
			return (
				st.includes("confirm") ||
				st === "success" ||
				st.includes("ticketed") ||
				st === "on_hold"
			);
		}
		return st === statusFilter.toLowerCase();
	});

	const getStatusVariant = (status: string) => {
		switch (status.toUpperCase()) {
			case "CONFIRMED":
			case "SUCCESS":
				return "default";
			case "PENDING":
			case "PAYMENT_PENDING":
			case "ON_HOLD":
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
			case "SUCCESS":
				return "text-green-600 bg-green-50 dark:bg-green-950/20";
			case "PENDING":
			case "PAYMENT_PENDING":
			case "ON_HOLD":
				return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20";
			case "COMPLETED":
				return "text-blue-600 bg-blue-50 dark:bg-blue-950/20";
			case "CANCELLED":
				return "text-red-600 bg-red-50 dark:bg-red-950/20";
			default:
				return "";
		}
	};

	const upcomingTrips = bookings.filter((b) => {
		const tripStart = new Date(b.travelDate || b.date);
		return tripStart > new Date() && b.status.toUpperCase() !== "CANCELLED";
	}).length;

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

				{authError && (
					<Card className="mb-8 border-amber-500/50 bg-amber-500/10">
						<CardContent className="pt-6">
							<p className="text-amber-700 dark:text-amber-400 font-medium mb-2">
								Sign in to view your trips
							</p>
							<p className="text-muted-foreground text-sm mb-4">
								Your bookings will appear here once you are logged in.
							</p>
							<Button asChild variant="default">
								<Link href="/auth/signin">Sign in</Link>
							</Button>
						</CardContent>
					</Card>
				)}

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
											<TableHead className="max-w-[200px]">Location</TableHead>
											<TableHead>Travel Date</TableHead>
											<TableHead>Booked On</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredBookings.map((booking) => {
											const isHotel = booking.transportType === "hotel";
											const isCab =
												!isHotel &&
												(booking.transportType === "cab" ||
													booking.source === "TRIPJACK_CAB");
											const hasHotelDetails =
												isHotel &&
												Boolean(
													(booking.tripjackBookingId &&
														booking.tripjackBookingId.trim() !== "") ||
														booking.id,
												);
											const hasTripjackFlightDetails =
												!isCab &&
												!isHotel &&
												booking.tripjackBookingId != null &&
												booking.tripjackBookingId.trim() !== "";
											const hasTboDetails =
												(booking.tboBookingId != null && booking.tboBookingId > 0) ||
												(booking.tboPnr != null && booking.tboPnr.trim() !== "");
											const hasAiriqDetails =
												(booking.airIqPnr != null && booking.airIqPnr.trim() !== "") ||
												(booking.airlinePnr != null && booking.airlinePnr.trim() !== "");
											const hasCabDetails = isCab && Boolean(booking.id);
											const hasDetails =
												hasHotelDetails ||
												hasCabDetails ||
												hasTripjackFlightDetails ||
												hasTboDetails ||
												hasAiriqDetails;
											const hotelConfirmationQuery = new URLSearchParams();
											if (hasHotelDetails) {
												const hotelRef =
													booking.tripjackBookingId?.trim() ||
													booking.id;
												hotelConfirmationQuery.set("bookingId", hotelRef);
												if (booking.source === "TBO") {
													hotelConfirmationQuery.set("source", "TBO");
												}
												if (booking.hotelName) {
													hotelConfirmationQuery.set(
														"hotelName",
														booking.hotelName,
													);
												}
												if (booking.checkIn) {
													hotelConfirmationQuery.set(
														"checkIn",
														booking.checkIn.slice(0, 10),
													);
												}
												if (booking.checkOut) {
													hotelConfirmationQuery.set(
														"checkOut",
														booking.checkOut.slice(0, 10),
													);
												}
											}
											const confirmationQuery = new URLSearchParams();
											if (hasTripjackFlightDetails) {
												confirmationQuery.set("source", "tripjack");
												confirmationQuery.set("bookingId", booking.tripjackBookingId!);
											} else if (hasTboDetails) {
												if (booking.tboBookingId != null && booking.tboBookingId > 0)
													confirmationQuery.set("bookingId", String(booking.tboBookingId));
												if (booking.tboPnr) confirmationQuery.set("pnr", booking.tboPnr);
												if (booking.leadFirstName)
													confirmationQuery.set("firstName", booking.leadFirstName);
												if (booking.leadLastName)
													confirmationQuery.set("lastName", booking.leadLastName);
												confirmationQuery.set("source", "tbo");
											} else if (hasAiriqDetails) {
												confirmationQuery.set("source", "airiq");
												if (booking.airIqPnr)
													confirmationQuery.set("airIqPNR", booking.airIqPnr);
												if (booking.airlinePnr)
													confirmationQuery.set("airlinePNR", booking.airlinePnr);
											}
											const destName =
												booking.destination?.name ??
												(isHotel
													? booking.hotelName || "Hotel stay"
													: isCab
														? "Cab transfer"
														: booking.source === "TRIPJACK" ||
																hasTripjackFlightDetails
															? "Flight booking"
															: "—");
											const destLocation = isHotel
												? booking.checkIn && booking.checkOut
													? `${new Date(booking.checkIn).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} – ${new Date(booking.checkOut).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
													: booking.destination?.location || "Hotel"
												: booking.destination?.location ||
													booking.fromLocation ||
													"—";
											const departTs = booking.travelDate || booking.date;
											return (
												<TableRow key={booking.id}>
													<TableCell className="font-medium">{destName}</TableCell>
													<TableCell className="max-w-[200px] overflow-hidden align-middle">
														<div className="flex min-w-0 max-w-full items-center gap-1 text-muted-foreground">
															<MapPin
																className="h-4 w-4 shrink-0 text-red-500"
																aria-hidden
															/>
															<span
																className="min-w-0 truncate"
																title={
																	destLocation !== "—"
																		? destLocation
																		: undefined
																}
															>
																{destLocation}
															</span>
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center">
															<Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
															{new Date(departTs).toLocaleDateString("en-IN", {
																year: "numeric",
																month: "short",
																day: "numeric",
															})}
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
													<TableCell className="text-right">
														{hasHotelDetails ? (
															<Link
																href={`/travel-portal/hotel-booking-confirmation?${hotelConfirmationQuery.toString()}`}
																className="text-blue-600 hover:underline text-sm font-medium"
															>
																View booking
															</Link>
														) : hasCabDetails ? (
															<Link
																href={`/travel-portal/cab-booking/${booking.id}`}
																className="text-blue-600 hover:underline text-sm font-medium"
															>
																View booking
															</Link>
														) : hasDetails ? (
															<Link
																href={`/travel-portal/booking/confirmation?${confirmationQuery.toString()}`}
																className="text-blue-600 hover:underline text-sm font-medium"
															>
																View details
															</Link>
														) : (
															<span className="text-muted-foreground text-sm">—</span>
														)}
													</TableCell>
												</TableRow>
											);
										})}
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
