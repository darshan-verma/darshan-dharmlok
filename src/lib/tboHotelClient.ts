/**
 * TBO Hotel API Client
 * Handles all hotel-related API calls with automatic token management
 */

import type {
	HotelSearchRequest,
	PaxRoom,
	HotelDetailsResponse,
} from "@/types/hotelApi";

// Use the Affiliate API URL (correct endpoint for hotel search)
// Note: This is the Affiliate API, NOT the Booking Engine API
// The Affiliate API endpoint is: https://affiliate.tektravels.com/HotelAPI
const HOTEL_API_BASE_URL = "https://affiliate.tektravels.com/HotelAPI";

// HotelDetails API uses a different endpoint
const HOTEL_DETAILS_API_BASE_URL =
	process.env.TBO_HOTEL_DETAILS_API_URL ||
	"http://api.tbotechnology.in/TBOHolidays_HotelAPI";

// Get Affiliate API credentials for Basic Auth (if needed)
function getAffiliateCredentials() {
	const username = process.env.TEKTRAVELS_USER_ID;
	const password = process.env.TEKTRAVELS_PASSWORD;
	return { username, password };
}

// Get Static API credentials for HotelDetails API
// IMPORTANT: These are the Static API credentials (NOT the Affiliate API credentials)
// Static API: TBOStaticAPITest / Tbo@11530818
// Affiliate API (Search): Dharmlok / Dharmlok@123
function getStaticApiCredentials() {
	// Use environment variables if set, otherwise use hardcoded defaults
	// These MUST be the Static API credentials, not the Affiliate API credentials
	const username = process.env.TBO_STATIC_API_USERNAME || "TBOStaticAPITest";
	const password = process.env.TBO_STATIC_API_PASSWORD || "Tbo@11530818";

	// Verify we're not accidentally using Affiliate API credentials
	if (username === "Dharmlok" || password === "Dharmlok@123") {
		console.error("❌ ERROR: Using Affiliate API credentials for Static API!");
		console.error("Static API requires: TBOStaticAPITest / Tbo@11530818");
		throw new Error(
			"Incorrect credentials: Static API cannot use Affiliate API credentials"
		);
	}

	return { username, password };
}

/**
 * Get the base API URL for hotel services
 */
function getHotelApiUrl(): string {
	if (!HOTEL_API_BASE_URL) {
		throw new Error(
			"TEKTRAVELS_HOTEL_API_URL is not configured in environment variables"
		);
	}
	return HOTEL_API_BASE_URL;
}

/**
 * Make an authenticated request to TBO Hotel API
 */
