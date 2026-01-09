"use client";

import React, { useState, useEffect } from "react";
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

export default function HotelBookingPage() {
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

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [roomData, setRoomData] = useState<RoomData | null>(null);
	const [preBookResponse, setPreBookResponse] = useState<PreBookResponse | null>(null);
	const [hotelInfo, setHotelInfo] = useState<{
		name: string;
		address: string;
		city: string;
		country: string;
		rating?: number;
	} | null>(null);

	useEffect(() => {
		if (!bookingCode || !roomDataParam) {
			setError("Missing booking information");
			setIsLoading(false);
			return;
		}

		// Parse room data from URL
		try {
			const parsedRoomData = JSON.parse(decodeURIComponent(roomDataParam));
			setRoomData(parsedRoomData);
		} catch (err) {
			setError("Invalid room data");
			setIsLoading(false);
			return;
		}

		// Fetch hotel details
		if (hotelCode) {
			fetchHotelDetails();
		}

		// Call PreBook API
		callPreBook();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bookingCode, roomDataParam, hotelCode]);

	const fetchHotelDetails = async () => {
		if (!hotelCode) return;

		try {
			const response = await fetch(
				`/api/travel/hotel/details?hotelCode=${hotelCode}&language=EN&isRoomDetailRequired=false`
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
		} catch (err) {
			console.error("Error fetching hotel details:", err);
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
				}),
			});

			const result = await response.json();

			if (!result.success) {
				setError(result.error || "Failed to prebook room");
				setIsLoading(false);
				return;
			}

			setPreBookResponse(result.data);
			setIsLoading(false);
		} catch (err) {
			console.error("Error calling PreBook:", err);
			setError(err instanceof Error ? err.message : "Failed to prebook room");
			setIsLoading(false);
		}
	};

	const totalPrice = roomData
		? roomData.totalFare + roomData.totalTax
		: 0;

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
						<p className="text-red-600 mb-4">{error || "Room not found"}</p>
						<Button onClick={() => router.back()}>Go Back</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 pb-24">
			{/* Header */}
			<div className="bg-white border-b sticky top-0 z-10">
				<div className="container mx-auto px-4 py-4">
					<Button
						variant="ghost"
						onClick={() => router.back()}
						className="mb-4"
					>
						<ChevronRight className="mr-2 h-4 w-4 rotate-180" />
						Back
					</Button>
					<h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>
				</div>
			</div>

			<div className="container mx-auto px-4 py-6 max-w-7xl">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
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
												{Array.from({ length: hotelInfo.rating }).map((_, i) => (
													<Star
														key={i}
														className="w-4 h-4 fill-yellow-400 text-yellow-400"
													/>
												))}
											</div>
										)}
										{hotelInfo?.address && (
											<div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
												<MapPin className="w-4 h-4" />
												<span>
													{hotelInfo.address}, {hotelInfo.city}, {hotelInfo.country}
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
								{roomData.roomPromotion && roomData.roomPromotion.length > 0 && (
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

						{/* PreBook Response Info */}
						{preBookResponse && (
							<Card>
								<CardHeader>
									<CardTitle>Booking Information</CardTitle>
								</CardHeader>
								<CardContent>
									<Alert className="bg-green-50 border-green-200">
										<CheckCircle className="h-4 w-4 text-green-600" />
										<AlertDescription className="text-sm">
											Room has been successfully pre-booked. Please complete
											guest details to proceed.
										</AlertDescription>
									</Alert>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Sidebar - Price Summary */}
					<div className="lg:col-span-1">
						<div className="sticky top-24 space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Price Summary</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span className="text-gray-600">Room Fare</span>
											<span className="font-medium">
												₹{roomData.totalFare.toLocaleString("en-IN")}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span className="text-gray-600">Taxes & Fees</span>
											<span className="font-medium">
												₹{roomData.totalTax.toLocaleString("en-IN")}
											</span>
										</div>
									</div>
									<div className="border-t pt-4">
										<div className="flex justify-between items-center">
											<span className="text-lg font-bold text-gray-900">
												Total
											</span>
											<span className="text-2xl font-bold text-blue-600">
												₹{totalPrice.toLocaleString("en-IN")}
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
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Navbar - Fixed at bottom */}
			<div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<div className="text-sm text-gray-600 mb-1">
								{hotelInfo?.name || "Hotel"}
							</div>
							<div className="text-xs text-gray-500">
								{checkIn} - {checkOut} • {rooms} Room(s) • {adults} Adults
								{children && parseInt(children) > 0 ? `, ${children} Children` : ""}
							</div>
						</div>
						<div className="flex items-center gap-6">
							<div className="text-right">
								<div className="text-sm text-gray-600">Total Price</div>
								<div className="text-2xl font-bold text-blue-600">
									₹{totalPrice.toLocaleString("en-IN")}
								</div>
							</div>
							<Button
								size="lg"
								className="bg-blue-600 hover:bg-blue-700 px-8"
								onClick={() => {
									toast.success("Proceeding to passenger details...");
									// TODO: Navigate to passenger details form
								}}
							>
								Continue Booking
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
