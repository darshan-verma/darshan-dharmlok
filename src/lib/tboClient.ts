/**
 * TBO API Client
 * Provides helper methods to make authenticated requests to TBO API
 */

import { getTboToken, clearTokenCache } from "@/services/tboAuth";
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

		// Debug logging
		console.log(`🔍 TBO Request Debug:`, {
			endpoint,
			service,
			baseUrl,
			fullUrl: url,
			tokenPreview: token ? `${token.substring(0, 20)}...` : "NO TOKEN",
			tokenLength: token?.length || 0,
		});

		const requestOptions: RequestInit = {
			method,
			headers: {
				"Content-Type": "application/json",
				...headers,
			},
		};

		// Add token to request body if it's a POST/PUT request
		let requestBody: unknown = body;
		if (body && (method === "POST" || method === "PUT")) {
			requestBody = {
				...(typeof body === "object" && body !== null ? body : {}),
				TokenId: token,
			};
			requestOptions.body = JSON.stringify(requestBody);
			
			// Log request body (without sensitive data)
			const bodyForLog = typeof requestBody === "object" && requestBody !== null
				? { ...(requestBody as Record<string, unknown>) }
				: {};
			if (bodyForLog.TokenId) {
				bodyForLog.TokenId = `${String(bodyForLog.TokenId).substring(0, 20)}...`;
			}
			console.log(`📤 TBO Request Body:`, JSON.stringify(bodyForLog, null, 2));
		}

		const response = await fetch(url, requestOptions);

		console.log(`📥 TBO Response Status:`, {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok,
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`❌ TBO API HTTP Error:`, {
				status: response.status,
				statusText: response.statusText,
				body: errorText,
			});
			throw new Error(
				`TBO API request failed: ${response.status} ${response.statusText}`
			);
		}

		const data = await response.json();

		// Log full response for debugging (truncate if too large)
		const responseForLog = JSON.stringify(data, null, 2);
		if (responseForLog.length > 1000) {
			console.log(`📥 TBO Response (truncated):`, responseForLog.substring(0, 1000) + "...");
		} else {
			console.log(`📥 TBO Response:`, responseForLog);
		}

		// Check for API-level errors at top level
		if (data.Error && data.Error.ErrorCode !== 0) {
			console.error(`❌ TBO API Error (top level):`, {
				ErrorCode: data.Error.ErrorCode,
				ErrorMessage: data.Error.ErrorMessage,
			});
			
			// Handle "Invalid Token" error - clear cache and retry once
			const errorMessage = data.Error.ErrorMessage || "";
			if (
				errorMessage.toLowerCase().includes("invalid token") ||
				(errorMessage.toLowerCase().includes("token") && 
				 (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("expired")))
			) {
				console.warn("⚠️ Invalid/Expired token detected (top level). Clearing cache and retrying...");
				clearTokenCache();
				
				// Retry the request once with a fresh token
				try {
					const freshToken = await getTboToken();
					
					// Rebuild request with fresh token
					const retryRequestBody = body && (method === "POST" || method === "PUT")
						? {
								...body,
								TokenId: freshToken,
							}
						: body;
					
					const retryRequestOptions: RequestInit = {
						method,
						headers: {
							"Content-Type": "application/json",
							...headers,
						},
					};
					
					if (retryRequestBody && (method === "POST" || method === "PUT")) {
						retryRequestOptions.body = JSON.stringify(retryRequestBody);
					}
					
					console.log("🔄 Retrying request with fresh token (top level error)...");
					const retryResponse = await fetch(url, retryRequestOptions);
					
					if (!retryResponse.ok) {
						throw new Error(
							`TBO API request failed after retry: ${retryResponse.status} ${retryResponse.statusText}`
						);
					}
					
					const retryData = await retryResponse.json();
					
					// Check for errors in retry response
					if (retryData.Error && retryData.Error.ErrorCode !== 0) {
						throw new Error(
							`TBO API Error (after retry): ${retryData.Error.ErrorMessage || "Unknown error"}`
						);
					}
					
					if (
						retryData.Response &&
						retryData.Response.Error &&
						retryData.Response.Error.ErrorCode !== 0
					) {
						throw new Error(
							`TBO API Error (after retry): ${retryData.Response.Error.ErrorMessage || "Unknown error"}`
						);
					}
					
					console.log("✅ Request succeeded after token refresh (top level)");
					return retryData as T;
				} catch (retryError) {
					console.error("❌ Retry failed (top level):", retryError);
					throw new Error(
						`TBO API Error: ${errorMessage} (Token refresh retry also failed)`
					);
				}
			}
			
			throw new Error(
				`TBO API Error: ${errorMessage || "Unknown error"}`
			);
		}

		// Check for API-level errors inside Response object
		if (
			data.Response &&
			data.Response.Error &&
			data.Response.Error.ErrorCode !== 0
		) {
			console.error(`❌ TBO API Error (Response level):`, {
				ErrorCode: data.Response.Error.ErrorCode,
				ErrorMessage: data.Response.Error.ErrorMessage,
				endpoint,
			});
			// Special case: "No result found" is not really an error, just no flights available
			if (
				data.Response.Error.ErrorMessage?.toLowerCase().includes(
					"no result found"
				)
			) {
				// Return the response as is - it should have empty Results array
				return data as T;
			}

			// Special case for FareUpsell: "Supplier end" errors are common and should be handled gracefully
			// IsUpsellAllowed flag doesn't guarantee upsell will actually work
			if (
				endpoint === "FareUpsell" &&
				data.Response.Error.ErrorMessage?.toLowerCase().includes(
					"supplier end"
				)
			) {
				// Log but don't throw - return empty results so the route can handle it
				console.warn(
					"⚠️ FareUpsell: Supplier doesn't support upsell for this flight (even though IsUpsellAllowed may be true)"
				);
				// Return response with error so route can handle it appropriately
				return data as T;
			}

			// Handle "Invalid Token" error - clear cache and retry once
			const errorMessage = data.Response.Error.ErrorMessage || "";
			if (
				errorMessage.toLowerCase().includes("invalid token") ||
				errorMessage.toLowerCase().includes("token") && 
				(errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("expired"))
			) {
				console.warn("⚠️ Invalid/Expired token detected. Clearing cache and retrying...");
				clearTokenCache();
				
				// Retry the request once with a fresh token
				try {
					const freshToken = await getTboToken();
					
					// Rebuild request with fresh token
					const retryRequestBody = body && (method === "POST" || method === "PUT")
						? {
								...body,
								TokenId: freshToken,
							}
						: body;
					
					const retryRequestOptions: RequestInit = {
						method,
						headers: {
							"Content-Type": "application/json",
							...headers,
						},
					};
					
					if (retryRequestBody && (method === "POST" || method === "PUT")) {
						retryRequestOptions.body = JSON.stringify(retryRequestBody);
					}
					
					console.log("🔄 Retrying request with fresh token...");
					const retryResponse = await fetch(url, retryRequestOptions);
					
					if (!retryResponse.ok) {
						throw new Error(
							`TBO API request failed after retry: ${retryResponse.status} ${retryResponse.statusText}`
						);
					}
					
					const retryData = await retryResponse.json();
					
					// Check for errors in retry response
					if (retryData.Error && retryData.Error.ErrorCode !== 0) {
						throw new Error(
							`TBO API Error (after retry): ${retryData.Error.ErrorMessage || "Unknown error"}`
						);
					}
					
					if (
						retryData.Response &&
						retryData.Response.Error &&
						retryData.Response.Error.ErrorCode !== 0
					) {
						throw new Error(
							`TBO API Error (after retry): ${retryData.Response.Error.ErrorMessage || "Unknown error"}`
						);
					}
					
					console.log("✅ Request succeeded after token refresh");
					return retryData as T;
				} catch (retryError) {
					console.error("❌ Retry failed:", retryError);
					throw new Error(
						`TBO API Error: ${errorMessage} (Token refresh retry also failed)`
					);
				}
			}

			throw new Error(
				`TBO API Error: ${errorMessage || "Unknown error"}`
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
