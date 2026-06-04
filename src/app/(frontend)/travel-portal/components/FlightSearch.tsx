"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import FromToSelector, {
	fetchCityFromCode,
	type City,
} from "../../components/travel-portal/FromToSelector";
import { airlineLabelFromFields } from "@/lib/reference-data-client";
import { AirportCodeLabel } from "@/components/travel-portal/ReferenceCodeLabel";
import TripTypeSelector from "../../components/travel-portal/TripTypeSelector";
import SearchButton from "../../components/travel-portal/SearchButton";
import MultiCitySelector from "../../components/travel-portal/MultiCitySelector";
import TripjackMulticityLegBar from "./TripjackMulticityLegBar";
import UpsellModal from "./UpsellModal";
import {
	allDomesticMulticityLegsSelected,
	buildTripjackMulticityBookSearchParams,
	resolveMulticitySearchView,
} from "@/lib/tripjackMulticityUi";
import { Separator } from "@/components/ui/separator";
import { getFareBreakdown } from "@/lib/tboFareCalculations";
import { formatTravelPriceInr } from "@/lib/formatTravelPrice";
import AirlineLogo from "@/components/travel-portal/AirlineLogo";
import {
	flightCache,
	lastSearch,
	generateCacheKey,
	normalizeDate,
} from "@/lib/searchCache";
import { captureAndSendSnapshot } from "@/lib/audit/snapshotClient";
import MinimalFlightSearch from "@/components/travel-portal/MinimalFlightSearch";
import {
	TBO_API_CABIN_TO_UI,
	TBO_CABIN_CLASS,
	TBO_UI_CABIN_TO_API,
} from "@/lib/tboFlightSearch";

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
	journeyType: "1" | "2" | "3" | "5"; // 1: OW, 2: Return, 3: MC, 5: Special Return
	directFlight: boolean;
	oneStopFlight: boolean;
	/** TripJack searchModifiers.pft — Regular omits pft on API */
	fareProfile: "REGULAR" | "STUDENT" | "SENIOR_CITIZEN";
	/** Comma-separated IATA airline codes (max 10) for TripJack / TBO */
	preferredAirlines: string;
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
	JourneyType: "1" | "2" | "3" | "5";
	DirectFlight: string;
	OneStopFlight: string;
	Segments?: ApiFlightSegment[];
	Origin?: string;
	Destination?: string;
	PreferredDepartureTime?: string;
	ReturnPreferredDepartureTime?: string;
	pft?: "STUDENT" | "SENIOR_CITIZEN";
	PreferredAirlines?: string[] | null;
	Sources?: string[] | null;
	SpecialReturnChannel?: "LCC" | "GDS";
}

const timeSlots = [
	{ label: "Before 6AM", icon: Sunrise, range: [0, 6] },
	{ label: "6AM - 12PM", icon: Sun, range: [6, 12] },
	{ label: "12PM - 6PM", icon: Sunset, range: [12, 18] },
	{ label: "After 6PM", icon: Moon, range: [18, 24] },
];

const FLIGHT_LIST_INITIAL = 25;
const FLIGHT_LIST_STEP = 25;

const cabinClassMapping = TBO_UI_CABIN_TO_API;

const reverseCabinClassMapping = TBO_API_CABIN_TO_UI;

const tripTypeMapping: { [key: string]: string } = {
	"one-way": "1",
	"round-trip": "2",
	"multi-city": "3",
	"special-return": "5",
};

const reverseTripTypeMapping: { [key: string]: string } = {
	"1": "one-way",
	"2": "round-trip",
	"3": "multi-city",
	"5": "special-return",
};