async function makeAuthenticatedRequest<T>(
	endpoint: string,
	body: Record<string, unknown>
): Promise<T> {
	const url = `${getHotelApiUrl()}/${endpoint}`;

	// For Affiliate API Search endpoint, use Basic Auth instead of TokenId
	// The Affiliate Search API requires Basic Auth with agency credentials
	const { username, password } = getAffiliateCredentials();

	if (!username || !password) {
		throw new Error(
			"Affiliate API credentials (TEKTRAVELS_USER_ID and TEKTRAVELS_PASSWORD) are required for hotel search"
		);
	}

	// Don't include TokenId for Search endpoint - use Basic Auth only
	// The Affiliate Search API uses Basic Auth instead of TokenId
	const { TokenId: _TokenId, ...payloadWithoutToken } = body;
	const payload = payloadWithoutToken;

	const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		Authorization: `Basic ${basicAuth}`,
	};

	console.log(
		`🔍 Hotel API Request to ${url}:`,
		JSON.stringify(payload, null, 2)
	);
	console.log(`🔐 Using Basic Auth with username: ${username}`);

	try {
		const response = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Hotel API HTTP error: ${response.status} - ${errorText}`);
			throw new Error(
				`Hotel API request failed: ${response.status} ${response.statusText}: ${errorText}`
			);
		}

		const responseText = await response.text();
		try {
			const data = JSON.parse(responseText);

			// Check if the API returned an error status (even if HTTP 200)
			if (data.Status && typeof data.Status === "object") {
				const statusCode = data.Status.Code;
				const description = (data.Status.Description || "").toLowerCase();

				// Status codes that indicate success:
				// - 1 = Success
				// - 0 = Success/Pending
				// - 200 = Success (used by Affiliate API when Description is "Successful")
				// Any other code indicates an error
				const isSuccess =
					statusCode === 1 ||
					statusCode === 0 ||
					(statusCode === 200 &&
						(description.includes("success") || description === "successful"));

				if (!isSuccess) {
					const errorMsg =
						data.Status.Description || `API Error: Code ${statusCode}`;
					console.error(
						`❌ TBO API Error Status: Code ${statusCode}, Description: ${errorMsg}`
					);
					throw new Error(`TBO API Error: ${errorMsg} (Code: ${statusCode})`);
				}
			}

			return data as T;
		} catch (parseError) {
			// If it's already an Error we threw, re-throw it
			if (parseError instanceof Error) {
				throw parseError;
			}

			console.error(
				`Failed to parse response as JSON. Response text:`,
				responseText
			);
			throw new Error(
				`Invalid JSON response from API: ${responseText.substring(0, 100)}`
			);
		}
	} catch (error) {
		console.error(`Hotel API error (${endpoint}):`, error);
		throw error;
	}
}

/**
 * Build PaxRooms array from frontend room configuration
 */
function buildPaxRooms(
	rooms: Array<{
		adults: number;
		children: number;
		childrenAges: number[];
	}>
): PaxRoom[] {
	return rooms.map((room) => ({
		Adults: room.adults,
		Children: room.children,
		ChildrenAges: room.children > 0 ? room.childrenAges : null,
	}));
}

/**
 * Search for hotels
 */
export async function searchHotels(params: {
	checkIn: string; // YYYY-MM-DD
	checkOut: string; // YYYY-MM-DD
	hotelCodes?: string; // Comma-separated hotel codes
	cityCode?: string; // City code for searching all hotels in a city
	countryCode?: string; // Country code
	guestNationality: string; // ISO country code (e.g., "IN", "AE")
	rooms: Array<{
		adults: number;
		children: number;
		childrenAges: number[];
	}>;
	isDetailedResponse?: boolean;
	filters?: {
		refundable?: boolean;
		mealType?: "All" | "WithMeal" | "RoomOnly";
		starRating?: number[];
		minPrice?: number;
		maxPrice?: number;
	};
}) {
	const request: HotelSearchRequest = {
		CheckIn: params.checkIn,
		CheckOut: params.checkOut,
		HotelCodes: params.hotelCodes || "",
		GuestNationality: params.guestNationality,
		NoOfRooms: params.rooms.length,
		PaxRooms: buildPaxRooms(params.rooms),
		ResponseTime: 23.0,
		IsDetailedResponse: params.isDetailedResponse ?? false,
		Filters: params.filters
			? {
					Refundable: params.filters.refundable ?? false,
					NoOfRooms: 0, // 0 to get all available rooms
					MealType: params.filters.mealType || undefined,
					StarRating: params.filters.starRating || undefined,
			  }
			: {
					Refundable: false,
					NoOfRooms: 0,
					MealType: undefined,
					StarRating: undefined,
			  },
	};

	// If searching by city instead of specific hotels
	if (params.cityCode && !params.hotelCodes) {
		// TBO requires hotel codes, so we need to first get hotels in the city
		// This would require a separate API call to get hotel codes by city
		// For now, we'll throw an error if hotel codes aren't provided
		throw new Error(
			"Hotel search by city requires hotel codes. Please use the city search API first."
		);
	}

	return makeAuthenticatedRequest(
		"Search",
		request as unknown as Record<string, unknown>
	);
}

/**
 * Get hotel details from HotelDetails API
 * Endpoint: http://api.tbotechnology.in/TBOHolidays_HotelAPI/Hoteldetails
 */
export async function getHotelDetailsFromApi(params: {
	hotelCode: number | string;
	language?: string;
	isRoomDetailRequired?: boolean;
}): Promise<HotelDetailsResponse> {
	// Use the same endpoint name as tboStaticClient.ts
	const url = `${HOTEL_DETAILS_API_BASE_URL}/HotelDetails`;

	// Format request according to API specification
	// The API expects "Hotelcodes" (plural, no space) based on tboStaticClient implementation
	// Request format: Hotelcodes (String - hotel code as string), Language (String), IsRoomDetailRequired (String)
	const hotelCodeStr = String(params.hotelCode);

	// Validate hotel code is not empty
	if (!hotelCodeStr || hotelCodeStr.trim() === "") {
		throw new Error(`Invalid hotel code: ${params.hotelCode}`);
	}

	const request = {
		Hotelcodes: hotelCodeStr, // Use plural "Hotelcodes" as per API spec - keep as string
		Language: params.language || "EN",
		IsRoomDetailRequired: params.isRoomDetailRequired ? "true" : "false",
	};

	// HotelDetails API uses Basic Auth with Static API credentials
	// IMPORTANT: Hotel Details uses Static API credentials (TBOStaticAPITest / Tbo@11530818)
	// NOT the Affiliate API credentials (Dharmlok / Dharmlok@123)
	const { username, password } = getStaticApiCredentials();

	// Verify credentials are correct
	if (!username || !password) {
		throw new Error(
			"Static API credentials are required. Please set TBO_STATIC_API_USERNAME and TBO_STATIC_API_PASSWORD"
		);
	}

	const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");

	console.log(
		`🔍 Hotel Details API Request to ${url}:`,
		JSON.stringify(request, null, 2)
	);
	console.log(`🔐 Using Static API Basic Auth with username: ${username}`);
	console.log(
		`🔐 Password length: ${password ? password.length : 0} characters`
	);
	console.log(`🔐 Basic Auth header: Basic ${basicAuth.substring(0, 20)}...`);

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Basic ${basicAuth}`,
			},
			body: JSON.stringify(request),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`Hotel Details API HTTP error: ${response.status} - ${errorText}`
			);
			throw new Error(
				`Hotel Details API request failed: ${response.status} ${response.statusText}: ${errorText}`
			);
		}

		const responseText = await response.text();
		try {
			const data = JSON.parse(responseText) as HotelDetailsResponse;

			// Check if the API returned an error status
			if (data.Status && typeof data.Status === "object") {
				const statusCode = data.Status.Code;
				const description = (data.Status.Description || "").toLowerCase();

				const isSuccess =
					statusCode === 1 ||
					statusCode === 0 ||
					(statusCode === 200 &&
						(description.includes("success") || description === "successful"));

				if (!isSuccess) {
					const errorMsg =
						data.Status.Description || `API Error: Code ${statusCode}`;
					console.error(
						`❌ Hotel Details API Error Status: Code ${statusCode}, Description: ${errorMsg}`
					);
					throw new Error(
						`Hotel Details API Error: ${errorMsg} (Code: ${statusCode})`
					);
				}
			}

			return data;
		} catch (parseError) {
			if (parseError instanceof Error) {
				throw parseError;
			}

			console.error(
				`Failed to parse response as JSON. Response text:`,
				responseText
			);
			throw new Error(
				`Invalid JSON response from Hotel Details API: ${responseText.substring(
					0,
					100
				)}`
			);
		}
	} catch (error) {
		console.error(`Hotel Details API error:`, error);
		throw error;
	}
}

