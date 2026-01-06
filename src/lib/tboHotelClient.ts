/**
 * TBO Hotel API Client
 * Handles all hotel-related API calls with automatic token management
 */

import { getTboToken } from "@/services/tboAuth";
import type {
	HotelSearchRequest,
	PaxRoom,
	HotelFilters,
} from "@/types/hotelApi";

const HOTEL_API_BASE_URL =
	process.env.TEKTRAVELS_HOTEL_API_URL ||
	"http://api.tektravels.com/BookingEngineService_Hotel/HotelService.svc/rest";

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
	body: any
): Promise<T> {
	const token = await getTboToken();
	const url = `${getHotelApiUrl()}/${endpoint}`;

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				...body,
				TokenId: token,
			}),
		});

		if (!response.ok) {
			throw new Error(
				`Hotel API request failed: ${response.status} ${response.statusText}`
			);
		}

		const data = await response.json();
		return data as T;
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
		ChildrenAges: room.childrenAges,
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
		IsDetailedResponse: params.isDetailedResponse ?? false,
	};

	// Add filters if provided
	if (params.filters) {
		request.Filters = {
			Refundable: params.filters.refundable ?? false,
			MealType: params.filters.mealType ?? "All",
		};
	}

	// If searching by city instead of specific hotels
	if (params.cityCode && !params.hotelCodes) {
		// TBO requires hotel codes, so we need to first get hotels in the city
		// This would require a separate API call to get hotel codes by city
		// For now, we'll throw an error if hotel codes aren't provided
		throw new Error(
			"Hotel search by city requires hotel codes. Please use the city search API first."
		);
	}

	return makeAuthenticatedRequest("GetHotelResult", request);
}

/**
 * Get hotel details
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

	return makeAuthenticatedRequest("GetHotelInfo", request);
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

	return makeAuthenticatedRequest("GetHotelRoom", request);
}

/**
 * Block a hotel room before booking
 */
export async function blockHotelRoom(params: {
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
export async function searchCityForHotels(cityName: string) {
	// This would call TBO's city search API
	// For now, return a placeholder
	throw new Error(
		"City search not yet implemented. Please provide hotel codes directly."
	);
}

/**
 * Get list of available cities/destinations
 */
export async function getHotelDestinations(params?: {
	countryCode?: string;
	searchTerm?: string;
}) {
	// This would call TBO's destination/city list API
	throw new Error("Get hotel destinations not yet implemented");
}

export default {
	searchHotels,
	getHotelDetails,
	getHotelRooms,
	blockHotelRoom,
	searchCityForHotels,
	getHotelDestinations,
};
