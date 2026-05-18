"use client";
import { useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Calendar, Car, MapPin, Plane, Search } from "lucide-react";
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

type TripTab = "flights" | "hotels" | "cabs";

function isHotelBooking(booking: Booking): boolean {
	return booking.transportType === "hotel";
}

function isCabBooking(booking: Booking): boolean {
	return (
		booking.transportType === "cab" || booking.source === "TRIPJACK_CAB"
	);
}

function isFlightBooking(booking: Booking): boolean {
	return !isHotelBooking(booking) && !isCabBooking(booking);
}

function formatDate(iso: string | undefined | null): string {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleDateString("en-IN", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function matchesStatusFilter(booking: Booking, statusFilter: string): boolean {
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
}

function getStatusVariant(status: string) {
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
}

function getStatusColor(status: string) {
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
}

function StatusBadge({ status }: { status: string }) {
	return (
		<Badge
			variant={getStatusVariant(status)}
			className={getStatusColor(status)}
		>
			{status}
		</Badge>
	);
}

function getFlightPnr(booking: Booking): string {
	if (booking.tripjackAirlinePnr?.trim()) return booking.tripjackAirlinePnr;
	if (booking.airlinePnr?.trim()) return booking.airlinePnr;
	if (booking.airIqPnr?.trim()) return booking.airIqPnr;
	if (booking.tboPnr?.trim()) return booking.tboPnr;
	return "—";
}

function getProviderLabel(source: string | null | undefined): string {
	if (!source) return "—";
	return source.replace(/_/g, " ");
}

function buildHotelConfirmationHref(booking: Booking): string | null {
	const hasHotelDetails =
		Boolean(booking.tripjackBookingId?.trim()) || Boolean(booking.id);
	if (!hasHotelDetails) return null;
	const q = new URLSearchParams();
	const hotelRef = booking.tripjackBookingId?.trim() || booking.id;
	q.set("bookingId", hotelRef);
	if (booking.source === "TBO") q.set("source", "TBO");
	if (booking.hotelName) q.set("hotelName", booking.hotelName);
	if (booking.checkIn) q.set("checkIn", booking.checkIn.slice(0, 10));
	if (booking.checkOut) q.set("checkOut", booking.checkOut.slice(0, 10));
	return `/travel-portal/hotel-booking-confirmation?${q.toString()}`;
}

function buildFlightConfirmationHref(booking: Booking): string | null {
	const hasTripjackFlightDetails =
		booking.tripjackBookingId != null && booking.tripjackBookingId.trim() !== "";
	const hasTboDetails =
		(booking.tboBookingId != null && booking.tboBookingId > 0) ||
		(booking.tboPnr != null && booking.tboPnr.trim() !== "");
	const hasAiriqDetails =
		(booking.airIqPnr != null && booking.airIqPnr.trim() !== "") ||
		(booking.airlinePnr != null && booking.airlinePnr.trim() !== "");

	if (!hasTripjackFlightDetails && !hasTboDetails && !hasAiriqDetails) {
		return null;
	}

	const q = new URLSearchParams();
	if (hasTripjackFlightDetails) {
		q.set("source", "tripjack");
		q.set("bookingId", booking.tripjackBookingId!);
	} else if (hasTboDetails) {
		if (booking.tboBookingId != null && booking.tboBookingId > 0) {
			q.set("bookingId", String(booking.tboBookingId));
		}
		if (booking.tboPnr) q.set("pnr", booking.tboPnr);
		if (booking.leadFirstName) q.set("firstName", booking.leadFirstName);
		if (booking.leadLastName) q.set("lastName", booking.leadLastName);
		q.set("source", "tbo");
	} else if (hasAiriqDetails) {
		q.set("source", "airiq");
		if (booking.airIqPnr) q.set("airIqPNR", booking.airIqPnr);
		if (booking.airlinePnr) q.set("airlinePNR", booking.airlinePnr);
	}
	return `/travel-portal/booking/confirmation?${q.toString()}`;
}

function getFlightRouteLabel(booking: Booking): string {
	const isAiriqFlight =
		booking.source === "AIRiQ" ||
		Boolean(booking.airIqPnr?.trim()) ||
		Boolean(booking.airlinePnr?.trim());
	return (
		booking.destination?.name ??
		(isAiriqFlight && booking.fromLocation
			? booking.fromLocation
			: booking.source === "TRIPJACK" ||
					Boolean(booking.tripjackBookingId?.trim())
				? "Flight booking"
				: isAiriqFlight
					? "Flight booking"
					: "—")
	);
}

function EmptyTabState({
	tabLabel,
	hasAnyBookings,
	filterActive,
}: {
	tabLabel: string;
	hasAnyBookings: boolean;
	filterActive: boolean;
}) {
	return (
		<div className="py-12 text-center">
			<div className="flex justify-center mb-4">
				<div className="rounded-full bg-secondary p-4">
					<Search className="h-8 w-8 text-muted-foreground" />
				</div>
			</div>
			<h3 className="text-lg font-semibold mb-2">
				{!hasAnyBookings
					? `No ${tabLabel.toLowerCase()} bookings yet`
					: `No ${tabLabel.toLowerCase()} match your filters`}
			</h3>
			<p className="text-muted-foreground mb-6">
				{!hasAnyBookings
					? `Your ${tabLabel.toLowerCase()} will appear here after you book.`
					: "Try adjusting your status filter to see more results"}
			</p>
			{!hasAnyBookings && !filterActive && tabLabel === "Flights" && (
				<Link href="/travel-portal">
					<Button>Search flights</Button>
				</Link>
			)}
		</div>
	);
}

function FlightsTable({ bookings }: { bookings: Booking[] }) {
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Route</TableHead>
						<TableHead className="max-w-[180px]">From</TableHead>
						<TableHead>Departure</TableHead>
						<TableHead>Return</TableHead>
						<TableHead>PNR</TableHead>
						<TableHead>Provider</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Booked on</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{bookings.map((booking) => {
						const href = buildFlightConfirmationHref(booking);
						const route = getFlightRouteLabel(booking);
						const from =
							booking.fromLocation ||
							booking.destination?.location ||
							"—";
						return (
							<TableRow key={booking.id}>
								<TableCell className="font-medium">{route}</TableCell>
								<TableCell className="max-w-[180px] truncate text-muted-foreground">
									{from}
								</TableCell>
								<TableCell>
									<div className="flex items-center whitespace-nowrap">
										<Calendar className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
										{formatDate(booking.travelDate || booking.date)}
									</div>
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{formatDate(booking.returnDate)}
								</TableCell>
								<TableCell className="font-mono text-sm">
									{getFlightPnr(booking)}
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{getProviderLabel(booking.source)}
								</TableCell>
								<TableCell>
									<StatusBadge status={booking.status} />
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{formatDate(booking.date)}
								</TableCell>
								<TableCell className="text-right">
									{href ? (
										<Link
											href={href}
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
	);
}

function HotelsTable({ bookings }: { bookings: Booking[] }) {
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Hotel</TableHead>
						<TableHead className="max-w-[160px]">Location</TableHead>
						<TableHead>Check-in</TableHead>
						<TableHead>Check-out</TableHead>
						<TableHead>Provider</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Booked on</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{bookings.map((booking) => {
						const href = buildHotelConfirmationHref(booking);
						const hotelName =
							booking.hotelName ||
							booking.destination?.name ||
							"Hotel stay";
						const location =
							booking.destination?.location ||
							getProviderLabel(booking.source);
						return (
							<TableRow key={booking.id}>
								<TableCell className="font-medium">{hotelName}</TableCell>
								<TableCell className="max-w-[160px]">
									<div className="flex min-w-0 items-center gap-1 text-muted-foreground">
										<MapPin className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
										<span className="truncate" title={location}>
											{location}
										</span>
									</div>
								</TableCell>
								<TableCell>{formatDate(booking.checkIn || booking.travelDate)}</TableCell>
								<TableCell>{formatDate(booking.checkOut || booking.returnDate)}</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{getProviderLabel(booking.source)}
								</TableCell>
								<TableCell>
									<StatusBadge status={booking.status} />
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{formatDate(booking.date)}
								</TableCell>
								<TableCell className="text-right">
									{href ? (
										<Link
											href={href}
											className="text-blue-600 hover:underline text-sm font-medium"
										>
											View booking
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
	);
}

function CabsTable({ bookings }: { bookings: Booking[] }) {
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Trip</TableHead>
						<TableHead className="max-w-[200px]">Route</TableHead>
						<TableHead>Pickup date</TableHead>
						<TableHead>Provider</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Booked on</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{bookings.map((booking) => {
						const tripName =
							booking.destination?.name || "Cab transfer";
						const route =
							booking.fromLocation ||
							booking.destination?.location ||
							"—";
						return (
							<TableRow key={booking.id}>
								<TableCell className="font-medium">{tripName}</TableCell>
								<TableCell className="max-w-[200px]">
									<div className="flex min-w-0 items-center gap-1 text-muted-foreground">
										<MapPin className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
										<span className="truncate" title={route}>
											{route}
										</span>
									</div>
								</TableCell>
								<TableCell>
									<div className="flex items-center whitespace-nowrap">
										<Calendar className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
										{formatDate(booking.travelDate || booking.date)}
									</div>
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{getProviderLabel(booking.source)}
								</TableCell>
								<TableCell>
									<StatusBadge status={booking.status} />
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{formatDate(booking.date)}
								</TableCell>
								<TableCell className="text-right">
									<Link
										href={`/travel-portal/cab-booking/${booking.id}`}
										className="text-blue-600 hover:underline text-sm font-medium"
									>
										View booking
									</Link>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

export default function MyTripsPage() {
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [authError, setAuthError] = useState(false);
	const [activeTab, setActiveTab] = useState<TripTab>("flights");

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
					throw new Error(
						res.ok
							? "Invalid response"
							: res.statusText || "Failed to fetch bookings",
					);
				}
				if (!res.ok) {
					if (res.status === 401) {
						setAuthError(true);
						setBookings([]);
						return [];
					}
					const message =
						typeof data === "object" &&
						data !== null &&
						"error" in data &&
						typeof (data as { error: unknown }).error === "string"
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

	const flightBookings = useMemo(
		() => bookings.filter(isFlightBooking),
		[bookings],
	);
	const hotelBookings = useMemo(
		() => bookings.filter(isHotelBooking),
		[bookings],
	);
	const cabBookings = useMemo(() => bookings.filter(isCabBooking), [bookings]);

	const filterActive = statusFilter !== "all";

	const filteredFlights = useMemo(
		() => flightBookings.filter((b) => matchesStatusFilter(b, statusFilter)),
		[flightBookings, statusFilter],
	);
	const filteredHotels = useMemo(
		() => hotelBookings.filter((b) => matchesStatusFilter(b, statusFilter)),
		[hotelBookings, statusFilter],
	);
	const filteredCabs = useMemo(
		() => cabBookings.filter((b) => matchesStatusFilter(b, statusFilter)),
		[cabBookings, statusFilter],
	);

	const upcomingTrips = bookings.filter((b) => {
		const tripStart = new Date(b.travelDate || b.date);
		return tripStart > new Date() && b.status.toUpperCase() !== "CANCELLED";
	}).length;

	const completedTrips = bookings.filter(
		(b) => b.status === "COMPLETED",
	).length;

	const tabConfig: {
		value: TripTab;
		label: string;
		icon: typeof Plane;
		all: Booking[];
		filtered: Booking[];
	}[] = [
		{
			value: "flights",
			label: "Flights",
			icon: Plane,
			all: flightBookings,
			filtered: filteredFlights,
		},
		{
			value: "hotels",
			label: "Hotels",
			icon: Building2,
			all: hotelBookings,
			filtered: filteredHotels,
		},
		{
			value: "cabs",
			label: "Cabs",
			icon: Car,
			all: cabBookings,
			filtered: filteredCabs,
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-2">My Trips</h1>
					<p className="text-muted-foreground">
						Flights, hotels, and cabs in one place
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

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Total Bookings
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold">{bookings.length}</div>
							<p className="text-xs text-muted-foreground mt-1">
								{flightBookings.length} flights · {hotelBookings.length} hotels ·{" "}
								{cabBookings.length} cabs
							</p>
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

				<Card>
					<CardHeader>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<CardTitle>Booking history</CardTitle>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All status</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="confirmed">Confirmed</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardHeader>
					<CardContent>
						<Tabs
							value={activeTab}
							onValueChange={(v) => setActiveTab(v as TripTab)}
							className="gap-4"
						>
							<TabsList className="w-full sm:w-auto h-auto flex-wrap">
								{tabConfig.map(({ value, label, icon: Icon, all }) => (
									<TabsTrigger
										key={value}
										value={value}
										className="gap-1.5 px-4"
									>
										<Icon className="h-4 w-4" />
										{label}
										<span className="text-muted-foreground">({all.length})</span>
									</TabsTrigger>
								))}
							</TabsList>

							{loading ? (
								<div className="space-y-3 pt-2">
									{[...Array(5)].map((_, i) => (
										<div key={i} className="flex items-center gap-4">
											<Skeleton className="h-12 flex-1" />
											<Skeleton className="h-12 w-32" />
											<Skeleton className="h-12 w-24" />
										</div>
									))}
								</div>
							) : (
								<>
									<TabsContent value="flights" className="mt-0">
										{filteredFlights.length === 0 ? (
											<EmptyTabState
												tabLabel="Flights"
												hasAnyBookings={flightBookings.length > 0}
												filterActive={filterActive}
											/>
										) : (
											<FlightsTable bookings={filteredFlights} />
										)}
									</TabsContent>
									<TabsContent value="hotels" className="mt-0">
										{filteredHotels.length === 0 ? (
											<EmptyTabState
												tabLabel="Hotels"
												hasAnyBookings={hotelBookings.length > 0}
												filterActive={filterActive}
											/>
										) : (
											<HotelsTable bookings={filteredHotels} />
										)}
									</TabsContent>
									<TabsContent value="cabs" className="mt-0">
										{filteredCabs.length === 0 ? (
											<EmptyTabState
												tabLabel="Cabs"
												hasAnyBookings={cabBookings.length > 0}
												filterActive={filterActive}
											/>
										) : (
											<CabsTable bookings={filteredCabs} />
										)}
									</TabsContent>
								</>
							)}
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
