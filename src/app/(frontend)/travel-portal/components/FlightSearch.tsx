"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Plane, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { toast } from "@/lib/toast";
import type { FlightResult, FlightSegmentDetail } from "@/types/tekTravels";
import DateSelector from "../../components/travel-portal/DateSelector";
import TravellerSelector from "../../components/travel-portal/TravellerSelector";
import FromToSelector from "../../components/travel-portal/FromToSelector";
import TripTypeSelector from "../../components/travel-portal/TripTypeSelector";
import SearchButton from "../../components/travel-portal/SearchButton";

interface City {
	city: string;
	airport: string;
	code: string;
}

interface FlightSearchForm {
	origin: string;
	destination: string;
	departureDate: Date | undefined;
	returnDate?: Date | undefined;
	adults: number;
	children: number;
	infants: number;
	cabinClass: string;
	journeyType: "1" | "2"; // 1: OneWay, 2: Return
	directFlight: boolean;
	oneStopFlight: boolean;
}

const timeSlots = [
	{ label: "Before 6AM", icon: Sunrise, range: [0, 6] },
	{ label: "6AM - 12PM", icon: Sun, range: [6, 12] },
	{ label: "12PM - 6PM", icon: Sunset, range: [12, 18] },
	{ label: "After 6PM", icon: Moon, range: [18, 24] },
];

const cabinClassMapping: { [key: string]: string } = {
	Economy: "1",
	"Premium Economy": "3",
	Business: "4",
	"Premium Business": "5",
	First: "6",
};

const reverseCabinClassMapping: { [key: string]: string } = {
	"1": "Economy",
	"2": "Economy",
	"3": "Premium Economy",
	"4": "Business",
	"5": "Premium Business",
	"6": "First",
};

const tripTypeMapping: { [key: string]: string } = {
	"one-way": "1",
	"round-trip": "2",
};

const reverseTripTypeMapping: { [key: string]: string } = {
	"1": "one-way",
	"2": "round-trip",
};

// Airport code to city name mapping
const airportToCityMap: { [key: string]: string } = {
	DEL: "Delhi",
	BLR: "Bengaluru",
	BOM: "Mumbai",
	HYD: "Hyderabad",
	MAA: "Chennai",
	CCU: "Kolkata",
	PNQ: "Pune",
	AMD: "Ahmedabad",
	GOI: "Goa",
	JAI: "Jaipur",
	COK: "Kochi",
	TRV: "Thiruvananthapuram",
	GAU: "Guwahati",
	IXC: "Chandigarh",
	IXR: "Ranchi",
	BBI: "Bhubaneswar",
	VNS: "Varanasi",
	IXB: "Bagdogra",
	NAG: "Nagpur",
	IXL: "Leh",
	ATQ: "Amritsar",
	IXJ: "Jammu",
	SXR: "Srinagar",
	IXZ: "Port Blair",
	IXU: "Aurangabad",
	RPR: "Raipur",
	IXD: "Allahabad",
};