/**
 * Get hotel details (legacy function for booking flow)
 */
export async function getHotelDetails(params: {
	hotelCode: string;
	checkIn: string;
	checkOut: string;
	guestNationality: string;
	rooms: Array<{
		adults: number;
		children: number;
		childrenAges: number[];
	}>;
}) {
	const request = {
		HotelCode: params.hotelCode,
		CheckIn: params.checkIn,
		CheckOut: params.checkOut,
		GuestNationality: params.guestNationality,
		NoOfRooms: params.rooms.length,
		PaxRooms: buildPaxRooms(params.rooms),
	};

	return makeAuthenticatedRequest(
		"GetHotelInfo",
		request as unknown as Record<string, unknown>
	);
}

/**
 * Get hotel room details and availability
 */
export async function getHotelRooms(params: {
	resultIndex: string;
	hotelCode: string;
	checkIn: string;
	checkOut: string;
	guestNationality: string;
	rooms: Array<{
		adults: number;
		children: number;
		childrenAges: number[];
	}>;
}) {
	const request = {
		ResultIndex: params.resultIndex,
		HotelCode: params.hotelCode,
		CheckIn: params.checkIn,
		CheckOut: params.checkOut,
		GuestNationality: params.guestNationality,
		NoOfRooms: params.rooms.length,
		PaxRooms: buildPaxRooms(params.rooms),
	};

	return makeAuthenticatedRequest(
		"GetHotelRoom",
		request as unknown as Record<string, unknown>
	);
}

/**
 * PreBook a hotel room
 * This method is used to block a room before final booking
 */
export async function preBookHotel(params: {
	bookingCode: string;
	paymentMode?: string;
}): Promise<Record<string, unknown>> {
	const request = {
		BookingCode: params.bookingCode,
		PaymentMode: params.paymentMode || "Limit",
	};

	return makeAuthenticatedRequest(
		"PreBook",
		request as unknown as Record<string, unknown>
	);
}

/**
 * Block a hotel room before booking
 */
export async function blockHotelRoom(_params: {
	resultIndex: string;
	hotelCode: string;
	hotelName: string;
	checkIn: string;
	checkOut: string;
	guestNationality: string;
	rooms: Array<{
		adults: number;
		children: number;
		childrenAges: number[];
	}>;
	// Add other required booking parameters
}) {
	// Implementation depends on TBO's BlockRoom API requirements
	throw new Error("Block hotel room not yet implemented");
}

/**
 * Search hotels by city name (helper function)
 * This can be used to get city codes before searching hotels
 */
export async function searchCityForHotels(_cityName: string) {
	// This would call TBO's city search API
	// For now, return a placeholder
	throw new Error(
		"City search not yet implemented. Please provide hotel codes directly."
	);
}

/**
 * Get list of available cities/destinations
 */
export async function getHotelDestinations(_params?: {
	countryCode?: string;
	searchTerm?: string;
}) {
	// This would call TBO's destination/city list API
	throw new Error("Get hotel destinations not yet implemented");
}

const tboHotelClient = {
	searchHotels,
	getHotelDetails,
	getHotelRooms,
	preBookHotel,
	blockHotelRoom,
	searchCityForHotels,
	getHotelDestinations,
};

export default tboHotelClient;
