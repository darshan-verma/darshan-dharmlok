"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Star,
	MapPin,
	ChevronRight,
	CheckCircle,
	Utensils,
	Calendar,
	Users,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/lib/toast";
import type { Room } from "@/types/hotelApi";
import { captureAndSendSnapshot } from "@/lib/audit/snapshotClient";
import { TRIPJACK_HOTEL_PRICING_SESSION_KEY } from "@/lib/tripjackPricingNormalize";
import { getTripjackGuestNationalityCountryId } from "@/lib/tripjackHotelGuestNationality";
import { tripjackHotelComplianceFlags } from "@/lib/tripjackHotelCompliance";
import { formatTravelPriceInr } from "@/lib/formatTravelPrice";
import TripjackHotelGuestForm from "@/components/travel-portal/TripjackHotelGuestForm";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { buildRoomGuestConfig } from "@/lib/hotelGuestUtils";

interface RoomData {
	bookingCode: string;
	name: string;
	totalFare: number;
	totalTax: number;
	mealType: string;
	isRefundable: boolean;
	inclusion: string;
	roomPromotion: string[];
	cancelPolicies: Array<{
		Index: string;
		FromDate: string;
		ChargeType: string;
		CancellationCharge: number;
	}>;
	amenities?: string[];
}

interface PreBookResponse {
	Status: {
		Code: number;
		Description: string;
	};
	HotelResult: Array<{
		HotelCode: string;
		Currency: string;
		Rooms: Room[];
	}>;
	ValidationInfo?: {
		PanMandatory: boolean;
		PassportMandatory: boolean;
		CorporateBookingAllowed: boolean;
		PanCountRequired: number;
		SamePaxNameAllowed: boolean;
		SpaceAllowed: boolean;
		SpecialCharAllowed: boolean;
		PaxNameMinLength: number;
		PaxNameMaxLength: number;
		CharLimit: boolean;
		PackageFare: boolean;
		PackageDetailsMandatory: boolean;
		DepartureDetailsMandatory: boolean;
		GSTAllowed: boolean;
	};
}

