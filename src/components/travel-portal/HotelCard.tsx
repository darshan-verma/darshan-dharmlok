"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, CheckCircle, Utensils, Loader2 } from "lucide-react";
import type { Room } from "@/types/hotelApi";
import { formatTravelPriceInr } from "@/lib/formatTravelPrice";

interface HotelCardProps {
	hotelCode: string;
	hotelName: string;
	location?: string;
	starRating?: number;
	ratings?: {
		score: number;
		count: number;
		label: string;
	};
	room: Room;
	hotelImage?: string;
	propertyPhotosCount?: number;
	isDetailsLoading?: boolean;
	onBookClick: (hotelCode: string) => void;
	onViewDetails: (hotelCode: string) => void;
	priceRange?: { min: number; max: number };
	roomCount?: number;
	source?: "TBO" | "TRIPJACK";
}

function HotelCard({
	hotelCode,
	hotelName,
	location,
	starRating = 3,
	ratings,
	room,
	hotelImage,
	propertyPhotosCount,
	isDetailsLoading = false,
	onBookClick,
	onViewDetails,
	priceRange,
	roomCount,
	source,
}: HotelCardProps) {
	const totalPrice = room.TotalFare + room.TotalTax;
	const displayPrice = priceRange ? priceRange.min : totalPrice;

	// Parse inclusions
	const inclusions = room.Inclusion ? room.Inclusion.split(",") : [];
	const promotions = room.RoomPromotion || [];

	return (
		<Card className="overflow-hidden hover:shadow-lg transition-shadow">
			<div className="flex flex-col md:flex-row">
				{/* Hotel Image */}
				<div className="relative w-full md:w-72 h-48 md:h-auto bg-gray-200">
					{hotelImage ? (
						<Image
							src={hotelImage}
							alt={hotelName}
							fill
							className="object-cover"
							unoptimized
							onError={(e) => {
								console.error("Image failed to load:", hotelImage);
								e.currentTarget.style.display = "none";
							}}
						/>
					) : (
						<div className="flex items-center justify-center h-full text-gray-400">
							No Image Available
						</div>
					)}
					{propertyPhotosCount && (
						<button
							onClick={() => onViewDetails(hotelCode)}
							className="absolute bottom-3 left-3 bg-white px-3 py-1.5 rounded-md shadow-md text-sm font-medium text-blue-600 hover:bg-gray-50 flex items-center gap-2"
						>
							<span className="text-blue-600">📷</span>+{propertyPhotosCount}{" "}
							Property Photos
						</button>
					)}
				</div>

				{/* Hotel Details */}
				<CardContent className="flex-1 p-4 md:p-6">
					<div className="flex justify-between gap-4">
						{/* Left Section */}
						<div className="flex-1">
							{/* Hotel Name & Rating */}
							<div className="mb-2">
								<div className="flex items-center gap-2 mb-1 flex-wrap">
									<h3 className="text-xl font-bold text-gray-900">
										{hotelName}
									</h3>
									{isDetailsLoading && (
										<Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
									)}
									{source === "TBO" && (
										<Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border border-blue-300 font-semibold">
											TBO
										</Badge>
									)}
									{source === "TRIPJACK" && (
										<Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border border-purple-300 font-semibold">
											TripJack
										</Badge>
									)}
								</div>
								{starRating && starRating > 0 && (
									<div className="flex items-center gap-2 mb-2">
										{Array.from({ length: starRating }).map((_, i) => (
											<Star
												key={i}
												className="w-4 h-4 fill-yellow-400 text-yellow-400"
											/>
										))}
									</div>
								)}
								{location && (
									<div className="flex items-center gap-1 text-sm text-gray-600">
										<MapPin className="w-4 h-4" />
										<span>{location}</span>
									</div>
								)}
							</div>

							{/* Room Count or Room Name */}
							<div className="mb-3">
								{roomCount && roomCount > 1 ? (
									<p className="text-sm font-medium text-gray-700">
										{roomCount} room options available
									</p>
								) : (
									<p className="text-sm font-medium text-gray-700">
										{room.Name[0]}
									</p>
								)}
							</div>

							{/* Inclusions */}
							<div className="space-y-2 mb-3">
								{inclusions.slice(0, 2).map((inclusion, index) => (
									<div
										key={index}
										className="flex items-center gap-2 text-sm text-gray-700"
									>
										<CheckCircle className="w-4 h-4 text-green-600" />
										<span>{inclusion.trim()}</span>
									</div>
								))}
								{room.MealType && room.MealType !== "Room_Only" && (
									<div className="flex items-center gap-2 text-sm text-blue-600">
										<Utensils className="w-4 h-4" />
										<span>{room.MealType.replace("_", " ")}</span>
									</div>
								)}
							</div>

							{/* Promotions */}
							{promotions.length > 0 && (
								<div className="mb-3">
									<p className="text-sm text-blue-700 flex items-center gap-2">
										<span className="text-blue-600">✨</span>
										{promotions[0]}
									</p>
								</div>
							)}

							{/* Badges */}
							<div className="flex flex-wrap gap-2">
								{room.IsRefundable && (
									<Badge
										variant="outline"
										className="text-green-600 border-green-600"
									>
										Free Cancellation
									</Badge>
								)}
								{!room.IsRefundable && (
									<Badge
										variant="outline"
										className="text-orange-600 border-orange-600"
									>
										Non-Refundable
									</Badge>
								)}
							</div>
						</div>

						{/* Right Section - Pricing */}
						<div className="flex flex-col items-end justify-between border-l pl-4 md:pl-6 min-w-[200px]">
							{ratings && (
								<div className="text-right mb-4">
									<div className="flex items-center justify-end gap-2 mb-1">
										<span className="text-sm font-medium">{ratings.label}</span>
										<div className="bg-blue-600 text-white px-2 py-1 rounded-md font-bold">
											{ratings.score}
										</div>
									</div>
									<p className="text-xs text-gray-600">
										({ratings.count} Ratings)
									</p>
								</div>
							)}

							<div className="text-right">
								<div className="mb-1">
									{priceRange && priceRange.min !== priceRange.max ? (
										<div>
											<span className="text-sm text-gray-600">from </span>
											<span className="text-2xl font-bold text-gray-900">
												₹ {formatTravelPriceInr(priceRange.min)}
											</span>
										</div>
									) : (
										<span className="text-2xl font-bold text-gray-900">
											₹ {formatTravelPriceInr(displayPrice)}
										</span>
									)}
								</div>
								{priceRange && priceRange.min !== priceRange.max ? (
									<p className="text-xs text-gray-600 mb-1">
										Price varies by room type
									</p>
								) : (
									<p className="text-xs text-gray-600 mb-1">
										+ ₹ {formatTravelPriceInr(room.TotalTax)}{" "}
										taxes & fees
									</p>
								)}
								<p className="text-sm text-gray-700 mb-4">
									Per Night for {room.RoomID?.length || 1} Room
									{room.RoomID?.length > 1 ? "s" : ""}
								</p>

								<Button
									onClick={() => onBookClick(hotelCode)}
									className="w-full bg-blue-600 hover:bg-blue-700"
								>
									Book Now
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</div>

			{/* Bank Offer Banner (Optional) */}
			<div className="bg-teal-50 border-t border-teal-100 px-6 py-2">
				<p className="text-sm text-teal-800">
					HSBC Bank Credit Card NoCostEMI Offer - Get INR 5899 Off
				</p>
			</div>
		</Card>
	);
}

export default React.memo(HotelCard);
