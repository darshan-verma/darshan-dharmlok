"use client";

import React, { useState} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Star,
	MapPin,
	Wifi,
	Car,
	Utensils,
	Coffee,
	Wind,
	Bed,
	Bath,
	AlertCircle,
	ChevronRight,
} from "lucide-react";
import {
	HotelSearchData,
} from "@/components/travel-portal/HotelSearchForm";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RoomOption {
	name: string;
	price: number;
	basePrice: number;
	taxes: number;
	amenities: string[];
	size: string;
	bedType: string;
	view: string;
	mealType: string;
	cancellationPolicy: string;
	isRefundable: boolean;
	bookingCode: string;
}

export default function HotelBookingPage() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const hotelCode = searchParams.get("hotelCode");

	// Mock hotel data (in production, fetch from API)
	const hotelData = {
		name: "Hotel Maa Heritage",
		location: "Pink City, 3 km drive to Jantar Mantar",
		starRating: 3,
		propertyPhotos: 32,
		amenities: [
			{ icon: Utensils, name: "Restaurant" },
			{ icon: Car, name: "Parking" },
			{ icon: Coffee, name: "Room Service" },
			{ icon: Wind, name: "Air Conditioning" },
			{ icon: Wifi, name: "Housekeeping" },
		],
	};

	// Mock room options based on screenshot
	const roomOptions: RoomOption[] = [
		{
			name: "Deluxe Double Room",
			price: 2062,
			basePrice: 1816,
			taxes: 246,
			amenities: [
				"Mineral Water",
				"Wi-Fi",
				"Safe",
				"Air Conditioning",
				"Bathroom",
				"TV",
			],
			size: "210 sq.ft (25 sq.mt)",
			bedType: "1 King Bed",
			view: "City View",
			mealType: "Free Cancellation",
			cancellationPolicy: "Free Cancellation till check-in",
			isRefundable: true,
			bookingCode: "RC1",
		},
		{
			name: "Room With Free Cancellation | Breakfast only",
			price: 4274,
			basePrice: 3764,
			taxes: 510,
			amenities: ["Breakfast Included", "Free Cancellation till check-in"],
			size: "210 sq.ft",
			bedType: "1 King Bed",
			view: "City View",
			mealType: "Breakfast Included",
			cancellationPolicy: "Free Cancellation till check-in",
			isRefundable: true,
			bookingCode: "RC2",
		},
		{
			name: "Room With Free Cancellation | Breakfast + Lunch/Dinner",
			price: 4902,
			basePrice: 4318,
			taxes: 566,
			amenities: [
				"Breakfast Included",
				"Lunch Or Dinner Included",
				"Free Cancellation till check-in",
			],
			size: "210 sq.ft",
			bedType: "1 King Bed",
			view: "City View",
			mealType: "Breakfast + Lunch/Dinner",
			cancellationPolicy: "Free Cancellation till check-in",
			isRefundable: true,
			bookingCode: "RC3",
		},
	];

	// Search form state
	const [searchData, setSearchData] = useState<HotelSearchData>({
		location: "Hotel Maa Heritage, Jaipur",
		checkIn: new Date("2026-01-07"),
		checkOut: new Date("2026-01-10"),
		rooms: 3,
		adults: 4,
		children: 2,
	});

	const handleUpdateSearch = () => {
		// Redirect to search page with updated params
		const params = new URLSearchParams({
			location: searchData.location,
			checkIn: searchData.checkIn.toISOString().split("T")[0],
			checkOut: searchData.checkOut.toISOString().split("T")[0],
			rooms: searchData.rooms.toString(),
			adults: searchData.adults.toString(),
			children: searchData.children.toString(),
		});
		router.push(`/travel-portal/hotel-search?${params.toString()}`);
	};

	const handleBookNow = (roomOption: RoomOption) => {
		// Redirect to booking confirmation page
		router.push(
			`/travel-portal/booking/hotel?hotelCode=${hotelCode}&bookingCode=${roomOption.bookingCode}`
		);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Breadcrumb */}
			<div className="bg-white border-b">
				<div className="container mx-auto px-4 py-3">
					<div className="flex items-center gap-2 text-sm text-gray-600">
						<Link href="/" className="hover:text-blue-600">
							Home
						</Link>
						<ChevronRight className="w-4 h-4" />
						<a href="/travel-portal/hotel-search" className="hover:text-blue-600">
							Hotels in Jaipur
						</a>
						<ChevronRight className="w-4 h-4" />
						<span className="text-gray-900">{hotelData.name}</span>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 py-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Hotel Header */}
						<Card>
							<CardContent className="p-6">
								<div className="flex gap-4">
									{/* Hotel Image */}
									<div className="relative w-64 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
										<Image
											src="/placeholder.jpg"
											alt={hotelData.name}
											fill
											className="object-cover"
											onError={(e) => {
												e.currentTarget.style.display = "none";
											}}
										/>
										<button className="absolute bottom-3 left-3 bg-white px-3 py-1.5 rounded-md shadow-md text-sm font-medium text-blue-600 hover:bg-gray-50">
											{hotelData.propertyPhotos} Property Photos →
										</button>
									</div>

									{/* Hotel Info */}
									<div className="flex-1">
										<h1 className="text-2xl font-bold text-gray-900 mb-2">
											{hotelData.name}
										</h1>

										<div className="flex items-center gap-2 mb-2">
											{Array.from({ length: hotelData.starRating }).map(
												(_, i) => (
													<Star
														key={i}
														className="w-4 h-4 fill-yellow-400 text-yellow-400"
													/>
												)
											)}
										</div>

										<div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
											<MapPin className="w-4 h-4" />
											<span>{hotelData.location}</span>
											<a href="#" className="text-blue-600 ml-2">
												See on Map
											</a>
										</div>

										{/* Amenities */}
										<div className="mb-4">
											<h3 className="text-sm font-semibold mb-2">Amenities</h3>
											<div className="flex flex-wrap gap-4">
												{hotelData.amenities.map((amenity, index) => (
													<div
														key={index}
														className="flex items-center gap-1 text-sm text-gray-600"
													>
														<amenity.icon className="w-4 h-4" />
														<span>{amenity.name}</span>
													</div>
												))}
												<button className="text-blue-600 text-sm font-medium">
													+ More Amenities
												</button>
											</div>
										</div>

										<Alert className="bg-blue-50 border-blue-200">
											<AlertCircle className="h-4 w-4 text-blue-600" />
											<AlertDescription className="text-sm">
												Login to unlock deals & manage your bookings!
											</AlertDescription>
										</Alert>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Search Modification Card */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Change Dates and Guest(s)</CardTitle>
								<p className="text-sm text-gray-600">
									Check-in: 12 PM | Check-out: 12 PM
								</p>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-3 gap-4 mb-4">
									<div>
										<label className="text-sm font-medium text-gray-700 block mb-1">
											Check-in
										</label>
										<input
											type="date"
											value={searchData.checkIn.toISOString().split("T")[0]}
											onChange={(e) =>
												setSearchData({
													...searchData,
													checkIn: new Date(e.target.value),
												})
											}
											className="w-full px-3 py-2 border rounded-md"
										/>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700 block mb-1">
											Check-out
										</label>
										<input
											type="date"
											value={searchData.checkOut.toISOString().split("T")[0]}
											onChange={(e) =>
												setSearchData({
													...searchData,
													checkOut: new Date(e.target.value),
												})
											}
											className="w-full px-3 py-2 border rounded-md"
										/>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700 block mb-1">
											Guests
										</label>
										<input
											type="text"
											value={`${searchData.adults} Adults, ${searchData.children} Children`}
											readOnly
											className="w-full px-3 py-2 border rounded-md bg-gray-50"
										/>
									</div>
								</div>
								<Button onClick={handleUpdateSearch} className="w-full">
									UPDATE SEARCH
								</Button>
							</CardContent>
						</Card>

						{/* Room Types */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>
										{roomOptions.length} Room Types
									</CardTitle>
									<div className="flex gap-2">
										<Button variant="outline" size="sm">
											Free Cancellation
										</Button>
										<Button variant="outline" size="sm">
											Breakfast Included
										</Button>
										<Button variant="outline" size="sm">
											Breakfast & Lunch/Dinner Included
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{roomOptions.map((room, index) => (
										<div
											key={index}
											className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
										>
											<div className="flex">
												{/* Room Image */}
												<div className="relative w-56 h-40 bg-gray-200 flex-shrink-0">
													<Image
														src="/placeholder.jpg"
														alt={room.name}
														fill
														className="object-cover"
														onError={(e) => {
															e.currentTarget.style.display = "none";
														}}
													/>
													<button className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-xs font-medium">
														12 PHOTOS →
													</button>
												</div>

												{/* Room Details */}
												<div className="flex-1 p-4">
													<div className="flex justify-between">
														<div className="flex-1">
															<h4 className="font-bold text-gray-900 mb-2">
																{room.name}
															</h4>

															<div className="grid grid-cols-3 gap-2 mb-3 text-sm text-gray-600">
																<div className="flex items-center gap-1">
																	<span className="w-4 h-4">📐</span>
																	<span>{room.size}</span>
																</div>
																<div className="flex items-center gap-1">
																	<Bed className="w-4 h-4" />
																	<span>{room.bedType}</span>
																</div>
																<div className="flex items-center gap-1">
																	<Bath className="w-4 h-4" />
																	<span>1 Bathroom</span>
																</div>
															</div>

															<div className="space-y-1 mb-3">
																{room.amenities.slice(0, 3).map((amenity, i) => (
																	<div
																		key={i}
																		className="flex items-center gap-2 text-sm"
																	>
																		<span className="text-gray-600">•</span>
																		<span>{amenity}</span>
																	</div>
																))}
															</div>

															<button className="text-blue-600 text-sm font-medium">
																More Details
															</button>
														</div>

														{/* Room Pricing */}
														<div className="border-l pl-4 ml-4 text-right min-w-[200px]">
															<div className="line-through text-sm text-gray-500 mb-1">
																₹ {(room.basePrice + 500).toLocaleString("en-IN")}
															</div>
															<div className="text-2xl font-bold text-gray-900 mb-1">
																₹ {room.price.toLocaleString("en-IN")}
															</div>
															<p className="text-xs text-gray-600 mb-1">
																+₹ {room.taxes.toLocaleString("en-IN")} Taxes & Fees per night
															</p>
															<Button
																onClick={() => handleBookNow(room)}
																className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
															>
																BOOK NOW
															</Button>

															{room.isRefundable && (
																<p className="text-xs text-green-600 mt-2">
																	✓ Free Cancellation till check-in
																</p>
															)}

															<div className="mt-3 p-2 bg-teal-50 rounded text-xs">
																<p className="text-teal-800">
																	HSBC Bank Credit Card NoCostEMI Offer
																</p>
																<p className="font-medium text-teal-900">
																	Get INR 1504 Off
																</p>
																<button className="text-teal-700 underline">
																	SELECT TO AVAIL
																</button>
															</div>

															<button className="text-blue-600 text-xs mt-2">
																Login Now and get this for ₹2,038 or less
															</button>
														</div>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-1">
						<div className="sticky top-6 space-y-4">
							{/* Login Card */}
							<Card>
								<CardContent className="p-6">
									<h3 className="font-bold text-lg mb-4">
										Login to unlock deals & manage your bookings!
									</h3>
									<div className="space-y-3">
										<div>
											<label className="text-sm font-medium">Mobile Number</label>
											<div className="flex gap-2 mt-1">
												<input
													type="text"
													value="+91"
													className="w-16 px-2 py-2 border rounded"
													readOnly
												/>
												<input
													type="tel"
													placeholder="Enter mobile number"
													className="flex-1 px-3 py-2 border rounded"
												/>
											</div>
										</div>
										<Button className="w-full bg-orange-500 hover:bg-orange-600">
											LOGIN NOW
										</Button>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
