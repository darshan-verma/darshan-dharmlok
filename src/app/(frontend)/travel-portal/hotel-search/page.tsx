"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HotelSearchForm, {
	HotelSearchData,
} from "@/components/travel-portal/HotelSearchForm";
import HotelFilters, {
	FilterState,
} from "@/components/travel-portal/HotelFilters";
import HotelCard from "@/components/travel-portal/HotelCard";
import MinimalHotelSearch from "@/components/travel-portal/MinimalHotelSearch";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Timer } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { HotelSearchResponse, HotelResult } from "@/types/hotelApi";
import type { TripjackHotelListingResponse } from "@/types/tripjack";
import {
	hotelCache,
	lastSearch,
	generateCacheKey,
	HOTEL_CACHE_EXPIRY,
} from "@/lib/searchCache";
import { useSearchSession } from "@/hooks/useSearchSession";

/** Faster first paint: aggressive caps, never block UI on image APIs */
const INITIAL_HOTEL_DISPLAY = 25;
const HOTEL_SCROLL_CHUNK = 25;
const TBO_HOTEL_SEARCH_CAP = 60;
const TRIPJACK_HID_CAP = 100;
const TRIPJACK_LISTING_BATCH_CAP = 2;
const BACKGROUND_IMAGE_CHUNK = 25;
const BACKGROUND_IMAGE_PACE_MS = 300;
/** Above-the-fold image static-detail/detail calls; rest deferred */
const IMAGE_PREFETCH_FIRST_WAVE = 8;
const IMAGE_PREFETCH_SECOND_WAVE_DELAY_MS = 1000;
const SKELETON_INITIAL_ROWS = 8;
const SKELETON_TRIPJACK_PENDING_ROWS = 2;

function minRoomPrice(hotel: HotelResult): number {
	return hotel.Rooms.reduce(
		(min, room) => Math.min(min, room.TotalFare + room.TotalTax),
		Infinity,
	);
}

/** Same grouping, filter, and sort as the results useEffect — used for image prefetch ordering. */
function computeFilteredHotelResults(
	raw: HotelResult[],
	filters: FilterState,
	sortBy: string,
	specificHotelCode: string | null,
): HotelResult[] {
	let results = [...raw];
	if (specificHotelCode) {
		results = results.filter(
			(hotel) => String(hotel.HotelCode) === specificHotelCode,
		);
	}

	const hotelMap = new Map<string, HotelResult>();
	results.forEach((hotel) => {
		const hotelCode = String(hotel.HotelCode);
		if (!hotelMap.has(hotelCode)) {
			hotelMap.set(hotelCode, hotel);
		} else {
			const existing = hotelMap.get(hotelCode)!;
			existing.Rooms = [...existing.Rooms, ...hotel.Rooms];
		}
	});

	let grouped = Array.from(hotelMap.values());

	grouped = grouped.filter((hotel) => {
		const hotelPrice = minRoomPrice(hotel);
		if (
			hotelPrice < filters.priceRange[0] ||
			hotelPrice > filters.priceRange[1]
		) {
			return false;
		}
		if (filters.refundable) {
			const hasRefundableRoom = hotel.Rooms.some((room) => room.IsRefundable);
			if (!hasRefundableRoom) return false;
		}
		if (filters.mealTypes.length > 0) {
			const hasMealType = hotel.Rooms.some((room) =>
				filters.mealTypes.includes(room.MealType),
			);
			if (!hasMealType) return false;
		}
		return true;
	});

	grouped.sort((a, b) => {
		const priceA = minRoomPrice(a);
		const priceB = minRoomPrice(b);
		switch (sortBy) {
			case "price-low":
				return priceA - priceB;
			case "price-high":
				return priceB - priceA;
			default:
				return 0;
		}
	});

	return grouped;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		out.push(arr.slice(i, i + size));
	}
	return out;
}

const HOTEL_UI_SNAPSHOT_KEY = "hotelSearchUiSnapshot.v1";
const HOTEL_HYDRATION_SNAPSHOT_KEY = "hotelSearchHydration.v1";
const SNAPSHOT_VERSION = 1;

type HotelUiSnapshot = {
	version: number;
	cacheKey: string;
	scrollY: number;
	displayCount: number;
	sortBy: string;
	filters: FilterState;
	specificHotelCode: string | null;
	savedAt: number;
};

type HotelHydrationSnapshot = {
	version: number;
	cacheKey: string;
	savedAt: number;
	hotelImageMap: Record<string, string>;
	hotelDetailsMap: Record<
		string,
		{
			HotelName?: string;
			CityName?: string;
			CountryName?: string;
			HotelRating?: string | number;
			Images?: string | string[];
		}
	>;
};

function HotelSearchContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const [searchResults, setSearchResults] =
		useState<HotelSearchResponse | null>(null);
	const [filteredResults, setFilteredResults] = useState<HotelResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	/** TBO shown; TripJack listing still in flight */
	const [isTripjackPending, setIsTripjackPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<string>("price-low");
	/** Same correlationId for all TripJack listing batches; passed through to details → pricing → review */
	const [tripjackListingCorrelationId, setTripjackListingCorrelationId] =
		useState<string | null>(null);
	// Store hotel details fetched from HotelDetails API
	const [hotelDetailsMap, setHotelDetailsMap] = useState<
		Record<
			string,
			{
				HotelName?: string;
				CityName?: string;
				CountryName?: string;
				HotelRating?: string | number;
				Images?: string | string[];
			}
		>
	>({});
	const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
	const [hotelImageMap, setHotelImageMap] = useState<Record<string, string>>({});
	const hotelCardImageCacheRef = useRef<Map<string, string>>(new Map());
	/** First successful card URL per hotel; prevents src swapping (flicker) as details/map update */
	const stableCardImageUrlRef = useRef<Map<string, string>>(new Map());
	const [displayCount, setDisplayCount] = useState(INITIAL_HOTEL_DISPLAY);
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const hasLoadedCacheRef = React.useRef(false);
	const currentCacheKeyRef = useRef<string | null>(null);
	const restoreScrollYRef = useRef<number | null>(null);
	const hasRestoredScrollRef = useRef(false);
	const restoreDisplayCountRef = useRef<number | null>(null);
	const isRestoringSnapshotRef = useRef(false);

	// Search session countdown (TripJack sessions last ~15 min)
	const {
		isExpired,
		isWarning,
		formattedTime,
		startSession,
		clearSession,
		isActive: sessionActive,
	} = useSearchSession();

	// Scroll state for sticky header
	const [showMinimalHeader, setShowMinimalHeader] = useState(false);
	const searchFormRef = useRef<HTMLDivElement>(null);

	// Filter state
	const [filters, setFilters] = useState<FilterState>({
		priceRange: [0, 50000],
		starRatings: [],
		mealTypes: [],
		refundable: false,
	});

	// Search parameters from URL
	const [specificHotelCode, setSpecificHotelCode] = useState<string | null>(
		searchParams.get("hotelCode"),
	);

	const [searchData, setSearchData] = useState<HotelSearchData | null>(() => {
		const location = searchParams.get("location");
		const locationCode = searchParams.get("locationCode");
		const checkIn = searchParams.get("checkIn");
		const checkOut = searchParams.get("checkOut");
		// Support both URL schemas:
		// - New: rooms/adults/children
		// - Legacy: noOfRooms + room{n}Adults + room{n}Children
		const roomsParam = searchParams.get("rooms") ?? searchParams.get("noOfRooms");
		const adultsParam = searchParams.get("adults");
		const childrenParam = searchParams.get("children");

		if (location && checkIn && checkOut) {
			const roomsCount = parseInt(roomsParam || "1");
			const isFiniteRooms = Number.isFinite(roomsCount) && roomsCount > 0;
			const safeRooms = isFiniteRooms ? roomsCount : 1;

			// If totals aren't present, derive totals from per-room params (room0Adults, room0Children, ...)
			let derivedAdults = 0;
			let derivedChildren = 0;
			for (let i = 0; i < safeRooms; i++) {
				const a = parseInt(searchParams.get(`room${i}Adults`) || "0");
				const c = parseInt(searchParams.get(`room${i}Children`) || "0");
				derivedAdults += Number.isFinite(a) ? a : 0;
				derivedChildren += Number.isFinite(c) ? c : 0;
			}

			const adultsTotal =
				adultsParam !== null
					? parseInt(adultsParam || "2")
					: derivedAdults > 0
						? derivedAdults
						: 2;
			const childrenTotal =
				childrenParam !== null
					? parseInt(childrenParam || "0")
					: derivedChildren > 0
						? derivedChildren
						: 0;

			return {
				location,
				cityCode: locationCode || undefined,
				checkIn: new Date(checkIn),
				checkOut: new Date(checkOut),
				rooms: safeRooms,
				adults: Number.isFinite(adultsTotal) && adultsTotal > 0 ? adultsTotal : 1,
				children:
					Number.isFinite(childrenTotal) && childrenTotal >= 0 ? childrenTotal : 0,
			};
		}
		return null;
	});

	// Scroll detection for sticky minimal header
	useEffect(() => {
		const handleScroll = () => {
			if (searchFormRef.current) {
				const rect = searchFormRef.current.getBoundingClientRect();
				// Show minimal header when search form is scrolled past (top is above viewport)
				setShowMinimalHeader(rect.top < -50);
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll(); // Initial check

		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Handler to scroll back to search form
	const scrollToSearch = () => {
		searchFormRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	// Helper function to format dates
	const formatDate = (date: Date | string) => {
		const d = typeof date === "string" ? new Date(date) : date;
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	const normalizeImageUrl = (value: unknown): string | undefined => {
		if (typeof value !== "string") return undefined;
		const trimmed = value.trim();
		if (!trimmed) return undefined;
		if (trimmed.startsWith("//")) return `https:${trimmed}`;
		if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
			return trimmed;
		}
		return undefined;
	};

	const pickImageFromUnknown = (value: unknown): string | undefined => {
		const normalizedDirect = normalizeImageUrl(value);
		if (normalizedDirect) return normalizedDirect;
		if (!value || typeof value !== "object") return undefined;

		const record = value as Record<string, unknown>;
		for (const key of ["href", "url", "link", "image", "img", "thumbnail"]) {
			const normalized = normalizeImageUrl(record[key]);
			if (normalized) return normalized;
		}

		const links = record.links;
		if (links && typeof links === "object" && !Array.isArray(links)) {
			const linkValues = Object.values(links as Record<string, unknown>);
			for (const item of linkValues) {
				const fromLink = pickImageFromUnknown(item);
				if (fromLink) return fromLink;
			}
		}

		for (const key of ["images", "photos", "imageUrls"]) {
			const list = record[key];
			if (!Array.isArray(list)) continue;
			for (const item of list) {
				const fromItem = pickImageFromUnknown(item);
				if (fromItem) return fromItem;
			}
		}

		return undefined;
	};

	const loadUiSnapshot = (): HotelUiSnapshot | null => {
		try {
			const raw = localStorage.getItem(HOTEL_UI_SNAPSHOT_KEY);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as HotelUiSnapshot;
			const isStale = Date.now() - parsed.savedAt >= HOTEL_CACHE_EXPIRY;
			if (
				parsed.version !== SNAPSHOT_VERSION ||
				!parsed.cacheKey ||
				isStale ||
				typeof parsed.displayCount !== "number"
			) {
				localStorage.removeItem(HOTEL_UI_SNAPSHOT_KEY);
				return null;
			}
			return parsed;
		} catch {
			localStorage.removeItem(HOTEL_UI_SNAPSHOT_KEY);
			return null;
		}
	};

	const loadHydrationSnapshot = (
		expectedCacheKey: string,
	): HotelHydrationSnapshot | null => {
		try {
			const raw = localStorage.getItem(HOTEL_HYDRATION_SNAPSHOT_KEY);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as HotelHydrationSnapshot;
			const isStale = Date.now() - parsed.savedAt >= HOTEL_CACHE_EXPIRY;
			if (
				parsed.version !== SNAPSHOT_VERSION ||
				parsed.cacheKey !== expectedCacheKey ||
				isStale
			) {
				localStorage.removeItem(HOTEL_HYDRATION_SNAPSHOT_KEY);
				return null;
			}
			return parsed;
		} catch {
			localStorage.removeItem(HOTEL_HYDRATION_SNAPSHOT_KEY);
			return null;
		}
	};

	const persistUiSnapshot = (scrollYOverride?: number) => {
		const cacheKey = currentCacheKeyRef.current;
		if (!cacheKey) return;
		try {
			const snapshot: HotelUiSnapshot = {
				version: SNAPSHOT_VERSION,
				cacheKey,
				scrollY:
					typeof scrollYOverride === "number"
						? scrollYOverride
						: window.scrollY || 0,
				displayCount: Math.max(INITIAL_HOTEL_DISPLAY, displayCount),
				sortBy,
				filters,
				specificHotelCode,
				savedAt: Date.now(),
			};
			localStorage.setItem(HOTEL_UI_SNAPSHOT_KEY, JSON.stringify(snapshot));
		} catch {
			// no-op
		}
	};

	// Normalize TripJack listing response into HotelResult[] compatible with HotelCard
	const normalizeTripjackResults = (
		response: TripjackHotelListingResponse,
	): HotelResult[] => {
		return response.hotels.map((hotel) => ({
			HotelCode: hotel.tjHotelId || hotel.hotelId || "",
			Currency: response.currency,
			HotelName: hotel.name || undefined,
			HotelImage: pickImageFromUnknown(hotel),
			source: "TRIPJACK" as const,
			Rooms: hotel.options.map((option) => ({
				Name: option.roomInfo.map((r) => r.name),
				BookingCode: option.optionId,
				Inclusion: option.inclusions.join(", "),
				DayRates: [],
				TotalFare: option.pricing.basePrice,
				TotalTax: option.pricing.taxes + option.pricing.mf + option.pricing.mft,
				RoomID: option.roomInfo.map((r) => r.id),
				RoomPromotion: [],
				CancelPolicies: [],
				MealType: option.mealBasis.replace(/ /g, "_"),
				IsRefundable: option.cancellation.isRefundable,
				Supplements: [],
				WithTransfers: false,
			})),
		}));
	};

	// Perform search
	const performSearch = async (data: HotelSearchData, forceRefresh = false) => {
		setIsLoading(true);
		setIsTripjackPending(false);
		setError(null);
		clearSession();
		setTripjackListingCorrelationId(null);
		stableCardImageUrlRef.current.clear();

		try {
			// Generate cache key
			const cacheKey = await generateCacheKey({
				cityCode: data.cityCode,
				checkIn: formatDate(data.checkIn),
				checkOut: formatDate(data.checkOut),
				rooms: data.rooms,
				adults: data.adults,
				children: data.children,
			});
			currentCacheKeyRef.current = cacheKey;

			// Check cache (unless forced refresh)
			if (!forceRefresh) {
				const cached = hotelCache.get(cacheKey);
				if (cached) {
					stableCardImageUrlRef.current.clear();
					const results = cached.results as HotelSearchResponse | null;
					setSearchResults(results);
					const hotelResults =
						results?.HotelResult || (Array.isArray(results) ? results : []);
					setFilteredResults(Array.isArray(hotelResults) ? hotelResults : []);
					if (Array.isArray(hotelResults) && hotelResults.length > 0) {
						// Image fetch is handled by the filteredResults useEffect
					}
					setIsLoading(false);
					setError(null);
					// Intentionally skip hotel static detail prefetch on cached results.
					startSession();
					return;
				}
			}
			console.log(
				"🔍 Starting hotel search for:",
				data.location,
				"with cityCode:",
				data.cityCode,
			);

			if (!data.cityCode) {
				console.log("❌ No cityCode provided");
				setError("Please select a city from the suggestions");
				setIsLoading(false);
				return;
			}

			// Prepare room config for both APIs
			const adultsPerRoom = Math.floor(data.adults / data.rooms);
			const childrenPerRoom = Math.floor(data.children / data.rooms);
			const paxRooms = Array(data.rooms)
				.fill(null)
				.map(() => ({
					Adults: adultsPerRoom || 1,
					Children: childrenPerRoom,
					ChildrenAges: Array(childrenPerRoom).fill(5),
				}));

			// ── Fetch city data (shared by TBO + TripJack) ───────────────────────
			const cityDetailsResponse = await fetch("/api/travel/hotel-search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type: "city", code: data.cityCode }),
			});
			const cityDetailsData = await cityDetailsResponse.json();
			console.log("🏨 City hotels response:", cityDetailsData);

			// ── TBO search ────────────────────────────────────────────────────────
			const tboSearchPromise = (async () => {
				if (!cityDetailsData.success || !cityDetailsData.data?.hotels?.length) {
					return [];
				}

				const hotels = cityDetailsData.data.hotels.slice(0, TBO_HOTEL_SEARCH_CAP);
				const hotelCodes = hotels
					.map((h: { hotelCode: string }) => h.hotelCode)
					.join(",");

				const hotelSearchResponse = await fetch("/api/travel/hotel/search", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						checkIn: formatDate(data.checkIn),
						checkOut: formatDate(data.checkOut),
						hotelCodes,
						guestNationality: "IN",
						rooms: paxRooms.map((room) => ({
							adults: room.Adults,
							children: room.Children,
							childrenAges: room.ChildrenAges,
						})),
						isDetailedResponse: true,
						filters: {},
					}),
				});

				const result = await hotelSearchResponse.json();
				if (!result.success) return [];

				// Validate status
				if (result.data?.Status) {
					const statusCode = result.data.Status.Code;
					const description = (
						result.data.Status.Description || ""
					).toLowerCase();
					const isSuccess =
						statusCode === 1 ||
						statusCode === 0 ||
						(statusCode === 200 &&
							(description.includes("success") ||
								description === "successful"));
					if (!isSuccess) return [];
				}

				if (
					result.data?.HotelResult &&
					Array.isArray(result.data.HotelResult)
				) {
					return result.data.HotelResult as HotelResult[];
				}
				return [];
			})();

			// ── TripJack search ───────────────────────────────────────────────────
			const tripjackSearchPromise = (async (): Promise<HotelResult[]> => {
				const tjHidsAll: string[] = cityDetailsData.data?.tripjackHids ?? [];
				const tjHids = tjHidsAll.slice(0, TRIPJACK_HID_CAP);
				if (tjHids.length === 0) {
					console.log("ℹ️ No TripJack hotel IDs for city:", data.cityCode);
					return [];
				}

				const tjRooms = paxRooms.map((room) => ({
					adults: room.Adults,
					...(room.Children > 0 && {
						children: room.Children,
						childAge: room.ChildrenAges,
					}),
				}));

				// Batch into groups of 100 (TripJack limit); cap parallel listing calls
				const batches: string[][] = [];
				for (let i = 0; i < tjHids.length; i += 100) {
					batches.push(tjHids.slice(i, i + 100));
				}

				console.log(
					`🔍 TripJack: ${tjHids.length} hotel IDs (capped) in ${batches.length} batch(es), running ${Math.min(batches.length, TRIPJACK_LISTING_BATCH_CAP)} listing request(s)`,
				);

				const listingCorrelationSeed = crypto.randomUUID();
				const batchResults = await Promise.all(
					batches.slice(0, TRIPJACK_LISTING_BATCH_CAP).map(async (batchHids) => {
						const response = await fetch("/api/travel/tripjack-hotel/listing", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								checkIn: formatDate(data.checkIn),
								checkOut: formatDate(data.checkOut),
								rooms: tjRooms,
								currency: "INR",
								nationality: "106",
								hids: batchHids,
								correlationId: listingCorrelationSeed,
							}),
						});

						if (!response.ok)
							return { hotels: [] as HotelResult[], correlationId: undefined };
						const raw = (await response.json()) as unknown;

						// TripJack sometimes varies response envelope; accept a few common shapes.
						const result =
							(raw &&
								typeof raw === "object" &&
								"hotels" in (raw as Record<string, unknown>)) ||
							(raw && typeof raw === "object" && "status" in (raw as Record<string, unknown>))
								? (raw as TripjackHotelListingResponse)
								: (raw as { data?: TripjackHotelListingResponse })?.data;

						const statusSuccess =
							(result as TripjackHotelListingResponse | undefined)?.status?.success ??
							(raw as { success?: boolean })?.success ??
							false;
						const hotels =
							(result as TripjackHotelListingResponse | undefined)?.hotels ??
							(raw as { hotels?: TripjackHotelListingResponse["hotels"] })?.hotels ??
							[];

						if (!statusSuccess || !Array.isArray(hotels) || hotels.length === 0) {
							return { hotels: [] as HotelResult[], correlationId: undefined };
						}

						const listingTyped = result as TripjackHotelListingResponse;
						return {
							hotels: normalizeTripjackResults({
								...listingTyped,
								hotels,
							}),
							correlationId: listingTyped.correlationId,
						};
					}),
				);

				const allTjResults = batchResults.flatMap((b) => b.hotels);
				const correlationFromListing = batchResults.find(
					(b) => b.correlationId,
				)?.correlationId;
				if (allTjResults.length > 0) {
					setTripjackListingCorrelationId(
						correlationFromListing || listingCorrelationSeed,
					);
				}
				console.log(`✅ TripJack: ${allTjResults.length} hotels found`);
				return allTjResults;
			})();

			// ── TBO first (non-blocking TripJack): listings start in parallel, but we
			//    only await TBO so the UI can render without waiting for TripJack.
			const tboResults = await tboSearchPromise.catch((err) => {
				console.error("❌ TBO search error:", err);
				return [] as HotelResult[];
			});

			const cachePayload = {
				timestamp: Date.now(),
				searchData: {
					location: data.location,
					cityCode: data.cityCode,
					checkIn: formatDate(data.checkIn),
					checkOut: formatDate(data.checkOut),
					rooms: data.rooms,
					adults: data.adults,
					children: data.children,
				},
			};

			const applyMergedResults = (mergedResults: HotelResult[]) => {
				const syntheticResponse: HotelSearchResponse = {
					Status: { Code: 1, Description: "Successful" },
					HotelResult: mergedResults,
				};
				const visibleList = computeFilteredHotelResults(
					mergedResults,
					filters,
					sortBy,
					specificHotelCode,
				);
				setSearchResults(syntheticResponse);
				setFilteredResults(visibleList);
				setError(null);
				startSession();
				hotelCache.set(cacheKey, {
					results: syntheticResponse,
					...cachePayload,
				});
				lastSearch.save("hotel", {
					location: data.location,
					cityCode: data.cityCode,
					checkIn: formatDate(data.checkIn),
					checkOut: formatDate(data.checkOut),
					rooms: data.rooms,
					adults: data.adults,
					children: data.children,
				});
				persistUiSnapshot(0);
				scheduleProgressiveHotelCardImages(visibleList);
			};

			if (tboResults.length > 0) {
				console.log(
					`📊 TBO first: ${tboResults.length} hotels — showing now; TripJack loading in background`,
				);
				setIsTripjackPending(true);
				applyMergedResults([...tboResults]);

				void tripjackSearchPromise
					.then((tripjackResults) => {
						setIsTripjackPending(false);
						const mergedResults = [...tboResults, ...tripjackResults];
						console.log(
							`📊 Merged: TBO ${tboResults.length} + TripJack ${tripjackResults.length} hotels`,
						);
						applyMergedResults(mergedResults);
					})
					.catch((err) => {
						setIsTripjackPending(false);
						console.error("❌ TripJack search error:", err);
					});
			} else {
				const tripjackResults = await tripjackSearchPromise.catch((err) => {
					console.error("❌ TripJack search error:", err);
					return [] as HotelResult[];
				});
				setIsTripjackPending(false);
				console.log(`📊 TBO empty; TripJack: ${tripjackResults.length} hotels`);

				if (tripjackResults.length === 0) {
					setError(
						"No hotels available for the selected dates and criteria. Please try different dates or adjust your search.",
					);
				} else {
					applyMergedResults(tripjackResults);
				}
			}
		} catch (err) {
			console.error("❌ Search error:", err);
			setError(
				err instanceof Error
					? err.message
					: "An error occurred while searching",
			);
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch hotel details in batches
	const fetchHotelDetailsBatch = async (hotels: HotelResult[]) => {
		// Get unique hotel codes (convert to strings for consistency)
		const uniqueHotelCodes = Array.from(
			new Set(hotels.map((h) => String(h.HotelCode))),
		);

		// Filter out hotels we already have details for
		const hotelCodesToFetch = uniqueHotelCodes.filter(
			(code) => !hotelDetailsMap[code] && !loadingDetails.has(code),
		);

		if (hotelCodesToFetch.length === 0) {
			console.log("✅ All hotel details already cached");
			return;
		}

		console.log(
			`🔄 Fetching hotel details for ${hotelCodesToFetch.length} hotels...`,
		);

		// Build a map of hotelCode → source for quick lookup
		const sourceMap = new Map<string, "TBO" | "TRIPJACK">();
		hotels.forEach((h) => {
			sourceMap.set(String(h.HotelCode), h.source ?? "TBO");
		});

		const batchSize = 5;

		for (let i = 0; i < hotelCodesToFetch.length; i += batchSize) {
			const batch = hotelCodesToFetch.slice(i, i + batchSize);

			setLoadingDetails((prev) => {
				const newSet = new Set(prev);
				batch.forEach((code) => newSet.add(code));
				return newSet;
			});

			const detailsPromises = batch.map(async (hotelCode) => {
				const source = sourceMap.get(hotelCode) ?? "TBO";
				let timeoutId: NodeJS.Timeout | null = null;
				try {
					const controller = new AbortController();
					timeoutId = setTimeout(() => controller.abort(), 15000);

					if (source === "TRIPJACK") {
						// ── TripJack static detail ──────────────────────────────────
						const response = await fetch(
							`/api/travel/tripjack-hotel/static-detail`,
							{
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ hid: hotelCode }),
								signal: controller.signal,
							},
						);
						if (timeoutId) clearTimeout(timeoutId);
						if (!response.ok) throw new Error(`HTTP ${response.status}`);
						const result = await response.json();
						if (result.success && result.data) {
							const d = result.data;
							// Normalize to the same shape used by hotelDetailsMap
							const images: string[] = [];
							if (Array.isArray(d.images)) {
								for (const img of d.images) {
									const links =
										img && typeof img === "object" && "links" in img
											? (img.links as Record<string, unknown>)
											: {};
									const preferredOrder = [
										"xl",
										"l",
										"xxl",
										"original",
										"default",
										"m",
										"s",
										"thumbnail",
									];
									let href: string | undefined;
									for (const key of preferredOrder) {
										const candidate = links?.[key];
										const picked = pickImageFromUnknown(candidate);
										if (picked) {
											href = picked;
											break;
										}
									}
									if (!href) {
										const fallback = pickImageFromUnknown(img);
										if (fallback) href = fallback;
									}
									if (href) images.push(href);
								}
							}
							return {
								success: true,
								hotelCode,
								details: {
									HotelName: d.name,
									CityName: d.locale?.address?.city,
									CountryName: d.locale?.address?.countryname,
									HotelRating: d.star_rating,
									Images: images,
								},
							};
						}
						throw new Error(result.error || "No data");
					} else {
						// ── TBO static detail ───────────────────────────────────────
						const response = await fetch(
							`/api/travel/hotel/details?hotelCode=${hotelCode}&language=EN&isRoomDetailRequired=false`,
							{ signal: controller.signal },
						);
						if (timeoutId) clearTimeout(timeoutId);
						if (!response.ok)
							throw new Error(
								`HTTP ${response.status}: ${response.statusText}`,
							);
						const result = await response.json();
						if (result.success && result.data?.HotelDetails) {
							let hotelDetails = result.data.HotelDetails;
							if (Array.isArray(hotelDetails) && hotelDetails.length > 0) {
								hotelDetails = hotelDetails[0];
							}
							return {
								success: true,
								hotelCode: String(hotelCode),
								details: hotelDetails,
							};
						}
						throw new Error(result.error || "No hotel details in response");
					}
				} catch (error) {
					if (timeoutId) clearTimeout(timeoutId);
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					console.warn(
						`⚠️ Failed to fetch details for hotel ${hotelCode}:`,
						errorMessage,
					);
					return {
						success: false,
						hotelCode: String(hotelCode),
						error: errorMessage,
					};
				}
			});

			const detailsResults = await Promise.allSettled(detailsPromises);

			let successCount = 0;
			let failureCount = 0;

			setHotelDetailsMap((prev) => {
				const newMap = { ...prev };
				detailsResults.forEach((result) => {
					if (result.status === "fulfilled" && result.value.success) {
						const { hotelCode, details } = result.value;
						newMap[hotelCode] = details;
						successCount++;
					} else {
						failureCount++;
					}
				});
				return newMap;
			});

			console.log(
				`✅ Batch ${Math.floor(i / batchSize) + 1}: ${successCount} succeeded, ${failureCount} failed`,
			);

			setLoadingDetails((prev) => {
				const newSet = new Set(prev);
				batch.forEach((code) => newSet.delete(code));
				return newSet;
			});

			if (i + batchSize < hotelCodesToFetch.length) {
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		}

		console.log(
			`✅ Hotel details fetching completed for ${hotelCodesToFetch.length} hotels`,
		);
	};

	// Lightweight image prefetch for hotel search cards (both TBO + TripJack).
	// Accumulates all results and performs a single setHotelImageMap call per pass
	// to minimise re-renders. Uses a ref cache to avoid duplicate provider calls.
	const fetchHotelCardImagesBatch = async (
		hotels: HotelResult[],
		options?: { maxTargets?: number },
	) => {
		type CodeEntry = { code: string; source: "TBO" | "TRIPJACK" };

		const maxTargets = options?.maxTargets ?? 80;
		const seen = new Set<string>();
		const targets: CodeEntry[] = [];

		for (const h of hotels) {
			const code = String(h.HotelCode);
			if (seen.has(code)) continue;
			seen.add(code);
			if (hotelCardImageCacheRef.current.has(code)) continue;
			if (h.HotelImage && normalizeImageUrl(h.HotelImage)) continue;
			if (hotelDetailsMap[code]?.Images) continue;
			targets.push({ code, source: h.source ?? "TBO" });
		}

		const capped = targets.slice(0, maxTargets);
		if (capped.length === 0) return;

		const fetchImageForHotel = async (
			entry: CodeEntry,
		): Promise<{ code: string; image: string | undefined }> => {
			try {
				if (entry.source === "TRIPJACK") {
					const res = await fetch(
						"/api/travel/tripjack-hotel/static-detail",
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ hid: entry.code }),
						},
					);
					if (!res.ok) return { code: entry.code, image: undefined };
					const json = await res.json();
					if (!json?.success || !json?.data)
						return { code: entry.code, image: undefined };
					const d = json.data as { images?: unknown[] };
					if (Array.isArray(d.images)) {
						for (const img of d.images) {
							const found = pickImageFromUnknown(img);
							if (found) return { code: entry.code, image: found };
						}
					}
					return { code: entry.code, image: undefined };
				}

				const res = await fetch(
					`/api/travel/hotel/details?hotelCode=${encodeURIComponent(entry.code)}&language=EN&isRoomDetailRequired=false`,
				);
				if (!res.ok) return { code: entry.code, image: undefined };
				const json = await res.json();
				if (!json?.success) return { code: entry.code, image: undefined };
				let details = json.data?.HotelDetails;
				if (Array.isArray(details) && details.length > 0) details = details[0];
				if (!details) return { code: entry.code, image: undefined };
				const imgs = details.Images;
				if (typeof imgs === "string") {
					try {
						const parsed = JSON.parse(imgs);
						if (Array.isArray(parsed) && parsed.length > 0) {
							const url = normalizeImageUrl(parsed[0]);
							if (url) return { code: entry.code, image: url };
						}
					} catch {
						const url = normalizeImageUrl(imgs);
						if (url) return { code: entry.code, image: url };
					}
				} else if (Array.isArray(imgs) && imgs.length > 0) {
					const url = normalizeImageUrl(imgs[0]);
					if (url) return { code: entry.code, image: url };
				}
				return { code: entry.code, image: undefined };
			} catch {
				return { code: entry.code, image: undefined };
			}
		};

		const batchSize = 5;
		const accumulated: Record<string, string> = {};
		const failedEntries: CodeEntry[] = [];

		for (let i = 0; i < capped.length; i += batchSize) {
			const batch = capped.slice(i, i + batchSize);
			const results = await Promise.allSettled(
				batch.map((e) => fetchImageForHotel(e)),
			);

			for (let j = 0; j < results.length; j++) {
				const r = results[j];
				if (r.status === "fulfilled" && r.value.image) {
					accumulated[r.value.code] = r.value.image;
				} else {
					failedEntries.push(batch[j]);
				}
			}
		}

		if (Object.keys(accumulated).length > 0) {
			for (const [k, v] of Object.entries(accumulated)) {
				hotelCardImageCacheRef.current.set(k, v);
			}
			setHotelImageMap((prev) => ({ ...prev, ...accumulated }));
		}

		if (failedEntries.length > 0) {
			const retryAccumulated: Record<string, string> = {};
			const retryTargets = failedEntries.filter(
				(e) =>
					!accumulated[e.code] &&
					!hotelCardImageCacheRef.current.has(e.code),
			);
			for (let i = 0; i < retryTargets.length; i += batchSize) {
				const batch = retryTargets.slice(i, i + batchSize);
				const results = await Promise.allSettled(
					batch.map((e) => fetchImageForHotel(e)),
				);
				for (const r of results) {
					if (r.status === "fulfilled" && r.value.image) {
						retryAccumulated[r.value.code] = r.value.image;
					}
				}
			}
			if (Object.keys(retryAccumulated).length > 0) {
				for (const [k, v] of Object.entries(retryAccumulated)) {
					hotelCardImageCacheRef.current.set(k, v);
				}
				setHotelImageMap((prev) => ({ ...prev, ...retryAccumulated }));
			}
		}
	};

	/** Never block UI: small first wave of static image APIs, then rest after a delay, then paced remainder. */
	const scheduleProgressiveHotelCardImages = (visibleList: HotelResult[]) => {
		const top25 = visibleList.slice(0, INITIAL_HOTEL_DISPLAY);
		void fetchHotelCardImagesBatch(
			top25.slice(0, IMAGE_PREFETCH_FIRST_WAVE),
			{ maxTargets: IMAGE_PREFETCH_FIRST_WAVE },
		);
		window.setTimeout(() => {
			const secondWave = top25.slice(IMAGE_PREFETCH_FIRST_WAVE);
			if (secondWave.length === 0) return;
			void fetchHotelCardImagesBatch(secondWave, {
				maxTargets: secondWave.length,
			});
		}, IMAGE_PREFETCH_SECOND_WAVE_DELAY_MS);

		const remainder = visibleList.slice(INITIAL_HOTEL_DISPLAY);
		if (remainder.length === 0) return;
		void (async () => {
			for (const chunk of chunkArray(remainder, BACKGROUND_IMAGE_CHUNK)) {
				void fetchHotelCardImagesBatch(chunk, { maxTargets: chunk.length });
				await new Promise((r) => setTimeout(r, BACKGROUND_IMAGE_PACE_MS));
			}
		})();
	};

	// Initial search on mount if URL params exist OR load from cache on back navigation
	useEffect(() => {
		console.log("🔄 useEffect triggered, searchData:", searchData);
		if (hasLoadedCacheRef.current) return;
		hasLoadedCacheRef.current = true;

		const bootstrap = async () => {
			let effectiveSearchData = searchData;
			if (!effectiveSearchData) {
				const lastSearchParams = lastSearch.get("hotel") as {
					location?: string;
					cityCode?: string;
					checkIn?: string;
					checkOut?: string;
					rooms?: number;
					adults?: number;
					children?: number;
				} | null;
				if (lastSearchParams) {
					effectiveSearchData = {
						location: lastSearchParams.location || "",
						cityCode: lastSearchParams.cityCode || "",
						checkIn: lastSearchParams.checkIn
							? new Date(lastSearchParams.checkIn)
							: new Date(),
						checkOut: lastSearchParams.checkOut
							? new Date(lastSearchParams.checkOut)
							: new Date(),
						rooms: lastSearchParams.rooms || 1,
						adults: lastSearchParams.adults || 1,
						children: lastSearchParams.children || 0,
					};
					setSearchData(effectiveSearchData);
				}
			}
			if (!effectiveSearchData) return;

			const cacheKey = await generateCacheKey({
				cityCode: effectiveSearchData.cityCode,
				checkIn: formatDate(effectiveSearchData.checkIn),
				checkOut: formatDate(effectiveSearchData.checkOut),
				rooms: effectiveSearchData.rooms,
				adults: effectiveSearchData.adults,
				children: effectiveSearchData.children,
			});
			currentCacheKeyRef.current = cacheKey;

			const cached = hotelCache.get(cacheKey);
			const uiSnapshot = loadUiSnapshot();
			if (uiSnapshot && uiSnapshot.cacheKey === cacheKey) {
				isRestoringSnapshotRef.current = true;
				setSortBy(uiSnapshot.sortBy);
				setFilters(uiSnapshot.filters);
				setSpecificHotelCode(uiSnapshot.specificHotelCode);
				setDisplayCount(Math.max(INITIAL_HOTEL_DISPLAY, uiSnapshot.displayCount));
				restoreDisplayCountRef.current = Math.max(
					INITIAL_HOTEL_DISPLAY,
					uiSnapshot.displayCount,
				);
				restoreScrollYRef.current = Math.max(0, uiSnapshot.scrollY || 0);
			}
			const hydrationSnapshot = loadHydrationSnapshot(cacheKey);
			if (hydrationSnapshot) {
				setHotelImageMap(hydrationSnapshot.hotelImageMap || {});
				setHotelDetailsMap(hydrationSnapshot.hotelDetailsMap || {});
			}

			if (cached) {
				stableCardImageUrlRef.current.clear();
				const results = cached.results as HotelSearchResponse | null;
				setSearchResults(results);
				const hotelResults =
					results?.HotelResult || (Array.isArray(results) ? results : []);
				setFilteredResults(Array.isArray(hotelResults) ? hotelResults : []);
				setError(null);
				startSession();
				return;
			}

			await performSearch(effectiveSearchData);
		};
		void bootstrap();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Handle new search
	const handleSearch = async (data: HotelSearchData) => {
		console.log("🔍 handleSearch called with:", data);
		setSearchData(data);
		isRestoringSnapshotRef.current = false;
		hasRestoredScrollRef.current = false;
		restoreScrollYRef.current = null;
		restoreDisplayCountRef.current = null;
		setDisplayCount(INITIAL_HOTEL_DISPLAY);

		// Clear specific hotel filter when doing a new search
		setSpecificHotelCode(null);

		// Clear cache for this specific search to force fresh results
		const cacheKey = await generateCacheKey({
			cityCode: data.cityCode,
			checkIn: formatDate(data.checkIn),
			checkOut: formatDate(data.checkOut),
			rooms: data.rooms,
			adults: data.adults,
			children: data.children,
		});

		// Clear this specific cache entry to force fresh search
		hotelCache.clearKey(cacheKey);

		// Update URL
		const params = new URLSearchParams({
			location: data.location,
			checkIn: data.checkIn.toISOString().split("T")[0],
			checkOut: data.checkOut.toISOString().split("T")[0],
			rooms: data.rooms.toString(),
			adults: data.adults.toString(),
			children: data.children.toString(),
		});

		router.push(`/travel-portal/hotel-search?${params.toString()}`);
		performSearch(data, true); // Force refresh
	};

	// Apply filters and sorting - group hotels by hotel code
	useEffect(() => {
		if (!searchResults?.HotelResult) return;

		if (specificHotelCode) {
			const pre = [...searchResults.HotelResult].filter(
				(hotel) => String(hotel.HotelCode) === specificHotelCode,
			);
			console.log(
				`🎯 Filtering for specific hotel: ${specificHotelCode}, found ${pre.length} rows`,
			);
		}

		setFilteredResults(
			computeFilteredHotelResults(
				searchResults.HotelResult,
				filters,
				sortBy,
				specificHotelCode,
			),
		);
	}, [searchResults, filters, sortBy, specificHotelCode]);

	// Keep in-memory image cache aligned with persisted / hydrated map
	useEffect(() => {
		for (const [k, v] of Object.entries(hotelImageMap)) {
			if (typeof v === "string" && v) hotelCardImageCacheRef.current.set(k, v);
		}
	}, [hotelImageMap]);

	// Fetch images for current visible hotels
	useEffect(() => {
		if (filteredResults.length > 0) {
			const targetCount = Math.max(
				INITIAL_HOTEL_DISPLAY,
				restoreDisplayCountRef.current ?? displayCount,
			);
			void fetchHotelCardImagesBatch(filteredResults.slice(0, targetCount), {
				maxTargets: targetCount,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filteredResults]);

	// Fetch images for newly visible hotels when user scrolls
	const prevDisplayCountRef = useRef(INITIAL_HOTEL_DISPLAY);
	useEffect(() => {
		const prev = prevDisplayCountRef.current;
		prevDisplayCountRef.current = displayCount;
		if (displayCount > prev && filteredResults.length > prev) {
			void fetchHotelCardImagesBatch(
				filteredResults.slice(prev, displayCount),
				{ maxTargets: displayCount - prev },
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [displayCount]);

	useEffect(() => {
		if (!restoreScrollYRef.current || hasRestoredScrollRef.current) return;
		if (filteredResults.length === 0) return;
		const firstPass = requestAnimationFrame(() => {
			const secondPass = requestAnimationFrame(() => {
				window.scrollTo({ top: restoreScrollYRef.current || 0, behavior: "auto" });
				hasRestoredScrollRef.current = true;
				isRestoringSnapshotRef.current = false;
			});
			return () => cancelAnimationFrame(secondPass);
		});
		return () => cancelAnimationFrame(firstPass);
	}, [filteredResults.length, displayCount]);

	useEffect(() => {
		const cacheKey = currentCacheKeyRef.current;
		if (!cacheKey) return;
		const payload: HotelHydrationSnapshot = {
			version: SNAPSHOT_VERSION,
			cacheKey,
			savedAt: Date.now(),
			hotelImageMap,
			hotelDetailsMap,
		};
		try {
			localStorage.setItem(HOTEL_HYDRATION_SNAPSHOT_KEY, JSON.stringify(payload));
		} catch {
			// no-op
		}
	}, [hotelImageMap, hotelDetailsMap]);

	useEffect(() => {
		const onScroll = () => {
			if (isRestoringSnapshotRef.current) return;
			persistUiSnapshot();
		};
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		const throttled = () => {
			if (timeoutId) return;
			timeoutId = setTimeout(() => {
				onScroll();
				timeoutId = null;
			}, 250);
		};
		window.addEventListener("scroll", throttled, { passive: true });
		return () => {
			window.removeEventListener("scroll", throttled);
			if (timeoutId) clearTimeout(timeoutId);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (isRestoringSnapshotRef.current) return;
		persistUiSnapshot();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [displayCount, filters, sortBy, specificHotelCode]);

	// IntersectionObserver for infinite scroll sentinel
	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setDisplayCount((prev) => prev + HOTEL_SCROLL_CHUNK);
				}
			},
			{ rootMargin: "200px" },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [filteredResults.length]);

	// Handle booking - navigate to hotel details page with search params
	const handleBook = (hotelCode: string) => {
		if (!searchData) return;
		persistUiSnapshot();

		// Find the hotel to check its source
		const hotel = filteredResults.find(
			(h) => String(h.HotelCode) === String(hotelCode),
		);
		if (hotel) {
			// Fetch details only on explicit user action (Book Now).
			// Do not block navigation; hotel details page still performs its own fetch.
			void fetchHotelDetailsBatch([hotel]);
		}

		const params = new URLSearchParams({
			hotelCode: hotelCode,
			checkIn: searchData.checkIn.toISOString().split("T")[0],
			checkOut: searchData.checkOut.toISOString().split("T")[0],
			rooms: searchData.rooms.toString(),
			adults: searchData.adults.toString(),
			children: searchData.children.toString(),
			location: searchData.location,
			...(hotel?.source === "TRIPJACK" && { source: "TRIPJACK" }),
			...(hotel?.source === "TRIPJACK" &&
				tripjackListingCorrelationId && {
					correlationId: tripjackListingCorrelationId,
				}),
			...(hotel?.HotelName && { hotelName: hotel.HotelName }),
			...(hotel?.StarRating && { rating: String(hotel.StarRating) }),
		});

		router.push(`/travel-portal/hotel-details?${params.toString()}`);
	};

	// Handle view details
	const handleViewDetails = (hotelCode: string) => {
		persistUiSnapshot();
		const hotel = filteredResults.find(
			(h) => String(h.HotelCode) === String(hotelCode),
		);
		const params = new URLSearchParams({ hotelCode });
		if (hotel?.source === "TRIPJACK") params.set("source", "TRIPJACK");
		if (hotel?.source === "TRIPJACK" && tripjackListingCorrelationId) {
			params.set("correlationId", tripjackListingCorrelationId);
		}
		if (hotel?.HotelName) params.set("hotelName", hotel.HotelName);
		if (hotel?.StarRating) params.set("rating", String(hotel.StarRating));
		router.push(`/travel-portal/hotel-details?${params.toString()}`);
	};

	return (
		<div className="min-h-screen bg-gray-50 relative">
			{/* Minimal Sticky Header - appears when scrolling, below navbar */}
			<div
				className={`fixed top-20 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
					showMinimalHeader && searchData
						? "translate-y-0 opacity-100"
						: "-translate-y-full opacity-0 pointer-events-none"
				}`}
			>
				<MinimalHotelSearch
					location={searchData?.location || ""}
					checkInDate={searchData?.checkIn}
					checkOutDate={searchData?.checkOut}
					rooms={searchData?.rooms || 1}
					adults={searchData?.adults || 2}
					childrenCount={searchData?.children || 0}
					onModifySearch={scrollToSearch}
				/>
			</div>

			{/* Search Form - Scrolls away naturally */}
			<div ref={searchFormRef} className="bg-white border-b shadow-sm">
				<div className="container mx-auto px-4 py-4">
					<HotelSearchForm
						initialValues={searchData || undefined}
						onSearch={handleSearch}
					/>
				</div>
			</div>

			<div className="container mx-auto px-4 py-6">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* Filters Sidebar */}
					<aside className="lg:col-span-1">
						<div
							className={`transition-all duration-300 ${
								showMinimalHeader
									? "lg:sticky lg:top-[168px]"
									: "lg:sticky lg:top-6"
							}`}
							style={{
								maxHeight: showMinimalHeader
									? "calc(100vh - 176px)"
									: "calc(100vh - 32px)",
								overflowY: "auto",
							}}
						>
							<HotelFilters
								filters={filters}
								onFilterChange={setFilters}
								priceRange={{ min: 0, max: 50000 }}
							/>
						</div>
					</aside>

					{/* Results Section */}
					<main className="lg:col-span-3">
						{/* Session expired banner */}
						{isExpired && searchResults && (
							<Alert variant="destructive" className="mb-4">
								<Timer className="h-4 w-4" />
								<AlertDescription>
									Your search session has expired. Prices and availability may
									have changed.{" "}
									<button
										onClick={() =>
											searchData && performSearch(searchData, true)
										}
										className="underline font-semibold"
									>
										Search again
									</button>
								</AlertDescription>
							</Alert>
						)}

						{/* Sort and Count */}
						<div className="flex justify-between items-center mb-4">
							<div className="flex items-center gap-3">
								{!isLoading && filteredResults.length > 0 && (
									<p className="text-gray-700">
										Showing{" "}
										<span className="font-bold">
											{Math.min(displayCount, filteredResults.length)}
										</span>{" "}
										of{" "}
										<span className="font-bold">{filteredResults.length}</span>{" "}
										properties
									</p>
								)}
								{sessionActive &&
									!isExpired &&
									!isLoading &&
									filteredResults.length > 0 && (
										<span
											className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
												isWarning
													? "bg-amber-100 text-amber-700"
													: "bg-gray-100 text-gray-500"
											}`}
											title="Search session expires in this time. Re-search for fresh results."
										>
											<Timer className="w-3 h-3" />
											{formattedTime}
										</span>
									)}
							</div>
							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-600">Sort by:</span>
								<Select value={sortBy} onValueChange={setSortBy}>
									<SelectTrigger className="w-48">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="price-low">
											Price (Low to High)
										</SelectItem>
										<SelectItem value="price-high">
											Price (High to Low)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Loading: skeletons + spinner — never blocks on images after TBO returns */}
						{isLoading && (
							<div className="space-y-4">
								{Array.from({ length: SKELETON_INITIAL_ROWS }, (_, i) => (
									<div key={i} className="bg-white rounded-lg p-6 shadow-sm">
										<Skeleton className="h-48 w-full rounded-md" />
										<div className="mt-4 space-y-2">
											<Skeleton className="h-5 w-2/3" />
											<Skeleton className="h-4 w-1/2" />
										</div>
									</div>
								))}
								<div className="flex items-center justify-center py-6">
									<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
									<span className="ml-2 text-gray-600">
										Searching hotels...
									</span>
								</div>
							</div>
						)}

						{isTripjackPending && !isLoading && (
							<div className="flex items-center gap-2 text-sm text-gray-600 mb-3 px-1">
								<Loader2 className="h-4 w-4 shrink-0 animate-spin text-orange-500" />
								<span>Loading more properties (TripJack)…</span>
							</div>
						)}

						{/* Error State */}
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{/* No Results */}
						{!isLoading &&
							!error &&
							filteredResults.length === 0 &&
							searchData && (
								<div className="text-center py-12">
									<p className="text-gray-600 text-lg">
										No hotels found matching your criteria.
									</p>
									<p className="text-gray-500 mt-2">
										Try adjusting your filters or search for a different
										location.
									</p>
								</div>
							)}

						{/* No Search Yet */}
						{!isLoading && !error && !searchData && (
							<div className="text-center py-12">
								<p className="text-gray-600 text-lg">
									Start your search to find amazing hotels!
								</p>
							</div>
						)}

						{/* Results */}
						<div className="space-y-4">
							{filteredResults.slice(0, displayCount).map((hotel) => {
								// Ensure hotel code is used as string key for consistency
								const hotelCodeKey = String(hotel.HotelCode);
								const hotelDetails = hotelDetailsMap[hotelCodeKey];
								const isDetailsLoading =
									loadingDetails.has(hotelCodeKey);

								// Calculate price range from all rooms
								const prices = hotel.Rooms.map(
									(room) => room.TotalFare + room.TotalTax,
								);
								const minPrice = Math.min(...prices);
								const maxPrice = Math.max(...prices);
								const hasMultiplePrices = minPrice !== maxPrice;

								// Get the cheapest room for display
								const cheapestRoom = hotel.Rooms.reduce((cheapest, room) => {
									const roomPrice = room.TotalFare + room.TotalTax;
									const cheapestPrice = cheapest.TotalFare + cheapest.TotalTax;
									return roomPrice < cheapestPrice ? room : cheapest;
								}, hotel.Rooms[0]);

								// Thumbnail: prefer prefetch map → listing (no flicker) → details fallback.
								// Parse details for gallery count and last-resort URL only.
								let detailsThumb: string | undefined;
								let imageCount = 0;

								if (hotelDetails?.Images) {
									try {
										const imagesValue = hotelDetails.Images;

										if (typeof imagesValue === "string") {
											try {
												const parsed = JSON.parse(imagesValue);
												if (Array.isArray(parsed)) {
													if (parsed.length > 0) {
														detailsThumb = pickImageFromUnknown(parsed[0]);
														imageCount = parsed.length;
													}
												} else {
													const imageArray = imagesValue
														.split(",")
														.map((img: string) => img.trim())
														.filter(Boolean);
													if (imageArray.length > 0) {
														detailsThumb = normalizeImageUrl(imageArray[0]);
														imageCount = imageArray.length;
													} else if (imagesValue.startsWith("http")) {
														detailsThumb = normalizeImageUrl(imagesValue);
														imageCount = 1;
													}
												}
											} catch {
												const imageArray = imagesValue
													.split(",")
													.map((img: string) => img.trim())
													.filter(Boolean);
												if (imageArray.length > 0) {
													detailsThumb = normalizeImageUrl(imageArray[0]);
													imageCount = imageArray.length;
												} else if (imagesValue.startsWith("http")) {
													detailsThumb = normalizeImageUrl(imagesValue);
													imageCount = 1;
												}
											}
										} else if (
											Array.isArray(imagesValue) &&
											imagesValue.length > 0
										) {
											detailsThumb = pickImageFromUnknown(imagesValue[0]);
											imageCount = imagesValue.length;
										}
									} catch (e) {
										console.error(
											`Error parsing images for hotel ${hotelCodeKey}:`,
											e,
										);
										const imagesValue = hotelDetails.Images;
										if (
											typeof imagesValue === "string" &&
											imagesValue.startsWith("http")
										) {
											detailsThumb = normalizeImageUrl(imagesValue);
											imageCount = 1;
										}
									}
								}

								const fromMap = normalizeImageUrl(hotelImageMap[hotelCodeKey]);
								const fromListing = normalizeImageUrl(hotel.HotelImage);
								const fromDetails = detailsThumb;
								const candidate = fromMap || fromListing || fromDetails;

								const locked = stableCardImageUrlRef.current.get(hotelCodeKey);
								let hotelImage: string | undefined;
								if (locked) {
									hotelImage = locked;
								} else if (candidate) {
									stableCardImageUrlRef.current.set(hotelCodeKey, candidate);
									hotelImage = candidate;
								}

								// Get hotel name - prefer details map, then direct search result field, then fallback
								const hotelName = hotelDetails?.HotelName
									? hotelDetails.HotelName
									: hotel.HotelName
										? hotel.HotelName
										: isDetailsLoading
											? `Hotel ${hotel.HotelCode} (Loading...)`
											: `Hotel ${hotel.HotelCode}`;

								const starRating = hotelDetails?.HotelRating
									? typeof hotelDetails.HotelRating === "string"
										? parseInt(hotelDetails.HotelRating)
										: hotelDetails.HotelRating
									: hotel.StarRating
										? typeof hotel.StarRating === "string"
											? parseInt(hotel.StarRating)
											: hotel.StarRating
										: undefined;

								const location = hotelDetails
									? `${hotelDetails.CityName || hotel.CityName || ""}, ${hotelDetails.CountryName || hotel.CountryName || ""}`.trim()
									: hotel.CityName
										? `${hotel.CityName}, ${hotel.CountryName || ""}`.trim()
										: searchData?.location || "Location details loading...";

								return (
									<HotelCard
										key={hotel.HotelCode}
										hotelCode={hotel.HotelCode}
										hotelName={hotelName}
										location={location}
										starRating={starRating}
										room={cheapestRoom}
										hotelImage={hotelImage}
										propertyPhotosCount={
											imageCount > 1 ? imageCount : undefined
										}
										isDetailsLoading={isDetailsLoading}
										onBookClick={handleBook}
										onViewDetails={handleViewDetails}
										ratings={{
											score: 3.9,
											count: 6472,
											label: "Very Good",
										}}
										priceRange={
											hasMultiplePrices
												? { min: minPrice, max: maxPrice }
												: undefined
										}
										roomCount={hotel.Rooms.length}
										source={hotel.source}
									/>
								);
							})}
							{isTripjackPending &&
								!isLoading &&
								Array.from({ length: SKELETON_TRIPJACK_PENDING_ROWS }, (_, i) => (
									<div
										key={`tj-pending-${i}`}
										className="bg-white rounded-lg p-6 shadow-sm"
									>
										<Skeleton className="h-48 w-full rounded-md" />
										<div className="mt-4 space-y-2">
											<Skeleton className="h-5 w-2/3" />
											<Skeleton className="h-4 w-1/2" />
										</div>
									</div>
								))}

							{displayCount < filteredResults.length && (
								<div
									ref={sentinelRef}
									className="flex justify-center py-6"
								>
									<Loader2 className="h-6 w-6 animate-spin text-orange-500" />
								</div>
							)}
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}

export default function HotelSearchPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gray-50">
					<div className="container mx-auto px-4 py-6">
						<div className="bg-white border-b sticky top-[8.5rem] z-10 shadow-sm">
							<div className="container mx-auto px-4 py-4">
								<Skeleton className="h-32 w-full" />
							</div>
						</div>
						<div className="space-y-4 mt-6">
							{[1, 2, 3].map((i) => (
								<div key={i} className="bg-white rounded-lg p-6">
									<Skeleton className="h-48 w-full" />
								</div>
							))}
						</div>
					</div>
				</div>
			}
		>
			<HotelSearchContent />
		</Suspense>
	);
}
