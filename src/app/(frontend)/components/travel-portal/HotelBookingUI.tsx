"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import HotelLocationSelector from "./HotelLocationSelector";
import HotelDateSelector from "./HotelDateSelector";
import RoomGuestSelector, { RoomConfig } from "./RoomGuestSelector";
import PriceRangeSelector from "./PriceRangeSelector";
import SearchButton from "./SearchButton";

interface City {
	name: string;
	country: string;
	code?: string;
}

interface PriceRange {
	min: number;
	max: number;
}

export default function HotelBookingUI() {
	const router = useRouter();
	const [location, setLocation] = useState<City>({
		name: "",
		country: "",
		code: "",
	});
	const [checkInDate, setCheckInDate] = useState<Date>();
	const [checkOutDate, setCheckOutDate] = useState<Date>();
	const [rooms, setRooms] = useState<RoomConfig[]>([
		{ adults: 1, children: 0, childrenAges: [] },
	]);
	const [travellingWithPets, setTravellingWithPets] = useState(false);
	const [priceRange, setPriceRange] = useState<PriceRange>({
		min: 0,
		max: 10000,
	});
	const [guestNationality, setGuestNationality] = useState("IN"); // Default to India

	const handleSearch = () => {
		// Validate required fields
		if (!location.name) {
			alert("Please select a destination");
			return;
		}
		if (!checkInDate) {
			alert("Please select a check-in date");
			return;
		}
		if (!checkOutDate) {
			alert("Please select a check-out date");
			return;
		}

		// Format dates in YYYY-MM-DD format
		const formatDate = (date: Date) => {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			return `${year}-${month}-${day}`;
		};

		// Prepare search parameters for the API
		const searchParams = new URLSearchParams();
		searchParams.set("location", location.name);
		searchParams.set("locationCode", location.code || "");
		searchParams.set("checkIn", formatDate(checkInDate));
		searchParams.set("checkOut", formatDate(checkOutDate));
		searchParams.set("guestNationality", guestNationality);
		searchParams.set("noOfRooms", String(rooms.length));
		searchParams.set("priceMin", String(priceRange.min));
		searchParams.set("priceMax", String(priceRange.max));
		searchParams.set("withPets", String(travellingWithPets));

		// Add room configurations
		rooms.forEach((room, index) => {
			searchParams.set(`room${index}Adults`, String(room.adults));
			searchParams.set(`room${index}Children`, String(room.children));
			if (room.children > 0) {
				searchParams.set(
					`room${index}ChildrenAges`,
					room.childrenAges.join(",")
				);
			}
		});

		// Navigate to hotel search results page
		router.push(`/travel-portal/hotel-search?${searchParams.toString()}`);
	};

	return (
		<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{/* Main Booking Card */}
			<div className="bg-white rounded-3xl shadow-xl overflow-hidden">
				{/* Booking Form */}
				<div className="p-6 sm:p-8 space-y-6">
					{/* Location Selector */}
					<div className="w-full">
						<HotelLocationSelector
							location={location}
							onLocationChange={setLocation}
						/>
					</div>

					{/* Dates, Rooms & Price */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
						{/* Check-In/Check-Out Dates - Takes more space */}
						<div className="lg:col-span-5">
							<HotelDateSelector
								checkInDate={checkInDate}
								checkOutDate={checkOutDate}
								onCheckInDateChange={setCheckInDate}
								onCheckOutDateChange={setCheckOutDate}
							/>
						</div>

						{/* Room & Guest Selector */}
						<div className="lg:col-span-4">
							<RoomGuestSelector
								rooms={rooms}
								onRoomsChange={setRooms}
								travellingWithPets={travellingWithPets}
								onPetsChange={setTravellingWithPets}
							/>
						</div>

						{/* Price Range Selector */}
						<div className="lg:col-span-3">
							<PriceRangeSelector
								priceRange={priceRange}
								onPriceRangeChange={setPriceRange}
							/>
						</div>
					</div>

					{/* Guest Nationality (Optional - can be hidden or shown based on requirement) */}
					<div className="flex items-center gap-4 px-2">
						<label className="text-sm text-gray-600">Guest Nationality:</label>
						<select
							value={guestNationality}
							onChange={(e) => setGuestNationality(e.target.value)}
							className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="IN">India</option>
							<option value="AE">United Arab Emirates</option>
							<option value="US">United States</option>
							<option value="GB">United Kingdom</option>
							<option value="SG">Singapore</option>
							<option value="TH">Thailand</option>
							<option value="MY">Malaysia</option>
							{/* Add more countries as needed */}
						</select>
					</div>

					{/* Additional Filters Info */}
					<div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
						<div className="flex items-start gap-3">
							<svg
								className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<div>
								<p className="text-sm font-medium text-blue-900">
									Additional Filters Available
								</p>
								<p className="text-xs text-blue-700 mt-1">
									You can refine your search with meal types, refundable
									options, and more filters on the results page.
								</p>
							</div>
						</div>
					</div>

					{/* Search Button */}
					<SearchButton onSearch={handleSearch} />

					{/* Trending Searches */}
					<div className="pt-2">
						<div className="text-center mb-3">
							<span className="text-xs text-gray-500 uppercase font-semibold">
								Trending Searches
							</span>
						</div>
						<div className="flex flex-wrap items-center justify-center gap-2">
							{[
								"Mumbai, India",
								"Dubai, United Arab Emirates",
								"Bangkok, Thailand",
							].map((dest) => (
								<button
									key={dest}
									onClick={() => {
										const [city, country] = dest.split(", ");
										setLocation({ name: city, country, code: "" });
									}}
									className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors"
								>
									{dest}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Info Cards */}
			<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white rounded-xl p-6 shadow-md">
					<div className="flex items-start gap-4">
						<div className="bg-green-100 rounded-lg p-3">
							<svg
								className="w-6 h-6 text-green-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div>
							<h3 className="font-semibold text-gray-900 mb-1">
								Best Price Guarantee
							</h3>
							<p className="text-sm text-gray-600">
								Find lower price? We'll refund the difference
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl p-6 shadow-md">
					<div className="flex items-start gap-4">
						<div className="bg-blue-100 rounded-lg p-3">
							<svg
								className="w-6 h-6 text-blue-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
						</div>
						<div>
							<h3 className="font-semibold text-gray-900 mb-1">
								Secure Booking
							</h3>
							<p className="text-sm text-gray-600">
								Your data is protected with industry-leading security
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl p-6 shadow-md">
					<div className="flex items-start gap-4">
						<div className="bg-purple-100 rounded-lg p-3">
							<svg
								className="w-6 h-6 text-purple-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
						</div>
						<div>
							<h3 className="font-semibold text-gray-900 mb-1">24/7 Support</h3>
							<p className="text-sm text-gray-600">
								Customer service available round the clock
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