function HotelBookingContent() {
	const { t } = useTranslation();
	const searchParams = useSearchParams();
	const router = useRouter();

	const bookingCode = searchParams.get("bookingCode");
	const hotelCode = searchParams.get("hotelCode");
	const checkIn = searchParams.get("checkIn");
	const checkOut = searchParams.get("checkOut");
	const rooms = searchParams.get("rooms");
	const adults = searchParams.get("adults");
	const children = searchParams.get("children");
	const roomDataParam = searchParams.get("roomData");
	const source = searchParams.get("source");
	const reviewHash = searchParams.get("reviewHash");
	const correlationId = searchParams.get("correlationId");
	const isTripjack = source === "TRIPJACK";

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [roomData, setRoomData] = useState<RoomData | null>(null);
	const [preBookResponse, setPreBookResponse] =
		useState<PreBookResponse | null>(null);
	const [tjReviewResponse, setTjReviewResponse] = useState<{
		bookingId: string;
		tjHotelId: string;
		hotelName: string;
		option: {
			optionId: string;
			pricing: {
				totalPrice: number;
				basePrice: number;
				taxes: number;
				mf: number;
				mft: number;
				currency: string;
				discount: number;
				strikethrough?: number;
			};
			cancellation: {
				isRefundable: boolean;
				penalties: { from: string; to: string; amount: number }[];
			};
			compliance: {
				panRequired: boolean;
				passportRequired: boolean;
				gstType: string;
			};
			mealBasis: string;
			roomInfo: { id: string; name: string }[];
			inclusions: string[];
			bookingNotes?: string;
		};
		ddt?: string; // deadlineDatetime for hold bookings
		status: { success: boolean };
	} | null>(null);
	const [hotelInfo, setHotelInfo] = useState<{
		name: string;
		address: string;
		city: string;
		country: string;
		rating?: number;
	} | null>(null);
	const [showGuestForm, setShowGuestForm] = useState(false);
	const [isBooking, setIsBooking] = useState(false);
	const guestFormRef = useRef<HTMLDivElement>(null);

	const roomCount = Math.max(1, parseInt(rooms || "1", 10) || 1);
	const adultCount = Math.max(1, parseInt(adults || "1", 10) || 1);
	const childCount = Math.max(0, parseInt(children || "0", 10) || 0);
	const roomGuestConfig = buildRoomGuestConfig(
		roomCount,
		adultCount,
		childCount,
	);
	const bookingReady = Boolean(
		(isTripjack && tjReviewResponse) || (!isTripjack && preBookResponse),
	);

	useEffect(() => {
		if (bookingReady) {
			setShowGuestForm(true);
		}
	}, [bookingReady]);

	useEffect(() => {
		if (!bookingCode || !roomDataParam) {
			setError(t("hotelBooking.missingBookingInfo"));
			setIsLoading(false);
			return;
		}

		// Parse room data from URL
		let parsedRoomData: RoomData | null = null;
		try {
			parsedRoomData = JSON.parse(decodeURIComponent(roomDataParam));
			setRoomData(parsedRoomData);
		} catch (_err) {
			setError(t("hotelBooking.invalidRoomData"));
			setIsLoading(false);
			return;
		}

		// Capture snapshot when hotel review page loads
		if (parsedRoomData) {
			captureAndSendSnapshot(
				{
					hotelCode: hotelCode || "",
					hotelName: hotelInfo?.name || "",
					roomData: parsedRoomData,
					checkIn: checkIn || "",
					checkOut: checkOut || "",
					rooms: rooms || "",
					adults: adults || "",
					children: children || "0",
				},
				{
					page: "hotel_review",
					user: {},
					booking: {
						type: "hotel",
						searchId: hotelCode || undefined,
						resultIndex: bookingCode,
					},
				},
			).catch(() => {
				// Silently fail - don't block user flow
			});
		}

		// Fetch hotel details first, then call PreBook / Review
		if (hotelCode) {
			fetchHotelDetails()
				.then(() => {
					if (isTripjack) {
						callTripjackReview();
					} else {
						callPreBook();
					}
				})
				.catch(() => {
					if (isTripjack) {
						callTripjackReview();
					} else {
						callPreBook();
					}
				});
		} else {
			if (isTripjack) {
				callTripjackReview();
			} else {
				callPreBook();
			}
		}
	// Intentionally scoped to booking/session identifiers to avoid duplicate prebook/review calls.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		bookingCode,
		roomDataParam,
		hotelCode,
		correlationId,
		reviewHash,
		isTripjack,
	]);

	const fetchHotelDetails = async (): Promise<void> => {
		if (!hotelCode) return;

		try {
			if (isTripjack) {
				// Fetch from TripJack static detail API
				const response = await fetch(
					"/api/travel/tripjack-hotel/static-detail",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ hid: hotelCode }),
					},
				);
				const result = await response.json();
				if (result.success && result.data) {
					const d = result.data;
					setHotelInfo({
						name: d.name || "Hotel",
						address: d.locale?.address?.fulladdr || "",
						city: d.locale?.address?.city || "",
						country: d.locale?.address?.countryname || "",
						rating: d.star_rating ? parseInt(String(d.star_rating)) : undefined,
					});
				}
			} else {
				const response = await fetch(
					`/api/travel/hotel/details?hotelCode=${encodeURIComponent(hotelCode)}&language=EN&isRoomDetailRequired=false`,
				);
				const result = await response.json();

				if (result.success && result.data?.HotelDetails) {
					let hotelDetails = result.data.HotelDetails;
					if (Array.isArray(hotelDetails) && hotelDetails.length > 0) {
						hotelDetails = hotelDetails[0];
					}
					setHotelInfo({
						name: hotelDetails.HotelName || "Hotel",
						address: hotelDetails.Address || "",
						city: hotelDetails.CityName || "",
						country: hotelDetails.CountryName || "",
						rating: hotelDetails.HotelRating
							? parseInt(String(hotelDetails.HotelRating))
							: undefined,
					});
				}
			}
		} catch (err) {
			console.error("Error fetching hotel details:", err);
			throw err;
		}
	};

	/** TripJack Review API — re-validates option availability & pricing before booking */
	const callTripjackReview = async () => {
		if (!bookingCode || !hotelCode) {
			setError(
				"Missing TripJack booking parameters (optionId, reviewHash, or hotelCode)",
			);
			setIsLoading(false);
			return;
		}

		let reviewHashEffective = reviewHash?.trim() || "";
		let corr = correlationId?.trim() || "";
		if (typeof window !== "undefined") {
			try {
				const raw = sessionStorage.getItem(TRIPJACK_HOTEL_PRICING_SESSION_KEY);
				if (raw) {
					const o = JSON.parse(raw) as {
						hid?: string;
						reviewHash?: string;
						correlationId?: string;
					};
					if (String(o.hid) === String(hotelCode)) {
						if (!reviewHashEffective && o.reviewHash)
							reviewHashEffective = String(o.reviewHash).trim();
						if (!corr && o.correlationId)
							corr = String(o.correlationId).trim();
					}
				}
			} catch {
				/* ignore */
			}
		}

		if (!reviewHashEffective) {
			setError(
				"Missing TripJack reviewHash. Return to the hotel page, wait for prices to load, then book again — or start a new search.",
			);
			setIsLoading(false);
			return;
		}

		if (!corr) {
			setError(
				"Missing TripJack correlationId (search session). Open this hotel from search results again, then book — pricing and review must share the same session id.",
			);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const doReview = async (args: {
				correlationId: string;
				optionId: string;
				reviewHash: string;
				hid: string;
			}) => {
				const response = await fetch("/api/travel/tripjack-hotel/review", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(args),
				});
				const result = await response.json();
				return { response, result };
			};

			const buildRoomsForPricing = () => {
				const numRooms = Math.max(1, parseInt(rooms || "1", 10) || 1);
				const numAdults = Math.max(1, parseInt(adults || "1", 10) || 1);
				const numChildren = Math.max(0, parseInt(children || "0", 10) || 0);
				const adultsPerRoom = Math.max(1, Math.floor(numAdults / numRooms));
				const childrenPerRoom = Math.max(0, Math.floor(numChildren / numRooms));
				return Array(numRooms)
					.fill(null)
					.map(() => ({
						adults: adultsPerRoom,
						...(childrenPerRoom > 0 && {
							children: childrenPerRoom,
							childAge: Array(childrenPerRoom).fill(5),
						}),
					}));
			};

			/** Re-price with the *same* correlationId (listing → pricing → review must match). */
			const tryRefreshContextAndRetry = async (correlationForSession: string) => {
				if (!hotelCode || !checkIn || !checkOut || !correlationForSession)
					return null;

				const pricingResponse = await fetch("/api/travel/tripjack-hotel/pricing", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hid: hotelCode,
						checkIn,
						checkOut,
						rooms: buildRoomsForPricing(),
						currency: "INR",
						nationality: getTripjackGuestNationalityCountryId(),
						correlationId: correlationForSession,
					}),
				});
				const pricingResult = await pricingResponse.json();
				if (!pricingResponse.ok || !pricingResult.status?.success) return null;

				const options = Array.isArray(pricingResult.options)
					? pricingResult.options
					: [];
				if (options.length === 0) return null;

				// Pick the closest option to what user selected (same primary room name if possible)
				const currentRoomName = (roomData?.name || "").toLowerCase().trim();
				const matched =
					options.find(
						(o: {
							optionId?: string;
							roomInfo?: Array<{ name?: string }>;
							mealBasis?: string;
							inclusions?: string[];
							pricing?: {
								totalPrice?: number;
								taxes?: number;
								mf?: number;
								mft?: number;
							};
							cancellation?: { isRefundable?: boolean };
						}) => {
						const n = String(o?.roomInfo?.[0]?.name || "")
							.toLowerCase()
							.trim();
						return currentRoomName && n && n === currentRoomName;
						},
					) || options[0];

				const nextReviewHash =
					typeof pricingResult.reviewHash === "string"
						? pricingResult.reviewHash
						: "";
				// Prefer returned id only if TripJack echoes the same session; never mint a new one.
				const returnedCorr =
					typeof pricingResult.correlationId === "string" &&
					pricingResult.correlationId
						? pricingResult.correlationId
						: "";
				const nextCorrelation = returnedCorr || correlationForSession;
				const nextOptionId =
					typeof matched?.optionId === "string" ? matched.optionId : "";

				if (!nextReviewHash || !nextOptionId) return null;

				// Keep session context fresh for retry / navigation.
				if (typeof window !== "undefined") {
					try {
						sessionStorage.setItem(
							TRIPJACK_HOTEL_PRICING_SESSION_KEY,
							JSON.stringify({
								hid: hotelCode,
								reviewHash: nextReviewHash,
								correlationId: nextCorrelation,
								checkIn,
								checkOut,
							}),
						);
					} catch {
						/* ignore */
					}
				}

				// Update local room summary so user sees current option/price.
				setRoomData((prev) =>
					prev
						? {
								...prev,
								bookingCode: nextOptionId,
								name: matched?.roomInfo?.[0]?.name || prev.name,
								totalFare:
									typeof matched?.pricing?.basePrice === "number"
										? matched.pricing.basePrice
										: prev.totalFare,
								totalTax:
									typeof matched?.pricing?.totalPrice === "number"
										? matched.pricing.totalPrice -
											(matched.pricing.basePrice || 0)
										: prev.totalTax,
								mealType: matched?.mealBasis || prev.mealType,
								isRefundable:
									typeof matched?.cancellation?.isRefundable === "boolean"
										? matched.cancellation.isRefundable
										: prev.isRefundable,
								inclusion: Array.isArray(matched?.inclusions)
									? matched.inclusions.join(", ")
									: prev.inclusion,
							}
						: prev,
				);

				return {
					correlationId: nextCorrelation,
					optionId: nextOptionId,
					reviewHash: nextReviewHash,
					hid: hotelCode,
				};
			};

			// Review with the search-session correlationId first (do not mint a new one).
			let { response, result } = await doReview({
				correlationId: corr,
				optionId: bookingCode,
				reviewHash: reviewHashEffective,
				hid: hotelCode,
			});

			if (!response.ok || !result.status?.success) {
				const providerErrCode =
					result?.providerError?.errors?.[0]?.errCode ??
					result?.providerError?.errorCode;
				const providerErrMsg = String(result?.error || "");
				const isOptionExpired =
					String(providerErrCode) === "6001" ||
					providerErrMsg.toLowerCase().includes("no longer available");

				// Common TripJack case: selected option expires quickly; refresh pricing once and retry review.
				if (isOptionExpired) {
					const retryPayload = await tryRefreshContextAndRetry(corr);
					if (retryPayload) {
						const retry = await doReview(retryPayload);
						response = retry.response;
						result = retry.result;
					}
				}
			}

			if (!response.ok || !result.status?.success) {
				const errMsg =
					result.error ||
					t("hotelBooking.reviewUnavailable");
				setError(errMsg);
				setIsLoading(false);
				return;
			}

			setTjReviewResponse(result);

			// Update room data with confirmed pricing from Review response
			if (result.option) {
				const opt = result.option;
				setRoomData((prev) =>
					prev
						? {
								...prev,
								totalFare: opt.pricing.basePrice,
								totalTax:
									opt.pricing.totalPrice - (opt.pricing.basePrice || 0),
								isRefundable: opt.cancellation.isRefundable,
							}
						: prev,
				);
			}

			// Backfill hotel name from review response
			if (result.hotelName && !hotelInfo?.name) {
				setHotelInfo((prev) => ({
					name: result.hotelName,
					address: prev?.address || "",
					city: prev?.city || "",
					country: prev?.country || "",
					rating: prev?.rating,
				}));
			}

			setIsLoading(false);
		} catch (err) {
			console.error("Error calling TripJack Review:", err);
			setError(
				err instanceof Error ? err.message : t("hotelBooking.failedReview"),
			);
			setIsLoading(false);
		}
	};

	const callPreBook = async () => {
		if (!bookingCode) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/travel/hotel/prebook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bookingCode: bookingCode,
					paymentMode: "Limit",
					hotelData: {
						hotelCode: hotelCode,
						hotelName: hotelInfo?.name || "",
						city: hotelInfo?.city || "",
						country: hotelInfo?.country || "",
						roomData: roomData,
					},
				}),
			});

			const result = await response.json();

			if (!result.success) {
				setError(result.error || t("hotelBooking.failedPrebook"));
				setIsLoading(false);
				return;
			}

			setPreBookResponse(result.data);

			// Capture snapshot after successful prebook (before payment)
			if (result.data?.Status?.Code === 1 || result.success) {
				await captureAndSendSnapshot(
					{
						hotelCode: hotelCode || "",
						hotelName: hotelInfo?.name || "",
						roomData: roomData,
						preBookResponse: result.data,
						checkIn: checkIn || "",
						checkOut: checkOut || "",
						rooms: rooms || "",
						adults: adults || "",
						children: children || "0",
						totalPrice: totalPrice,
					},
					{
						page: "payment",
						user: {},
						booking: {
							type: "hotel",
							searchId: hotelCode || undefined,
							resultIndex: bookingCode || undefined,
						},
					},
				).catch(() => {
					// Silently fail - don't block user flow
				});
			}

			setIsLoading(false);
		} catch (err) {
			console.error("Error calling PreBook:", err);
			setError(err instanceof Error ? err.message : t("hotelBooking.failedPrebook"));
			setIsLoading(false);
		}
	};

	const tripjackBookAmount =
		isTripjack && tjReviewResponse?.option?.pricing?.totalPrice != null
			? tjReviewResponse.option.pricing.totalPrice
			: null;
	const totalPrice =
		tripjackBookAmount ??
		(roomData ? roomData.totalFare + roomData.totalTax : 0);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-6">
					<Skeleton className="h-96 w-full mb-6" />
					<Skeleton className="h-64 w-full" />
				</div>
			</div>
		);
	}

	if (error || !roomData) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Card className="max-w-md">
					<CardContent className="p-6 text-center">
						<p className="text-red-600 mb-4">{error || t("hotelBooking.roomNotFound")}</p>
						<Button onClick={() => router.back()}>Go Back</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 pb-[calc(9.5rem+env(safe-area-inset-bottom))] md:pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
			{/* Header */}
			<div className="bg-white border-b sticky top-0 z-10 shadow-sm">
				<div className="container mx-auto px-4 py-4">
					<Button
						variant="ghost"
						onClick={() => router.back()}
						className="mb-4"
					>
						<ChevronRight className="mr-2 h-4 w-4 rotate-180" />
						Back
					</Button>
					<h1 className="text-2xl font-bold text-gray-900">
						Complete Your Booking
					</h1>
				</div>
			</div>

			<div className="container mx-auto px-4 py-6 max-w-7xl">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
					{/* Main Content - Left Column (8 columns) */}
					<div className="lg:col-span-8 space-y-6">
						{/* Hotel Info Card */}
						<Card>
							<CardContent className="p-6">
								<div className="flex items-start gap-4">
									<div className="flex-1">
										<h2 className="text-xl font-bold text-gray-900 mb-2">
											{hotelInfo?.name || "Hotel"}
										</h2>
										{hotelInfo?.rating && (
											<div className="flex items-center gap-1 mb-2">
												{Array.from({ length: hotelInfo.rating }).map(
													(_, i) => (
														<Star
															key={i}
															className="w-4 h-4 fill-yellow-400 text-yellow-400"
														/>
													),
												)}
											</div>
										)}
										{hotelInfo?.address && (
											<div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
												<MapPin className="w-4 h-4" />
												<span>
													{hotelInfo.address}, {hotelInfo.city},{" "}
													{hotelInfo.country}
												</span>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Booking Details Card */}
						<Card>
							<CardHeader>
								<CardTitle>Booking Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-gray-700 block mb-1">
											Check-in
										</label>
										<div className="flex items-center gap-2 text-gray-900">
											<Calendar className="w-4 h-4" />
											<span>{checkIn || "N/A"}</span>
										</div>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700 block mb-1">
											Check-out
										</label>
										<div className="flex items-center gap-2 text-gray-900">
											<Calendar className="w-4 h-4" />
											<span>{checkOut || "N/A"}</span>
										</div>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700 block mb-1">
											Guests
										</label>
										<div className="flex items-center gap-2 text-gray-900">
											<Users className="w-4 h-4" />
											<span>
												{adults || "0"} Adults
												{children && parseInt(children) > 0
													? `, ${children} Children`
													: ""}
											</span>
										</div>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700 block mb-1">
											Rooms
										</label>
										<div className="flex items-center gap-2 text-gray-900">
											<Users className="w-4 h-4" />
											<span>{rooms || "1"} Room(s)</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Selected Room Card */}
						<Card>
							<CardHeader>
								<CardTitle>Selected Room</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										{roomData.name}
									</h3>
									{roomData.mealType && roomData.mealType !== "Room_Only" && (
										<div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
											<Utensils className="w-4 h-4" />
											<span>{roomData.mealType.replace(/_/g, " ")}</span>
										</div>
									)}
								</div>

								{/* Inclusions */}
								{roomData.inclusion && (
									<div>
										<h4 className="text-sm font-medium text-gray-700 mb-2">
											Inclusions
										</h4>
										<div className="space-y-1">
											{roomData.inclusion.split(",").map((inc, idx) => (
												<div
													key={idx}
													className="flex items-center gap-2 text-sm text-gray-700"
												>
													<CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
													<span>{inc.trim()}</span>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Cancellation Policy */}
								<div className="flex gap-2">
									{roomData.isRefundable ? (
										<span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
											✓ Free Cancellation
										</span>
									) : (
										<span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
											Non-Refundable
										</span>
									)}
								</div>

								{/* Promotions */}
								{roomData.roomPromotion &&
									roomData.roomPromotion.length > 0 && (
										<div>
											<h4 className="text-sm font-medium text-gray-700 mb-2">
												Promotions
											</h4>
											<div className="space-y-1">
												{roomData.roomPromotion.map((promo, idx) => (
													<div
														key={idx}
														className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded"
													>
														{promo}
													</div>
												))}
											</div>
										</div>
									)}
							</CardContent>
						</Card>

						{/* PreBook / Review Response Info */}
						{(preBookResponse || tjReviewResponse) && (
							<Card>
								<CardHeader>
									<CardTitle>Booking Information</CardTitle>
								</CardHeader>
								<CardContent>
									<Alert className="bg-green-50 border-green-200">
										<CheckCircle className="h-4 w-4 text-green-600" />
										<AlertDescription className="text-sm">
											{isTripjack && tjReviewResponse
												? `Room reviewed and confirmed. Booking ID: ${tjReviewResponse.bookingId}. Please complete guest details to proceed.`
												: t("hotelBooking.prebookSuccess")}
										</AlertDescription>
									</Alert>
									{isTripjack && tjReviewResponse?.option?.compliance && (
										<div className="mt-3 flex flex-wrap gap-2">
											{(() => {
												const compliance = tripjackHotelComplianceFlags(
													tjReviewResponse.option.compliance,
												);
												return (
													<>
														{compliance.panRequired && (
															<span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
																PAN Card Required
															</span>
														)}
														{compliance.passportRequired && (
															<span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
																Passport Required
															</span>
														)}
														{compliance.gstType !== "NA" && (
															<span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
																GST: {compliance.gstType}
															</span>
														)}
													</>
												);
											})()}
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Guest details — shown after room is selected & prebook/review succeeds */}
						{showGuestForm && bookingReady && (
							<div ref={guestFormRef} id="hotel-guest-form" className="space-y-4">
								<h2 className="text-xl font-bold text-gray-900">
									Guest information
								</h2>

						{isTripjack && tjReviewResponse && (
							<TripjackHotelGuestForm
								rooms={roomGuestConfig}
								checkIn={checkIn}
								checkOut={checkOut}
								roomsCount={roomCount}
								adultsCount={adultCount}
								childrenCount={childCount}
								panRequired={
									tripjackHotelComplianceFlags(
										tjReviewResponse.option?.compliance,
									).panRequired
								}
								passportRequired={
									tripjackHotelComplianceFlags(
										tjReviewResponse.option?.compliance,
									).passportRequired
								}
								totalAmount={totalPrice}
								currency={tjReviewResponse.option?.pricing?.currency || "INR"}
								isSubmitting={isBooking}
								onSubmit={async ({
									roomTravellerInfo,
									deliveryInfo,
									isHoldBooking,
								}) => {
									setIsBooking(true);
									try {
										const response = await fetch(
											"/api/travel/tripjack-hotel/book",
											{
												method: "POST",
												headers: { "Content-Type": "application/json" },
												body: JSON.stringify({
													bookingId: tjReviewResponse.bookingId,
													roomTravellerInfo,
													deliveryInfo,
													...(!isHoldBooking && {
														paymentInfos: [
															{
																amount:
																	tjReviewResponse.option.pricing
																		.totalPrice,
															},
														],
													}),
													type: "HOTEL",
													hotelMeta: {
														hotelName:
															hotelInfo?.name || tjReviewResponse.hotelName,
														hotelCode: hotelCode || tjReviewResponse.tjHotelId,
														checkIn,
														checkOut,
														rooms: rooms ? parseInt(rooms) : 1,
														adults: adults ? parseInt(adults) : 1,
														children: children ? parseInt(children) : 0,
														totalAmount: totalPrice,
														currency:
															tjReviewResponse.option?.pricing?.currency ||
															"INR",
														cancellationPolicy:
															tjReviewResponse.option?.cancellation,
														optionSnapshot: tjReviewResponse.option,
														...(isHoldBooking &&
															tjReviewResponse.ddt && {
																holdDeadline: tjReviewResponse.ddt,
															}),
													},
												}),
											},
										);
										const result = await response.json();
										if (!response.ok || !result.status?.success) {
											toast.error(
												result.error || t("hotelBooking.bookingFailed"),
											);
											setIsBooking(false);
											return;
										}
										toast.success(t("hotelBooking.bookingSubmitted"));
										const bookId =
											result.bookingId || tjReviewResponse.bookingId;
										router.push(
											`/travel-portal/hotel-booking-confirmation?bookingId=${encodeURIComponent(bookId)}&hotelName=${encodeURIComponent(hotelInfo?.name || tjReviewResponse.hotelName)}&checkIn=${checkIn}&checkOut=${checkOut}`,
										);
									} catch (err) {
										toast.error(
											err instanceof Error
												? err.message
												: t("hotelBooking.bookingRequestFailed"),
										);
										setIsBooking(false);
									}
								}}
							/>
						)}

						{!isTripjack && preBookResponse && (
							<TripjackHotelGuestForm
								rooms={roomGuestConfig}
								checkIn={checkIn}
								checkOut={checkOut}
								roomsCount={roomCount}
								adultsCount={adultCount}
								childrenCount={childCount}
								panRequired={
									preBookResponse.ValidationInfo?.PanMandatory || false
								}
								passportRequired={
									preBookResponse.ValidationInfo?.PassportMandatory || false
								}
								totalAmount={totalPrice}
								currency="INR"
								showHoldBooking={false}
								submitLabel={t("hotelBooking.submitGuestDetails")}
								isSubmitting={isBooking}
								onSubmit={async ({
									roomTravellerInfo,
									deliveryInfo,
								}) => {
									setIsBooking(true);
									try {
										const response = await fetch("/api/travel/hotel/book", {
											method: "POST",
											headers: { "Content-Type": "application/json" },
											body: JSON.stringify({
												bookingCode,
												roomTravellerInfo,
												deliveryInfo,
												hotelMeta: {
													hotelName: hotelInfo?.name || "",
													hotelCode: hotelCode || "",
													checkIn,
													checkOut,
													rooms: roomCount,
													adults: adultCount,
													children: childCount,
													totalAmount: totalPrice,
													currency: "INR",
													preBookSnapshot: preBookResponse,
												},
											}),
										});
										const result = await response.json();
										if (!response.ok || !result.success) {
											toast.error(
												result.error ||
													t("hotelBooking.couldNotSaveGuest"),
											);
											setIsBooking(false);
											return;
										}
										toast.success(t("hotelBooking.guestDetailsSaved"));
										router.push(
											`/travel-portal/hotel-booking-confirmation?bookingId=${encodeURIComponent(result.bookingId)}&source=TBO&hotelName=${encodeURIComponent(hotelInfo?.name || "")}&checkIn=${checkIn}&checkOut=${checkOut}`,
										);
									} catch (err) {
										toast.error(
											err instanceof Error
												? err.message
												: t("hotelBooking.bookingRequestFailed"),
										);
										setIsBooking(false);
									}
								}}
							/>
						)}
							</div>
						)}
					</div>

					{/* Sidebar - Right Column (4 columns) - Sticky Price Summary */}
					<div className="lg:col-span-4 h-full">
						<div className="sticky top-20 space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Price Summary</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span className="text-gray-600">Room Fare</span>
											<span className="font-medium">
												₹{formatTravelPriceInr(roomData.totalFare)}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span className="text-gray-600">Taxes & Fees</span>
											<span className="font-medium">
												₹{formatTravelPriceInr(roomData.totalTax)}
											</span>
										</div>
									</div>
									<div className="border-t pt-4">
										<div className="flex justify-between items-center">
											<span className="text-lg font-bold text-gray-900">
												Total
											</span>
											<span className="text-2xl font-bold text-blue-600">
												₹{formatTravelPriceInr(totalPrice)}
											</span>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="p-6">
									<div className="bg-green-50 rounded-lg p-4 text-sm text-green-700 border border-green-200">
										<p className="flex items-center gap-2 mb-1 font-medium">
											<CheckCircle className="w-4 h-4" />
											Secure Booking
										</p>
										<p className="text-xs text-green-600">
											Your data is encrypted and secure.
										</p>
									</div>
								</CardContent>
							</Card>

							{/* Booking Guarantee */}
							<div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 border border-gray-100">
								<p className="flex items-center gap-2 mb-2 font-medium text-gray-900">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="text-green-600"
									>
										<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
									</svg>
									Best Price Guarantee
								</p>
								<p className="text-xs">
									We guarantee the best prices for your hotel booking. Book with
									confidence.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Navbar - Fixed at bottom */}
			<div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
				<div className="container mx-auto px-4 py-3 md:py-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-[calc(1rem+env(safe-area-inset-bottom))]">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div className="min-w-0 flex-1">
							<div className="text-sm text-gray-600 mb-1">
								{hotelInfo?.name || "Hotel"}
							</div>
							<div className="text-xs text-gray-500 truncate">
								{checkIn} - {checkOut} • {rooms} Room(s) • {adults} Adults
								{children && parseInt(children) > 0
									? `, ${children} Children`
									: ""}
							</div>
						</div>
						<div className="flex items-center justify-between gap-4 md:gap-6">
							<div className="text-right">
								<div className="text-sm text-gray-600">Total Price</div>
								<div className="text-xl md:text-2xl font-bold text-blue-600">
									₹{formatTravelPriceInr(totalPrice)}
								</div>
							</div>
							<Button
								size="lg"
								className="bg-blue-600 hover:bg-blue-700 px-6 md:px-8"
								disabled={!bookingReady}
								onClick={() => {
									if (!bookingReady) return;
									setShowGuestForm(true);
									requestAnimationFrame(() => {
										guestFormRef.current?.scrollIntoView({
											behavior: "smooth",
											block: "start",
										});
									});
								}}
							>
								{showGuestForm && bookingReady
									? t("hotelBooking.fillGuestDetails")
									: bookingReady
										? t("hotelBooking.continueToGuestDetails")
										: t("hotelBooking.preparingBooking")}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function HotelBookingPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gray-50">
					<div className="container mx-auto px-4 py-6">
						<Skeleton className="h-96 w-full mb-6" />
						<Skeleton className="h-64 w-full" />
					</div>
				</div>
			}
		>
			<HotelBookingContent />
		</Suspense>
	);
}
