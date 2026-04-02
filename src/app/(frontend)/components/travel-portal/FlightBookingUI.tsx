"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CategoryTabs from "./CategoryTabs";
import TripTypeSelector from "./TripTypeSelector";
import FromToSelector from "./FromToSelector";
import DateSelector from "./DateSelector";
import TravellerSelector, { TravellerCount } from "./TravellerSelector";
import SpecialFareOptions from "./SpecialFareOptions";
import SearchButton from "./SearchButton";
import MultiCitySelector from "./MultiCitySelector";
import HotelLocationSelector from "./HotelLocationSelector";
import HotelDateSelector from "./HotelDateSelector";
import RoomGuestSelector, { RoomConfig } from "./RoomGuestSelector";
import PriceRangeSelector from "./PriceRangeSelector";
import CabSearchForm, {
	type CabSearchData,
} from "@/components/travel-portal/CabSearchForm";
// icons imported in CategoryTabs; no direct icon needed here

interface City {
	city: string;
	airport: string;
	code: string;
}

interface HotelCity {
	name: string;
	country: string;
	code?: string;
}

interface CityLeg {
	id: string;
	from: City;
	to: City;
	date?: Date;
}

interface PriceRange {
	min: number;
	max: number;
}

export default function FlightBookingUI() {
	const router = useRouter();
	const [activeCategory, setActiveCategory] = useState("Flights");
	const [tripType, setTripType] = useState("round-trip");
	const [departureDate, setDepartureDate] = useState<Date>();
	const [returnDate, setReturnDate] = useState<Date>();
	const [travellers, setTravellers] = useState<TravellerCount>({
		adults: 1,
		children: 0,
		infants: 0,
	});
	const [travelClass, setTravelClass] = useState("Economy");
	const [selectedFare, setSelectedFare] = useState("Regular");

	// Hotel booking states
	const [hotelLocation, setHotelLocation] = useState<HotelCity>({
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
	const [guestNationality, setGuestNationality] = useState("IN");

	const [from, setFrom] = useState({
		city: "",
		airport: "",
		code: "",
	});
	const [to, setTo] = useState({
		city: "",
		airport: "",
		code: "",
	});

	// Multi-city state
	const [multiCityLegs, setMultiCityLegs] = useState<CityLeg[]>([
		{
			id: "leg-1",
			from: { city: "", airport: "", code: "" },
			to: { city: "", airport: "", code: "" },
			date: undefined,
		},
		{
			id: "leg-2",
			from: { city: "", airport: "", code: "" },
			to: { city: "", airport: "", code: "" },
			date: undefined,
		},
	]);

	const handleSwap = () => {
		const temp = from;
		setFrom(to);
		setTo(temp);
	};

	const handleSearch = () => {
		if (activeCategory === "Hotels") {
			handleHotelSearch();
		} else if (activeCategory === "Cabs") {
			return;
		} else {
			handleFlightSearch();
		}
	};

	const handleCabSearch = (searchData: CabSearchData) => {
		const searchParams = new URLSearchParams();
		searchParams.set("journeyType", searchData.journeyType);
		searchParams.set("tripType", searchData.tripType);
		searchParams.set("pickupDateTime", searchData.pickupDateTime);
		searchParams.set("passengers", String(searchData.passengers));
		searchParams.set("origin", JSON.stringify(searchData.origin));
		searchParams.set("destination", JSON.stringify(searchData.destination));

		if (searchData.returnDateTime) {
			searchParams.set("returnDateTime", searchData.returnDateTime);
		}

		router.push(`/travel-portal/cab-search?${searchParams.toString()}`);
	};

	const handleFlightSearch = () => {
		// Validate round trip requires return date
		if (tripType === "round-trip" && !returnDate) {
			alert("Please select a return date for round trip flights");
			return;
		}

		// Helper function to format date in local timezone
		const formatLocalDate = (date: Date) => {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			return `${year}-${month}-${day}T00:00:00`;
		};

		// Prepare search parameters and navigate to flight search page
		const searchParams = new URLSearchParams();

		if (tripType === "one-way" || tripType === "round-trip") {
			searchParams.set("origin", from.code);
			searchParams.set("destination", to.code);
			searchParams.set(
				"departureDate",
				departureDate ? formatLocalDate(departureDate) : "",
			);

			if (tripType === "round-trip" && returnDate) {
				searchParams.set("returnDate", formatLocalDate(returnDate));
			}
		} else if (tripType === "multi-city") {
			// For multi-city, pass all legs data
			multiCityLegs.forEach((leg, index) => {
				searchParams.set(`leg${index + 1}From`, leg.from.code);
				searchParams.set(`leg${index + 1}To`, leg.to.code);
				if (leg.date) {
					searchParams.set(`leg${index + 1}Date`, formatLocalDate(leg.date));
				}
			});
		}

		searchParams.set("adults", String(travellers.adults));
		searchParams.set("children", String(travellers.children));
		searchParams.set("infants", String(travellers.infants));
		searchParams.set(
			"journeyType",
			tripType === "round-trip" ? "2" : tripType === "multi-city" ? "3" : "1",
		);
		searchParams.set(
			"cabinClass",
			travelClass === "Economy"
				? "2"
				: travelClass === "Premium Economy"
					? "3"
					: travelClass === "Business"
						? "4"
						: "1",
		);

		// Navigate to flight search page with parameters
		router.push(`/travel-portal/flight-search?${searchParams.toString()}`);
	};

	const handleHotelSearch = () => {
		// Validate required fields
		if (!hotelLocation.name) {
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
		searchParams.set("location", hotelLocation.name);
		searchParams.set("locationCode", hotelLocation.code || "");
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
					room.childrenAges.join(","),
				);
			}
		});

		// Navigate to hotel search results page
		router.push(`/travel-portal/hotel-search?${searchParams.toString()}`);
	};

	// Map active category to a transportType id used by TravellerSelector
	const transportTypeMap: Record<string, string | undefined> = {
		Flights: "air",
		Trains: "train",
		Buses: "bus",
		Cabs: "road",
	};

	const transportType = transportTypeMap[activeCategory];

	// Keep travelClass sensible when transportType changes
	useEffect(() => {
		const trainClasses = [
			"All classes",
			"Sleeper",
			"Third AC",
			"Second AC",
			"First AC",
			"Second Seating",
			"Vistadome AC",
			"AC Chair Car",
			"First Class",
			"Third AC Economy",
		];

		const current = travelClass || "";
		if (transportType === "train") {
			if (!trainClasses.includes(current)) setTravelClass("All classes");
		} else if (transportType) {
			if (trainClasses.includes(current)) setTravelClass("Economy");
		}
	}, [transportType, travelClass]);

	const isRoundTrip = tripType === "round-trip";
	const isMultiCity = tripType === "multi-city";

	return (
		<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{/* Main Booking Card */}
			<div className="bg-white rounded-3xl shadow-xl overflow-hidden">
				{/* Category Tabs */}
				<CategoryTabs
					activeCategory={activeCategory}
					onCategoryChange={setActiveCategory}
				/>

				{/* Booking Form */}
				<div className="p-6 sm:p-8 space-y-6">
					{activeCategory === "Flights" ? (
						<>
							{/* Flight Booking UI */}
							{/* Trip Type */}
							<TripTypeSelector
								tripType={tripType}
								onTripTypeChange={setTripType}
							/>

							{/* Conditional Rendering based on Trip Type */}
							{isMultiCity ? (
								<>
									{/* Multi-City Flights */}
									<MultiCitySelector
										legs={multiCityLegs}
										onLegsChange={setMultiCityLegs}
									/>

									{/* Travellers Only for Multi-City */}
									<div className="w-full lg:w-64">
										<TravellerSelector
											travellers={travellers}
											travelClass={travelClass}
											transportType={transportType}
											onTravellersChange={setTravellers}
											onClassChange={setTravelClass}
										/>
									</div>
								</>
							) : (
								<>
									{/* Regular One-Way/Round-Trip */}
									<FromToSelector
										from={from}
										to={to}
										onSwap={handleSwap}
										onFromChange={setFrom}
										onToChange={setTo}
									/>

									{/* Dates & Travellers */}
									<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
										<div className="lg:col-span-2">
											<DateSelector
												departureDate={departureDate}
												returnDate={returnDate}
												onDepartureDateChange={setDepartureDate}
												onReturnDateChange={setReturnDate}
												isRoundTrip={isRoundTrip}
											/>
										</div>
										<div>
											<TravellerSelector
												travellers={travellers}
												travelClass={travelClass}
												transportType={transportType}
												onTravellersChange={setTravellers}
												onClassChange={setTravelClass}
											/>
										</div>
									</div>
								</>
							)}

							{/* Special Fares */}
							<SpecialFareOptions
								selectedFare={selectedFare}
								onFareChange={setSelectedFare}
							/>
						</>
					) : activeCategory === "Hotels" ? (
						<>
							{/* Hotel Booking UI */}
							{/* Location Selector */}
							<div className="w-full">
								<HotelLocationSelector
									location={hotelLocation}
									onLocationChange={setHotelLocation}
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

							{/* Guest Nationality */}
							<div className="flex items-center gap-4 px-2">
								<label className="text-sm text-gray-600">
									Guest Nationality:
								</label>
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
						</>
					) : activeCategory === "Cabs" ? (
						<>
							<div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
								<p className="text-sm font-medium text-amber-900">
									TripJack cabs are now live on the travel portal for location
									lookup and quote search.
								</p>
								<p className="mt-1 text-sm text-amber-800/80">
									Search airport transfers, local rides, rentals and outstation
									journeys using TripJack locations and real-time fare
									responses.
								</p>
							</div>

							<CabSearchForm onSearch={handleCabSearch} />
						</>
					) : (
						<>
							{/* Placeholder for other categories */}
							<div className="text-center py-12">
								<div className="text-gray-400 mb-4">
									<svg
										className="w-16 h-16 mx-auto"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
										/>
									</svg>
								</div>
								<h3 className="text-xl font-semibold text-gray-700 mb-2">
									{activeCategory} Booking
								</h3>
								<p className="text-gray-500">Coming soon...</p>
							</div>
						</>
					)}

					{/* Search Button */}
					{activeCategory !== "Cabs" && (
						<SearchButton onSearch={handleSearch} />
					)}

					{/* Explore More - Only show for Flights */}
					{activeCategory === "Flights" && (
						<div className="text-center pt-2">
							<button className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 mx-auto">
								<span>Explore More</span>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
						</div>
					)}

					{/* Trending Searches - Only show for Hotels */}
					{activeCategory === "Hotels" && (
						<div className="pt-2">
							<div className="text-center mb-3">
								<span className="text-xs text-gray-500 uppercase font-semibold">
									Trending Searches
								</span>
							</div>
							<div className="flex flex-wrap items-center justify-center gap-2">
								{[
									{ city: "Mumbai, India" },
									{ city: "Dubai, United Arab Emirates" },
									{ city: "Bangkok, Thailand" },
								].map((item) => (
									<button
										key={item.city}
										onClick={() => {
											const [name, country] = item.city.split(", ");
											setHotelLocation({ name, country, code: "" });
										}}
										className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors"
									>
										{item.city}
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
