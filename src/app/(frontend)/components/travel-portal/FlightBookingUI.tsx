"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CategoryTabs from "./CategoryTabs";
import TripTypeSelector from "./TripTypeSelector";
import FromToSelector from "./FromToSelector";
import DateSelector from "./DateSelector";
import TravellerSelector from "./TravellerSelector";
import SpecialFareOptions from "./SpecialFareOptions";
import SearchButton from "./SearchButton";
import MultiCitySelector from "./MultiCitySelector";
// icons imported in CategoryTabs; no direct icon needed here

interface City {
	city: string;
	airport: string;
	code: string;
}

interface CityLeg {
	id: string;
	from: City;
	to: City;
	date?: Date;
}

export default function FlightBookingUI() {
	const router = useRouter();
	const [activeCategory, setActiveCategory] = useState("Flights");
	const [tripType, setTripType] = useState("round-trip");
	const [departureDate, setDepartureDate] = useState<Date>();
	const [returnDate, setReturnDate] = useState<Date>();
	const [travellers, setTravellers] = useState(1);
	const [travelClass, setTravelClass] = useState("Economy");
	const [selectedFare, setSelectedFare] = useState("Regular");

	const [from, setFrom] = useState({
		city: "Delhi",
		airport: "Delhi Airport India",
		code: "DEL",
	});
	const [to, setTo] = useState({
		city: "Bengaluru",
		airport: "Bengaluru International Airport ...",
		code: "BLR",
	});

	// Multi-city state
	const [multiCityLegs, setMultiCityLegs] = useState<CityLeg[]>([
		{
			id: "leg-1",
			from: { city: "Delhi", airport: "Delhi Airport India", code: "DEL" },
			to: {
				city: "Bengaluru",
				airport: "Bengaluru International Airport",
				code: "BLR",
			},
			date: undefined,
		},
		{
			id: "leg-2",
			from: {
				city: "Bengaluru",
				airport: "Bengaluru International Airport",
				code: "BLR",
			},
			to: {
				city: "Mumbai",
				airport: "Chhatrapati Shivaji Maharaj International Airport",
				code: "BOM",
			},
			date: undefined,
		},
	]);

	const handleSwap = () => {
		const temp = from;
		setFrom(to);
		setTo(temp);
	};

	const handleSearch = () => {
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
				departureDate ? formatLocalDate(departureDate) : ""
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

		searchParams.set("adults", String(travellers));
		searchParams.set(
			"journeyType",
			tripType === "round-trip" ? "2" : tripType === "multi-city" ? "3" : "1"
		);
		searchParams.set(
			"cabinClass",
			travelClass === "Economy"
				? "2"
				: travelClass === "Premium Economy"
				? "3"
				: travelClass === "Business"
				? "4"
				: "1"
		);

		// Navigate to flight search page with parameters
		router.push(`/travel-portal/flight-search?${searchParams.toString()}`);
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
							<div className="w-full lg:w-1/3">
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

					{/* Search Button */}
					<SearchButton onSearch={handleSearch} />

					{/* Explore More */}
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
				</div>
			</div>
		</div>
	);
}
