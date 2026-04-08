"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	CheckCircle,
	XCircle,
	Clock,
	Hotel,
	Calendar,
	AlertTriangle,
	Loader2,
	CreditCard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { showToast } from "@/lib/toast";

interface BookingDetailsData {
	order?: {
		bookingId: string;
		amount: number;
		markup: number;
		status: string;
		createdOn: string;
		deliveryInfo?: {
			emails: string[];
			contacts: string[];
			code: string[];
		};
	};
	holdDeadline?: string; // ISO 8601 — present for ON_HOLD bookings
	itemInfos?: {
		HOTEL?: {
			hInfo?: {
				name: string;
				rt: number;
				ad?: { adr: string; ctn: string; cn: string };
				ops?: Array<{
					tp: number;
					cnp?: {
						ifra: boolean;
						inra: boolean;
						pd?: Array<{ fdt: string; tdt: string; am: number; pp: number }>;
					};
					ris?: Array<{
						rc: string;
						mb: string;
						tp: number;
						ti?: Array<{ fN: string; lN: string; ti: string; pt: string }>;
					}>;
				}>;
			};
		};
	};
	status?: { success: boolean };
}

const STATUS_CONFIG: Record<
	string,
	{ label: string; color: string; icon: LucideIcon }
> = {
	SUCCESS: {
		label: "Confirmed",
		color: "text-green-700 bg-green-50 border-green-200",
		icon: CheckCircle,
	},
	ON_HOLD: {
		label: "On Hold",
		color: "text-amber-700 bg-amber-50 border-amber-200",
		icon: Clock,
	},
	CANCELLED: {
		label: "Cancelled",
		color: "text-red-700 bg-red-50 border-red-200",
		icon: XCircle,
	},
	CANCELLATION_PENDING: {
		label: "Cancellation Pending",
		color: "text-orange-700 bg-orange-50 border-orange-200",
		icon: Clock,
	},
	FAILED: {
		label: "Failed",
		color: "text-red-700 bg-red-50 border-red-200",
		icon: XCircle,
	},
	ABORTED: {
		label: "Aborted",
		color: "text-red-700 bg-red-50 border-red-200",
		icon: XCircle,
	},
	IN_PROGRESS: {
		label: "Processing",
		color: "text-blue-700 bg-blue-50 border-blue-200",
		icon: Loader2,
	},
	PENDING: {
		label: "Pending",
		color: "text-gray-700 bg-gray-50 border-gray-200",
		icon: Clock,
	},
};

function ManageBookingContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const bookingIdParam = searchParams.get("bookingId") || "";
	const action = searchParams.get("action");

	const [bookingId, setBookingId] = useState(bookingIdParam);
	const [details, setDetails] = useState<BookingDetailsData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);
	const [isConfirming, setIsConfirming] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchDetails = useCallback(async (id: string) => {
		if (!id) return;
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(
				"/api/travel/tripjack-hotel/booking-details",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ bookingId: id }),
				},
			);
			const result = await response.json();
			if (!response.ok) {
				setError(result.error || "Failed to fetch booking details");
			} else {
				setDetails(result);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Network error");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (bookingIdParam) {
			fetchDetails(bookingIdParam);
		}
	}, [bookingIdParam, fetchDetails]);

	const handleLookup = (e: React.FormEvent) => {
		e.preventDefault();
		if (bookingId.trim()) {
			fetchDetails(bookingId.trim());
		}
	};

	const handleCancel = async () => {
		if (
			!confirm(
				"Are you sure you want to cancel this booking? Cancellation charges may apply.",
			)
		)
			return;

		setIsCancelling(true);
		try {
			const id = details?.order?.bookingId || bookingId;
			const response = await fetch(
				"/api/travel/tripjack-hotel/cancel-booking",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ bookingId: id }),
				},
			);
			const result = await response.json();
			if (!response.ok || !result.status?.success) {
				showToast("error", result.error || "Cancellation failed");
			} else {
				showToast("success", "Cancellation request submitted");
				fetchDetails(id);
			}
		} catch (err) {
			showToast(
				"error",
				err instanceof Error ? err.message : "Cancellation failed",
			);
		} finally {
			setIsCancelling(false);
		}
	};

	const handleConfirmHold = async () => {
		setIsConfirming(true);
		try {
			const id = details?.order?.bookingId || bookingId;
			const amount = details?.order?.amount || 0;
			const response = await fetch("/api/travel/tripjack-hotel/confirm-book", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bookingId: id,
					paymentInfos: [{ amount }],
				}),
			});
			const result = await response.json();
			if (!response.ok || !result.status?.success) {
				showToast("error", result.error || "Failed to confirm hold booking");
			} else {
				showToast("success", "Booking confirmed! Redirecting...");
				router.push(
					`/travel-portal/hotel-booking-confirmation?bookingId=${encodeURIComponent(id)}`,
				);
			}
		} catch (err) {
			showToast(
				"error",
				err instanceof Error ? err.message : "Confirmation failed",
			);
		} finally {
			setIsConfirming(false);
		}
	};

	const order = details?.order;
	const hotelInfo = details?.itemInfos?.HOTEL?.hInfo;
	const status = order?.status || "";
	const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
	const StatusIcon = statusCfg.icon;

	// Find current cancellation penalty
	const cnp = hotelInfo?.ops?.[0]?.cnp;
	const now = new Date();
	const currentPenalty = cnp?.pd?.find((p) => {
		const from = new Date(p.fdt);
		const to = new Date(p.tdt);
		return now >= from && now < to;
	});

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8 max-w-3xl">
				<h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
					<Hotel className="w-6 h-6" />
					Manage Hotel Booking
				</h1>

				{/* Lookup Form */}
				{!bookingIdParam && (
					<Card className="mb-6">
						<CardContent className="p-6">
							<form onSubmit={handleLookup} className="flex gap-3">
								<Input
									value={bookingId}
									onChange={(e) => setBookingId(e.target.value)}
									placeholder="Enter Booking ID (e.g. TJ202487947162)"
									className="flex-1"
								/>
								<Button type="submit" disabled={isLoading}>
									{isLoading ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										"Look Up"
									)}
								</Button>
							</form>
						</CardContent>
					</Card>
				)}

				{/* Loading */}
				{isLoading && <Skeleton className="h-64 w-full" />}

				{/* Error */}
				{error && !isLoading && (
					<Alert variant="destructive" className="mb-6">
						<XCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Booking Details */}
				{details && !isLoading && (
					<div className="space-y-6">
						{/* Status Banner */}
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<StatusIcon
											className={`w-6 h-6 ${statusCfg.color.split(" ")[0]}`}
										/>
										<div>
											<p className="font-medium text-gray-900">
												Booking ID: {order?.bookingId || bookingId}
											</p>
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}
											>
												{statusCfg.label}
											</span>
										</div>
									</div>
									{order?.amount && (
										<div className="text-right">
											<p className="text-sm text-gray-500">Total</p>
											<p className="text-xl font-bold text-blue-600">
												₹{order.amount.toLocaleString("en-IN")}
											</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Hotel Info */}
						{hotelInfo && (
							<Card>
								<CardHeader>
									<CardTitle>Hotel Details</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<p className="font-medium text-lg">{hotelInfo.name}</p>
									{hotelInfo.ad && (
										<p className="text-sm text-gray-600">
											{hotelInfo.ad.adr}, {hotelInfo.ad.ctn}, {hotelInfo.ad.cn}
										</p>
									)}
									{hotelInfo.rt && (
										<div className="flex gap-0.5">
											{Array.from({ length: hotelInfo.rt }).map((_, i) => (
												<span key={i} className="text-yellow-400">
													★
												</span>
											))}
										</div>
									)}

									{/* Room + Guest Details */}
									{hotelInfo.ops?.[0]?.ris?.map((room, idx) => (
										<div key={idx} className="bg-gray-50 rounded-lg p-4 mt-3">
											<p className="font-medium">{room.rc}</p>
											<p className="text-sm text-gray-500">{room.mb}</p>
											{room.ti && room.ti.length > 0 && (
												<p className="text-sm text-gray-600 mt-1">
													Guests:{" "}
													{room.ti
														.map((t) => `${t.ti} ${t.fN} ${t.lN}`)
														.join(", ")}
												</p>
											)}
										</div>
									))}
								</CardContent>
							</Card>
						)}

						{/* Cancellation Policy */}
						{cnp && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Calendar className="w-5 h-5" />
										Cancellation Policy
									</CardTitle>
								</CardHeader>
								<CardContent>
									{cnp.pd && cnp.pd.length > 0 ? (
										<div className="space-y-2">
											{cnp.pd.map((slab, idx) => {
												const isCurrent =
													now >= new Date(slab.fdt) && now < new Date(slab.tdt);
												return (
													<div
														key={idx}
														className={`flex justify-between items-center p-3 rounded-lg text-sm ${isCurrent ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}
													>
														<div>
															<p className="font-medium">
																{new Date(slab.fdt).toLocaleDateString()} –{" "}
																{new Date(slab.tdt).toLocaleDateString()}
															</p>
															{isCurrent && (
																<span className="text-xs text-blue-600">
																	Current period
																</span>
															)}
														</div>
														<p
															className={`font-medium ${slab.am === 0 ? "text-green-600" : "text-red-600"}`}
														>
															{slab.am === 0
																? "Free Cancellation"
																: `₹${slab.am.toLocaleString("en-IN")} penalty`}
														</p>
													</div>
												);
											})}
										</div>
									) : (
										<p className="text-sm text-gray-500">
											{cnp.inra
												? "Non-refundable booking"
												: "No cancellation policy details available"}
										</p>
									)}
								</CardContent>
							</Card>
						)}

						{/* Actions */}
						<div className="flex flex-col gap-4 items-center pt-4">
							{/* Hold deadline warning */}
							{status === "ON_HOLD" &&
								details?.holdDeadline &&
								(() => {
									const deadline = new Date(details.holdDeadline);
									const now = new Date();
									const diffMs = deadline.getTime() - now.getTime();
									const isExpired = diffMs <= 0;
									const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
									const minsLeft = Math.floor(
										(diffMs % (1000 * 60 * 60)) / (1000 * 60),
									);
									return (
										<Alert
											className={
												isExpired
													? "bg-red-50 border-red-200"
													: diffMs < 3600000
														? "bg-amber-50 border-amber-200"
														: "bg-blue-50 border-blue-200"
											}
										>
											<Clock
												className={`h-4 w-4 ${isExpired ? "text-red-600" : diffMs < 3600000 ? "text-amber-600" : "text-blue-600"}`}
											/>
											<AlertDescription className="text-sm">
												{isExpired
													? "Hold deadline has passed. This booking may be auto-cancelled."
													: `Hold expires on ${deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at ${deadline.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} (${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minsLeft}m remaining). Confirm before the deadline to secure this booking.`}
											</AlertDescription>
										</Alert>
									);
								})()}

							<div className="flex gap-4">
								{/* Confirm Hold */}
								{(status === "ON_HOLD" || action === "confirm") && (
									<Button
										className="bg-blue-600 hover:bg-blue-700"
										onClick={handleConfirmHold}
										disabled={isConfirming}
									>
										{isConfirming ? (
											<Loader2 className="w-4 h-4 animate-spin mr-2" />
										) : (
											<CreditCard className="w-4 h-4 mr-2" />
										)}
										Confirm & Pay ₹
										{order?.amount?.toLocaleString("en-IN") || "—"}
									</Button>
								)}

								{/* Cancel */}
								{(status === "SUCCESS" || status === "ON_HOLD") && (
									<Button
										variant="destructive"
										onClick={handleCancel}
										disabled={isCancelling}
									>
										{isCancelling ? (
											<Loader2 className="w-4 h-4 animate-spin mr-2" />
										) : (
											<XCircle className="w-4 h-4 mr-2" />
										)}
										Cancel Booking
										{currentPenalty && currentPenalty.am > 0 && (
											<span className="ml-1 text-xs">
												(₹{currentPenalty.am.toLocaleString("en-IN")} penalty)
											</span>
										)}
									</Button>
								)}

								{/* Cancellation Pending */}
								{status === "CANCELLATION_PENDING" && (
									<Alert className="bg-orange-50 border-orange-200">
										<AlertTriangle className="h-4 w-4 text-orange-600" />
										<AlertDescription className="text-sm">
											Cancellation is being processed by the supplier. Please
											check back later.
										</AlertDescription>
									</Alert>
								)}

								{/* Refresh */}
								<Button
									variant="outline"
									onClick={() => fetchDetails(bookingId)}
								>
									Refresh Status
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default function HotelBookingManagePage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gray-50 flex items-center justify-center">
					<Skeleton className="h-64 w-96" />
				</div>
			}
		>
			<ManageBookingContent />
		</Suspense>
	);
}
