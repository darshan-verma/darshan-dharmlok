/**
 * Shared caching utility for flight and hotel search results
 * Provides consistent caching behavior across the application
 */

import { normalizeTboCabinClass } from "@/lib/tboFlightSearch";

/**
 * Canonical date normalizer - converts Date to YYYY-MM-DD format
 * Use this function everywhere dates are used for cache key generation, lastSearch saving, URL restore, multi-city segments
 */
export function normalizeDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
		2,
		"0",
	)}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface FlightCacheEntry {
	results: unknown[];
	createdAt: number;
	/** TripJack domestic multicity: one flight list per leg */
	multicityLegs?: unknown[][];
	providerResults?: {
		tbo?: unknown[];
		airiq?: unknown[];
		tripjack?: unknown[];
	};
}

export interface HotelCacheEntry {
	results: unknown;
	timestamp: number;
	searchData: {
		location: string;
		cityCode: string;
		checkIn: string;
		checkOut: string;
		rooms: number;
		adults: number;
		children: number;
	};
}

const FLIGHT_CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes
export const HOTEL_CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
const FLIGHT_CACHE_KEY = "flightSearchCache";
const HOTEL_CACHE_KEY = "hotelSearchCache";
const LAST_SEARCH_KEY = "lastSearchParams";
const FLIGHT_TRACEID_MAP_KEY = "flightTraceIdMap"; // Store traceId separately from cache

/**
 * Hash a string using SHA-256
 */
