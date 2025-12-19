/**
 * TBO API Client
 * Provides helper methods to make authenticated requests to TBO API
 */

import { getTboToken } from "@/services/tboAuth";
import type {
	FlightSearchRequest,
	FlightSearchResponse,
	FareRuleRequest,
	FareRuleResponse,
	FareQuoteRequest,
	FareQuoteResponse,
	BookingRequest,
	BookingResponse,
	SeatMapRequest,
	SeatMapResponse,
	FareUpsellRequest,
	FareUpsellResponse,
	PriceRBDRequest,
	PriceRBDResponse,
	SSRRequest,
	SSRResponse,
} from "@/types/tbo";

const API_BASE_URL = process.env.TEKTRAVELS_API_URL || "";
const BOOKING_API_BASE_URL = process.env.TEKTRAVELS_BOOKING_API_URL || "";

export interface TboRequestConfig {
	endpoint: string;
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
	headers?: Record<string, string>;
	service?: "auth" | "booking"; // Specify which service to use
}

/**
 * Make an authenticated request to TBO API
 * Automatically includes the authentication token
 */
export async function tboRequest<T = unknown>(
	config: TboRequestConfig
): Promise<T> {
	const {
		endpoint,
		method = "POST",
		body,
		headers = {},
		service = "auth",
	} = config;

	try {
		// Get valid token (from cache or by authenticating)
		const token = await getTboToken();

		// Use appropriate base URL based on service
		const baseUrl = service === "booking" ? BOOKING_API_BASE_URL : API_BASE_URL;

		const url = endpoint.startsWith("http")
			? endpoint
			: `${baseUrl}/${endpoint}`;

		const requestOptions: RequestInit = {
			method,
			headers: {
				"Content-Type": "application/json",
				...headers,
			},
		};

		// Add token to request body if it's a POST/PUT request
		if (body && (method === "POST" || method === "PUT")) {
			requestOptions.body = JSON.stringify({
				...body,
				TokenId: token,
			});
		}

		const response = await fetch(url, requestOptions);

		if (!response.ok) {
			throw new Error(
				`TBO API request failed: ${response.status} ${response.statusText}`
			);
		}

		const data = await response.json();

		// Check for API-level errors at top level
		if (data.Error && data.Error.ErrorCode !== 0) {
			throw new Error(
				`TBO API Error: ${data.Error.ErrorMessage || "Unknown error"}`
			);
		}

		// Check for API-level errors inside Response object
		if (
			data.Response &&
			data.Response.Error &&
			data.Response.Error.ErrorCode !== 0
		) {
			// Special case: "No result found" is not really an error, just no flights available
			if (
				data.Response.Error.ErrorMessage?.toLowerCase().includes(
					"no result found"
				)
			) {
				// Return the response as is - it should have empty Results array
				return data as T;
			}
			throw new Error(
				`TBO API Error: ${data.Response.Error.ErrorMessage || "Unknown error"}`
			);
		}

		return data as T;
	} catch (error) {
		console.error(`TBO API Error (${endpoint}):`, error);
		throw error;
	}
}

/**
 * Search for flights
 */
export async function searchFlights(
	searchParams: Omit<FlightSearchRequest, "TokenId">
): Promise<FlightSearchResponse> {
	return tboRequest<FlightSearchResponse>({
		endpoint: "Search",
		method: "POST",
		body: searchParams,
		service: "booking",
	});
}

/**
 * Get fare rules for a flight
 */
export async function getFareRules(
	fareRuleParams: Omit<FareRuleRequest, "TokenId">
): Promise<FareRuleResponse> {
	return tboRequest<FareRuleResponse>({
		endpoint: "FareRule",
		method: "POST",
		body: fareRuleParams,
		service: "booking",
	});
}

/**
 * Get fare quote (detailed pricing)
 */
export async function getFareQuote(
	fareQuoteParams: Omit<FareQuoteRequest, "TokenId">
): Promise<FareQuoteResponse> {
	return tboRequest<FareQuoteResponse>({
		endpoint: "FareQuote",
		method: "POST",
		body: fareQuoteParams,
		service: "booking",
	});
}

/**
 * Get SSR (Special Service Request) options
 */
export async function getSSR(
	ssrParams: Omit<SSRRequest, "TokenId">
): Promise<SSRResponse> {
	return tboRequest<SSRResponse>({
		endpoint: "SSR",
		method: "POST",
		body: ssrParams,
		service: "booking",
	});
}

/**
 * Get seat map
 */
export async function bookFlight(
	bookingParams: Omit<BookingRequest, "TokenId">
): Promise<BookingResponse> {
	return tboRequest<BookingResponse>({
		endpoint: "Book",
		method: "POST",
		body: bookingParams,
		service: "booking",
	});
}

/**
 * Get booking details
 */
export async function getBookingDetails(
	bookingParams: Record<string, unknown>
) {
	return tboRequest({
		endpoint: "GetBookingDetails",
		method: "POST",
		body: bookingParams,
		service: "booking",
	});
}

/**
 * Cancel booking
 */
export async function cancelBooking(cancelParams: Record<string, unknown>) {
	return tboRequest({
		endpoint: "Cancel",
		method: "POST",
		body: cancelParams,
		service: "booking",
	});
}

/**
 * Send change request for booking
 */
export async function sendChangeRequest(changeParams: Record<string, unknown>) {
	return tboRequest({
		endpoint: "SendChangeRequest",
		method: "POST",
		body: changeParams,
		service: "booking",
	});
}

/**
 * Get calendar fare
 */
export async function getCalendarFare(calendarParams: Record<string, unknown>) {
	return tboRequest({
		endpoint: "GetCalendarFare",
		method: "POST",
		body: calendarParams,
		service: "booking",
	});
}

/**
 * Get fare upsell options
 */
export async function getFareUpsell(
	fareUpsellParams: Omit<FareUpsellRequest, "TokenId">
): Promise<FareUpsellResponse> {
	return tboRequest<FareUpsellResponse>({
		endpoint: "FareUpsell",
		method: "POST",
		body: fareUpsellParams,
		service: "booking",
	});
}

/**
 * Get price RBD
 */
export async function getPriceRBD(
	priceRBDParams: Omit<PriceRBDRequest, "TokenId">
): Promise<PriceRBDResponse> {
	return tboRequest<PriceRBDResponse>({
		endpoint: "PriceRBD",
		method: "POST",
		body: priceRBDParams,
		service: "booking",
	});
}

/**
 * SSR (Special Service Request) methods
 */
export const SSR = {
	/**
	 * Get seat map for a flight
	 */
	getSeatMap: async (
		seatMapParams: Omit<SeatMapRequest, "TokenId">
	): Promise<SeatMapResponse> => {
		return tboRequest<SeatMapResponse>({
			endpoint: "SeatMap",
			method: "POST",
			body: seatMapParams,
			service: "booking",
		});
	},

	/**
	 * Get meal options
	 */
	getMeal: async (mealParams: Record<string, unknown>) => {
		return tboRequest({
			endpoint: "Meal",
			method: "POST",
			body: mealParams,
			service: "booking",
		});
	},

	/**
	 * Get baggage options
	 */
	getBaggage: async (baggageParams: Record<string, unknown>) => {
		return tboRequest({
			endpoint: "Baggage",
			method: "POST",
			body: baggageParams,
			service: "booking",
		});
	},
};
