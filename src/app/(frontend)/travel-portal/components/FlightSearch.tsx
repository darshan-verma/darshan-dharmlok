"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Plane,
	Sunrise,
	Sun,
	Sunset,
	Moon,
	Loader2,
	IndianRupee,
	RefreshCw,
	TrendingUp,
	MapPin,
	ShoppingBag,
} from "lucide-react";
import { toast } from "@/lib/toast";
import type {
	FlightResult,
	FlightSegment as ApiFlightSegment,
} from "@/types/tbo";
import DateSelector from "../../components/travel-portal/DateSelector";
import TravellerSelector, {
	TravellerCount,
} from "../../components/travel-portal/TravellerSelector";
import FromToSelector from "../../components/travel-portal/FromToSelector";
import TripTypeSelector from "../../components/travel-portal/TripTypeSelector";
import SearchButton from "../../components/travel-portal/SearchButton";
import MultiCitySelector from "../../components/travel-portal/MultiCitySelector";
import UpsellModal from "./UpsellModal";
import { Separator } from "@/components/ui/separator";
import { getFareBreakdown } from "@/lib/tboFareCalculations";
import AirlineLogo from "@/components/travel-portal/AirlineLogo";

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

interface FlightSearchForm {
	origin: string;
	destination: string;
	departureDate: Date | undefined;
	returnDate?: Date | undefined;
	segments?: FlightSegment[]; // For multi-city flights
	adults: number;
	children: number;
	infants: number;
	cabinClass: string;
	journeyType: "1" | "2" | "3"; // 1: OneWay, 2: Return, 3: MultiCity
	directFlight: boolean;
	oneStopFlight: boolean;
}

interface FlightSegment {
	origin: string;
	destination: string;
	departureDate: Date | undefined;
}

interface FlightSearchParams {
	AdultCount: string;
	ChildCount: string;
	InfantCount: string;
	FlightCabinClass: string;
	JourneyType: "1" | "2" | "3";
	DirectFlight: string;
	OneStopFlight: string;
	Segments?: ApiFlightSegment[];
	Origin?: string;
	Destination?: string;
	PreferredDepartureTime?: string;
	ReturnPreferredDepartureTime?: string;
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
	"multi-city": "3",
};