export default function FlightSearch() {
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState(false);
	const [flights, setFlights] = useState<FlightResult[]>([]);
	const [searchPerformed, setSearchPerformed] = useState(false);

	// DateSelector state
	const [departureDate, setDepartureDate] = useState<Date>();
	const [returnDate, setReturnDate] = useState<Date>();

	// TravellerSelector state
	const [travellers, setTravellers] = useState(1);
	const [travelClass, setTravelClass] = useState("Economy");

	// TripTypeSelector state
	const [tripType, setTripType] = useState("one-way");

	// FromToSelector state
	const [from, setFrom] = useState({
		city: "Delhi",
		airport: "Delhi Airport India",
		code: "DEL",
	});
	const [to, setTo] = useState({
		city: "Bengaluru",
		airport: "Bengaluru International Airport",
		code: "BLR",
	});

	// Filter states
	const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
	const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 100000]);
	const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
	const [selectedDepartureTimes, setSelectedDepartureTimes] = useState<
		string[]
	>([]);
	const [selectedArrivalTimes, setSelectedArrivalTimes] = useState<string[]>(
		[]
	);

	const [filteredFlights, setFilteredFlights] = useState<FlightResult[]>([]);

	const form = useForm<FlightSearchForm>({
		defaultValues: {
			origin: "",
			destination: "",
			departureDate: undefined,
			returnDate: undefined,
			adults: 1,
			children: 0,
			infants: 0,
			cabinClass: "1",
			journeyType: "1",
			directFlight: true,
			oneStopFlight: false,
		},
	});

	// Auto-fill form and search if URL parameters are present
	useEffect(() => {
		const origin = searchParams.get("origin");
		const destination = searchParams.get("destination");
		const departureDate = searchParams.get("departureDate");
		const returnDate = searchParams.get("returnDate");
		const adults = searchParams.get("adults");
		const journeyType = searchParams.get("journeyType");
		const cabinClass = searchParams.get("cabinClass");

		if (origin && destination && departureDate) {
			// Fill form with URL parameters
			form.setValue("origin", origin);
			form.setValue("destination", destination);
			setFrom({ city: "Delhi", airport: "Delhi Airport India", code: origin }); // Simplified, should lookup actual city
			setTo({
				city: "Bengaluru",
				airport: "Bengaluru International Airport",
				code: destination,
			}); // Simplified
			const depDate = new Date(departureDate);
			setDepartureDate(depDate);
			form.setValue("departureDate", depDate);
			if (returnDate) {
				const retDate = new Date(returnDate);
				setReturnDate(retDate);
				form.setValue("returnDate", retDate);
			}
			if (adults) {
				const adultCount = parseInt(adults);
				setTravellers(adultCount);
				form.setValue("adults", adultCount);
			}
			if (journeyType) {
				form.setValue("journeyType", journeyType as "1" | "2");
				setTripType(reverseTripTypeMapping[journeyType] || "one-way");
			}
			if (cabinClass) {
				form.setValue("cabinClass", cabinClass);
				setTravelClass(reverseCabinClassMapping[cabinClass] || "Economy");
			}

			// Automatically perform search
			handleAutoSearch({
				origin,
				destination,
				departureDate: depDate,
				returnDate: returnDate ? new Date(returnDate) : undefined,
				adults: adults ? parseInt(adults) : 1,
				children: 0,
				infants: 0,
				cabinClass: cabinClass || "1",
				journeyType: (journeyType as "1" | "2") || "1",
				directFlight: true,
				oneStopFlight: false,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	const handleSwap = () => {
		const temp = from;
		setFrom(to);
		setTo(temp);
		form.setValue("origin", to.code);
		form.setValue("destination", from.code);
	};

	const handleFromChange = (city: City) => {
		setFrom(city);
		form.setValue("origin", city.code);
	};

	const handleToChange = (city: City) => {
		setTo(city);
		form.setValue("destination", city.code);
	};

	const handleTripTypeChange = (type: string) => {
		setTripType(type);
		form.setValue("journeyType", tripTypeMapping[type] as "1" | "2");
	};

	// Filter flights based on selected criteria
	useEffect(() => {
		const filtered = flights.filter((flight) => {
			const price = flight.Fare.OfferedFare;
			if (price < priceRange[0] || price > priceRange[1]) return false;

			if (
				selectedAirlines.length > 0 &&
				!selectedAirlines.includes(flight.AirlineCode)
			)
				return false;

			// Arrival time
			if (selectedArrivalTimes.length > 0) {
				const timeString =
					flight.Segments?.[0]?.[flight.Segments[0].length - 1]?.Destination
						?.ArrTime ||
					flight.Segments?.[0]?.[flight.Segments[0].length - 1]?.ArrivalTime;
				if (timeString) {
					const arrTime = new Date(timeString).getHours();
					if (!isNaN(arrTime)) {
						const isInSelectedSlot = selectedArrivalTimes.some((slotLabel) => {
							const slot = timeSlots.find((s) => s.label === slotLabel);
							return (
								slot && arrTime >= slot.range[0] && arrTime < slot.range[1]
							);
						});
						if (!isInSelectedSlot) return false;
					}
				}
			}

			// Departure time (for round trip)
			if (tripType === "round-trip" && selectedDepartureTimes.length > 0) {
				const timeString =
					flight.Segments?.[0]?.[0]?.Origin?.DepTime ||
					flight.Segments?.[0]?.[0]?.DepartureTime;
				if (timeString) {
					const depTime = new Date(timeString).getHours();
					if (!isNaN(depTime)) {
						const isInSelectedSlot = selectedDepartureTimes.some(
							(slotLabel) => {
								const slot = timeSlots.find((s) => s.label === slotLabel);
								return (
									slot && depTime >= slot.range[0] && depTime < slot.range[1]
								);
							}
						);
						if (!isInSelectedSlot) return false;
					}
				}
			}

			return true;
		});
		setFilteredFlights(filtered);
	}, [
		flights,
		priceRange,
		selectedAirlines,
		selectedDepartureTimes,
		selectedArrivalTimes,
		tripType,
	]);

	// Update price range when new flights are loaded
	useEffect(() => {
		if (flights.length > 0) {
			const prices = flights.map((flight) => flight.Fare.OfferedFare);
			const minPrice = Math.min(...prices);
			const maxPrice = Math.max(...prices);
			setPriceBounds([minPrice, maxPrice]);
			setPriceRange([minPrice, maxPrice]);
		}
	}, [flights]);

	const handleAutoSearch = async (searchData: FlightSearchForm) => {
		// Validate round trip requires return date
		if (searchData.journeyType === "2" && !searchData.returnDate) {
			toast.error("Please select a return date for round trip flights");
			return;
		}

		setLoading(true);
		setSearchPerformed(true);

		try {
			const formatLocalDate = (date: Date) => {
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, "0");
				const day = String(date.getDate()).padStart(2, "0");
				return `${year}-${month}-${day}`;
			};

			const searchParams = {
				Origin: searchData.origin.toUpperCase(),
				Destination: searchData.destination.toUpperCase(),
				PreferredDepartureTime: searchData.departureDate
					? formatLocalDate(searchData.departureDate)
					: "",
				ReturnPreferredDepartureTime: searchData.returnDate
					? formatLocalDate(searchData.returnDate)
					: "",
				AdultCount: String(searchData.adults),
				ChildCount: String(searchData.children),
				InfantCount: String(searchData.infants),
				FlightCabinClass: searchData.cabinClass,
				JourneyType: searchData.journeyType,
				DirectFlight: String(searchData.directFlight),
				OneStopFlight: String(searchData.oneStopFlight),
			};

			const response = await fetch("/api/travel/flights/search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(searchParams),
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Search failed");
			}

			// Extract flights from the response
			let flightResults: FlightResult[] = [];

			if (searchParams.JourneyType === "2") {
				// Round trip - combine outbound and return flights
				const outboundFlights = result.data?.Response?.Results?.[0] || [];
				const returnFlights = result.data?.Response?.Results?.[1] || [];

				console.log("Round trip search results:", {
					outboundFlights: outboundFlights.length,
					returnFlights: returnFlights.length,
					journeyType: searchParams.JourneyType,
				});

				// For round trips, create combined flight results
				// Each result will have both outbound and return segments
				flightResults = outboundFlights.map(
					(outboundFlight: FlightResult, index: number) => {
						const returnFlight = returnFlights[index] || returnFlights[0];
						const totalFare = returnFlight
							? outboundFlight.Fare.OfferedFare + returnFlight.Fare.OfferedFare
							: outboundFlight.Fare.OfferedFare;

						return {
							...outboundFlight,
							Fare: {
								...outboundFlight.Fare,
								OfferedFare: totalFare,
							},
							Segments: [
								outboundFlight.Segments[0], // Outbound segments
								returnFlight ? returnFlight.Segments[0] : [], // Return segments
							],
						};
					}
				);
			} else {
				// One-way
				flightResults = result.data?.Response?.Results?.[0] || [];
			}

			setFlights(flightResults);

			if (flightResults.length === 0) {
				toast.info("No flights found for the selected criteria");
			} else {
				toast.success(`Found ${flightResults.length} flight options`);
			}
		} catch (error) {
			console.error("Flight search error:", error);
			toast.error(error instanceof Error ? error.message : "Search failed");
			setFlights([]);
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: FlightSearchForm) => {
		// Validate round trip requires return date
		if (data.journeyType === "2" && !data.returnDate) {
			toast.error("Please select a return date for round trip flights");
			return;
		}

		setLoading(true);
		setSearchPerformed(true);

		try {
			const formatLocalDate = (date: Date) => {
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, "0");
				const day = String(date.getDate()).padStart(2, "0");
				return `${year}-${month}-${day}`;
			};

			const searchParams = {
				Origin: data.origin.toUpperCase(),
				Destination: data.destination.toUpperCase(),
				PreferredDepartureTime: data.departureDate
					? formatLocalDate(data.departureDate)
					: "",
				ReturnPreferredDepartureTime: data.returnDate
					? formatLocalDate(data.returnDate)
					: "",
				AdultCount: String(data.adults),
				ChildCount: String(data.children),
				InfantCount: String(data.infants),
				FlightCabinClass: data.cabinClass,
				JourneyType: data.journeyType,
				DirectFlight: String(data.directFlight),
				OneStopFlight: String(data.oneStopFlight),
			};

			const response = await fetch("/api/travel/flights/search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(searchParams),
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Search failed");
			}

			// Extract flights from the response
			let flightResults: FlightResult[] = [];

			if (searchParams.JourneyType === "2") {
				// Round trip - combine outbound and return flights
				const outboundFlights = result.data?.Response?.Results?.[0] || [];
				const returnFlights = result.data?.Response?.Results?.[1] || [];

				console.log("Round trip search results:", {
					outboundFlights: outboundFlights.length,
					returnFlights: returnFlights.length,
					journeyType: searchParams.JourneyType,
				});

				// For round trips, create combined flight results
				// Each result will have both outbound and return segments
				flightResults = outboundFlights.map(
					(outboundFlight: FlightResult, index: number) => {
						const returnFlight = returnFlights[index] || returnFlights[0];
						const totalFare = returnFlight
							? outboundFlight.Fare.OfferedFare + returnFlight.Fare.OfferedFare
							: outboundFlight.Fare.OfferedFare;

						return {
							...outboundFlight,
							Fare: {
								...outboundFlight.Fare,
								OfferedFare: totalFare,
							},
							Segments: [
								outboundFlight.Segments[0], // Outbound segments
								returnFlight ? returnFlight.Segments[0] : [], // Return segments
							],
						};
					}
				);
			} else {
				// One-way
				flightResults = result.data?.Response?.Results?.[0] || [];
			}

			setFlights(flightResults);

			if (flightResults.length === 0) {
				toast.info("No flights found for the selected criteria");
			} else {
				toast.success(`Found ${flightResults.length} flight options`);
			}
		} catch (error) {
			console.error("Flight search error:", error);
			toast.error(error instanceof Error ? error.message : "Search failed");
			setFlights([]);
		} finally {
			setLoading(false);
		}
	};

	const formatDuration = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	};

	const formatTime = (dateString: string | undefined) => {
		if (!dateString) return "--:--";
		if (!dateString) return "N/A";

		console.log("Raw date string:", dateString);

		try {
			// Handle various date formats that TBO might return
			let date: Date | null;

			// If it's already a valid date string, parse it
			date = new Date(dateString);
			if (!isNaN(date.getTime())) {
				console.log("Parsed with direct Date constructor:", date.toISOString());
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			// Try removing milliseconds if present (TBO sometimes includes them)
			const withoutMs = dateString.replace(/\.\d+/, "");
			console.log("After removing milliseconds:", withoutMs);
			date = new Date(withoutMs);
			if (!isNaN(date.getTime())) {
				console.log("Parsed after removing milliseconds:", date.toISOString());
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			// Try replacing space with T for ISO format
			const isoString = dateString.replace(" ", "T");
			console.log("After replacing space with T:", isoString);
			date = new Date(isoString);
			if (!isNaN(date.getTime())) {
				console.log("Parsed with ISO format:", date.toISOString());
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			// Try parsing as UTC if it ends with Z
			if (dateString.endsWith("Z")) {
				date = new Date(dateString + (dateString.includes("Z") ? "" : "Z"));
				if (!isNaN(date.getTime())) {
					console.log("Parsed as UTC:", date.toISOString());
					return date.toLocaleTimeString("en-IN", {
						hour: "2-digit",
						minute: "2-digit",
					});
				}
			}

			// Try manual parsing for common formats
			const manualParse = (str: string) => {
				// Match formats like: 2024-12-04T10:30:00 or 2024-12-04 10:30:00
				const match = str.match(
					/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/
				);
				if (match) {
					const [, year, month, day, hour, minute, second] = match;
					return new Date(
						parseInt(year),
						parseInt(month) - 1,
						parseInt(day),
						parseInt(hour),
						parseInt(minute),
						parseInt(second)
					);
				}
				return null;
			};

			date = manualParse(dateString);
			if (date && !isNaN(date.getTime())) {
				console.log("Parsed with manual parsing:", date.toISOString());
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			console.log("Could not parse date string:", dateString);
			return "Invalid Date";
		} catch (error) {
			console.log("Error parsing date:", dateString, error);
			return "Invalid Date";
		}
	};

	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return "--";
		if (!dateString) return "N/A";

		try {
			// Handle various date formats that TBO might return
			let date: Date | null;

			// If it's already a valid date string, parse it
			date = new Date(dateString);
			if (!isNaN(date.getTime())) {
				return date.toLocaleDateString("en-IN", {
					day: "numeric",
					month: "short",
				});
			}

			// Try removing milliseconds if present (TBO sometimes includes them)
			const withoutMs = dateString.replace(/\.\d+/, "");
			date = new Date(withoutMs);
			if (!isNaN(date.getTime())) {
				return date.toLocaleDateString("en-IN", {
					day: "numeric",
					month: "short",
				});
			}

			// Try replacing space with T for ISO format
			const isoString = dateString.replace(" ", "T");
			date = new Date(isoString);
			if (!isNaN(date.getTime())) {
				return date.toLocaleDateString("en-IN", {
					day: "numeric",
					month: "short",
				});
			}

			console.log("Could not parse date string:", dateString);
			return "Invalid Date";
		} catch (error) {
			console.log("Error parsing date:", dateString, error);
			return "Invalid Date";
		}
	};

	const FlightLegDisplay = ({
		segments,
		legType,
	}: {
		segments: FlightSegmentDetail[];
		legType: string;
	}) => {
		const firstSegment = segments?.[0];
		const lastSegment = segments?.[segments.length - 1];

		console.log(`FlightLegDisplay - ${legType}:`, {
			segments,
			firstSegment,
			lastSegment,
		});

		if (!firstSegment || !lastSegment) return null;

		// Get city names with better fallback logic
		const getLocationName = (
			location:
				| FlightSegmentDetail["Origin"]
				| FlightSegmentDetail["Destination"]
		) => {
			const airportCode = location?.Airport?.AirportCode;
			return (
				location?.Airport?.CityName ||
				(airportCode && airportToCityMap[airportCode]) ||
				location?.Airport?.AirportName ||
				airportCode ||
				"Unknown"
			);
		};

		return (
			<div className="mb-4">
				<div className="text-sm font-semibold text-primary mb-2">{legType}</div>
				<div className="flex items-center gap-4">
					<div className="text-center">
						<div className="text-lg font-bold">
							{firstSegment.Origin?.Airport?.AirportCode || "N/A"}
						</div>
						<div className="text-sm text-muted-foreground font-medium">
							{getLocationName(firstSegment.Origin)}
						</div>
						<div className="text-sm font-medium">
							{formatTime(
								firstSegment.Origin?.DepTime || firstSegment.DepartureTime
							)}
						</div>
						<div className="text-xs text-muted-foreground">
							{formatDate(
								firstSegment.Origin?.DepTime || firstSegment.DepartureTime
							)}
						</div>
					</div>

					<div className="flex-1 flex flex-col items-center">
						<div className="text-sm text-muted-foreground mb-1">
							{formatDuration(firstSegment.Duration)}
						</div>
						<div className="w-full h-px bg-border relative">
							<Plane className="h-3 w-3 absolute right-0 top-1/2 -translate-y-1/2 text-blue-500" />
						</div>
						{segments.length > 1 && (
							<div className="text-xs text-muted-foreground mt-1">
								{segments.length - 1} stop(s)
							</div>
						)}
					</div>

					<div className="text-center">
						<div className="text-lg font-bold">
							{lastSegment.Destination?.Airport?.AirportCode || "N/A"}
						</div>
						<div className="text-sm text-muted-foreground font-medium">
							{getLocationName(lastSegment.Destination)}
						</div>
						<div className="text-sm font-medium">
							{formatTime(
								lastSegment.Destination?.ArrTime || lastSegment.ArrivalTime
							)}
						</div>
						<div className="text-xs text-muted-foreground">
							{formatDate(
								lastSegment.Destination?.ArrTime || lastSegment.ArrivalTime
							)}
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Plane className="h-5 w-5" />
						Flight Search
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{/* Trip Type Selector */}
						<div className="flex justify-center">
							<TripTypeSelector
								tripType={tripType}
								onTripTypeChange={handleTripTypeChange}
							/>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							{/* From/To Selector */}
							<div className="lg:col-span-2">
								<FromToSelector
									from={from}
									to={to}
									onSwap={handleSwap}
									onFromChange={handleFromChange}
									onToChange={handleToChange}
								/>
							</div>

							{/* Dates */}
							<div className="lg:col-span-2">
								<DateSelector
									departureDate={departureDate}
									returnDate={returnDate}
									onDepartureDateChange={(date) => {
										setDepartureDate(date);
										form.setValue("departureDate", date);
									}}
									onReturnDateChange={(date) => {
										setReturnDate(date);
										form.setValue("returnDate", date);
									}}
									isRoundTrip={tripType === "round-trip"}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Travellers & Class */}
							<div className="space-y-2">
								<TravellerSelector
									travellers={travellers}
									travelClass={travelClass}
									onTravellersChange={(count) => {
										setTravellers(count);
										form.setValue("adults", count); // For now, set all as adults
									}}
									onClassChange={(cls) => {
										setTravelClass(cls);
										form.setValue("cabinClass", cabinClassMapping[cls] || "1");
									}}
								/>
							</div>

							{/* Flight Preferences */}
							<div className="space-y-2">
								<Label>Flight Preferences</Label>
								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="directFlight"
											checked={form.watch("directFlight")}
											onCheckedChange={(checked) =>
												form.setValue("directFlight", checked as boolean)
											}
										/>
										<Label htmlFor="directFlight" className="text-sm">
											Direct Flights
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox
											id="oneStopFlight"
											checked={form.watch("oneStopFlight")}
											onCheckedChange={(checked) =>
												form.setValue("oneStopFlight", checked as boolean)
											}
										/>
										<Label htmlFor="oneStopFlight" className="text-sm">
											One Stop
										</Label>
									</div>
								</div>
							</div>
						</div>

						{/* Search Button */}
						<SearchButton
							onSearch={form.handleSubmit(onSubmit)}
							loading={loading}
						/>
					</form>
				</CardContent>
			</Card>

			{/* Flight Results */}
			{searchPerformed && flights.length > 0 && (
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					<div className="lg:col-span-1">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle>Filters</CardTitle>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setPriceRange(priceBounds);
										setSelectedAirlines([]);
										setSelectedDepartureTimes([]);
										setSelectedArrivalTimes([]);
									}}
								>
									Clear Filters
								</Button>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									{/* Price Range */}
									<div className="space-y-3">
										<Label className="text-sm font-medium">Price Range</Label>
										<div className="px-2">
											<Slider
												value={priceRange}
												onValueChange={(value) =>
													setPriceRange(value as [number, number])
												}
												max={priceBounds[1]}
												min={priceBounds[0]}
												step={500}
												className="w-full"
											/>
											<div className="flex justify-between text-xs text-muted-foreground mt-1">
												<span>₹{priceRange[0].toLocaleString()}</span>
												<span>₹{priceRange[1].toLocaleString()}</span>
											</div>
										</div>
									</div>

									{/* Departure Time Filter (for round trip) */}
									{tripType === "round-trip" && (
										<div className="space-y-3">
											<Label className="text-sm font-medium">
												Departure Time
											</Label>
											<div className="space-y-2">
												{timeSlots.map((slot) => {
													const IconComponent = slot.icon;
													return (
														<div
															key={slot.label}
															className="flex items-center space-x-2"
														>
															<Checkbox
																id={`departure-${slot.label}`}
																checked={selectedDepartureTimes.includes(
																	slot.label
																)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		setSelectedDepartureTimes([
																			...selectedDepartureTimes,
																			slot.label,
																		]);
																	} else {
																		setSelectedDepartureTimes(
																			selectedDepartureTimes.filter(
																				(t) => t !== slot.label
																			)
																		);
																	}
																}}
															/>
															<IconComponent className="h-4 w-4" />
															<Label
																htmlFor={`departure-${slot.label}`}
																className="text-sm"
															>
																{slot.label}
															</Label>
														</div>
													);
												})}
											</div>
										</div>
									)}

									{/* Arrival Time Filter */}
									<div className="space-y-3">
										<Label className="text-sm font-medium">Arrival Time</Label>
										<div className="space-y-2">
											{timeSlots.map((slot) => {
												const IconComponent = slot.icon;
												return (
													<div
														key={slot.label}
														className="flex items-center space-x-2"
													>
														<Checkbox
															id={`arrival-${slot.label}`}
															checked={selectedArrivalTimes.includes(
																slot.label
															)}
															onCheckedChange={(checked) => {
																if (checked) {
																	setSelectedArrivalTimes([
																		...selectedArrivalTimes,
																		slot.label,
																	]);
																} else {
																	setSelectedArrivalTimes(
																		selectedArrivalTimes.filter(
																			(t) => t !== slot.label
																		)
																	);
																}
															}}
														/>
														<IconComponent className="h-4 w-4" />
														<Label
															htmlFor={`arrival-${slot.label}`}
															className="text-sm"
														>
															{slot.label}
														</Label>
													</div>
												);
											})}
										</div>
									</div>

									{/* Airline Filter */}
									<div className="space-y-3">
										<Label className="text-sm font-medium">Airlines</Label>
										<div className="space-y-2 max-h-32 overflow-y-auto">
											{Array.from(
												new Set(flights.map((f) => f.AirlineCode))
											).map((airlineCode) => {
												const airlineName =
													flights.find((f) => f.AirlineCode === airlineCode)
														?.Segments?.[0]?.[0]?.Airline?.AirlineName ||
													airlineCode;
												return (
													<div
														key={airlineCode}
														className="flex items-center space-x-2"
													>
														<Checkbox
															id={`airline-${airlineCode}`}
															checked={selectedAirlines.includes(airlineCode)}
															onCheckedChange={(checked) => {
																if (checked) {
																	setSelectedAirlines([
																		...selectedAirlines,
																		airlineCode,
																	]);
																} else {
																	setSelectedAirlines(
																		selectedAirlines.filter(
																			(a) => a !== airlineCode
																		)
																	);
																}
															}}
														/>
														<Label
															htmlFor={`airline-${airlineCode}`}
															className="text-sm"
														>
															{airlineName}
														</Label>
													</div>
												);
											})}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
					<div className="lg:col-span-3">
						<Card>
							<CardHeader>
								<CardTitle>
									Flight Results ({filteredFlights.length} of {flights.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								{filteredFlights.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										No flights match your filter criteria. Try adjusting your
										filters.
									</div>
								) : (
									<div className="space-y-4">
										{filteredFlights.map((flight, index) => (
											<Card
												key={flight.ResultIndex || index}
												className="border-l-4 border-l-blue-500"
											>
												<CardContent className="p-4">
													<div className="flex items-start">
														<div className="flex-1">
															{/* Airline Info */}
															<div className="flex items-center gap-2 mb-2">
																<span className="font-semibold text-lg">
																	{flight.Segments?.[0]?.[0]?.Airline
																		?.AirlineName || flight.AirlineCode}
																</span>
																<span className="text-sm text-muted-foreground">
																	{
																		flight.Segments?.[0]?.[0]?.Airline
																			?.FlightNumber
																	}
																</span>
																{flight.IsLCC && (
																	<span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
																		LCC
																	</span>
																)}
															</div>

															{/* Flight Route */}
															{(() => {
																console.log(
																	"Round trip flight:",
																	flight.Segments
																);
																return flight.Segments &&
																	flight.Segments.length > 1 ? (
																	// Round trip display - Outbound (Departure) first, Inbound (Return) second
																	<div>
																		{flight.Segments?.[0] && (
																			<FlightLegDisplay
																				segments={flight.Segments[0]}
																				legType="Outbound (Departure Flight)"
																			/>
																		)}
																		{flight.Segments?.[1] ? (
																			<FlightLegDisplay
																				segments={flight.Segments[1]}
																				legType="Inbound (Return Flight)"
																			/>
																		) : (
																			<div className="text-red-500 text-sm">
																				Return flight data not available
																			</div>
																		)}
																	</div>
																) : (
																	// One-way display
																	<div className="flex items-center gap-4 mb-3">
																		<div className="text-center">
																			<div className="text-lg font-bold">
																				{flight.Segments?.[0]?.[0]?.Origin
																					?.Airport?.AirportCode || "N/A"}
																			</div>
																			<div className="text-sm text-muted-foreground font-medium">
																				{flight.Segments?.[0]?.[0]?.Origin
																					?.Airport?.CityName ||
																					(flight.Segments?.[0]?.[0]?.Origin
																						?.Airport?.AirportCode &&
																						airportToCityMap[
																							flight.Segments[0][0].Origin
																								.Airport.AirportCode
																						]) ||
																					flight.Segments?.[0]?.[0]?.Origin
																						?.Airport?.AirportCode ||
																					"Unknown"}
																			</div>
																			<div className="text-sm font-medium">
																				{formatTime(
																					flight.Segments?.[0]?.[0]?.Origin
																						?.DepTime ||
																						flight.Segments?.[0]?.[0]
																							?.DepartureTime
																				)}
																			</div>
																			<div className="text-xs text-muted-foreground">
																				{formatDate(
																					flight.Segments?.[0]?.[0]?.Origin
																						?.DepTime ||
																						flight.Segments?.[0]?.[0]
																							?.DepartureTime
																				)}
																			</div>
																		</div>

																		<div className="flex-1 flex flex-col items-center">
																			<div className="text-sm text-muted-foreground mb-1">
																				{formatDuration(
																					flight.Segments?.[0]?.[0]?.Duration
																				)}
																			</div>
																			<div className="w-full h-px bg-border relative">
																				<Plane className="h-3 w-3 absolute right-0 top-1/2 -translate-y-1/2 text-blue-500" />
																			</div>
																			{flight.Segments?.[0] &&
																				flight.Segments[0].length > 1 && (
																					<div className="text-xs text-muted-foreground mt-1">
																						{flight.Segments[0].length - 1}{" "}
																						stop(s)
																					</div>
																				)}
																		</div>

																		<div className="text-center">
																			<div className="text-lg font-bold">
																				{flight.Segments?.[0]?.[
																					flight.Segments[0].length - 1
																				]?.Destination?.Airport?.AirportCode ||
																					"N/A"}
																			</div>
																			<div className="text-sm text-muted-foreground font-medium">
																				{flight.Segments?.[0]?.[
																					flight.Segments[0].length - 1
																				]?.Destination?.Airport?.CityName ||
																					(flight.Segments?.[0]?.[
																						flight.Segments[0].length - 1
																					]?.Destination?.Airport
																						?.AirportCode &&
																						airportToCityMap[
																							flight.Segments[0][
																								flight.Segments[0].length - 1
																							].Destination.Airport.AirportCode
																						]) ||
																					flight.Segments?.[0]?.[
																						flight.Segments[0].length - 1
																					]?.Destination?.Airport
																						?.AirportCode ||
																					"Unknown"}
																			</div>
																			<div className="text-sm font-medium">
																				{formatTime(
																					flight.Segments?.[0]?.[
																						flight.Segments[0].length - 1
																					]?.Destination?.ArrTime ||
																						flight.Segments?.[0]?.[
																							flight.Segments[0].length - 1
																						]?.ArrivalTime
																				)}
																			</div>
																			<div className="text-xs text-muted-foreground">
																				{formatDate(
																					flight.Segments?.[0]?.[
																						flight.Segments[0].length - 1
																					]?.Destination?.ArrTime ||
																						flight.Segments?.[0]?.[
																							flight.Segments[0].length - 1
																						]?.ArrivalTime
																				)}
																			</div>
																		</div>
																	</div>
																);
															})()}
														</div>

														{/* Vertical Separator */}
														<div className="border-l border-gray-300 mx-4 h-full"></div>

														{/* Price */}
														<div className="flex flex-col items-end justify-between">
															<div className="text-right mb-3">
																<div className="text-2xl font-bold text-green-600">
																	₹{flight.Fare.OfferedFare.toLocaleString()}
																</div>
																<div className="text-sm text-muted-foreground">
																	{flight.Fare.Currency}
																</div>
																{flight.IsRefundable && (
																	<div className="text-xs text-green-600 mt-1">
																		Refundable
																	</div>
																)}
															</div>
															<Button
																size="sm"
																className="w-full min-w-[120px]"
															>
																Select Flight
															</Button>
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
}
