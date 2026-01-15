"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
	Clock,
	Plane,
	Hotel,
	CreditCard,
	FileText,
	Shield,
	ArrowLeft,
	Globe,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import type { LucideIcon } from "lucide-react";

interface Snapshot {
	id: string;
	bookingId: string | null;
	userId: string | null;
	type: "flight" | "hotel";
	page: string;
	snapshotJson: Record<string, unknown>;
	hash: string;
	ip: string | null;
	userAgent: string | null;
	traceId: string | null;
	resultIndex: string | null;
	createdAt: string;
}

const pageIcons: Record<string, LucideIcon> = {
	flight_results: Plane,
	flight_review: FileText,
	payment: CreditCard,
	hotel_results: Hotel,
	hotel_review: FileText,
};

const pageLabels: Record<string, string> = {
	flight_results: "Flight Selection",
	flight_review: "Booking Review",
	payment: "Payment",
	hotel_results: "Hotel Selection",
	hotel_review: "Booking Review",
};

export default function BookingAuditPage() {
	const params = useParams();
	const bookingId = params.id as string;
	const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchSnapshots = async () => {
			try {
				setLoading(true);
				// Try bookingId first, then traceId as fallback
				let response = await fetch(
					`/api/audit/snapshot?bookingId=${bookingId}`
				);
				let result = await response.json();

				// If no snapshots found by bookingId, try traceId
				if (!result.success || !result.snapshots || result.snapshots.length === 0) {
					response = await fetch(
						`/api/audit/snapshot?traceId=${bookingId}`
					);
					result = await response.json();
				}

				if (!result.success) {
					throw new Error(result.error || "Failed to fetch snapshots");
				}

				setSnapshots(result.snapshots || []);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to load snapshots"
				);
				toast.error("Failed to load audit trail");
			} finally {
				setLoading(false);
			}
		};

		if (bookingId) {
			fetchSnapshots();
		}
	}, [bookingId]);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	const renderSnapshotData = (data: Record<string, unknown>, type: string) => {
		if (!data) return <p className="text-muted-foreground">No data</p>;

		if (type === "flight") {
			const origin = typeof data.origin === "string" ? data.origin : null;
			const destination = typeof data.destination === "string" ? data.destination : null;
			const airline = typeof data.airline === "string" ? data.airline : null;
			const flightNumber = typeof data.flightNumber === "string" ? data.flightNumber : null;
			const fare = typeof data.fare === "number" ? data.fare : null;
			
			return (
				<div className="space-y-3">
					{origin && destination && (
						<div className="flex items-center gap-2">
							<Plane className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium">
								{origin} → {destination}
							</span>
						</div>
					)}
					{airline && (
						<div>
							<span className="text-sm text-muted-foreground">Airline: </span>
							<span className="font-medium">{airline}</span>
						</div>
					)}
					{flightNumber && (
						<div>
							<span className="text-sm text-muted-foreground">
								Flight Number:{" "}
							</span>
							<span className="font-medium">{flightNumber}</span>
						</div>
					)}
					{fare !== null && (
						<div>
							<span className="text-sm text-muted-foreground">Fare: </span>
							<span className="font-medium text-green-600">
								₹{fare.toLocaleString("en-IN")}
							</span>
						</div>
					)}
					{(() => {
						const passengers = data.passengers && typeof data.passengers === "object" && !Array.isArray(data.passengers)
							? data.passengers as { adults?: number; children?: number; infants?: number }
							: null;
						return passengers && (
							<div>
								<span className="text-sm text-muted-foreground">
									Passengers:{" "}
								</span>
								<span className="font-medium">
									{passengers.adults || 0} Adults,{" "}
									{passengers.children || 0} Children,{" "}
									{passengers.infants || 0} Infants
								</span>
							</div>
						);
					})()}
					{typeof data.cabinClass === "string" && data.cabinClass && (
						<div>
							<span className="text-sm text-muted-foreground">
								Cabin Class:{" "}
							</span>
							<span className="font-medium">{data.cabinClass}</span>
						</div>
					)}
				</div>
			);
		}

		if (type === "hotel") {
			const hotelName = typeof data.hotelName === "string" ? data.hotelName : null;
			const room = data.room && typeof data.room === "object" && !Array.isArray(data.room)
				? data.room as { name?: string }
				: null;
			const checkIn = typeof data.checkIn === "string" ? data.checkIn : null;
			const checkOut = typeof data.checkOut === "string" ? data.checkOut : null;
			const totalPrice = typeof data.totalPrice === "number" ? data.totalPrice : null;
			
			return (
				<div className="space-y-3">
					{hotelName && (
						<div>
							<span className="text-sm text-muted-foreground">Hotel: </span>
							<span className="font-medium">{hotelName}</span>
						</div>
					)}
					{room && room.name && (
						<div>
							<span className="text-sm text-muted-foreground">Room: </span>
							<span className="font-medium">{room.name}</span>
						</div>
					)}
					{checkIn && checkOut && (
						<div>
							<span className="text-sm text-muted-foreground">Dates: </span>
							<span className="font-medium">
								{checkIn} - {checkOut}
							</span>
						</div>
					)}
					{totalPrice !== null && (
						<div>
							<span className="text-sm text-muted-foreground">Total: </span>
							<span className="font-medium text-green-600">
								₹{totalPrice.toLocaleString("en-IN")}
							</span>
						</div>
					)}
				</div>
			);
		}

		// Fallback: render as JSON
		return (
			<pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
				{JSON.stringify(data, null, 2)}
			</pre>
		);
	};

	if (loading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-4">
				<Card>
					<CardContent className="pt-6">
						<p className="text-destructive">{error}</p>
						<Button
							onClick={() => window.location.reload()}
							className="mt-4"
						>
							Retry
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-full overflow-x-hidden">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-4 flex-wrap">
						<Link href="/admin/travel-logs">
							<Button variant="ghost" size="sm">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back
							</Button>
						</Link>
						<h1 className="text-3xl font-bold">Booking Audit Trail</h1>
					</div>
					<p className="text-muted-foreground mt-2 break-words">
						Booking/Trace ID: <span className="font-mono break-all">{bookingId}</span>
					</p>
					{snapshots.length > 0 && (
						<div className="mt-2 space-y-1">
							<p className="text-sm text-muted-foreground">
								{snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""} captured
							</p>
							{snapshots[0]?.ip && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Globe className="h-3 w-3" />
									<span>User IP: </span>
									<span className="font-mono text-xs break-all">{snapshots[0].ip}</span>
								</div>
							)}
						</div>
					)}
				</div>
				<Badge variant="outline" className="flex items-center gap-2 shrink-0">
					<Shield className="h-4 w-4" />
					Legal Audit Trail
				</Badge>
			</div>

			{/* Snapshots Timeline */}
			{snapshots.length === 0 ? (
				<Card>
					<CardContent className="pt-6 text-center text-muted-foreground">
						No snapshots found for this booking.
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{snapshots.map((snapshot, _index) => {
						const PageIcon = pageIcons[snapshot.page] || FileText;
						const pageLabel = pageLabels[snapshot.page] || snapshot.page;

						return (
							<Card key={snapshot.id} className="relative overflow-hidden">
								<div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
								<CardHeader className="overflow-hidden">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
										<div className="flex items-center gap-3 min-w-0 flex-1">
											<div className="p-2 bg-primary/10 rounded-lg shrink-0">
												<PageIcon className="h-5 w-5 text-primary" />
											</div>
											<div className="min-w-0 flex-1">
												<CardTitle className="text-lg truncate">{pageLabel}</CardTitle>
												<div className="flex items-center gap-2 mt-1">
													<Clock className="h-3 w-3 text-muted-foreground shrink-0" />
													<span className="text-sm text-muted-foreground">
														{formatDate(snapshot.createdAt)}
													</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-2 shrink-0">
											<Badge
												variant={
													snapshot.type === "flight" ? "default" : "secondary"
												}
											>
												{snapshot.type}
											</Badge>
											<Badge variant="outline" className="text-xs">
												{snapshot.page}
											</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent className="overflow-hidden">
									<div className="space-y-4">
										{/* Snapshot Data */}
										<div className="border rounded-lg p-4 bg-muted/50 overflow-hidden">
											<h4 className="font-medium mb-3 text-sm">
												Snapshot Data
											</h4>
											<div className="overflow-x-auto">
												{renderSnapshotData(snapshot.snapshotJson, snapshot.type)}
											</div>
										</div>

										{/* Metadata */}
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
											{snapshot.ip && (
												<div className="min-w-0 flex items-center gap-2">
													<Globe className="h-3 w-3 text-muted-foreground shrink-0" />
													<div className="min-w-0 flex-1">
														<span className="text-muted-foreground">User IP: </span>
														<span className="font-mono text-xs break-all inline-block max-w-full">
															{snapshot.ip}
														</span>
													</div>
												</div>
											)}
											{snapshot.traceId && (
												<div className="min-w-0">
													<span className="text-muted-foreground">
														Trace ID:{" "}
													</span>
													<span className="font-mono text-xs break-all inline-block max-w-full">
														{snapshot.traceId}
													</span>
												</div>
											)}
											{snapshot.resultIndex && (
												<div className="min-w-0">
													<span className="text-muted-foreground">
														Result Index:{" "}
													</span>
													<span className="font-mono text-xs break-all inline-block max-w-full">
														{snapshot.resultIndex}
													</span>
												</div>
											)}
											{snapshot.userAgent && (
												<div className="min-w-0">
													<span className="text-muted-foreground">
														User Agent:{" "}
													</span>
													<span className="font-mono text-xs break-all inline-block max-w-full">
														{snapshot.userAgent.length > 50 
															? `${snapshot.userAgent.substring(0, 50)}...` 
															: snapshot.userAgent}
													</span>
												</div>
											)}
											<div className="min-w-0">
												<span className="text-muted-foreground">
													Hash:{" "}
												</span>
												<span className="font-mono text-xs break-all inline-block max-w-full">
													{snapshot.hash.substring(0, 16)}...
												</span>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