const reverseTripTypeMapping: { [key: string]: string } = {
	"1": "one-way",
	"2": "round-trip",
	"3": "multi-city",
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

// Airport code to airport name mapping
const airportToNameMap: { [key: string]: string } = {
	DEL: "Indira Gandhi International Airport",
	BLR: "Kempegowda International Airport",
	BOM: "Chhatrapati Shivaji Maharaj International Airport",
	HYD: "Rajiv Gandhi International Airport",
	MAA: "Chennai International Airport",
	CCU: "Netaji Subhas Chandra Bose International Airport",
	PNQ: "Pune International Airport",
	AMD: "Sardar Vallabhbhai Patel International Airport",
	GOI: "Goa International Airport",
	JAI: "Jaipur International Airport",
	COK: "Cochin International Airport",
	TRV: "Trivandrum International Airport",
	GAU: "Lokpriya Gopinath Bordoloi International Airport",
	IXC: "Chandigarh International Airport",
	IXR: "Birsa Munda Airport",
	BBI: "Biju Patnaik International Airport",
	VNS: "Lal Bahadur Shastri Airport",
	IXB: "Bagdogra Airport",
	NAG: "Dr. Babasaheb Ambedkar International Airport",
	IXL: "Kushok Bakula Rimpochee Airport",
	ATQ: "Sri Guru Ram Dass Jee International Airport",
	IXJ: "Jammu Airport",
	SXR: "Sheikh ul-Alam International Airport",
	IXZ: "Veer Savarkar International Airport",
	IXU: "Aurangabad Airport",
	RPR: "Swami Vivekananda Airport",
	IXD: "Allahabad Airport",
};

// Helper function to get City object from airport code
const getCityFromCode = (code: string): City => {
	const upperCode = code.toUpperCase();
	const city = airportToCityMap[upperCode] || code;
	const airport = airportToNameMap[upperCode] || `${city} Airport`;
	return {
		city,
		airport,
		code: upperCode,
	};
};

export default function FlightSearch() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [flights, setFlights] = useState<FlightResult[]>([]);
	const [traceId, setTraceId] = useState<string>("");
	const [searchPerformed, setSearchPerformed] = useState(false);
	const [selectingFlight, setSelectingFlight] = useState<string | null>(null);

	// Upsell modal state
	const [isUpsellOpen, setIsUpsellOpen] = useState(false);
	const [upsellFlight, setUpsellFlight] = useState<FlightResult | null>(null);

	// Preloaded upsell data: Map<ResultIndex, upsell data>

	const [preloadedUpsell, _setPreloadedUpsell] = useState<
		Map<string, FlightResult[]>
	>(new Map());

	// Cache for search results with timestamp
	const searchCache = useRef<
		Record<
			string,
			{
				results: FlightResult[];
				traceId: string;
				timestamp: number;
				journeyType: string;
			}
		>
	>({});

	// Load cache from sessionStorage on initial mount so it survives navigation
	useEffect(() => {
		try {
			const stored = sessionStorage.getItem("flightSearchCache");
			if (stored) {
				const parsedCache = JSON.parse(stored);
				const now = Date.now();
				const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

				// Filter out expired cache entries and old cache format
				const validCache: Record<
					string,
					{
						results: FlightResult[];
						traceId: string;
						timestamp: number;
						journeyType: string;
					}
				> = {};
				Object.keys(parsedCache).forEach((key) => {
					const entry = parsedCache[key];
					// Skip old "latest_" keys and expired entries
					if (
						key.startsWith("latest_") ||
						!entry.timestamp ||
						now - entry.timestamp >= CACHE_EXPIRY
					) {
						return;
					}
					validCache[key] = entry;
				});

				searchCache.current = validCache;
			}
		} catch (e) {
			console.warn("Failed to load flight search cache:", e);
		}
	}, []);

	// DateSelector state
	const [departureDate, setDepartureDate] = useState<Date>();
	const [returnDate, setReturnDate] = useState<Date>();

	// TravellerSelector state
	const [travellers, setTravellers] = useState<TravellerCount>({
		adults: 1,
		children: 0,
		infants: 0,
	});
	const [travelClass, setTravelClass] = useState("Economy");

	// TripTypeSelector state
	const [tripType, setTripType] = useState("one-way");
	const prevTripTypeRef = useRef("one-way");

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

	// FromToSelector state
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
	const [expandedFareBreakdown, setExpandedFareBreakdown] = useState<
		string | null
	>(null);

	const form = useForm<FlightSearchForm>({
		defaultValues: {
			origin: "",
			destination: "",
			departureDate: undefined,
			returnDate: undefined,
			segments: [
				{ origin: "", destination: "", departureDate: undefined },
				{ origin: "", destination: "", departureDate: undefined },
			],
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
		const children = searchParams.get("children");
		const infants = searchParams.get("infants");
		const journeyType = searchParams.get("journeyType");
		const cabinClass = searchParams.get("cabinClass");


		// Check for multi-city parameters
		const leg1From = searchParams.get("leg1From");
		const leg1To = searchParams.get("leg1To");
		const leg1Date = searchParams.get("leg1Date");
		const leg2From = searchParams.get("leg2From");
		const leg2To = searchParams.get("leg2To");
		const leg2Date = searchParams.get("leg2Date");
		const leg3From = searchParams.get("leg3From");
		const leg3To = searchParams.get("leg3To");
		const leg3Date = searchParams.get("leg3Date");

		// If any search parameters are present, clear the cache to ensure fresh search
		if (
			origin ||
			destination ||
			departureDate ||
			leg1From ||
			leg1To ||
			leg1Date
		) {
			searchCache.current = {};
			try {
				sessionStorage.setItem("flightSearchCache", JSON.stringify({}));
			} catch (e) {
				console.warn("Failed to clear flight search cache:", e);
			}
		}

		// Parse travellers
		const adultCount = adults ? parseInt(adults) : 1;
		const childCount = children ? parseInt(children) : 0;
		const infantCount = infants ? parseInt(infants) : 0;

		// Update state and form
		setTravellers({
			adults: adultCount,
			children: childCount,
			infants: infantCount,
		});
		form.setValue("adults", adultCount);
		form.setValue("children", childCount);
		form.setValue("infants", infantCount);

		if (journeyType === "3" && leg1From && leg1To) {
			// Multi-city search
			setTripType("multi-city");
			form.setValue("journeyType", "3");

			const newLegs: CityLeg[] = [];

			// Add leg 1
			if (leg1From && leg1To) {
				newLegs.push({
					id: "leg-1",
					from: getCityFromCode(leg1From),
					to: getCityFromCode(leg1To),
					date: leg1Date ? new Date(leg1Date) : undefined,
				});
			}

			// Add leg 2
			if (leg2From && leg2To) {
				newLegs.push({
					id: "leg-2",
					from: getCityFromCode(leg2From),
					to: getCityFromCode(leg2To),
					date: leg2Date ? new Date(leg2Date) : undefined,
				});
			}

			// Add leg 3
			if (leg3From && leg3To) {
				newLegs.push({
					id: "leg-3",
					from: getCityFromCode(leg3From),
					to: getCityFromCode(leg3To),
					date: leg3Date ? new Date(leg3Date) : undefined,
				});
			}

			setMultiCityLegs(newLegs);

			// Update form segments
			const segments = newLegs.map((leg) => ({
				origin: leg.from.code,
				destination: leg.to.code,
				departureDate: leg.date,
			}));
			form.setValue("segments", segments);

			// Automatically perform multi-city search
			handleAutoSearch({
				origin: "",
				destination: "",
				departureDate: undefined,
				returnDate: undefined,
				segments: segments,
				adults: adultCount,
				children: childCount,
				infants: infantCount,
				cabinClass: cabinClass || "1",
				journeyType: "3",
				directFlight: true,
				oneStopFlight: false,
			});
		} else if (origin && destination && departureDate) {
			// One-way or round-trip search
			form.setValue("origin", origin);
			form.setValue("destination", destination);
			const fromCity = getCityFromCode(origin);
			const toCity = getCityFromCode(destination);
			setFrom(fromCity);
			setTo(toCity);
			const depDate = new Date(departureDate);
			setDepartureDate(depDate);
			form.setValue("departureDate", depDate);
			if (returnDate) {
				const retDate = new Date(returnDate);
				setReturnDate(retDate);
				form.setValue("returnDate", retDate);
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
				adults: adultCount,
				children: childCount,
				infants: infantCount,
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
		form.setValue("journeyType", tripTypeMapping[type] as "1" | "2" | "3");

		if (type === "multi-city" && departureDate) {
			setMultiCityLegs((prev) => {
				const newLegs = [...prev];
				if (newLegs[0]) {
					newLegs[0] = { ...newLegs[0], date: departureDate };
				}
				return newLegs;
			});
		}
	};

	// Clear flights and cache when trip type changes
	useEffect(() => {
		if (prevTripTypeRef.current !== tripType) {
			// Clear displayed flights
			setFlights([]);
			setSearchPerformed(false);

			// CLEAR ENTIRE CACHE when trip type changes
			searchCache.current = {};

			// Update sessionStorage
			try {
				sessionStorage.setItem("flightSearchCache", JSON.stringify({}));
			} catch (e) {
				console.warn("Failed to clear flight search cache:", e);
			}

			prevTripTypeRef.current = tripType;
		}
	}, [tripType]);

	// Filter flights based on selected criteria
	useEffect(() => {
		const filtered = flights.filter((flight) => {
			if (!flight.Fare) return false;
			const price = flight.Fare!.OfferedFare;
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
			const prices = flights
				.filter((flight) => flight.Fare)
				.map((flight) => flight.Fare!.OfferedFare);
			if (prices.length > 0) {
				const minPrice = Math.min(...prices);
				const maxPrice = Math.max(...prices);
				setPriceBounds([minPrice, maxPrice]);
				setPriceRange([minPrice, maxPrice]);
			}
		}
	}, [flights]);

	// Sync multi-city legs with form segments
	useEffect(() => {
		if (tripType === "multi-city") {
			const segments = multiCityLegs.map((leg) => ({
				origin: leg.from.code,
				destination: leg.to.code,
				departureDate: leg.date,
			}));
			form.setValue("segments", segments);
		}
	}, [multiCityLegs, tripType, form]);

	// Function to preload upsell data for flights
	const preloadUpsellData = async (
		_flights: FlightResult[],
		_traceId: string,
		_adultCount: number,
		_childCount: number,
		_infantCount: number
	) => {
		// Temporarily disabled to prevent infinite loops with invalid result indices
		// This can be re-enabled once we have better session management
		console.log("Upsell preloading disabled to prevent infinite loops");
		return;

		/* Original code disabled
		if (!traceId || flights.length === 0) return;

		// Clear previous preloaded data
		_setPreloadedUpsell(new Map());

		// Also clear sessionStorage
		try {
			sessionStorage.removeItem("preloadedUpsellData");
		} catch (e) {
			console.warn("Failed to clear preloaded upsell data:", e);
		}

		const upsellData: Record<string, FlightResult[]> = {};

		// Preload upsell for each flight in the background
		const promises = flights.map(async (flight) => {
			try {
				const body: {
					TraceId: string;
					ResultIndex: string;
					EndUserIp: string;
					ReturnResultIndex?: string;
					AdultCount?: number;
					ChildCount?: number;
					InfantCount?: number;
				} = {
					TraceId: traceId,
					ResultIndex: flight.ResultIndex,
					EndUserIp: "",
				};
				if (flight.ReturnResultIndex) {
					body.ReturnResultIndex = flight.ReturnResultIndex;
				}
				if (adultCount) body.AdultCount = adultCount;
				if (childCount) body.ChildCount = childCount;
				if (infantCount) body.InfantCount = infantCount;

				const response = await fetch("/api/travel/fare-upsell", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});
				const json = await response.json();
				if (response.ok && json?.success) {
					const results = json.data?.Response?.Results || [];
					upsellData[flight.ResultIndex] = results;
					_setPreloadedUpsell(
						(prev) => new Map(prev.set(flight.ResultIndex, results))
					);
				}
			} catch (error) {
				console.warn(
					`Failed to preload upsell for flight ${flight.ResultIndex}:`,
					error
				);
			}
		});

		// Wait for all preloading to complete, then store in sessionStorage
		await Promise.all(promises);

		try {
			sessionStorage.setItem(
				"preloadedUpsellData",
				JSON.stringify({
					data: upsellData,
					traceId,
					timestamp: Date.now(),
				})
			);
			// Removed excessive logging
				`Stored preloaded upsell data for ${
					Object.keys(upsellData).length
				} flights`
			);
		} catch (e) {
			console.warn("Failed to store preloaded upsell data:", e);
		}
		*/
	};

	const handleAutoSearch = async (
		searchData: FlightSearchForm,
		options?: { forceRefresh?: boolean }
	) => {
		const forceRefresh = options?.forceRefresh === true;

		// Comprehensive validation for all journey types
		if (searchData.journeyType === "1" || searchData.journeyType === "2") {
			// One-way and Round-trip validation
			if (!searchData.origin || searchData.origin.trim() === "") {
				toast.error("Please select a departure city");
				return;
			}
			if (!searchData.destination || searchData.destination.trim() === "") {
				toast.error("Please select a destination city");
				return;
			}
			if (searchData.origin === searchData.destination) {
				toast.error("Departure and destination cities cannot be the same");
				return;
			}
			if (!searchData.departureDate) {
				toast.error("Please select a departure date");
				return;
			}
			// Check if departure date is not in the past
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const departureDate = new Date(searchData.departureDate);
			departureDate.setHours(0, 0, 0, 0);
			if (departureDate < today) {
				toast.error("Departure date cannot be in the past");
				return;
			}
			if (searchData.journeyType === "2") {
				if (!searchData.returnDate) {
					toast.error("Please select a return date for round trip flights");
					return;
				}
				const returnDate = new Date(searchData.returnDate);
				returnDate.setHours(0, 0, 0, 0);
				if (returnDate < departureDate) {
					toast.error("Return date must be after departure date");
					return;
				}
			}
		}

		// Validate traveller counts
		if (searchData.adults < 1) {
			toast.error("At least 1 adult is required");
			return;
		}
		if (searchData.adults + searchData.children + searchData.infants > 9) {
			toast.error("Maximum 9 passengers allowed (adults + children + infants)");
			return;
		}
		if (searchData.infants > searchData.adults) {
			toast.error("Number of infants cannot exceed number of adults");
			return;
		}

		// Validate round trip requires return date
		if (searchData.journeyType === "2" && !searchData.returnDate) {
			toast.error("Please select a return date for round trip flights");
			return;
		}

		// Validate multi-city requires at least 2 segments with complete data
		if (searchData.journeyType === "3") {
			if (!searchData.segments || searchData.segments.length < 2) {
				toast.error("Multi-city flights require at least 2 segments");
				return;
			}
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			for (let i = 0; i < searchData.segments.length; i++) {
				const segment = searchData.segments[i];
				if (!segment.origin || segment.origin.trim() === "") {
					toast.error(`Segment ${i + 1}: Please select a departure city`);
					return;
				}
				if (!segment.destination || segment.destination.trim() === "") {
					toast.error(`Segment ${i + 1}: Please select a destination city`);
					return;
				}
				if (segment.origin === segment.destination) {
					toast.error(
						`Segment ${
							i + 1
						}: Departure and destination cities cannot be the same`
					);
					return;
				}
				if (!segment.departureDate) {
					toast.error(`Segment ${i + 1}: Please select a departure date`);
					return;
				}
				const segmentDate = new Date(segment.departureDate);
				segmentDate.setHours(0, 0, 0, 0);
				if (segmentDate < today) {
					toast.error(`Segment ${i + 1}: Departure date cannot be in the past`);
					return;
				}
			}

			// Check for logical sequence in multi-city (optional but helpful)
			for (let i = 1; i < searchData.segments.length; i++) {
				const prevSegment = searchData.segments[i - 1];
				const currentSegment = searchData.segments[i];
				const prevDate = new Date(prevSegment.departureDate!);
				const currentDate = new Date(currentSegment.departureDate!);

				if (currentDate < prevDate) {
					toast.error(
						`Segment ${
							i + 1
						}: Departure date must be after segment ${i} departure date`
					);
					return;
				}
			}
		}

		setLoading(true);
		setSearchPerformed(true);

		try {
			const formatLocalDate = (date: Date) => {
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, "0");
				const day = String(date.getDate()).padStart(2, "0");
				const hours = String(date.getHours()).padStart(2, "0");
				const minutes = String(date.getMinutes()).padStart(2, "0");
				return `${year}-${month}-${day}T${hours}:${minutes}:00`;
			};

			const searchParams: FlightSearchParams = {
				AdultCount: String(searchData.adults),
				ChildCount: String(searchData.children),
				InfantCount: String(searchData.infants),
				FlightCabinClass: searchData.cabinClass,
				JourneyType: searchData.journeyType,
				DirectFlight: String(searchData.directFlight),
				OneStopFlight: String(searchData.oneStopFlight),
			};

			// Handle different journey types
			if (searchData.journeyType === "3" && searchData.segments) {
				// Multi-city
				searchParams.Segments = searchData.segments.map((segment) => ({
					Origin: segment.origin.toUpperCase(),
					Destination: segment.destination.toUpperCase(),
					FlightCabinClass: searchData.cabinClass,
					PreferredDepartureTime: segment.departureDate
						? formatLocalDate(new Date(segment.departureDate))
						: "",
				}));
			} else {
				// One-way or round-trip
				searchParams.Origin = searchData.origin.toUpperCase();
				searchParams.Destination = searchData.destination.toUpperCase();
				searchParams.PreferredDepartureTime = searchData.departureDate
					? formatLocalDate(new Date(searchData.departureDate))
					: "";
				if (searchData.journeyType === "2") {
					searchParams.ReturnPreferredDepartureTime = searchData.returnDate
						? formatLocalDate(new Date(searchData.returnDate))
						: "";
				}
			}

			// Create cache key from search parameters
			const cacheKey = JSON.stringify(searchParams);

			// Check cache (unless forced refresh requested)
			if (!forceRefresh) {
				// Try exact cache key match
				if (searchCache.current[cacheKey]) {
					const cached = searchCache.current[cacheKey];
					const now = Date.now();
					const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

					// Check if cache is still valid
					if (now - cached.timestamp < CACHE_EXPIRY) {
						setFlights(cached.results);
						setTraceId(cached.traceId);
						setSearchPerformed(true);
						setLoading(false);
						if (cached.results.length === 0) {
							toast.info("No flights found (cached)");
						} else {
							toast.success(
								`Found ${cached.results.length} flight options (cached)`
							);
						}
						return;
					} else {
						delete searchCache.current[cacheKey];
					}
				}
			}

			const response = await fetch("/api/travel/flights/search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(searchParams),
			});

			if (!response.ok) {
				// Handle HTTP errors
				if (response.status === 400) {
					throw new Error(
						"Invalid search parameters. Please check your inputs and try again."
					);
				} else if (response.status === 401) {
					throw new Error("Authentication failed. Please try again later.");
				} else if (response.status === 403) {
					throw new Error("Access denied. Please try again later.");
				} else if (response.status === 404) {
					throw new Error(
						"Flight search service not available. Please try again later."
					);
				} else if (response.status === 429) {
					throw new Error(
						"Too many requests. Please wait a moment and try again."
					);
				} else if (response.status >= 500) {
					throw new Error("Server error. Please try again later.");
				} else {
					throw new Error(
						`Search failed with status ${response.status}. Please try again.`
					);
				}
			}

			const result = await response.json();
			
			// Show results immediately - don't wait for full processing
			setLoading(false);

			if (!result.success) {
				// Handle API-specific errors
				const errorMessage = result.error || "Search failed";
				if (errorMessage.toLowerCase().includes("no flights")) {
					throw new Error(
						"No flights found for the selected criteria. Try different dates or routes."
					);
				} else if (errorMessage.toLowerCase().includes("invalid")) {
					throw new Error(
						"Invalid search parameters. Please check your inputs."
					);
				} else if (errorMessage.toLowerCase().includes("timeout")) {
					throw new Error("Search timed out. Please try again.");
				} else if (errorMessage.toLowerCase().includes("network")) {
					throw new Error(
						"Network error. Please check your connection and try again."
					);
				} else {
					throw new Error(errorMessage);
				}
			}

			const newTraceId = result.data?.Response?.TraceId || "";
			if (newTraceId) {
				setTraceId(newTraceId);
			}

			// Extract flights from the response
			let flightResults: FlightResult[] = [];

			if (searchParams.JourneyType === "2") {
				// Round trip - combine outbound and return flights
				const outboundFlights = result.data?.Response?.Results?.[0] || [];
				const returnFlights = result.data?.Response?.Results?.[1] || [];

				// For round trips, create combined flight results
				// Each result will have both outbound and return segments
				// We manually combine all fare components to ensure consistency with pricing formulas
				flightResults = outboundFlights.map(
					(outboundFlight: FlightResult, index: number) => {
						// Filter return flights to match the same API source
						const apiSource = outboundFlight.ApiSource;


						// Find matching return flight from same API source
						let returnFlight = returnFlights.find(
							(rf: FlightResult) => rf.ApiSource === apiSource
						);

						// Fallback to index-based pairing if no API source match
						if (!returnFlight) {
							returnFlight = returnFlights[index] || returnFlights[0];
						}

						let combinedFare = outboundFlight.Fare;
						let returnResultIndex = undefined;

						if (returnFlight && outboundFlight.Fare && returnFlight.Fare) {
							returnResultIndex = returnFlight.ResultIndex;
							const f1 = outboundFlight.Fare;
							const f2 = returnFlight.Fare;

							// Combine ALL fare components as per TBO pricing formula
							combinedFare = {
								...f1,
								BaseFare: Number(f1.BaseFare) + Number(f2.BaseFare),
								Tax: Number(f1.Tax) + Number(f2.Tax),
								YQTax: Number(f1.YQTax) + Number(f2.YQTax),
								AdditionalTxnFeeOfrd:
									Number(f1.AdditionalTxnFeeOfrd) +
									Number(f2.AdditionalTxnFeeOfrd),
								AdditionalTxnFeePub:
									Number(f1.AdditionalTxnFeePub) +
									Number(f2.AdditionalTxnFeePub),
								PGCharge: Number(f1.PGCharge) + Number(f2.PGCharge),
								OtherCharges: Number(f1.OtherCharges) + Number(f2.OtherCharges),
								Discount: Number(f1.Discount) + Number(f2.Discount),
								PublishedFare:
									Number(f1.PublishedFare) + Number(f2.PublishedFare),
								CommissionEarned:
									Number(f1.CommissionEarned) + Number(f2.CommissionEarned),
								PLBEarned: Number(f1.PLBEarned) + Number(f2.PLBEarned),
								IncentiveEarned:
									Number(f1.IncentiveEarned) + Number(f2.IncentiveEarned),
								OfferedFare: Number(f1.OfferedFare) + Number(f2.OfferedFare),
								TdsOnCommission:
									Number(f1.TdsOnCommission) + Number(f2.TdsOnCommission),
								TdsOnPLB: Number(f1.TdsOnPLB) + Number(f2.TdsOnPLB),
								TdsOnIncentive:
									Number(f1.TdsOnIncentive) + Number(f2.TdsOnIncentive),
								ServiceFee: Number(f1.ServiceFee) + Number(f2.ServiceFee),
								TotalBaggageCharges:
									Number(f1.TotalBaggageCharges) +
									Number(f2.TotalBaggageCharges),
								TotalMealCharges:
									Number(f1.TotalMealCharges) + Number(f2.TotalMealCharges),
								TotalSeatCharges:
									Number(f1.TotalSeatCharges) + Number(f2.TotalSeatCharges),
								TotalSpecialServiceCharges:
									Number(f1.TotalSpecialServiceCharges) +
									Number(f2.TotalSpecialServiceCharges),
								IGSTAmount:
									(Number(f1.IGSTAmount) || 0) + (Number(f2.IGSTAmount) || 0),
								CGSTAmount:
									(Number(f1.CGSTAmount) || 0) + (Number(f2.CGSTAmount) || 0),
								SGSTAmount:
									(Number(f1.SGSTAmount) || 0) + (Number(f2.SGSTAmount) || 0),
								CessAmount:
									(Number(f1.CessAmount) || 0) + (Number(f2.CessAmount) || 0),
								AirlineTransFee:
									(Number(f1.AirlineTransFee) || 0) +
									(Number(f2.AirlineTransFee) || 0),
							};
						}

						return {
							...outboundFlight,
							ReturnResultIndex: returnResultIndex,
							Fare: combinedFare,
							Segments: [
								outboundFlight.Segments[0], // Outbound segments
								returnFlight ? returnFlight.Segments[0] : [], // Return segments
							],
						};
					}
				);
			} else {
				// One-way and Multi-city
				// For multi-city, TBO API returns flights with all segments already combined in one flight object
				// The fare breakdown is already calculated for all legs combined
				flightResults = result.data?.Response?.Results?.[0] || [];
			}

			// Update cache with timestamp
			const now = Date.now();
			const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

			// Clean up expired cache entries
			const validCache: Record<
				string,
				{
					results: FlightResult[];
					traceId: string;
					timestamp: number;
					journeyType: string;
				}
			> = {};

			Object.keys(searchCache.current).forEach((key) => {
				const entry = searchCache.current[key];
				if (now - entry.timestamp < CACHE_EXPIRY) {
					validCache[key] = entry;
				}
			});

			// Add the new search result
			validCache[cacheKey] = {
				results: flightResults,
				traceId: newTraceId,
				timestamp: now,
				journeyType: searchParams.JourneyType,
			};

			searchCache.current = validCache;

			// Persist cache to sessionStorage so it survives navigation/back
			try {
				sessionStorage.setItem(
					"flightSearchCache",
					JSON.stringify(searchCache.current)
				);
			} catch (err) {
				console.warn("Failed to persist flight search cache:", err);
			}

			setFlights(flightResults);
			setSearchPerformed(true);

			// Preload upsell data in the background
			preloadUpsellData(
				flightResults,
				newTraceId,
				searchData.adults,
				searchData.children,
				searchData.infants
			);

			if (flightResults.length === 0) {
				toast.info("No flights found for the selected criteria");
			} else {
				toast.success(`Found ${flightResults.length} flight options`);
			}
		} catch (error) {
			console.error("Flight search error:", error);

			// Handle different types of errors
			let errorMessage = "Search failed. Please try again.";

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === "string") {
				errorMessage = error;
			}

			// Show appropriate toast based on error type
			if (
				errorMessage.toLowerCase().includes("network") ||
				errorMessage.toLowerCase().includes("connection") ||
				errorMessage.toLowerCase().includes("fetch")
			) {
				toast.error(
					"Network error. Please check your internet connection and try again."
				);
			} else if (errorMessage.toLowerCase().includes("timeout")) {
				toast.error(
					"Search timed out. The server is busy. Please try again in a few moments."
				);
			} else if (
				errorMessage.toLowerCase().includes("server") ||
				errorMessage.toLowerCase().includes("internal")
			) {
				toast.error(
					"Server error. Our team has been notified. Please try again later."
				);
			} else if (errorMessage.toLowerCase().includes("no flights")) {
				toast.info(errorMessage);
			} else {
				toast.error(errorMessage);
			}

			setFlights([]);
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: FlightSearchForm) => {
		// Clear cache for fresh search when user manually submits
		console.log(
			"Manual search submission detected, clearing cache for fresh search"
		);
		searchCache.current = {};
		try {
			sessionStorage.setItem("flightSearchCache", JSON.stringify({}));
		} catch (e) {
			console.warn("Failed to clear flight search cache:", e);
		}

		await handleAutoSearch(data);
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
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			// Try removing milliseconds if present (TBO sometimes includes them)
			const withoutMs = dateString.replace(/\.\d+/, "");
			date = new Date(withoutMs);
			if (!isNaN(date.getTime())) {
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			// Try replacing space with T for ISO format
			const isoString = dateString.replace(" ", "T");
			date = new Date(isoString);
			if (!isNaN(date.getTime())) {
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			// Try parsing as UTC if it ends with Z
			if (dateString.endsWith("Z")) {
				date = new Date(dateString + (dateString.includes("Z") ? "" : "Z"));
				if (!isNaN(date.getTime())) {
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
				return date.toLocaleTimeString("en-IN", {
					hour: "2-digit",
					minute: "2-digit",
				});
			}

			return "Invalid Date";
		} catch (error) {
			return "Invalid Date";
		}
	};

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-6">
			{/* Upsell modal - rendered at top-level of this component */}
			<UpsellModal
				open={isUpsellOpen}
				onOpenChange={setIsUpsellOpen}
				traceId={traceId}
				resultIndex={upsellFlight?.ResultIndex ?? ""}
				returnResultIndex={upsellFlight?.ReturnResultIndex}
				journeyType={parseInt(tripTypeMapping[tripType])}
				adultCount={form.getValues().adults}
				childCount={form.getValues().children}
				infantCount={form.getValues().infants}
				flight={upsellFlight}
				preloadedUpsell={
					upsellFlight
						? preloadedUpsell.get(upsellFlight.ResultIndex) || null
						: null
				}
			/>
			<Card className="shadow-md border-slate-200 overflow-hidden">
				<CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
					<CardTitle className="flex items-center gap-2 text-xl text-slate-800">
						<Plane className="h-5 w-5 text-blue-600" />
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

						{/* Main Booking Section - Horizontal Layout */}
						<div className="flex flex-wrap gap-4 items-start">
							{/* From/To Selector or Multi-City Selector */}
							<div
								className={`flex-1 min-w-[400px] ${
									tripType === "multi-city" ? "h-auto min-h-24" : "h-24"
								}`}
							>
								{tripType === "multi-city" ? (
									<MultiCitySelector
										legs={multiCityLegs}
										onLegsChange={setMultiCityLegs}
									/>
								) : (
									<FromToSelector
										from={from}
										to={to}
										onSwap={handleSwap}
										onFromChange={handleFromChange}
										onToChange={handleToChange}
									/>
								)}
							</div>

							{/* Dates */}
							{tripType !== "multi-city" && (
								<div className="flex-1 min-w-[200px] h-24">
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
							)}

							{/* Travellers & Class */}
							<div className="flex-1 min-w-[200px] h-24">
								<TravellerSelector
									travellers={travellers}
									travelClass={travelClass}
									onTravellersChange={(count) => {
										setTravellers(count);
										form.setValue("adults", count.adults);
										form.setValue("children", count.children);
										form.setValue("infants", count.infants);
									}}
									onClassChange={(cls) => {
										setTravelClass(cls);
										form.setValue("cabinClass", cabinClassMapping[cls] || "1");
									}}
								/>
							</div>

							{/* Search Button */}
							<div className="flex-shrink-0 h-24 flex items-center">
								<SearchButton
									onSearch={form.handleSubmit(onSubmit)}
									loading={loading}
								/>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Loading Skeleton */}
			{loading && (
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* Filters Skeleton */}
					<div className="lg:col-span-1">
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-20" />
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									{/* Price Range Skeleton */}
									<div className="space-y-3">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-6 w-full" />
										<div className="flex justify-between">
											<Skeleton className="h-3 w-12" />
											<Skeleton className="h-3 w-12" />
										</div>
									</div>

									{/* Airlines Skeleton */}
									<div className="space-y-3">
										<Skeleton className="h-4 w-16" />
										<div className="space-y-2">
											{Array.from({ length: 5 }).map((_, i) => (
												<div key={i} className="flex items-center space-x-2">
													<Skeleton className="h-4 w-4" />
													<Skeleton className="h-4 w-20" />
												</div>
											))}
										</div>
									</div>

									{/* Departure Time Skeleton */}
									<div className="space-y-3">
										<Skeleton className="h-4 w-28" />
										<div className="space-y-2">
											{Array.from({ length: 4 }).map((_, i) => (
												<div key={i} className="flex items-center space-x-2">
													<Skeleton className="h-4 w-4" />
													<Skeleton className="h-4 w-4" />
													<Skeleton className="h-4 w-16" />
												</div>
											))}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Flight Results Skeleton */}
					<div className="lg:col-span-3">
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<Skeleton className="h-6 w-32" />
									<Skeleton className="h-8 w-24" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{/* Flight Cards Skeleton */}
									{Array.from({ length: 5 }).map((_, i) => (
										<Card key={i} className="shadow-sm">
											<CardContent className="p-0">
												<div className="flex flex-col lg:flex-row items-stretch">
													{/* Flight Details Skeleton */}
													<div className="flex-1 p-4 lg:p-6">
														<div className="flex items-center gap-4">
															{/* Airline Logo Skeleton */}
															<div className="w-16 flex-shrink-0">
																<Skeleton className="h-10 w-10 rounded-full mb-1" />
																<Skeleton className="h-3 w-12 mb-1" />
																<Skeleton className="h-2 w-8" />
															</div>

															{/* Departure Skeleton */}
															<div className="text-right min-w-[80px]">
																<Skeleton className="h-8 w-16 mb-1" />
																<Skeleton className="h-4 w-12" />
															</div>

															{/* Duration & Stops Skeleton */}
															<div className="flex-1 flex flex-col items-center px-2">
																<Skeleton className="h-3 w-16 mb-1" />
																<div className="flex items-center gap-1">
																	<Skeleton className="h-3 w-8" />
																	<Skeleton className="h-3 w-12" />
																	<Skeleton className="h-3 w-8" />
																</div>
															</div>

															{/* Arrival Skeleton */}
															<div className="text-left min-w-[80px]">
																<Skeleton className="h-8 w-16 mb-1" />
																<Skeleton className="h-4 w-12" />
															</div>
														</div>
													</div>

													{/* Price & Book Button Skeleton */}
													<div className="lg:w-48 p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col justify-center items-center gap-2">
														<Skeleton className="h-6 w-20" />
														<Skeleton className="h-4 w-16" />
														<Skeleton className="h-10 w-24" />
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			)}

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
								<div className="flex items-center justify-between flex-wrap gap-3">
									<div className="flex flex-col gap-2">
										<CardTitle>
											Flight Results ({filteredFlights.length} of{" "}
											{flights.length})
										</CardTitle>
										{/* API Source Breakdown */}
										{flights.length > 0 && (
											<div className="flex gap-2 items-center text-xs">
												{(() => {
													const tboCount = flights.filter(
														(f) => f.ApiSource === "TBO"
													).length;
													const airiqCount = flights.filter(
														(f) => f.ApiSource === "AIRiQ"
													).length;
													return (
														<>
															{tboCount > 0 && (
																<div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded border border-blue-300 font-medium">
																	<span className="w-2 h-2 rounded-full bg-blue-500"></span>
																	TBO: {tboCount}
																</div>
															)}
															{airiqCount > 0 && (
																<div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded border border-green-300 font-medium">
																	<span className="w-2 h-2 rounded-full bg-green-500"></span>
																	AIRiQ: {airiqCount}
																</div>
															)}
														</>
													);
												})()}
											</div>
										)}
									</div>
									<div>
										<Button
											size="sm"
											variant="outline"
											className="text-sm"
											onClick={async () => {
												try {
													const currentValues = form.getValues();
													await handleAutoSearch(currentValues, {
														forceRefresh: true,
													});
												} catch (e) {
													console.error("Refresh failed:", e);
												}
											}}
											disabled={loading}
										>
											<RefreshCw className="mr-2 h-4 w-4" /> Refresh Results
										</Button>
									</div>
								</div>
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
												className="shadow-sm hover:shadow-md transition-all duration-200"
											>
												<CardContent className="p-0">
													<div className="flex flex-col lg:flex-row items-stretch">
														{/* Left Section: Flight Details */}
														<div className="flex-1 p-4 lg:p-6 flex flex-col justify-center gap-6">
															{flight.Segments.map((legSegments, legIndex) => {
																const firstSegment = legSegments[0];
																const lastSegment =
																	legSegments[legSegments.length - 1];

																// Safely get airline info with fallback
																const airlineName =
																	firstSegment?.Airline?.AirlineName ||
																	flight.AirlineCode ||
																	"Unknown Airline";
																const airlineCode =
																	firstSegment?.Airline?.AirlineCode ||
																	flight.AirlineCode ||
																	"XX";

																// Calculate total duration for this leg
																const totalDuration = legSegments.reduce(
																	(acc, seg) => acc + (seg?.Duration || 0),
																	0
																);

																return (
																	<div
																		key={legIndex}
																		className="flex items-center gap-4"
																	>
																		{/* Airline Logo/Info */}
																		<div className="w-16 flex-shrink-0">
																			<div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center mb-1 overflow-hidden">
																				<AirlineLogo
																					airlineCode={airlineCode}
																					airlineName={airlineName}
																					size="md"
																				/>
																			</div>
																			<div className="text-[10px] text-gray-500 font-medium truncate">
																				{airlineName}
																			</div>
																			{/* API Source Badge */}
																			{flight.ApiSource && (
																				<div
																					className={`mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded text-center ${
																						flight.ApiSource === "TBO"
																							? "bg-blue-100 text-blue-700 border border-blue-300"
																							: "bg-green-100 text-green-700 border border-green-300"
																					}`}
																				>
																					{flight.ApiSource}
																				</div>
																			)}
																		</div>

																		{/* Departure */}
																		<div className="text-right min-w-[80px]">
																			<div className="text-2xl font-bold text-gray-900 leading-none">
																				{formatTime(
																					firstSegment?.Origin?.DepTime ||
																						firstSegment?.DepartureTime
																				)}
																			</div>
																			<div className="text-sm font-medium text-gray-600 mt-1">
																				{firstSegment?.Origin?.Airport
																					?.AirportCode ||
																					firstSegment?.Origin?.Airport
																						?.CityCode ||
																					"N/A"}
																			</div>
																		</div>

																		{/* Duration & Stops */}
																		<div className="flex-1 flex flex-col items-center px-2">
																			<div className="text-xs text-gray-500 mb-1">
																				{formatDuration(totalDuration)}
																			</div>
																			<div className="w-full flex items-center gap-1 relative">
																				<div className="h-[1px] flex-1 bg-gray-300"></div>
																				<Plane className="h-3 w-3 text-gray-400 rotate-90" />
																				<div className="h-[1px] flex-1 bg-gray-300"></div>
																			</div>
																			<div className="text-[10px] text-blue-600 font-medium mt-1">
																				{legSegments.length > 1
																					? `${legSegments.length - 1} Stop(s)`
																					: "Direct"}
																			</div>
																		</div>

																		{/* Arrival */}
																		<div className="text-left min-w-[80px]">
																			<div className="text-2xl font-bold text-gray-900 leading-none">
																				{formatTime(
																					lastSegment?.Destination?.ArrTime ||
																						lastSegment?.ArrivalTime
																				)}
																			</div>
																			<div className="text-sm font-medium text-gray-600 mt-1">
																				{lastSegment?.Destination?.Airport
																					?.AirportCode ||
																					lastSegment?.Destination?.Airport
																						?.CityCode ||
																					"N/A"}
																			</div>
																			{/* Show +1 day if needed - simplified check */}
																			{firstSegment?.Origin?.DepTime &&
																				lastSegment?.Destination?.ArrTime &&
																				new Date(
																					lastSegment.Destination.ArrTime
																				).getDate() !==
																					new Date(
																						firstSegment.Origin.DepTime
																					).getDate() && (
																					<span className="text-[10px] text-red-500 absolute ml-1">
																						+1
																					</span>
																				)}
																		</div>
																	</div>
																);
															})}

															{/* Features Available: Seat Map & SSR */}
															{(() => {
																// Get SSR info from the first segment
																const firstSegment = flight.Segments?.[0]?.[0];
																const hasBaggage = firstSegment?.Baggage;
																const hasCabinBaggage =
																	firstSegment?.CabinBaggage;
																
																// Check seat map availability for AIRiQ flights
																const hasSeatMap = (flight as any)?._airiqSeatMapAvailable === true;
																
																// Check if any features are available
																if (hasSeatMap || hasBaggage || hasCabinBaggage) {
																	return (
																		<div className="mt-3 pt-3 border-t border-gray-200">
																			<div className="flex flex-wrap gap-2 items-center">
																				<span className="text-xs text-gray-500 font-medium">
																					Available:
																				</span>
																				
																				{/* Seat Map Indicator */}
																				{hasSeatMap && (
																					<div 
																						className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs border border-purple-200"
																						title="Seat map available"
																					>
																						<MapPin className="h-3 w-3" />
																						<span>Seat Map</span>
																					</div>
																				)}
																				
																				{/* SSR Indicators */}
																				{hasBaggage && (
																					<div 
																						className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs border border-blue-200"
																						title="Baggage options available"
																					>
																						<ShoppingBag className="h-3 w-3" />
																						<span>SSR</span>
																					</div>
																				)}
																				
																				{hasCabinBaggage && !hasBaggage && (
																					<div 
																						className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs border border-green-200"
																						title="Cabin baggage info available"
																					>
																						<ShoppingBag className="h-3 w-3" />
																						<span>Baggage Info</span>
																					</div>
																				)}
																			</div>
																		</div>
																	);
																}
																return null;
															})()}
														</div>

														{/* Vertical Separator */}
														<div className="hidden lg:block w-px bg-gray-200 my-4"></div>
														<div className="block lg:hidden h-px bg-gray-200 mx-4"></div>

														{/* Right Section: Price, Attributes & Action */}
														<div className="w-full lg:w-64 p-4 lg:p-6 flex flex-col justify-center items-center gap-4 bg-gray-50/50">
															<div className="text-center">
																<div className="text-xs text-gray-500 mb-1">
																	3 deals from
																</div>
																{flight.Fare ? (
																	<>
																		<div className="text-3xl font-bold text-gray-900">
																			₹
																			{(() => {
																				const breakdown = getFareBreakdown(
																					flight.Fare,
																					0
																				);
																				return breakdown.publishedFare.toLocaleString();
																			})()}
																		</div>
																		{/* Fare Class (RBD) */}
																		<div className="text-xs text-gray-500 mt-1">
																			Class:{" "}
																			{flight.Segments[0][0].Airline.FareClass}
																		</div>
																		{/* Upsell Availability Indicator */}
																		{flight.IsUpsellAllowed && (
																			<div className="flex items-center justify-center gap-1 mt-1 mb-1">
																				<TrendingUp className="h-3 w-3 text-purple-600" />
																				<span className="text-xs text-purple-700 font-medium">
																					Upsell Available
																				</span>
																			</div>
																		)}
																		<Button
																			variant="link"
																			size="sm"
																			className="h-auto p-0 text-xs text-blue-600 mt-1"
																			onClick={() =>
																				setExpandedFareBreakdown(
																					expandedFareBreakdown ===
																						flight.ResultIndex
																						? null
																						: flight.ResultIndex
																				)
																			}
																		>
																			{expandedFareBreakdown ===
																			flight.ResultIndex
																				? "Hide"
																				: "View"}{" "}
																			Fare Rules
																		</Button>
																	</>
																) : (
																	<div className="text-sm text-muted-foreground">
																		Price not available
																	</div>
																)}
															</div>

															<Button
																className="w-full max-w-[160px] bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold py-2 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
																disabled={
																	selectingFlight === flight.ResultIndex
																}
																onClick={() => {
																	const values = form.getValues();
																	// If multicity or no upsell available - go straight to booking
																	if (
																		tripType === "multi-city" ||
																		flight.IsUpsellAllowed !== true
																	) {
																		setSelectingFlight(flight.ResultIndex);
																		const params = new URLSearchParams({
																			traceId: traceId,
																			resultIndex: flight.ResultIndex,
																			adultCount: String(values.adults),
																			childCount: String(values.children),
																			infantCount: String(values.infants),
																			apiSource: flight.ApiSource || "TBO",
																		});
																		if (flight.IsUpsellAllowed === true) {
																			params.append("isUpsellAllowed", "true");
																		}
																		if (flight.ReturnResultIndex) {
																			params.append(
																				"returnResultIndex",
																				flight.ReturnResultIndex
																			);
																		}
																		router.push(
																			`/travel-portal/book?${params.toString()}`
																		);
																		return;
																	}

																	// Else show upsell modal so user can pick an upsell option first
																	setUpsellFlight(flight);
																	setIsUpsellOpen(true);
																}}
															>
																{selectingFlight === flight.ResultIndex ? (
																	<>
																		<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																		Processing
																	</>
																) : (
																	<>
																		Select
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
																			className="lucide lucide-arrow-right"
																		>
																			<path d="M5 12h14" />
																			<path d="m12 5 7 7-7 7" />
																		</svg>
																	</>
																)}
															</Button>
														</div>
													</div>
												</CardContent>
												{/* Fare Breakdown (inline summary swapped in) */}
												{expandedFareBreakdown === flight.ResultIndex &&
													flight.Fare && (
														<div className="px-4 pb-4">
															<div>
																<h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
																	<IndianRupee className="h-4 w-4 text-gray-500" />
																	Fare Breakdown
																</h3>
																{(() => {
																	const breakdown = getFareBreakdown(
																		flight.Fare,
																		0
																	);
																	return (
																		<div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2 border border-gray-100">
																			<div className="flex justify-between text-gray-600">
																				<span>Base Fare</span>
																				<span className="font-medium text-gray-900">
																					{flight.Fare.Currency}{" "}
																					{breakdown.baseFare.toLocaleString()}
																				</span>
																			</div>
																			<div className="flex justify-between text-gray-600">
																				<span>Tax & Charges</span>
																				<span className="font-medium text-gray-900">
																					{flight.Fare.Currency}{" "}
																					{(
																						breakdown.tax +
																						breakdown.gst.total +
																						breakdown.otherCharges
																					).toLocaleString()}
																				</span>
																			</div>
																			<Separator className="my-2" />
																			<div className="flex justify-between font-bold text-lg text-primary">
																				<span>Total Amount</span>
																				<span className="flex items-center">
																					<IndianRupee className="h-4 w-4 mr-1" />
																					{breakdown.publishedFare.toLocaleString()}
																				</span>
																			</div>
																		</div>
																	);
																})()}
															</div>
														</div>
													)}
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
