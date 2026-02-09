"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HotelSearchForm, {
	HotelSearchData,
} from "@/components/travel-portal/HotelSearchForm";
import HotelFilters, {
	FilterState,
} from "@/components/travel-portal/HotelFilters";
import HotelCard from "@/components/travel-portal/HotelCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { HotelSearchResponse, HotelResult } from "@/types/hotelApi";
import { hotelCache, lastSearch, generateCacheKey } from "@/lib/searchCache";

function HotelSearchContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const [searchResults, setSearchResults] =
		useState<HotelSearchResponse | null>(null);
	const [filteredResults, setFilteredResults] = useState<HotelResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<string>("price-low");
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
	const hasLoadedCacheRef = React.useRef(false);

	// Filter state
	const [filters, setFilters] = useState<FilterState>({
		priceRange: [0, 50000],
		starRatings: [],
		mealTypes: [],
		refundable: false,
	});

	// Search parameters from URL
	const [searchData, setSearchData] = useState<HotelSearchData | null>(() => {
		const location = searchParams.get("location");
		const locationCode = searchParams.get("locationCode");
		const checkIn = searchParams.get("checkIn");
		const checkOut = searchParams.get("checkOut");
		const rooms = searchParams.get("rooms");
		const adults = searchParams.get("adults");
		const children = searchParams.get("children");

		if (location && checkIn && checkOut) {
			return {
				location,
				cityCode: locationCode || undefined,
				checkIn: new Date(checkIn),
				checkOut: new Date(checkOut),
				rooms: parseInt(rooms || "1"),
				adults: parseInt(adults || "2"),
				children: parseInt(children || "0"),
			};
		}
		return null;
	});

	// Helper function to format dates
	const formatDate = (date: Date | string) => {
		const d = typeof date === "string" ? new Date(date) : date;
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	// Perform search
	const performSearch = async (data: HotelSearchData, forceRefresh = false) => {
		setIsLoading(true);
		setError(null);

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

			// Check cache (unless forced refresh)
			if (!forceRefresh) {
				const cached = hotelCache.get(cacheKey);
				if (cached) {
					const results = cached.results as HotelSearchResponse | null;
					setSearchResults(results);
					const hotelResults =
						results?.HotelResult || (Array.isArray(results) ? results : []);
					setFilteredResults(Array.isArray(hotelResults) ? hotelResults : []);
					setIsLoading(false);
					setError(null);
					// Fetch hotel details for cached results
					if (Array.isArray(hotelResults) && hotelResults.length > 0) {
						fetchHotelDetailsBatch(hotelResults);
					}
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

			// Fetch all hotels for this city using the cityCode
			const cityDetailsResponse = await fetch("/api/travel/hotel-search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					type: "city",
					code: data.cityCode,
				}),
			});

			const cityDetailsData = await cityDetailsResponse.json();
			console.log("🏨 City hotels response:", cityDetailsData);

			if (!cityDetailsData.success || !cityDetailsData.data?.hotels?.length) {
				console.log("❌ No hotels found for this city");
				setError("No hotels found for this location");
				setIsLoading(false);
				return;
			}

			// Limit hotels sent to TBO API
			// TBO API can handle multiple hotel codes, but too many may cause timeouts
			// For better availability results, especially for near dates, we check more hotels
			const totalHotelsInCity = cityDetailsData.data.hotels.length;
			const maxHotels = totalHotelsInCity <= 800 ? totalHotelsInCity : 500; // Use all hotels if ≤800, otherwise limit to 500
			const hotels = cityDetailsData.data.hotels.slice(0, maxHotels);
			const hotelCodes = hotels
				.map((h: { hotelCode: string }) => h.hotelCode)
				.join(",");
			console.log(
				`✅ Found ${cityDetailsData.data.hotels.length} hotels in city, using first ${hotels.length} hotels for availability check`,
			);

			console.log(
				"🏨 Using hotel codes:",
				hotelCodes.substring(0, 100) + "...",
			);

			// Prepare room configuration
			const adultsPerRoom = Math.floor(data.adults / data.rooms);
			const childrenPerRoom = Math.floor(data.children / data.rooms);

			const paxRooms = Array(data.rooms)
				.fill(null)
				.map(() => ({
					Adults: adultsPerRoom || 1,
					Children: childrenPerRoom,
					ChildrenAges: Array(childrenPerRoom).fill(5),
				}));

			// Call hotel search API
			const hotelSearchResponse = await fetch("/api/travel/hotel/search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					checkIn: formatDate(data.checkIn),
					checkOut: formatDate(data.checkOut),
					hotelCodes: hotelCodes,
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

			console.log("📡 Hotel search API response received");
			console.log("📡 Response Status:", result.data?.Status);
			console.log(
				"📡 HotelResult count:",
				Array.isArray(result.data?.HotelResult)
					? result.data.HotelResult.length
					: "not an array",
			);

			// Log detailed response structure for debugging (only in development)
			if (process.env.NODE_ENV === "development") {
				console.log(
					"📡 Full response structure:",
					JSON.stringify(result.data, null, 2),
				);
			}

			if (!result.success) {
				console.log("❌ API returned error:", result.error);
				setError(result.error || "Failed to search hotels");
				setIsLoading(false);
				return;
			}

			// Handle different possible response structures
			let hotelResults = [];

			// Check if response has Status and it indicates success
			if (result.data?.Status) {
				console.log("📡 Response Status:", result.data.Status);
				const statusCode = result.data.Status.Code;
				const description = (
					result.data.Status.Description || ""
				).toLowerCase();

				// Status codes that indicate success:
				// - 1 = Success
				// - 0 = Success/Pending
				// - 200 = Success (used by Affiliate API when Description is "Successful")
				const isSuccess =
					statusCode === 1 ||
					statusCode === 0 ||
					(statusCode === 200 &&
						(description.includes("success") || description === "successful"));

				if (!isSuccess) {
					console.log(
						"⚠️ API returned non-success status:",
						result.data.Status.Description,
					);
					setError(result.data.Status.Description || "No hotels found");
					setIsLoading(false);
					return;
				}
			}

			// Try different possible response structures
			if (result.data?.HotelResult && Array.isArray(result.data.HotelResult)) {
				hotelResults = result.data.HotelResult;
			} else if (Array.isArray(result.data)) {
				hotelResults = result.data;
			} else if (result.data?.Results && Array.isArray(result.data.Results)) {
				hotelResults = result.data.Results;
			} else if (result.data?.hotels && Array.isArray(result.data.hotels)) {
				hotelResults = result.data.hotels;
			} else if (result.HotelResult && Array.isArray(result.HotelResult)) {
				// In case the response structure is at root level
				hotelResults = result.HotelResult;
			}

			console.log(
				`✅ Extracted hotel results: ${hotelResults.length} hotels with availability`,
			);
			console.log(
				`📊 Availability rate: ${hotelResults.length} out of ${hotels.length} hotels have rooms (${Math.round((hotelResults.length / hotels.length) * 100)}%)`,
			);

			if (hotelResults.length > 0) {
				console.log(
					"✅ Sample hotel:",
					hotelResults[0]?.HotelName || hotelResults[0]?.Name,
				);
			}

			if (hotelResults.length === 0) {
				console.log(
					"⚠️ No hotels found with availability for your search criteria",
				);
				console.log(
					"💡 Try: Different dates (2-3 months ahead), fewer guests, or different location",
				);
				setError(
					"No hotels available for the selected dates and criteria. Please try different dates or adjust your search.",
				);
			} else {
				console.log("✅ Setting search results:", result.data);
				// Clear any previous errors
				setError(null);
				setSearchResults(result.data);
				setFilteredResults(hotelResults);

				// Save to cache
				hotelCache.set(cacheKey, {
					results: result.data,
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
				});

				// Save last search parameters for auto-search on back navigation
				lastSearch.save("hotel", {
					location: data.location,
					cityCode: data.cityCode,
					checkIn: formatDate(data.checkIn),
					checkOut: formatDate(data.checkOut),
					rooms: data.rooms,
					adults: data.adults,
					children: data.children,
				});

				// Fetch hotel details for all hotels in batches
				fetchHotelDetailsBatch(hotelResults);
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

		// Fetch in batches of 5 to avoid overwhelming the TBO Static API
		// Reduced from 10 to prevent 503 errors
		const batchSize = 5;

		// Process batches sequentially but fetch within batch in parallel
		for (let i = 0; i < hotelCodesToFetch.length; i += batchSize) {
			const batch = hotelCodesToFetch.slice(i, i + batchSize);

			// Mark as loading
			setLoadingDetails((prev) => {
				const newSet = new Set(prev);
				batch.forEach((code) => newSet.add(code));
				return newSet;
			});

			// Fetch all in batch in parallel with better error handling
			// Using Promise.allSettled so one failure doesn't block others
			const detailsPromises = batch.map(async (hotelCode) => {
				let timeoutId: NodeJS.Timeout | null = null;
				try {
					// Create abort controller for timeout
					const controller = new AbortController();
					timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

					const response = await fetch(
						`/api/travel/hotel/details?hotelCode=${hotelCode}&language=EN&isRoomDetailRequired=false`,
						{
							signal: controller.signal,
						},
					);

					if (timeoutId) clearTimeout(timeoutId);

					if (!response.ok) {
						throw new Error(`HTTP ${response.status}: ${response.statusText}`);
					}

					const result = await response.json();

					if (result.success && result.data?.HotelDetails) {
						// Handle both array and object formats
						let hotelDetails = result.data.HotelDetails;
						if (Array.isArray(hotelDetails) && hotelDetails.length > 0) {
							hotelDetails = hotelDetails[0];
						}

						return {
							success: true,
							hotelCode: String(hotelCode),
							details: hotelDetails,
						};
					} else {
						throw new Error(result.error || "No hotel details in response");
					}
				} catch (error) {
					// Always clear timeout on error
					if (timeoutId) clearTimeout(timeoutId);

					// Log error but don't block other hotels
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					console.warn(
						`⚠️ Failed to fetch details for hotel ${hotelCode}:`,
						errorMessage,
					);
					return {
						success: false,
						hotelCode: String(hotelCode),
						error: errorMessage || "Failed to fetch details",
					};
				}
			});

			// Use Promise.allSettled to handle partial failures gracefully
			const detailsResults = await Promise.allSettled(detailsPromises);

			// Update hotel details map with successful results
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

			// Remove from loading set (even failed ones, so UI doesn't hang)
			setLoadingDetails((prev) => {
				const newSet = new Set(prev);
				batch.forEach((code) => newSet.delete(code));
				return newSet;
			});

			// Small delay between batches to avoid overwhelming the API
			// Increased delay to 500ms to reduce rate limiting issues
			if (i + batchSize < hotelCodesToFetch.length) {
				await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
			}
		}

		console.log(
			`✅ Hotel details fetching completed for ${hotelCodesToFetch.length} hotels`,
		);
	};

	// Initial search on mount if URL params exist OR load from cache on back navigation
	useEffect(() => {
		console.log("🔄 useEffect triggered, searchData:", searchData);

		// If no URL params but we have cached search, restore from cache (back navigation)
		if (!searchData && !hasLoadedCacheRef.current) {
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
				hasLoadedCacheRef.current = true;

				// Restore search data
				const restoredData: HotelSearchData = {
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

				setSearchData(restoredData);

				// Try to load from cache
				const loadFromCache = async () => {
					const cacheKey = await generateCacheKey({
						cityCode: restoredData.cityCode,
						checkIn: formatDate(restoredData.checkIn),
						checkOut: formatDate(restoredData.checkOut),
						rooms: restoredData.rooms,
						adults: restoredData.adults,
						children: restoredData.children,
					});

					const cached = hotelCache.get(cacheKey);
					if (cached) {
						const results = cached.results as HotelSearchResponse | null;
						setSearchResults(results);
						const hotelResults =
							results?.HotelResult || (Array.isArray(results) ? results : []);
						setFilteredResults(Array.isArray(hotelResults) ? hotelResults : []);
						setError(null);
						// Fetch hotel details for cached results
						if (Array.isArray(hotelResults) && hotelResults.length > 0) {
							fetchHotelDetailsBatch(hotelResults);
						}
						return;
					}

					// If no cache, auto-search with last params
					performSearch(restoredData);
				};
				loadFromCache();
			}
		}

		if (searchData) {
			hasLoadedCacheRef.current = false;
			performSearch(searchData);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Handle new search
	const handleSearch = async (data: HotelSearchData) => {
		console.log("🔍 handleSearch called with:", data);
		setSearchData(data);

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

		const results = [...searchResults.HotelResult];

		// Group hotels by hotel code (each hotel should appear only once)
		const hotelMap = new Map<string, HotelResult>();

		results.forEach((hotel) => {
			const hotelCode = String(hotel.HotelCode);

			if (!hotelMap.has(hotelCode)) {
				// First time seeing this hotel, add it
				hotelMap.set(hotelCode, hotel);
			} else {
				// Hotel already exists, merge rooms
				const existingHotel = hotelMap.get(hotelCode)!;
				existingHotel.Rooms = [...existingHotel.Rooms, ...hotel.Rooms];
			}
		});

		// Convert map back to array
		let groupedResults = Array.from(hotelMap.values());

		// Apply filters
		groupedResults = groupedResults.filter((hotel) => {
			// Filter by price - use minimum price from all rooms
			const hotelPrice = hotel.Rooms.reduce(
				(min, room) => Math.min(min, room.TotalFare + room.TotalTax),
				Infinity,
			);

			if (
				hotelPrice < filters.priceRange[0] ||
				hotelPrice > filters.priceRange[1]
			) {
				return false;
			}

			// Filter by refundable
			if (filters.refundable) {
				const hasRefundableRoom = hotel.Rooms.some((room) => room.IsRefundable);
				if (!hasRefundableRoom) return false;
			}

			// Filter by meal type
			if (filters.mealTypes.length > 0) {
				const hasMealType = hotel.Rooms.some((room) =>
					filters.mealTypes.includes(room.MealType),
				);
				if (!hasMealType) return false;
			}

			return true;
		});

		// Apply sorting - use minimum price from all rooms
		groupedResults.sort((a, b) => {
			const priceA = a.Rooms.reduce(
				(min, room) => Math.min(min, room.TotalFare + room.TotalTax),
				Infinity,
			);
			const priceB = b.Rooms.reduce(
				(min, room) => Math.min(min, room.TotalFare + room.TotalTax),
				Infinity,
			);

			switch (sortBy) {
				case "price-low":
					return priceA - priceB;
				case "price-high":
					return priceB - priceA;
				default:
					return 0;
			}
		});

		setFilteredResults(groupedResults);
	}, [searchResults, filters, sortBy]);

	// Handle booking - navigate to hotel details page with search params
	const handleBook = (hotelCode: string) => {
		if (!searchData) return;

		const params = new URLSearchParams({
			hotelCode: hotelCode,
			checkIn: searchData.checkIn.toISOString().split("T")[0],
			checkOut: searchData.checkOut.toISOString().split("T")[0],
			rooms: searchData.rooms.toString(),
			adults: searchData.adults.toString(),
			children: searchData.children.toString(),
			location: searchData.location,
		});

		router.push(`/travel-portal/hotel-details?${params.toString()}`);
	};

	// Handle view details
	const handleViewDetails = (hotelCode: string) => {
		router.push(`/travel-portal/hotel-details?hotelCode=${hotelCode}`);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Search Form */}
			<div className="bg-white border-b sticky top-0 z-10 shadow-sm">
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
						<div className="sticky top-24">
							<HotelFilters
								filters={filters}
								onFilterChange={setFilters}
								priceRange={{ min: 0, max: 50000 }}
							/>
						</div>
					</aside>

					{/* Results Section */}
					<main className="lg:col-span-3">
						{/* Sort and Count */}
						<div className="flex justify-between items-center mb-4">
							<div>
								{!isLoading && filteredResults.length > 0 && (
									<p className="text-gray-700">
										<span className="font-bold">{filteredResults.length}</span>{" "}
										properties found
									</p>
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

						{/* Loading State */}
						{isLoading && (
							<div className="space-y-4">
								{[1, 2, 3].map((i) => (
									<div key={i} className="bg-white rounded-lg p-6">
										<Skeleton className="h-48 w-full" />
									</div>
								))}
								<div className="flex items-center justify-center py-8">
									<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
									<span className="ml-2 text-gray-600">
										Searching hotels...
									</span>
								</div>
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
							{filteredResults.map((hotel) => {
								// Ensure hotel code is used as string key for consistency
								const hotelCodeKey = String(hotel.HotelCode);
								const hotelDetails = hotelDetailsMap[hotelCodeKey];
								const isDetailsLoading = loadingDetails.has(hotelCodeKey);

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

								// Parse images from HotelDetails API response
								let hotelImage: string | undefined;
								let imageCount = 0;

								if (hotelDetails?.Images) {
									try {
										// Images might be a string or array
										const imagesValue = hotelDetails.Images;

										if (typeof imagesValue === "string") {
											// Try parsing as JSON first
											try {
												const parsed = JSON.parse(imagesValue);
												if (Array.isArray(parsed)) {
													if (parsed.length > 0) {
														hotelImage = parsed[0];
														imageCount = parsed.length;
													}
												} else {
													// Parsed but not an array, try comma-separated
													const imageArray = imagesValue
														.split(",")
														.map((img: string) => img.trim())
														.filter(Boolean);
													if (imageArray.length > 0) {
														hotelImage = imageArray[0];
														imageCount = imageArray.length;
													} else if (imagesValue.startsWith("http")) {
														// Single URL
														hotelImage = imagesValue;
														imageCount = 1;
													}
												}
											} catch {
												// If not JSON, try comma-separated
												const imageArray = imagesValue
													.split(",")
													.map((img: string) => img.trim())
													.filter(Boolean);
												if (imageArray.length > 0) {
													hotelImage = imageArray[0];
													imageCount = imageArray.length;
												} else if (imagesValue.startsWith("http")) {
													// Single URL
													hotelImage = imagesValue;
													imageCount = 1;
												}
											}
										} else if (
											Array.isArray(imagesValue) &&
											imagesValue.length > 0
										) {
											hotelImage = imagesValue[0];
											imageCount = imagesValue.length;
										}
									} catch (e) {
										console.error(
											`Error parsing images for hotel ${hotelCodeKey}:`,
											e,
										);
										// If parsing fails, try to use it as a single image URL
										const imagesValue = hotelDetails.Images;
										if (
											typeof imagesValue === "string" &&
											imagesValue.startsWith("http")
										) {
											hotelImage = imagesValue;
											imageCount = 1;
										}
									}
								}

								// Get hotel name - use actual hotel name from API, fallback to hotel code if details not loaded yet
								const hotelName = hotelDetails?.HotelName
									? hotelDetails.HotelName
									: isDetailsLoading
										? `Hotel ${hotel.HotelCode} (Loading...)`
										: `Hotel ${hotel.HotelCode}`;

								const starRating = hotelDetails?.HotelRating
									? typeof hotelDetails.HotelRating === "string"
										? parseInt(hotelDetails.HotelRating)
										: hotelDetails.HotelRating
									: undefined;

								const location = hotelDetails
									? `${hotelDetails.CityName || ""}, ${hotelDetails.CountryName || ""}`.trim()
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
									/>
								);
							})}
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
						<div className="bg-white border-b sticky top-0 z-10 shadow-sm">
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