export default function FlightSearch() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [flights, setFlights] = useState<FlightResult[]>([]);
	const [traceId, setTraceId] = useState<string>("");
	const [searchPerformed, setSearchPerformed] = useState(false);
	const [selectingFlight, setSelectingFlight] = useState<string | null>(null);

	// Scroll state for sticky header
	const [showMinimalHeader, setShowMinimalHeader] = useState(false);
	const searchCardRef = useRef<HTMLDivElement>(null);

	// Upsell modal state
	const [isUpsellOpen, setIsUpsellOpen] = useState(false);
	const [upsellFlight, setUpsellFlight] = useState<FlightResult | null>(null);

	// Preloaded upsell data: Map<ResultIndex, upsell data>

	const [preloadedUpsell, _setPreloadedUpsell] = useState<
		Map<string, FlightResult[]>
	>(new Map());

	// Track if we've loaded cached results on mount (for back navigation)
	const hasLoadedCacheRef = useRef(false);

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
	const [specialReturnChannel, setSpecialReturnChannel] = useState<
		"LCC" | "GDS"
	>("LCC");
	const prevTripTypeRef = useRef("one-way");

	/** TripJack domestic multicity: per-leg flight buckets + user selections */
	const [multicityDomesticLegs, setMulticityDomesticLegs] = useState<
		FlightResult[][] | null
	>(null);
	const [multicitySelections, setMulticitySelections] = useState<
		(FlightResult | null)[]
	>([]);
	const [multicityActiveLeg, setMulticityActiveLeg] = useState(0);

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
		[],
	);

	const [filteredFlights, setFilteredFlights] = useState<FlightResult[]>([]);
	const [visibleFlightCount, setVisibleFlightCount] =
		useState(FLIGHT_LIST_INITIAL);
	const flightListSentinelRef = useRef<HTMLDivElement | null>(null);
	const [flightSearchSessionId, setFlightSearchSessionId] = useState<
		string | null
	>(null);
	const [serverFlightTotal, setServerFlightTotal] = useState<number | null>(
		null,
	);
	const [mergePollSessionId, setMergePollSessionId] = useState<string | null>(
		null,
	);
	const [loadingMoreFlights, setLoadingMoreFlights] = useState(false);
	const loadingMoreFlightsRef = useRef(false);
	const flightCacheKeyRef = useRef<string | null>(null);
	const [expandedFareBreakdown, setExpandedFareBreakdown] = useState<
		string | null
	>(null);
	const hasPendingProviders = loading || mergePollSessionId !== null;

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
			cabinClass: TBO_CABIN_CLASS.ECONOMY,
			journeyType: "1",
			directFlight: true,
			oneStopFlight: false,
			fareProfile: "REGULAR",
			preferredAirlines: "",
		},
	});

	// Auto-fill form and search if URL parameters are present OR load from cache on back navigation
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

		// If no URL params but we have lastSearch, restore form UI only (no cache lookup)
		if (
			!origin &&
			!destination &&
			!departureDate &&
			!leg1From &&
			!hasLoadedCacheRef.current
		) {
			const lastSearchParams = lastSearch.get("flight") as {
				origin?: string;
				destination?: string;
				departureDate?: string;
				returnDate?: string;
				adults?: number;
				children?: number;
				infants?: number;
				journeyType?: string;
				cabinClass?: string;
				segments?: FlightSegment[];
				fareProfile?: "REGULAR" | "STUDENT" | "SENIOR_CITIZEN";
				preferredAirlines?: string;
			} | null;
			if (lastSearchParams) {
				hasLoadedCacheRef.current = true;

				if (lastSearchParams.fareProfile) {
					form.setValue("fareProfile", lastSearchParams.fareProfile);
				}
				if (lastSearchParams.preferredAirlines != null) {
					form.setValue(
						"preferredAirlines",
						lastSearchParams.preferredAirlines,
					);
				}

				// Restore form from lastSearch (UI state only)
				if (lastSearchParams.origin && lastSearchParams.destination) {
					form.setValue("origin", lastSearchParams.origin);
					form.setValue("destination", lastSearchParams.destination);
					void Promise.all([
						fetchCityFromCode(lastSearchParams.origin),
						fetchCityFromCode(lastSearchParams.destination),
					]).then(([fromCity, toCity]) => {
						setFrom(fromCity);
						setTo(toCity);
					});

					if (lastSearchParams.departureDate) {
						const depDate = new Date(lastSearchParams.departureDate);
						setDepartureDate(depDate);
						form.setValue("departureDate", depDate);
					}
					if (lastSearchParams.returnDate) {
						const retDate = new Date(lastSearchParams.returnDate);
						setReturnDate(retDate);
						form.setValue("returnDate", retDate);
					}
				}

				setTravellers({
					adults: lastSearchParams.adults || 1,
					children: lastSearchParams.children || 0,
					infants: lastSearchParams.infants || 0,
				});
				form.setValue("adults", lastSearchParams.adults || 1);
				form.setValue("children", lastSearchParams.children || 0);
				form.setValue("infants", lastSearchParams.infants || 0);

				if (lastSearchParams.journeyType) {
					form.setValue(
						"journeyType",
						lastSearchParams.journeyType as "1" | "2" | "3" | "5",
					);
					setTripType(
						reverseTripTypeMapping[lastSearchParams.journeyType] || "one-way",
					);
					prevTripTypeRef.current =
						reverseTripTypeMapping[lastSearchParams.journeyType] || "one-way" ;
				}
				if (lastSearchParams.cabinClass) {
					form.setValue("cabinClass", lastSearchParams.cabinClass);
					setTravelClass(
						reverseCabinClassMapping[lastSearchParams.cabinClass] || "Economy",
					);
				}

				// For multi-city, restore segments if available
				if (lastSearchParams.journeyType === "3" && lastSearchParams.segments) {
					const segments = lastSearchParams.segments;
					form.setValue("segments", segments);
					void Promise.all(
						segments.map(async (seg: FlightSegment, index: number) => ({
							id: `leg-${index + 1}`,
							from: await fetchCityFromCode(seg.origin || ""),
							to: await fetchCityFromCode(seg.destination || ""),
							date: seg.departureDate
								? new Date(seg.departureDate)
								: undefined,
						})),
					).then((newLegs) => setMultiCityLegs(newLegs));
				}
			}
		}

		// If URL params are present, this is a new search - clear cache for this specific search
		if (
			origin ||
			destination ||
			departureDate ||
			leg1From ||
			leg1To ||
			leg1Date
		) {
			hasLoadedCacheRef.current = false;
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

			void (async () => {
				const newLegs: CityLeg[] = [];

				if (leg1From && leg1To) {
					newLegs.push({
						id: "leg-1",
						from: await fetchCityFromCode(leg1From),
						to: await fetchCityFromCode(leg1To),
						date: leg1Date ? new Date(leg1Date) : undefined,
					});
				}
				if (leg2From && leg2To) {
					newLegs.push({
						id: "leg-2",
						from: await fetchCityFromCode(leg2From),
						to: await fetchCityFromCode(leg2To),
						date: leg2Date ? new Date(leg2Date) : undefined,
					});
				}
				if (leg3From && leg3To) {
					newLegs.push({
						id: "leg-3",
						from: await fetchCityFromCode(leg3From),
						to: await fetchCityFromCode(leg3To),
						date: leg3Date ? new Date(leg3Date) : undefined,
					});
				}

				setMultiCityLegs(newLegs);

				const segments = newLegs.map((leg) => ({
					origin: leg.from.code,
					destination: leg.to.code,
					departureDate: leg.date,
				}));
				form.setValue("segments", segments);

				handleAutoSearch({
					origin: "",
					destination: "",
					departureDate: undefined,
					returnDate: undefined,
					segments: segments,
					adults: adultCount,
					children: childCount,
					infants: infantCount,
					cabinClass: cabinClass || TBO_CABIN_CLASS.ECONOMY,
					journeyType: "3",
					directFlight: true,
					oneStopFlight: false,
					fareProfile: "REGULAR",
					preferredAirlines: "",
				});
			})();
		} else if (origin && destination && departureDate) {
			// One-way or round-trip search
			form.setValue("origin", origin);
			form.setValue("destination", destination);
			void Promise.all([
				fetchCityFromCode(origin),
				fetchCityFromCode(destination),
			]).then(([fromCity, toCity]) => {
				setFrom(fromCity);
				setTo(toCity);
			});
			const depDate = new Date(departureDate);
			setDepartureDate(depDate);
			form.setValue("departureDate", depDate);
			if (returnDate) {
				const retDate = new Date(returnDate);
				setReturnDate(retDate);
				form.setValue("returnDate", retDate);
			}

			if (journeyType) {
				form.setValue(
					"journeyType",
					journeyType as "1" | "2" | "3" | "5",
				);
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
				cabinClass: cabinClass || TBO_CABIN_CLASS.ECONOMY,
				journeyType: (journeyType as "1" | "2" | "3" | "5") || "1",
				directFlight: true,
				oneStopFlight: false,
				fareProfile: "REGULAR",
				preferredAirlines: "",
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	// Scroll detection for sticky minimal header
	useEffect(() => {
		const handleScroll = () => {
			if (searchCardRef.current) {
				const rect = searchCardRef.current.getBoundingClientRect();
				// Show minimal header when search card is scrolled past (top is above viewport)
				setShowMinimalHeader(rect.top < -50);
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll(); // Initial check

		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Handler to scroll back to search form
	const scrollToSearch = () => {
		searchCardRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

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
		form.setValue("journeyType", tripTypeMapping[type] as "1" | "2" | "3" | "5");

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

	// Clear flights when trip type changes (cache key includes trip type, so no need to clear cache)
	useEffect(() => {
		if (prevTripTypeRef.current !== tripType) {
			// Clear displayed flights only
			setFlights([]);
			setSearchPerformed(false);
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
			if (
				(tripType === "round-trip" || tripType === "special-return") &&
				selectedDepartureTimes.length > 0
			) {
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
							},
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

	useEffect(() => {
		setVisibleFlightCount(
			Math.min(FLIGHT_LIST_INITIAL, filteredFlights.length || 0),
		);
	}, [filteredFlights]);

	const visibleFlights = useMemo(
		() => filteredFlights.slice(0, visibleFlightCount),
		[filteredFlights, visibleFlightCount],
	);

	useEffect(() => {
		const el = flightListSentinelRef.current;
		if (!el || filteredFlights.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries[0]?.isIntersecting) return;

				const sid = flightSearchSessionId;
				const total = serverFlightTotal;

				if (
					sid &&
					total != null &&
					flights.length < total &&
					!loadingMoreFlightsRef.current
				) {
					loadingMoreFlightsRef.current = true;
					setLoadingMoreFlights(true);
					const offset = flights.length;
					const limit = total - offset;
					void (async () => {
						try {
							const res = await fetch(
								`/api/travel/flights/search/more?searchSessionId=${encodeURIComponent(
									sid,
								)}&offset=${offset}&limit=${limit}`,
							);
							if (!res.ok) {
								throw new Error("Failed to load more flights");
							}
							const more = await res.json();
							if (!more.success) {
								throw new Error(more.error || "Failed to load more flights");
							}
							const chunk = (more.data?.Response?.Results?.[0] ||
								[]) as FlightResult[];
							setFlights((prev) => {
								const next = [...prev, ...chunk];
								if (flightCacheKeyRef.current) {
									flightCache.set(flightCacheKeyRef.current, {
										results: next,
										createdAt: Date.now(),
									});
								}
								return next;
							});
							if (!more.pagination?.hasMore) {
								setFlightSearchSessionId(null);
							}
						} catch (e) {
							console.error(e);
							toast.error("Could not load more flights");
						} finally {
							loadingMoreFlightsRef.current = false;
							setLoadingMoreFlights(false);
						}
					})();
					return;
				}

				setVisibleFlightCount((prev) =>
					Math.min(prev + FLIGHT_LIST_STEP, filteredFlights.length),
				);
			},
			{ rootMargin: "120px" },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [
		filteredFlights.length,
		visibleFlightCount,
		flightSearchSessionId,
		serverFlightTotal,
		flights.length,
	]);

	useEffect(() => {
		if (!mergePollSessionId) return;
		let cancelled = false;
		let inFlight = false;

		const refreshFromMergedSession = async () => {
			if (inFlight) return;
			inFlight = true;
			try {
				const sid = mergePollSessionId;
				const statusRes = await fetch(
					`/api/travel/flights/search/merge-status?searchSessionId=${encodeURIComponent(sid)}`,
				);
				const statusJson = (await statusRes.json()) as {
					success?: boolean;
					ready?: boolean;
					searchSessionId?: string;
					total?: number;
					traceId?: string;
				};
				if (cancelled || !statusJson.success || !statusJson.ready) return;

				let moreJson: {
					success?: boolean;
					pending?: boolean;
					data?: { Response?: { Results?: FlightResult[][]; TraceId?: string } };
					pagination?: { total?: number; hasMore?: boolean };
				} = {};

				for (let attempt = 0; attempt < 8; attempt++) {
					const moreRes = await fetch(
						`/api/travel/flights/search/more?searchSessionId=${encodeURIComponent(sid)}&offset=0&limit=25`,
					);
					moreJson = await moreRes.json();
					if (moreJson.success && !moreJson.pending) break;
					await new Promise((r) => setTimeout(r, 350));
				}

				if (cancelled || !moreJson.success || moreJson.pending) return;

				const resultsArrays = (moreJson.data?.Response?.Results ||
					[]) as FlightResult[][];
				const journeyType = form.getValues("journeyType");
				const multicityView = resolveMulticitySearchView(
					resultsArrays,
					journeyType,
				);
				const chunk = multicityView.displayFlights;
				const trace =
					moreJson.data?.Response?.TraceId || statusJson.traceId || "";
				const total =
					moreJson.pagination?.total ?? statusJson.total ?? chunk.length;

				if (trace) {
					setTraceId(trace);
					const ck = flightCacheKeyRef.current;
					if (ck) flightCache.setTraceId(ck, trace);
				}

				if (multicityView.domesticLegs) {
					setMulticityDomesticLegs(multicityView.domesticLegs);
					setMulticitySelections(
						new Array(multicityView.domesticLegs.length).fill(null),
					);
					setMulticityActiveLeg(0);
				} else {
					setMulticityDomesticLegs(null);
					setMulticitySelections([]);
				}
				setFlights(chunk);
				const ck = flightCacheKeyRef.current;
				if (ck) {
					if (multicityView.domesticLegs) {
						flightCache.set(ck, {
							results: multicityView.domesticLegs[0] || [],
							multicityLegs: multicityView.domesticLegs,
							createdAt: Date.now(),
						});
					} else {
						flightCache.set(ck, { results: chunk, createdAt: Date.now() });
					}
				}

				setMergePollSessionId(null);

				if (
					moreJson.pagination?.hasMore === true &&
					(moreJson.pagination.total ?? 0) > chunk.length
				) {
					setFlightSearchSessionId(sid);
					setServerFlightTotal(moreJson.pagination.total ?? total);
				} else {
					setFlightSearchSessionId(null);
					setServerFlightTotal(null);
				}

				toast.success(
					`Found ${total} flight option${total !== 1 ? "s" : ""}${moreJson.pagination?.hasMore ? ". Scroll to load more." : ""}`,
				);
			} finally {
				inFlight = false;
			}
		};

		const interval = setInterval(() => {
			void refreshFromMergedSession();
		}, 1600);
		void refreshFromMergedSession();

		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [mergePollSessionId, form]);

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
		_infantCount: number,
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
		options?: { forceRefresh?: boolean },
	) => {
		const forceRefresh = options?.forceRefresh === true;

		// Comprehensive validation for all journey types
		if (
			searchData.journeyType === "1" ||
			searchData.journeyType === "2" ||
			searchData.journeyType === "5"
		) {
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
			if (
				searchData.journeyType === "2" ||
				searchData.journeyType === "5"
			) {
				if (!searchData.returnDate) {
					toast.error("Please select a return date");
					return;
				}
				const returnDate = new Date(searchData.returnDate);
				returnDate.setHours(0, 0, 0, 0);
				if (returnDate < departureDate) {
					toast.error("Return date must be on or after departure date");
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

		if (
			(searchData.journeyType === "2" || searchData.journeyType === "5") &&
			!searchData.returnDate
		) {
			toast.error("Please select a return date");
			return;
		}

		// Validate multi-city requires at least 2 segments with complete data
		if (searchData.journeyType === "3") {
			if (!searchData.segments || searchData.segments.length < 2) {
				toast.error("Multi-city flights require at least 2 segments");
				return;
			}
			if (searchData.segments.length > 6) {
				toast.error("Multi-city supports at most 6 legs");
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
						}: Departure and destination cities cannot be the same`,
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
						}: Departure date must be after segment ${i} departure date`,
					);
					return;
				}
			}
		}

		setLoading(true);
		setSearchPerformed(true);
		setFlightSearchSessionId(null);
		setServerFlightTotal(null);
		setMergePollSessionId(null);
		setMulticityDomesticLegs(null);
		setMulticitySelections([]);
		setMulticityActiveLeg(0);

		try {
			// Helper function to format date for API (YYYY-MM-DDT00:00:00)
			const formatDateForAPI = (date: Date) => {
				const normalized = normalizeDate(date);
				return `${normalized}T00:00:00`;
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
						? formatDateForAPI(new Date(segment.departureDate))
						: "",
				}));
			} else {
				// One-way or round-trip
				searchParams.Origin = searchData.origin.toUpperCase();
				searchParams.Destination = searchData.destination.toUpperCase();
				searchParams.PreferredDepartureTime = searchData.departureDate
					? formatDateForAPI(new Date(searchData.departureDate))
					: "";
				if (
					searchData.journeyType === "2" ||
					searchData.journeyType === "5"
				) {
					searchParams.ReturnPreferredDepartureTime = searchData.returnDate
						? formatDateForAPI(new Date(searchData.returnDate))
						: "";
				}
			}

			if (searchData.journeyType === "5") {
				searchParams.SpecialReturnChannel = specialReturnChannel;
			}

			const preferredCodes = searchData.preferredAirlines
				.split(/[\s,]+/)
				.map((c) => c.trim().toUpperCase())
				.filter((c) => c.length >= 2)
				.slice(0, 10);
			if (preferredCodes.length) {
				searchParams.PreferredAirlines = preferredCodes;
			}
			if (searchData.fareProfile !== "REGULAR") {
				searchParams.pft = searchData.fareProfile;
			}

			// Create cache key from search parameters (hashed) - use normalized dates for cache key
			const cacheKeyParams: Record<
				string,
				string | number | Array<Record<string, string>>
			> = {
				AdultCount: String(searchData.adults),
				ChildCount: String(searchData.children),
				InfantCount: String(searchData.infants),
				FlightCabinClass: searchData.cabinClass,
				JourneyType: searchData.journeyType,
				DirectFlight: String(searchData.directFlight),
				OneStopFlight: String(searchData.oneStopFlight),
				fareProfile: searchData.fareProfile,
				preferredAirlinesKey: preferredCodes.join(","),
			};

			if (searchData.journeyType === "3" && searchData.segments) {
				cacheKeyParams.Segments = searchData.segments.map((segment) => ({
					Origin: segment.origin.toUpperCase(),
					Destination: segment.destination.toUpperCase(),
					FlightCabinClass: searchData.cabinClass,
					PreferredDepartureTime: segment.departureDate
						? normalizeDate(new Date(segment.departureDate))
						: "",
				}));
			} else {
				cacheKeyParams.Origin = searchData.origin.toUpperCase();
				cacheKeyParams.Destination = searchData.destination.toUpperCase();
				cacheKeyParams.PreferredDepartureTime = searchData.departureDate
					? normalizeDate(new Date(searchData.departureDate))
					: "";
				if (
					searchData.journeyType === "2" ||
					searchData.journeyType === "5"
				) {
					cacheKeyParams.ReturnPreferredDepartureTime = searchData.returnDate
						? normalizeDate(new Date(searchData.returnDate))
						: "";
				}
			}

			const cacheKey = await generateCacheKey(cacheKeyParams);
			flightCacheKeyRef.current = cacheKey;

			// Check cache (unless forced refresh requested)
			if (!forceRefresh) {
				const cached = flightCache.get(cacheKey);
				if (cached) {
					setFlightSearchSessionId(null);
					setServerFlightTotal(null);
					setMergePollSessionId(null);
					const cachedLegs = cached.multicityLegs as
						| FlightResult[][]
						| undefined;
					if (cachedLegs?.length) {
						setMulticityDomesticLegs(cachedLegs);
						setMulticitySelections(new Array(cachedLegs.length).fill(null));
						setMulticityActiveLeg(0);
						setFlights(cachedLegs[0] || []);
					} else {
						setMulticityDomesticLegs(null);
						setMulticitySelections([]);
						setFlights(cached.results as FlightResult[]);
					}
					// Get traceId from separate storage (not from cache structure)
					const cachedTraceId = flightCache.getTraceId(cacheKey);
					if (cachedTraceId) {
						setTraceId(cachedTraceId);
					}
					setSearchPerformed(true);
					setLoading(false);
					const count = cachedLegs?.length
						? cachedLegs.reduce((n, leg) => n + leg.length, 0)
						: cached.results.length;
					if (count === 0) {
						toast.info("No flights found (cached)");
					} else {
						toast.success(`Found ${count} flight options (cached)`);
					}
					return;
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
						"Invalid search parameters. Please check your inputs and try again.",
					);
				} else if (response.status === 401) {
					throw new Error("Authentication failed. Please try again later.");
				} else if (response.status === 403) {
					throw new Error("Access denied. Please try again later.");
				} else if (response.status === 404) {
					throw new Error(
						"Flight search service not available. Please try again later.",
					);
				} else if (response.status === 429) {
					throw new Error(
						"Too many requests. Please wait a moment and try again.",
					);
				} else if (response.status >= 500) {
					throw new Error("Server error. Please try again later.");
				} else {
					throw new Error(
						`Search failed with status ${response.status}. Please try again.`,
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
						"No flights found for the selected criteria. Try different dates or routes.",
					);
				} else if (errorMessage.toLowerCase().includes("invalid")) {
					throw new Error(
						"Invalid search parameters. Please check your inputs.",
					);
				} else if (errorMessage.toLowerCase().includes("timeout")) {
					throw new Error("Search timed out. Please try again.");
				} else if (errorMessage.toLowerCase().includes("network")) {
					throw new Error(
						"Network error. Please check your connection and try again.",
					);
				} else {
					throw new Error(errorMessage);
				}
			}

			const newTraceId = result.data?.Response?.TraceId || "";
			if (newTraceId) {
				setTraceId(newTraceId);
				// Store traceId separately (not in cache structure)
				flightCache.setTraceId(cacheKey, newTraceId);
			}

			const paginationMeta = result.pagination as {
				searchSessionId: string;
				total: number;
				loaded: number;
				pageSize: number;
				hasMore: boolean;
			} | null;

			const mergePending = result.mergePending === true;
			const mergeSessionId = result.mergeSessionId as string | undefined;

			if (mergePending && mergeSessionId) {
				setMergePollSessionId(mergeSessionId);
				setFlightSearchSessionId(null);
				setServerFlightTotal(null);
			} else {
				setMergePollSessionId(null);
				if (paginationMeta?.hasMore && paginationMeta.searchSessionId) {
					setFlightSearchSessionId(paginationMeta.searchSessionId);
					setServerFlightTotal(paginationMeta.total);
				} else {
					setFlightSearchSessionId(null);
					setServerFlightTotal(null);
				}
			}

			const resultsArrays = (result.data?.Response?.Results ||
				[]) as FlightResult[][];
			const multicityView = resolveMulticitySearchView(
				resultsArrays,
				searchData.journeyType,
			);
			const flightResults = multicityView.displayFlights;

			if (multicityView.domesticLegs) {
				setMulticityDomesticLegs(multicityView.domesticLegs);
				setMulticitySelections(
					new Array(multicityView.domesticLegs.length).fill(null),
				);
				setMulticityActiveLeg(0);
				flightCache.set(cacheKey, {
					results: multicityView.domesticLegs[0] || [],
					multicityLegs: multicityView.domesticLegs,
					createdAt: Date.now(),
				});
			} else {
				setMulticityDomesticLegs(null);
				setMulticitySelections([]);
				flightCache.set(cacheKey, {
					results: flightResults,
					createdAt: Date.now(),
				});
			}

			// Save last search parameters for form restoration (UI state only)
			const lastSearchData: Record<
				string,
				| string
				| number
				| Array<{ origin: string; destination: string; departureDate?: string }>
			> = {
				adults: searchData.adults,
				children: searchData.children,
				infants: searchData.infants,
				journeyType: searchData.journeyType,
				cabinClass: searchData.cabinClass,
				fareProfile: searchData.fareProfile,
				preferredAirlines: searchData.preferredAirlines,
			};

			if (searchData.journeyType === "3" && searchData.segments) {
				// Multi-city: save segments
				lastSearchData.segments = searchData.segments.map((seg) => ({
					origin: seg.origin,
					destination: seg.destination,
					departureDate: seg.departureDate
						? normalizeDate(new Date(seg.departureDate))
						: undefined,
				}));
			} else {
				// One-way or round-trip: save origin/destination
				lastSearchData.origin = searchData.origin;
				lastSearchData.destination = searchData.destination;
				if (searchData.departureDate) {
					lastSearchData.departureDate = normalizeDate(
						new Date(searchData.departureDate),
					);
				}
				if (searchData.returnDate) {
					lastSearchData.returnDate = normalizeDate(
						new Date(searchData.returnDate),
					);
				}
			}

			lastSearch.save("flight", lastSearchData);

			setFlights(flightResults);
			setSearchPerformed(true);

			// Preload upsell data in the background
			preloadUpsellData(
				flightResults,
				newTraceId,
				searchData.adults,
				searchData.children,
				searchData.infants,
			);

			if (flightResults.length === 0 && !mergePending) {
				toast.info("No flights found for the selected criteria");
			} else if (mergePending) {
				toast.info(
					flightResults.length > 0
						? "Loading more results..."
						: "Searching flights...",
				);
			} else {
				const totalOptions = paginationMeta?.total ?? flightResults.length;
				const hasMorePages = Boolean(paginationMeta?.hasMore);
				toast.success(
					`Found ${totalOptions} flight option${totalOptions !== 1 ? "s" : ""}${hasMorePages ? ". Scroll to load more." : ""}`,
				);
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
					"Network error. Please check your internet connection and try again.",
				);
			} else if (errorMessage.toLowerCase().includes("timeout")) {
				toast.error(
					"Search timed out. The server is busy. Please try again in a few moments.",
				);
			} else if (
				errorMessage.toLowerCase().includes("server") ||
				errorMessage.toLowerCase().includes("internal")
			) {
				toast.error(
					"Server error. Our team has been notified. Please try again later.",
				);
			} else if (errorMessage.toLowerCase().includes("no flights")) {
				toast.info(errorMessage);
			} else {
				toast.error(errorMessage);
			}

			setFlights([]);
			setMulticityDomesticLegs(null);
			setMulticitySelections([]);
			setFlightSearchSessionId(null);
			setServerFlightTotal(null);
			setMergePollSessionId(null);
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: FlightSearchForm) => {
		// Generate cache key to clear specific entry when user manually submits
		// Use normalized dates for cache key generation
		const cacheKeyParams: Record<
			string,
			string | number | Array<Record<string, string>>
		> = {
			AdultCount: String(data.adults),
			ChildCount: String(data.children),
			InfantCount: String(data.infants),
			FlightCabinClass: data.cabinClass,
			JourneyType: data.journeyType,
			DirectFlight: String(data.directFlight),
			OneStopFlight: String(data.oneStopFlight),
			fareProfile: data.fareProfile,
			preferredAirlinesKey: data.preferredAirlines
				.split(/[\s,]+/)
				.map((c) => c.trim().toUpperCase())
				.filter((c) => c.length >= 2)
				.slice(0, 10)
				.join(","),
		};

		if (data.journeyType === "3" && data.segments) {
			cacheKeyParams.Segments = data.segments.map((segment) => ({
				Origin: segment.origin.toUpperCase(),
				Destination: segment.destination.toUpperCase(),
				FlightCabinClass: data.cabinClass,
				PreferredDepartureTime: segment.departureDate
					? normalizeDate(new Date(segment.departureDate))
					: "",
			}));
		} else {
			cacheKeyParams.Origin = data.origin.toUpperCase();
			cacheKeyParams.Destination = data.destination.toUpperCase();
			cacheKeyParams.PreferredDepartureTime = data.departureDate
				? normalizeDate(new Date(data.departureDate))
				: "";
			if (data.journeyType === "2" || data.journeyType === "5") {
				cacheKeyParams.ReturnPreferredDepartureTime = data.returnDate
					? normalizeDate(new Date(data.returnDate))
					: "";
			}
		}

		const cacheKey = await generateCacheKey(cacheKeyParams);
		// Clear this specific cache entry to force fresh search
		flightCache.clearKey(cacheKey);

		await handleAutoSearch(data, { forceRefresh: true });
	};

	const formatDuration = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	};

	const formatTime = (dateString: string | undefined) => {
		if (!dateString) return "--:--";

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
					/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/,
				);
				if (match) {
					const [, year, month, day, hour, minute, second] = match;
					return new Date(
						parseInt(year),
						parseInt(month) - 1,
						parseInt(day),
						parseInt(hour),
						parseInt(minute),
						parseInt(second),
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
		} catch (_error) {
			return "Invalid Date";
		}
	};

	return (
		<div className="relative">
			{/* Minimal Sticky Header - appears when scrolling */}
			<div
				className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
					showMinimalHeader && searchPerformed
						? "translate-y-0 opacity-100"
						: "-translate-y-full opacity-0 pointer-events-none"
				}`}
			>
				<MinimalFlightSearch
					from={from}
					to={to}
					departureDate={departureDate}
					returnDate={returnDate}
					travellers={travellers}
					travelClass={travelClass}
					tripType={tripType}
					onModifySearch={scrollToSearch}
				/>
			</div>

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
				<Card
					ref={searchCardRef}
					className="shadow-md border-slate-200 overflow-hidden transition-all duration-300"
				>
					<CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 px-4">
						<div className="relative flex items-center">
							<CardTitle className="flex items-center gap-2 text-xl text-slate-800 m-0">
								<Plane className="h-5 w-5 text-blue-600" />
								Flight Search
							</CardTitle>
							{/* Trip type controls aligned centered in header */}
							<div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
								<TripTypeSelector
									tripType={tripType}
									onTripTypeChange={handleTripTypeChange}
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							{tripType === "special-return" && (
								<div className="flex flex-wrap items-center gap-4 text-sm rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2">
									<span className="text-amber-900 font-medium">
										Special return (same airline, combined fare)
									</span>
									<label className="flex items-center gap-1.5 cursor-pointer">
										<input
											type="radio"
											name="specialReturnChannel"
											checked={specialReturnChannel === "LCC"}
											onChange={() => setSpecialReturnChannel("LCC")}
										/>
										LCC — 6E, SG, G8
									</label>
									<label className="flex items-center gap-1.5 cursor-pointer">
										<input
											type="radio"
											name="specialReturnChannel"
											checked={specialReturnChannel === "GDS"}
											onChange={() => setSpecialReturnChannel("GDS")}
										/>
										GDS
									</label>
								</div>
							)}

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
											isRoundTrip={
												tripType === "round-trip" ||
												tripType === "special-return"
											}
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
											form.setValue(
												"cabinClass",
												cabinClassMapping[cls] || TBO_CABIN_CLASS.ECONOMY,
											);
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

							<div className="flex flex-wrap gap-4 items-end pt-2 border-t border-slate-100">
								<div className="space-y-1.5 min-w-[200px]">
									<Label className="text-xs text-muted-foreground">
										Fare type (TripJack)
									</Label>
									<Select
										value={form.watch("fareProfile")}
										onValueChange={(v) =>
											form.setValue(
												"fareProfile",
												v as FlightSearchForm["fareProfile"],
											)
										}
									>
										<SelectTrigger className="w-[220px]" size="sm">
											<SelectValue placeholder="Regular" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="REGULAR">Regular</SelectItem>
											<SelectItem value="STUDENT">Student</SelectItem>
											<SelectItem value="SENIOR_CITIZEN">
												Senior citizen
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5 flex-1 min-w-[220px] max-w-md">
									<Label
										htmlFor="preferredAirlines"
										className="text-xs text-muted-foreground"
									>
										Preferred airlines (IATA codes, comma-separated, max 10)
									</Label>
									<Input
										id="preferredAirlines"
										placeholder="e.g. 6E, SG, AI"
										{...form.register("preferredAirlines")}
										className="h-9"
									/>
								</div>
							</div>
						</form>
					</CardContent>
				</Card>

				{/* Loading Skeleton */}
				{loading && (
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
						<div className="lg:col-span-4 text-sm text-muted-foreground flex items-center gap-2">
							<Loader2 className="h-4 w-4 animate-spin" />
							Searching flights...
						</div>
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

				{/* Search pending with no visible flights yet */}
				{searchPerformed && mergePollSessionId && flights.length === 0 && !loading && (
					<Card>
						<CardContent className="py-10">
							<div className="text-center text-muted-foreground flex items-center justify-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin" />
								Searching flights...
							</div>
						</CardContent>
					</Card>
				)}

				{/* Flight Results */}
				{searchPerformed && flights.length > 0 && (
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
						{/* Sticky Filters Container */}
						<div className="lg:col-span-1">
							<div
								className={`transition-all duration-300 ${
									showMinimalHeader
										? "lg:sticky lg:top-20"
										: "lg:sticky lg:top-6"
								}`}
								style={{
									maxHeight: showMinimalHeader
										? "calc(100vh - 88px)"
										: "calc(100vh - 32px)",
								}}
							>
								<Card className="overflow-hidden">
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
									<CardContent
										className="overflow-y-auto"
										style={{
											maxHeight: showMinimalHeader
												? "calc(100vh - 168px)"
												: "calc(100vh - 112px)",
										}}
									>
										<div className="space-y-6">
											{/* Price Range */}
											<div className="space-y-3">
												<Label className="text-sm font-medium">
													Price Range
												</Label>
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
														<span>₹{formatTravelPriceInr(priceRange[0])}</span>
														<span>₹{formatTravelPriceInr(priceRange[1])}</span>
													</div>
												</div>
											</div>

											{/* Departure Time Filter (for round trip) */}
											{(tripType === "round-trip" ||
												tripType === "special-return") && (
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
																			slot.label,
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
																						(t) => t !== slot.label,
																					),
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
												<Label className="text-sm font-medium">
													Arrival Time
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
																	id={`arrival-${slot.label}`}
																	checked={selectedArrivalTimes.includes(
																		slot.label,
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
																					(t) => t !== slot.label,
																				),
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
														new Set(flights.map((f) => f.AirlineCode)),
													).map((airlineCode) => {
														const sample = flights.find(
															(f) => f.AirlineCode === airlineCode,
														);
														const airlineName = airlineLabelFromFields(
															airlineCode,
															sample?.Segments?.[0]?.[0]?.Airline?.AirlineName,
														);
														return (
															<div
																key={airlineCode}
																className="flex items-center space-x-2"
															>
																<Checkbox
																	id={`airline-${airlineCode}`}
																	checked={selectedAirlines.includes(
																		airlineCode,
																	)}
																	onCheckedChange={(checked) => {
																		if (checked) {
																			setSelectedAirlines([
																				...selectedAirlines,
																				airlineCode,
																			]);
																		} else {
																			setSelectedAirlines(
																				selectedAirlines.filter(
																					(a) => a !== airlineCode,
																				),
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
						</div>
						<div className="lg:col-span-3">
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between flex-wrap gap-3">
										<div className="flex flex-col gap-2">
											<CardTitle>
												Flight Results (
												{Math.min(visibleFlightCount, filteredFlights.length)}{" "}
												of {filteredFlights.length}
												{filteredFlights.length !== flights.length
													? ` • ${flights.length} total`
													: ""}
												)
											</CardTitle>
											{mergePollSessionId ? (
												<p className="text-sm text-muted-foreground flex items-center gap-2">
													<Loader2 className="h-4 w-4 animate-spin shrink-0" />
													Loading more results...
												</p>
											) : null}
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
									{multicityDomesticLegs &&
									multicityDomesticLegs.length >= 2 ? (
										<TripjackMulticityLegBar
											legs={multicityDomesticLegs}
											selections={multicitySelections}
											activeLeg={multicityActiveLeg}
											onActiveLegChange={(index) => {
												setMulticityActiveLeg(index);
												setFlights(multicityDomesticLegs[index] || []);
											}}
											onContinue={() => {
												if (
													!traceId ||
													!allDomesticMulticityLegsSelected(
														multicitySelections,
														multicityDomesticLegs.length,
													)
												) {
													return;
												}
												const picks = multicitySelections.filter(
													(f): f is FlightResult => f != null,
												);
												setSelectingFlight(picks[0]?.ResultIndex ?? null);
												const values = form.getValues();
												const params = buildTripjackMulticityBookSearchParams({
													traceId,
													selections: picks,
													adultCount: values.adults,
													childCount: values.children,
													infantCount: values.infants,
												});
												router.push(
													`/travel-portal/book?${params.toString()}`,
												);
											}}
											continuing={Boolean(selectingFlight)}
										/>
									) : null}
									{filteredFlights.length === 0 ? (
										<div className="text-center py-8 text-muted-foreground">
											No flights match your filter criteria. Try adjusting your
											filters.
										</div>
									) : (
										<div className="space-y-4">
											{visibleFlights.map((flight, index) => (
												<Card
													key={flight.ResultIndex || index}
													className="shadow-sm hover:shadow-md transition-all duration-200"
												>
													<CardContent className="p-0">
														<div className="flex flex-col lg:flex-row items-stretch">
															{/* Left Section: Flight Details */}
															<div className="flex-1 p-4 lg:p-6 flex flex-col justify-center gap-6">
																{flight.Segments.map(
																	(legSegments, legIndex) => {
																		const firstSegment = legSegments[0];
																		const lastSegment =
																			legSegments[legSegments.length - 1];

																		// Safely get airline info with fallback
																		const airlineCode =
																			firstSegment?.Airline?.AirlineCode ||
																			flight.AirlineCode ||
																			"XX";
																		const airlineName =
																			airlineLabelFromFields(
																				airlineCode,
																				firstSegment?.Airline?.AirlineName,
																			);

																		// Calculate total duration for this leg
																		const totalDuration = legSegments.reduce(
																			(acc, seg) => acc + (seg?.Duration || 0),
																			0,
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
																				</div>

																				{/* Departure */}
																				<div className="text-right min-w-[80px]">
																					<div className="text-2xl font-bold text-gray-900 leading-none">
																						{formatTime(
																							firstSegment?.Origin?.DepTime ||
																								firstSegment?.DepartureTime,
																						)}
																					</div>
																					<div className="text-sm font-medium text-gray-600 mt-1">
																						<AirportCodeLabel
																							code={
																								firstSegment?.Origin?.Airport
																									?.AirportCode ||
																								firstSegment?.Origin?.Airport
																									?.CityCode ||
																								"N/A"
																							}
																							city={
																								firstSegment?.Origin?.Airport
																									?.CityName
																							}
																						/>
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
																							lastSegment?.Destination
																								?.ArrTime ||
																								lastSegment?.ArrivalTime,
																						)}
																					</div>
																					<div className="text-sm font-medium text-gray-600 mt-1">
																						<AirportCodeLabel
																							code={
																								lastSegment?.Destination?.Airport
																									?.AirportCode ||
																								lastSegment?.Destination?.Airport
																									?.CityCode ||
																								"N/A"
																							}
																							city={
																								lastSegment?.Destination?.Airport
																									?.CityName
																							}
																						/>
																					</div>
																					{/* Show +1 day if needed - simplified check */}
																					{firstSegment?.Origin?.DepTime &&
																						lastSegment?.Destination?.ArrTime &&
																						new Date(
																							lastSegment.Destination.ArrTime,
																						).getDate() !==
																							new Date(
																								firstSegment.Origin.DepTime,
																							).getDate() && (
																							<span className="text-[10px] text-red-500 absolute ml-1">
																								+1
																							</span>
																						)}
																				</div>
																			</div>
																		);
																	},
																)}

																{/* Features Available: Seat Map & SSR */}
																{(() => {
																	// Get SSR info from the first segment
																	const firstSegment =
																		flight.Segments?.[0]?.[0];
																	const hasBaggage = firstSegment?.Baggage;
																	const hasCabinBaggage =
																		firstSegment?.CabinBaggage;

																	// Check seat map availability for AIRiQ flights
																	const hasSeatMap =
																		(
																			flight as FlightResult & {
																				_airiqSeatMapAvailable?: boolean;
																			}
																		)?._airiqSeatMapAvailable === true;

																	// Check if any features are available
																	if (
																		hasSeatMap ||
																		hasBaggage ||
																		hasCabinBaggage
																	) {
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
																						0,
																					);
																					return formatTravelPriceInr(
																					breakdown.publishedFare,
																				);
																				})()}
																			</div>
																			{/* Fare Class (RBD) */}
																			<div className="text-xs text-gray-500 mt-1">
																				Class:{" "}
																				{
																					flight.Segments[0][0].Airline
																						.FareClass
																				}
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
																							: flight.ResultIndex,
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
																	onClick={async () => {
																		const values = form.getValues();

																		// Capture snapshot of flight selection (non-blocking)
																		try {
																			const firstSegment =
																				flight.Segments?.[0]?.[0];
																			const origin = firstSegment?.Origin;
																			const destination =
																				firstSegment?.Destination;
																			const originCode =
																				origin?.Airport?.AirportCode ||
																				(origin as { AirportCode?: string })
																					?.AirportCode;
																			const destCode =
																				destination?.Airport?.AirportCode ||
																				(
																					destination as {
																						AirportCode?: string;
																					}
																				)?.AirportCode;
																			const departureTime =
																				origin?.DepTime ||
																				(
																					firstSegment as {
																						DepartureTime?: string;
																					}
																				)?.DepartureTime;
																			const arrivalTime =
																				destination?.ArrTime ||
																				(
																					firstSegment as {
																						ArrivalTime?: string;
																					}
																				)?.ArrivalTime;
																			const cabinClass =
																				(
																					firstSegment as {
																						CabinClass?: string;
																					}
																				)?.CabinClass ||
																				(flight.Fare as { CabinClass?: string })
																					?.CabinClass;
																			// Fix: Property 'Refundable' does not exist on type 'Fare'.
																			// Some APIs may expose 'Refundable', so we fallback gracefully, otherwise use 'non-refundable' if undefined
																			let refundType = "non-refundable";
																			if ("Refundable" in (flight.Fare ?? {})) {
																				const refundable = (
																					flight.Fare as {
																						Refundable?: boolean;
																					}
																				)?.Refundable;
																				refundType = refundable
																					? "refundable"
																					: "non-refundable";
																			}

																			await captureAndSendSnapshot(
																				{
																					origin: originCode,
																					destination: destCode,
																					airline: flight.AirlineCode,
																					flightNumber: (
																						firstSegment as {
																							FlightNumber?: string;
																						}
																					)?.FlightNumber,
																					departureTime,
																					arrivalTime,
																					fare: flight.Fare?.OfferedFare,
																					cabinClass,
																					refundType,
																					passengers: {
																						adults: values.adults,
																						children: values.children,
																						infants: values.infants,
																					},
																					flightDetails: flight,
																				},
																				{
																					page: "flight_results",
																					user: {
																						ip: undefined, // Will be captured server-side
																						userAgent: undefined, // Will be captured server-side
																					},
																					booking: {
																						type: "flight",
																						traceId: traceId,
																						resultIndex: flight.ResultIndex,
																					},
																				},
																			);
																		} catch (_error) {
																			// Silently fail - don't block user flow
																		}

																		// Log flight selection (non-blocking)
																		try {
																			const firstSegment =
																				flight.Segments?.[0]?.[0];
																			const origin = firstSegment?.Origin;
																			const destination =
																				firstSegment?.Destination;
																			await fetch("/api/travel/log-selection", {
																				method: "POST",
																				headers: {
																					"Content-Type": "application/json",
																				},
																				body: JSON.stringify({
																					logType: "flight",
																					action: "selection",
																					provider: flight.ApiSource || "TBO",
																					flightData: {
																						origin:
																							origin?.Airport?.AirportCode ||
																							(
																								origin as {
																									AirportCode?: string;
																								}
																							)?.AirportCode,
																						destination:
																							destination?.Airport
																								?.AirportCode ||
																							(
																								destination as {
																									AirportCode?: string;
																								}
																							)?.AirportCode,
																						airline: flight.AirlineCode,
																						flightNumber: (
																							firstSegment as {
																								FlightNumber?: string;
																							}
																						)?.FlightNumber,
																						cabinClass:
																							(
																								firstSegment as {
																									CabinClass?: string;
																								}
																							)?.CabinClass ||
																							(
																								flight.Fare as {
																									CabinClass?: string;
																								}
																							)?.CabinClass,
																						departureDate:
																							origin?.DepTime ||
																							(
																								firstSegment as {
																									DepartureTime?: string;
																								}
																							)?.DepartureTime,
																						adultCount: values.adults,
																						childCount: values.children,
																						infantCount: values.infants,
																						totalFare: flight.Fare?.OfferedFare,
																						totalTax: flight.Fare?.Tax,
																					},
																					traceId: traceId,
																					resultIndex: flight.ResultIndex,
																				}),
																			}).catch(() => {}); // Silently fail
																		} catch (_error) {
																			// Silently fail - don't block user flow
																		}

																		// TripJack domestic multicity: pick one fare per leg, then continue
																		if (
																			tripType === "multi-city" &&
																			multicityDomesticLegs &&
																			multicityDomesticLegs.length >= 2 &&
																			flight.ApiSource === "TRIPJACK"
																		) {
																			const nextSelections = [
																				...multicitySelections,
																			];
																			nextSelections[multicityActiveLeg] =
																				flight;
																			setMulticitySelections(nextSelections);
																			if (
																				multicityActiveLeg <
																				multicityDomesticLegs.length - 1
																			) {
																				const nextLeg =
																					multicityActiveLeg + 1;
																				setMulticityActiveLeg(nextLeg);
																				setFlights(
																					multicityDomesticLegs[nextLeg] ||
																						[],
																				);
																				toast.success(
																					`Leg ${multicityActiveLeg + 1} selected. Choose leg ${nextLeg + 1}.`,
																				);
																			} else {
																				toast.success(
																					"All legs selected. Tap Continue to booking.",
																				);
																			}
																			return;
																		}

																		// If multicity (COMBO/intl) or no upsell - go straight to booking
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
																				journeyType: values.journeyType,
																			});
																			if (flight.IsUpsellAllowed === true) {
																				params.append(
																					"isUpsellAllowed",
																					"true",
																				);
																			}
																			if (
																				flight.ReturnResultIndex &&
																				values.journeyType !== "5"
																			) {
																				params.append(
																					"returnResultIndex",
																					flight.ReturnResultIndex,
																				);
																			}
																			router.push(
																				`/travel-portal/book?${params.toString()}`,
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
																			0,
																		);
																		return (
																			<div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2 border border-gray-100">
																				<div className="flex justify-between text-gray-600">
																					<span>Base Fare</span>
																					<span className="font-medium text-gray-900">
																						{flight.Fare.Currency}{" "}
																						{formatTravelPriceInr(
																							breakdown.baseFare,
																						)}
																					</span>
																				</div>
																				<div className="flex justify-between text-gray-600">
																					<span>Tax & Charges</span>
																					<span className="font-medium text-gray-900">
																						{flight.Fare.Currency}{" "}
																						{formatTravelPriceInr(
																							breakdown.tax +
																								breakdown.gst.total +
																								breakdown.otherCharges,
																						)}
																					</span>
																				</div>
																				<Separator className="my-2" />
																				<div className="flex justify-between font-bold text-lg text-primary">
																					<span>Total Amount</span>
																					<span className="flex items-center">
																						<IndianRupee className="h-4 w-4 mr-1" />
																						{formatTravelPriceInr(
																							breakdown.publishedFare,
																						)}
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
											{(visibleFlightCount < filteredFlights.length ||
												(flightSearchSessionId != null &&
													serverFlightTotal != null &&
													flights.length < serverFlightTotal)) && (
												<div
													ref={flightListSentinelRef}
													className="flex justify-center py-6"
												>
													<Loader2
														className={`h-6 w-6 text-orange-500 ${loadingMoreFlights ? "animate-spin" : ""}`}
													/>
												</div>
											)}
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</div>
				)}

				{/* Empty final state */}
				{searchPerformed && !hasPendingProviders && flights.length === 0 && (
					<Card>
						<CardContent className="py-10">
							<div className="text-center space-y-3">
								<p className="text-muted-foreground">
									No flights found. Please try different dates or routes.
								</p>
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										void handleAutoSearch(form.getValues(), {
											forceRefresh: true,
										});
									}}
								>
									Search Again
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