async function sha256Hash(data: string): Promise<string> {
	if (
		typeof window === "undefined" ||
		!window.crypto ||
		!window.crypto.subtle
	) {
		// Fallback for environments without Web Crypto API (shouldn't happen in browser)
		// Simple hash fallback - not cryptographically secure but deterministic
		let hash = 0;
		for (let i = 0; i < data.length; i++) {
			const char = data.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(16);
	}

	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);
	const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a cache key from search parameters by hashing the normalized search request
 * Includes all fields that affect pricing:
 * - For flights: journeyType, origin, destination, departureDate, returnDate, segments[], adults, children, infants, cabinClass, directFlight, oneStopFlight
 * - For hotels: cityCode, checkIn, checkOut, rooms, adults, children
 */
export async function generateCacheKey(
	params: Record<string, unknown>,
): Promise<string> {
	// Normalize the search request for consistent hashing
	const normalizedRequest: Record<string, unknown> = {};

	// Handle hotel search parameters
	if (params.cityCode || params.checkIn || params.checkOut) {
		normalizedRequest.searchType = "hotel";
		normalizedRequest.cityCode = params.cityCode || "";
		normalizedRequest.checkIn = params.checkIn || "";
		normalizedRequest.checkOut = params.checkOut || "";
		normalizedRequest.rooms = params.rooms || 1;
		normalizedRequest.adults = params.adults || 1;
		normalizedRequest.children = params.children || 0;
	} else {
		// Flight search parameters
		normalizedRequest.searchType = "flight";
		normalizedRequest.journeyType = params.JourneyType || params.journeyType;
		normalizedRequest.adults = params.AdultCount || params.adults || 1;
		normalizedRequest.children = params.ChildCount || params.children || 0;
		normalizedRequest.infants = params.InfantCount || params.infants || 0;
		normalizedRequest.cabinClass = normalizeTboCabinClass(
			String(params.FlightCabinClass || params.cabinClass || ""),
		);
		normalizedRequest.directFlight =
			params.DirectFlight || params.directFlight || "true";
		normalizedRequest.oneStopFlight =
			params.OneStopFlight || params.oneStopFlight || "false";
	}

	// Handle one-way and round-trip
	if (
		normalizedRequest.journeyType === "1" ||
		normalizedRequest.journeyType === "2" ||
		normalizedRequest.journeyType === "5"
	) {
		normalizedRequest.origin = String(
			params.Origin || params.origin || "",
		).toUpperCase();
		normalizedRequest.destination = String(
			params.Destination || params.destination || "",
		).toUpperCase();
		if (params.PreferredDepartureTime || params.departureDate) {
			const depDate = params.PreferredDepartureTime || params.departureDate;
			normalizedRequest.departureDate = normalizeDate(
				new Date(depDate as string | number | Date),
			);
		}
		if (
			(normalizedRequest.journeyType === "2" ||
				normalizedRequest.journeyType === "5") &&
			(params.ReturnPreferredDepartureTime || params.returnDate)
		) {
			const retDate = params.ReturnPreferredDepartureTime || params.returnDate;
			normalizedRequest.returnDate = normalizeDate(
				new Date(retDate as string | number | Date),
			);
		}
	}

	// Handle multi-city - include each leg in order
	interface Segment {
		PreferredDepartureTime?: string;
		departureDate?: string;
		Origin?: string;
		origin?: string;
		Destination?: string;
		destination?: string;
		[key: string]: unknown;
	}
	if (
		normalizedRequest.journeyType === "3" &&
		params.Segments &&
		Array.isArray(params.Segments)
	) {
		normalizedRequest.segments = (params.Segments as Segment[]).map(
			(seg, index: number) => {
				const segmentDate = seg.PreferredDepartureTime || seg.departureDate;
				return {
					leg: index + 1,
					origin: (seg.Origin || seg.origin || "").toUpperCase(),
					destination: (seg.Destination || seg.destination || "").toUpperCase(),
					date: segmentDate ? normalizeDate(new Date(segmentDate)) : "",
				};
			},
		);
	} else if (
		normalizedRequest.journeyType === "3" &&
		params.segments &&
		Array.isArray(params.segments)
	) {
		normalizedRequest.segments = (params.segments as Segment[]).map(
			(seg, index: number) => ({
				leg: index + 1,
				origin: (seg.origin || "").toUpperCase(),
				destination: (seg.destination || "").toUpperCase(),
				date: seg.departureDate
					? normalizeDate(new Date(seg.departureDate))
					: "",
			}),
		);
	}

	// Sort keys for deterministic ordering, then stringify and hash
	const sortedKeys = Object.keys(normalizedRequest).sort();
	const normalizedString = JSON.stringify(
		sortedKeys.reduce(
			(acc, key) => {
				acc[key] = normalizedRequest[key];
				return acc;
			},
			{} as Record<string, unknown>,
		),
	);

	return await sha256Hash(normalizedString);
}

/**
 * Synchronous version of generateCacheKey for use in non-async contexts
 * Uses a simpler hash algorithm (not SHA-256 but deterministic)
 */
export function generateCacheKeySync(params: Record<string, unknown>): string {
	// Normalize the search request for consistent hashing
	const normalizedRequest: Record<string, unknown> = {
		journeyType: params.JourneyType || params.journeyType,
		adults: params.AdultCount || params.adults || 1,
		children: params.ChildCount || params.children || 0,
		infants: params.InfantCount || params.infants || 0,
		cabinClass: normalizeTboCabinClass(
			String(params.FlightCabinClass || params.cabinClass || ""),
		),
		directFlight: params.DirectFlight || params.directFlight || "true",
		oneStopFlight: params.OneStopFlight || params.oneStopFlight || "false",
	};

	// Handle one-way and round-trip
	if (
		normalizedRequest.journeyType === "1" ||
		normalizedRequest.journeyType === "2" ||
		normalizedRequest.journeyType === "5"
	) {
		normalizedRequest.origin = String(
			params.Origin || params.origin || "",
		).toUpperCase();
		normalizedRequest.destination = String(
			params.Destination || params.destination || "",
		).toUpperCase();
		if (params.PreferredDepartureTime || params.departureDate) {
			const depDate = params.PreferredDepartureTime || params.departureDate;
			normalizedRequest.departureDate = normalizeDate(
				new Date(depDate as string | number | Date),
			);
		}
		if (
			(normalizedRequest.journeyType === "2" ||
				normalizedRequest.journeyType === "5") &&
			(params.ReturnPreferredDepartureTime || params.returnDate)
		) {
			const retDate = params.ReturnPreferredDepartureTime || params.returnDate;
			normalizedRequest.returnDate = normalizeDate(
				new Date(retDate as string | number | Date),
			);
		}
	}

	// Handle multi-city - include each leg in order
	interface Segment {
		PreferredDepartureTime?: string;
		departureDate?: string;
		Origin?: string;
		origin?: string;
		Destination?: string;
		destination?: string;
		[key: string]: unknown;
	}
	if (
		normalizedRequest.journeyType === "3" &&
		params.Segments &&
		Array.isArray(params.Segments)
	) {
		normalizedRequest.segments = (params.Segments as Segment[]).map(
			(seg, index: number) => {
				const segmentDate = seg.PreferredDepartureTime || seg.departureDate;
				return {
					leg: index + 1,
					origin: (seg.Origin || seg.origin || "").toUpperCase(),
					destination: (seg.Destination || seg.destination || "").toUpperCase(),
					date: segmentDate ? normalizeDate(new Date(segmentDate)) : "",
				};
			},
		);
	} else if (
		normalizedRequest.journeyType === "3" &&
		params.segments &&
		Array.isArray(params.segments)
	) {
		normalizedRequest.segments = (params.segments as Segment[]).map(
			(seg, index: number) => ({
				leg: index + 1,
				origin: (seg.origin || "").toUpperCase(),
				destination: (seg.destination || "").toUpperCase(),
				date: seg.departureDate
					? normalizeDate(new Date(seg.departureDate))
					: "",
			}),
		);
	}

	// Sort keys for deterministic ordering, then stringify
	const sortedKeys = Object.keys(normalizedRequest).sort();
	const normalizedString = JSON.stringify(
		sortedKeys.reduce(
			(acc, key) => {
				acc[key] = normalizedRequest[key];
				return acc;
			},
			{} as Record<string, unknown>,
		),
	);

	// Simple hash fallback (deterministic but not cryptographically secure)
	let hash = 0;
	for (let i = 0; i < normalizedString.length; i++) {
		const char = normalizedString.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash).toString(16).padStart(16, "0");
}

/**
 * Flight Search Cache Operations
 * Cache stores only results and createdAt. TraceId must come from fresh search every time.
 */
export const flightCache = {
	/**
	 * Get cached flight results (exact match only, no fuzzy matching)
	 */
	get(cacheKey: string): FlightCacheEntry | null {
		try {
			const stored = sessionStorage.getItem(FLIGHT_CACHE_KEY);
			if (!stored) return null;

			const cache: Record<string, FlightCacheEntry> = JSON.parse(stored);
			const entry = cache[cacheKey];

			if (!entry) return null;

			// Check if cache is expired (15 minutes TTL)
			const now = Date.now();
			if (now - entry.createdAt >= FLIGHT_CACHE_EXPIRY) {
				// Remove expired entry
				delete cache[cacheKey];
				sessionStorage.setItem(FLIGHT_CACHE_KEY, JSON.stringify(cache));
				return null;
			}

			return entry;
		} catch (e) {
			console.warn("Failed to get flight cache:", e);
			return null;
		}
	},

	/**
	 * Set cached flight results
	 */
	set(cacheKey: string, entry: FlightCacheEntry): void {
		try {
			const stored = sessionStorage.getItem(FLIGHT_CACHE_KEY);
			const cache: Record<string, FlightCacheEntry> = stored
				? JSON.parse(stored)
				: {};

			// Clean up expired entries before adding new one
			const now = Date.now();
			Object.keys(cache).forEach((key) => {
				if (now - cache[key].createdAt >= FLIGHT_CACHE_EXPIRY) {
					delete cache[key];
				}
			});

			// Ensure entry has createdAt timestamp
			const entryWithTimestamp: FlightCacheEntry = {
				...entry,
				createdAt: entry.createdAt || now,
			};

			cache[cacheKey] = entryWithTimestamp;
			sessionStorage.setItem(FLIGHT_CACHE_KEY, JSON.stringify(cache));
		} catch (e) {
			console.warn("Failed to set flight cache:", e);
		}
	},

	/**
	 * Clear specific cache entry
	 */
	clearKey(cacheKey: string): void {
		try {
			const stored = sessionStorage.getItem(FLIGHT_CACHE_KEY);
			if (!stored) return;

			const cache: Record<string, FlightCacheEntry> = JSON.parse(stored);
			delete cache[cacheKey];
			sessionStorage.setItem(FLIGHT_CACHE_KEY, JSON.stringify(cache));

			// Also clear traceId for this cache key
			try {
				const traceIdMapStored = sessionStorage.getItem(FLIGHT_TRACEID_MAP_KEY);
				if (traceIdMapStored) {
					const traceIdMap: Record<string, string> =
						JSON.parse(traceIdMapStored);
					delete traceIdMap[cacheKey];
					sessionStorage.setItem(
						FLIGHT_TRACEID_MAP_KEY,
						JSON.stringify(traceIdMap),
					);
				}
			} catch (_e) {
				// Ignore errors when clearing traceId
			}
		} catch (e) {
			console.warn("Failed to clear flight cache key:", e);
		}
	},

	/**
	 * Store traceId for a cache key (separate from cache structure)
	 */
	setTraceId(cacheKey: string, traceId: string): void {
		try {
			const stored = sessionStorage.getItem(FLIGHT_TRACEID_MAP_KEY);
			const traceIdMap: Record<string, string> = stored
				? JSON.parse(stored)
				: {};
			traceIdMap[cacheKey] = traceId;
			sessionStorage.setItem(
				FLIGHT_TRACEID_MAP_KEY,
				JSON.stringify(traceIdMap),
			);
		} catch (e) {
			console.warn("Failed to set traceId:", e);
		}
	},

	/**
	 * Get traceId for a cache key
	 */
	getTraceId(cacheKey: string): string | null {
		try {
			const stored = sessionStorage.getItem(FLIGHT_TRACEID_MAP_KEY);
			if (!stored) return null;
			const traceIdMap: Record<string, string> = JSON.parse(stored);
			return traceIdMap[cacheKey] || null;
		} catch (e) {
			console.warn("Failed to get traceId:", e);
			return null;
		}
	},
};

/**
 * Hotel Search Cache Operations
 */
export const hotelCache = {
	/**
	 * Get cached hotel results
	 */
	get(cacheKey: string): HotelCacheEntry | null {
		try {
			const stored = sessionStorage.getItem(HOTEL_CACHE_KEY);
			if (!stored) return null;

			const cache: Record<string, HotelCacheEntry> = JSON.parse(stored);
			const entry = cache[cacheKey];

			if (!entry) return null;

			// Check if cache is expired
			const now = Date.now();
			if (now - entry.timestamp >= HOTEL_CACHE_EXPIRY) {
				// Remove expired entry
				delete cache[cacheKey];
				sessionStorage.setItem(HOTEL_CACHE_KEY, JSON.stringify(cache));
				return null;
			}

			return entry;
		} catch (e) {
			console.warn("Failed to get hotel cache:", e);
			return null;
		}
	},

	/**
	 * Set cached hotel results
	 */
	set(cacheKey: string, entry: HotelCacheEntry): void {
		try {
			const stored = sessionStorage.getItem(HOTEL_CACHE_KEY);
			const cache: Record<string, HotelCacheEntry> = stored
				? JSON.parse(stored)
				: {};

			// Clean up expired entries before adding new one
			const now = Date.now();
			Object.keys(cache).forEach((key) => {
				if (now - cache[key].timestamp >= HOTEL_CACHE_EXPIRY) {
					delete cache[key];
				}
			});

			cache[cacheKey] = entry;
			sessionStorage.setItem(HOTEL_CACHE_KEY, JSON.stringify(cache));
		} catch (e) {
			console.warn("Failed to set hotel cache:", e);
		}
	},

	/**
	 * Clear all hotel cache
	 */
	clear(): void {
		try {
			sessionStorage.removeItem(HOTEL_CACHE_KEY);
		} catch (e) {
			console.warn("Failed to clear hotel cache:", e);
		}
	},

	/**
	 * Clear specific cache entry
	 */
	clearKey(cacheKey: string): void {
		try {
			const stored = sessionStorage.getItem(HOTEL_CACHE_KEY);
			if (!stored) return;

			const cache: Record<string, HotelCacheEntry> = JSON.parse(stored);
			delete cache[cacheKey];
			sessionStorage.setItem(HOTEL_CACHE_KEY, JSON.stringify(cache));
		} catch (e) {
			console.warn("Failed to clear hotel cache key:", e);
		}
	},

	/**
	 * Get all valid cache entries
	 */
	getAll(): Record<string, HotelCacheEntry> {
		try {
			const stored = sessionStorage.getItem(HOTEL_CACHE_KEY);
			if (!stored) return {};

			const cache: Record<string, HotelCacheEntry> = JSON.parse(stored);
			const now = Date.now();
			const validCache: Record<string, HotelCacheEntry> = {};

			Object.keys(cache).forEach((key) => {
				if (now - cache[key].timestamp < HOTEL_CACHE_EXPIRY) {
					validCache[key] = cache[key];
				}
			});

			return validCache;
		} catch (e) {
			console.warn("Failed to get all hotel cache:", e);
			return {};
		}
	},
};

/**
 * Last Search Parameters (for auto-search on back navigation)
 */
export const lastSearch = {
	/**
	 * Save last search parameters
	 */
	save(type: "flight" | "hotel", params: Record<string, unknown>): void {
		try {
			const key = `${LAST_SEARCH_KEY}_${type}`;
			sessionStorage.setItem(key, JSON.stringify(params));
		} catch (e) {
			console.warn("Failed to save last search:", e);
		}
	},

	/**
	 * Get last search parameters
	 */
	get(type: "flight" | "hotel"): Record<string, unknown> | null {
		try {
			const key = `${LAST_SEARCH_KEY}_${type}`;
			const stored = sessionStorage.getItem(key);
			return stored ? JSON.parse(stored) : null;
		} catch (e) {
			console.warn("Failed to get last search:", e);
			return null;
		}
	},

	/**
	 * Clear last search parameters
	 */
	clear(type: "flight" | "hotel"): void {
		try {
			const key = `${LAST_SEARCH_KEY}_${type}`;
			sessionStorage.removeItem(key);
		} catch (e) {
			console.warn("Failed to clear last search:", e);
		}
	},
};
