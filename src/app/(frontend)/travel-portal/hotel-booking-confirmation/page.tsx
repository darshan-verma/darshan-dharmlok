"use client";

import React, {
	useState,
	useEffect,
	useCallback,
	useRef,
	Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	CheckCircle,
	XCircle,
	Clock,
	Loader2,
	Hotel,
	Calendar,
	AlertTriangle,
} from "lucide-react";
import { formatTravelPriceInr } from "@/lib/formatTravelPrice";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_DURATION_MS = 180000;

const TERMINAL_STATUSES = new Set([
	"SUCCESS",
	"ON_HOLD",
	"ABORTED",
	"FAILED",
	"CANCELLED",
]);

const PENDING_STATUSES = new Set([
	"IN_PROGRESS",
	"PAYMENT_SUCCESS",
	"PAYMENT_PENDING",
	"PENDING",
]);

interface BookingDetails {
	order?: {
		bookingId: string;
		amount: number;
		markup: number;
		status: string;
		createdOn: string;
		deliveryInfo?: {
			emails: string[];
			contacts: string[];
		};
	};
	itemInfos?: {
		HOTEL?: {
			hInfo?: {
				name: string;
				rt: number;
				ad?: { adr: string; ctn: string; cn: string };
				ops?: Array<{
					tp: number;
					ris?: Array<{
						rc: string;
						mb: string;
						tp: number;
						ti?: Array<{ fN: string; lN: string; ti: string }>;
					}>;
				}>;
			};
		};
	};
	status?: { success: boolean };
}

function ConfirmationContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const bookingId = searchParams.get("bookingId") || "";
	const hotelName = searchParams.get("hotelName") || "";
	const checkIn = searchParams.get("checkIn") || "";
	const checkOut = searchParams.get("checkOut") || "";

	const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
		null,
	);
	const [bookingStatus, setBookingStatus] = useState<string>("POLLING");
	const [error, setError] = useState<string | null>(null);
	const [elapsedMs, setElapsedMs] = useState(0);
	const pollStartRef = useRef(Date.now());
	const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

	const fetchDetails = useCallback(async () => {
		try {
			const response = await fetch(
				"/api/travel/tripjack-hotel/booking-details",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ bookingId }),
				},
			);

			const result = await response.json();
			if (!response.ok) {
				setError(result.error || "Failed to fetch booking details");
				return null;
			}

			setBookingDetails(result);
			return result.order?.status || null;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Network error");
			return null;
		}
	}, [bookingId]);

	useEffect(() => {
		if (!bookingId) {
			setError("No booking ID provided");
			setBookingStatus("ERROR");
			return;
		}

		pollStartRef.current = Date.now();

		const poll = async () => {
			const status = await fetchDetails();
			const elapsed = Date.now() - pollStartRef.current;
			setElapsedMs(elapsed);

			if (status && TERMINAL_STATUSES.has(status)) {
				setBookingStatus(status);
				if (timerRef.current) clearInterval(timerRef.current);
				return;
			}

			if (elapsed >= MAX_POLL_DURATION_MS) {
				setBookingStatus("TIMEOUT");
				if (timerRef.current) clearInterval(timerRef.current);
				return;
			}
		};

		// Initial fetch
		poll();

		// Poll every 5 seconds
		timerRef.current = setInterval(poll, POLL_INTERVAL_MS);

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [bookingId, fetchDetails]);

	const orderStatus = bookingDetails?.order?.status;
	const hotelInfo = bookingDetails?.itemInfos?.HOTEL?.hInfo;
	const displayName = hotelInfo?.name || hotelName;

	// Polling state
	if (bookingStatus === "POLLING" || PENDING_STATUSES.has(bookingStatus)) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Card className="max-w-lg w-full mx-4">
					<CardContent className="p-8 text-center space-y-6">
						<Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
						<div>
							<h2 className="text-xl font-bold text-gray-900 mb-2">
								Confirming Your Booking
							</h2>
							<p className="text-gray-600">
								Waiting for supplier confirmation...
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-gray-500">
								Booking ID: <span className="font-mono">{bookingId}</span>
							</p>
							{orderStatus && (
								<p className="text-sm text-blue-600">
									Status: {orderStatus.replace(/_/g, " ")}
								</p>
							)}
							<div className="w-full bg-gray-200 rounded-full h-2 mt-4">
								<div
									className="bg-blue-600 h-2 rounded-full transition-all duration-500"
									style={{
										width: `${Math.min((elapsedMs / MAX_POLL_DURATION_MS) * 100, 100)}%`,
									}}
								/>
							</div>
							<p className="text-xs text-gray-400">
								{Math.round(elapsedMs / 1000)}s / {MAX_POLL_DURATION_MS / 1000}s
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// SUCCESS
	if (bookingStatus === "SUCCESS") {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8 max-w-3xl">
					<div className="text-center mb-8">
						<CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
						<h1 className="text-2xl font-bold text-gray-900">
							Booking Confirmed!
						</h1>
						<p className="text-gray-600 mt-2">
							Your hotel booking has been successfully confirmed.
						</p>
					</div>

					<Card className="mb-6">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Hotel className="w-5 h-5" />
								Booking Details
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-gray-500">Booking ID</p>
									<p className="font-mono font-medium">
										{bookingDetails?.order?.bookingId || bookingId}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-500">Status</p>
									<span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full text-sm font-medium">
										<CheckCircle className="w-3.5 h-3.5" /> Confirmed
									</span>
								</div>
								<div>
									<p className="text-sm text-gray-500">Hotel</p>
									<p className="font-medium">{displayName}</p>
								</div>
								<div>
									<p className="text-sm text-gray-500">Amount</p>
									<p className="font-medium text-blue-600">
										{bookingDetails?.order?.amount != null
											? `₹${formatTravelPriceInr(bookingDetails.order.amount)}`
											: "—"}
									</p>
								</div>
								{(checkIn || checkOut) && (
									<>
										<div>
											<p className="text-sm text-gray-500">Check-in</p>
											<p className="flex items-center gap-1 font-medium">
												<Calendar className="w-4 h-4" /> {checkIn}
											</p>
										</div>
										<div>
											<p className="text-sm text-gray-500">Check-out</p>
											<p className="flex items-center gap-1 font-medium">
												<Calendar className="w-4 h-4" /> {checkOut}
											</p>
										</div>
									</>
								)}
							</div>

							{/* Room Details */}
							{hotelInfo?.ops?.[0]?.ris && (
								<div className="border-t pt-4 mt-4">
									<h3 className="text-sm font-medium text-gray-700 mb-3">
										Room Details
									</h3>
									{hotelInfo.ops[0].ris.map((room, idx) => (
										<div key={idx} className="bg-gray-50 rounded-lg p-3 mb-2">
											<p className="font-medium">{room.rc}</p>
											<p className="text-sm text-gray-500">
												{room.mb} — ₹{formatTravelPriceInr(room.tp)}
											</p>
											{room.ti && (
												<p className="text-sm text-gray-600 mt-1">
													Guests:{" "}
													{room.ti
														.map((t) => `${t.ti} ${t.fN} ${t.lN}`)
														.join(", ")}
												</p>
											)}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<div className="flex gap-4 justify-center">
						<Button
							variant="outline"
							onClick={() =>
								router.push(
									`/travel-portal/hotel-booking-manage?bookingId=${encodeURIComponent(bookingId)}`,
								)
							}
						>
							Manage Booking
						</Button>
						<Button onClick={() => router.push("/travel-portal/hotel-search")}>
							Search More Hotels
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// ON_HOLD
	if (bookingStatus === "ON_HOLD") {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8 max-w-3xl">
					<div className="text-center mb-8">
						<Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
						<h1 className="text-2xl font-bold text-gray-900">
							Room Held Successfully
						</h1>
						<p className="text-gray-600 mt-2">
							Your room is reserved. Please confirm before the deadline to
							complete the booking.
						</p>
					</div>

					<Card className="mb-6">
						<CardContent className="p-6 space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-gray-500">Booking ID</p>
									<p className="font-mono font-medium">{bookingId}</p>
								</div>
								<div>
									<p className="text-sm text-gray-500">Status</p>
									<span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-sm font-medium">
										<Clock className="w-3.5 h-3.5" /> On Hold
									</span>
								</div>
								<div>
									<p className="text-sm text-gray-500">Hotel</p>
									<p className="font-medium">{displayName}</p>
								</div>
								<div>
									<p className="text-sm text-gray-500">Amount</p>
									<p className="font-medium text-blue-600">
										{bookingDetails?.order?.amount != null
											? `₹${formatTravelPriceInr(bookingDetails.order.amount)}`
											: "—"}
									</p>
								</div>
							</div>

							<Alert className="bg-amber-50 border-amber-200">
								<AlertTriangle className="h-4 w-4 text-amber-600" />
								<AlertDescription className="text-sm">
									Confirm and pay before the deadline or the hold will be
									auto-cancelled.
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>

					<div className="flex gap-4 justify-center">
						<Button
							variant="outline"
							onClick={() => router.push("/travel-portal/hotel-search")}
						>
							Back to Search
						</Button>
						<Button
							className="bg-blue-600 hover:bg-blue-700"
							onClick={() =>
								router.push(
									`/travel-portal/hotel-booking-manage?bookingId=${encodeURIComponent(bookingId)}&action=confirm`,
								)
							}
						>
							Confirm & Pay
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// FAILED / ABORTED / TIMEOUT / ERROR
	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<Card className="max-w-lg w-full mx-4">
				<CardContent className="p-8 text-center space-y-6">
					<XCircle className="w-16 h-16 text-red-500 mx-auto" />
					<div>
						<h2 className="text-xl font-bold text-gray-900 mb-2">
							{bookingStatus === "TIMEOUT"
								? "Booking Confirmation Timed Out"
								: "Booking Failed"}
						</h2>
						<p className="text-gray-600">
							{bookingStatus === "TIMEOUT"
								? "The booking is still being processed. Please check back later."
								: error ||
									`Booking status: ${orderStatus || bookingStatus}. No charges have been applied.`}
						</p>
					</div>
					<div className="space-y-2">
						{bookingId && (
							<p className="text-sm text-gray-500">
								Booking ID: <span className="font-mono">{bookingId}</span>
							</p>
						)}
					</div>
					<div className="flex gap-4 justify-center">
						{bookingStatus === "TIMEOUT" && (
							<Button
								variant="outline"
								onClick={() =>
									router.push(
										`/travel-portal/hotel-booking-manage?bookingId=${encodeURIComponent(bookingId)}`,
									)
								}
							>
								Check Status
							</Button>
						)}
						<Button onClick={() => router.push("/travel-portal/hotel-search")}>
							Search Again
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function HotelBookingConfirmationPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gray-50 flex items-center justify-center">
					<Skeleton className="h-64 w-96" />
				</div>
			}
		>
			<ConfirmationContent />
		</Suspense>
	);
}
