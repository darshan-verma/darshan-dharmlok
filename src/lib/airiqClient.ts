/**
 * AIRiQ API Client
 * Provides helper methods to make authenticated requests to AIRiQ API
 */

import { getAiriqToken, clearTokenCache } from "@/services/airiqAuth";
import type {
	AiriqFlightSearchRequest,
	AiriqFlightSearchResponse,
	AiriqFareRuleRequest,
	AiriqFareRuleResponse,
	AiriqFareQuoteRequest,
	AiriqFareQuoteResponse,
	AiriqBookingRequest,
	AiriqBookingResponse,
	AiriqSSRRequest,
	AiriqSSRResponse,
} from "@/types/airiq";
import type { FlightSearchResponse, FlightSegment } from "@/types/tbo";

const API_BASE_URL = process.env.AIRIQ_API_URL || "";
const AUTH_HEADER = process.env.AIRIQ_AUTH_HEADER || "";

export interface AiriqRequestConfig {
	endpoint: string;
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
	headers?: Record<string, string>;
}

/**
 * Make an authenticated request to AIRiQ API
 * Automatically includes the authentication token and authorization header
 * Retries once with a fresh token if token timeout occurs
 */
export async function airiqRequest<T = unknown>(
	config: AiriqRequestConfig,
	isRetry = false
): Promise<T> {
	const { endpoint, method = "POST", body, headers = {} } = config;

	try {
		// Get valid token (from cache or by authenticating)
		const token = await getAiriqToken();

		const url = endpoint.startsWith("http")
			? endpoint
			: `${API_BASE_URL}/${endpoint}`;

		const requestOptions: RequestInit = {
			method,
			headers: {
				"Content-Type": "application/json",
				Authorization: AUTH_HEADER,
				TOKEN: token, // Token must be sent in header as "TOKEN" (all caps)
				...headers,
			},
		};

		console.log(
			`🔍 AIRiQ ${endpoint} Headers:`,
			JSON.stringify(
				{
					"Content-Type": "application/json",
					Authorization: AUTH_HEADER.substring(0, 20) + "...",
					TOKEN: token.substring(0, 30) + "...",
				},
				null,
				2
			)
		);

		// Add body for POST/PUT requests (Token is in header, not body)
		if (body && (method === "POST" || method === "PUT")) {
			console.log(
				`🔍 AIRiQ ${endpoint} Request Body:`,
				JSON.stringify(body, null, 2)
			);
			requestOptions.body = JSON.stringify(body);
		}

		console.log(`📡 AIRiQ Request to: ${url}`);
		const response = await fetch(url, requestOptions);

		console.log(
			`📡 AIRiQ ${endpoint} Response Status:`,
			response.status,
			response.statusText
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`❌ AIRiQ ${endpoint} Response Error:`, errorText);
			throw new Error(
				`AIRiQ API request failed: ${response.status} ${response.statusText} - ${errorText}`
			);
		}

		const responseText = await response.text();
		const preview =
			responseText.length > 500
				? responseText.substring(0, 500) + "..."
				: responseText;
		console.log(
			`📦 AIRiQ ${endpoint} Raw Response (first 500 chars):`,
			preview
		);

		let data;
		try {
			data = JSON.parse(responseText);
		} catch (parseError) {
			console.error(
				`❌ Failed to parse ${endpoint} response as JSON:`,
				parseError
			);
			console.error(`Raw response: ${responseText}`);
			throw new Error(`Invalid JSON response from AIRiQ ${endpoint}`);
		}

		console.log(`📦 AIRiQ ${endpoint} Response Keys:`, Object.keys(data));

		// Check for AIRiQ Status error (per API doc: ResultCode "1" = success, "0" = failure, "-1" = exception)
		// Check Status object for errors (present in all AIRiQ responses)
		if (data.Status) {
			const { ResultCode, Error: errorMsg, SequenceID } = data.Status;
			console.log(
				`📊 AIRiQ ${endpoint} Status - ResultCode: ${ResultCode}, SequenceID: ${SequenceID}`
			);

			if (ResultCode !== "1") {
				const errorMessage = errorMsg || "API request failed";
				console.error(
					`❌ AIRiQ ${endpoint} Error - Code: ${ResultCode}, Message: ${errorMessage}`
				);

				// If token timeout and this is not a retry, clear cache and retry once
				if (
					!isRetry &&
					(errorMessage.toLowerCase().includes("token") ||
						errorMessage.toLowerCase().includes("timeout"))
				) {
					console.log(
						"🔄 Token issue detected, clearing cache and retrying..."
					);
					clearTokenCache();
					return await airiqRequest<T>(config, true);
				}

				throw new Error(
					`AIRiQ ${endpoint} Error (Code ${ResultCode}): ${errorMessage}`
				);
			}
		}

		// Check if response has no flights (empty or null ItineraryFlightList)
		if (endpoint === "Availability") {
			if (!data.ItineraryFlightList || data.ItineraryFlightList.length === 0) {
				console.log(
					"⚠️ AIRiQ Availability: No flights found for the search criteria"
				);
			} else {
				const totalItems = data.ItineraryFlightList.reduce(
					(sum: number, itinerary: { Items?: unknown[] }) =>
						sum + (itinerary.Items?.length || 0),
					0
				);
				console.log(
					`✅ AIRiQ Availability: Found ${totalItems} flight options`
				);
			}
			return data as T;
		}

		return data as T;
	} catch (error) {
		console.error(`AIRiQ API Error (${endpoint}):`, error);
		throw error;
	}
}

/**
 * Search for flights
 */
export async function searchFlights(
	searchParams: Omit<AiriqFlightSearchRequest, "Token">
): Promise<AiriqFlightSearchResponse> {
	return airiqRequest<AiriqFlightSearchResponse>({
		endpoint: "Availability",
		method: "POST",
		body: searchParams,
	});
}

/**
 * Get fare rules for a flight
 */
export async function getFareRules(
	fareRuleParams: Omit<AiriqFareRuleRequest, "Token">
): Promise<AiriqFareRuleResponse> {
	return airiqRequest<AiriqFareRuleResponse>({
		endpoint: "FareRule",
		method: "POST",
		body: fareRuleParams,
	});
}

/**
 * Get fare quote (detailed pricing)
 */
export async function getFareQuote(
	fareQuoteParams: Omit<AiriqFareQuoteRequest, "Token">
): Promise<AiriqFareQuoteResponse> {
	return airiqRequest<AiriqFareQuoteResponse>({
		endpoint: "FareQuote",
		method: "POST",
		body: fareQuoteParams,
	});
}

/**
 * Get SSR (Special Service Request) options
 */
export async function getSSR(
	ssrParams: Omit<AiriqSSRRequest, "Token">
): Promise<AiriqSSRResponse> {
	return airiqRequest<AiriqSSRResponse>({
		endpoint: "SSR",
		method: "POST",
		body: ssrParams,
	});
}

/**
 * Book a flight
 */
export async function bookFlight(
	bookingParams: Omit<AiriqBookingRequest, "Token">
): Promise<AiriqBookingResponse> {
	return airiqRequest<AiriqBookingResponse>({
		endpoint: "Book",
		method: "POST",
		body: bookingParams,
	});
}

/**
 * Get booking details
 */
export async function getBookingDetails(
	bookingParams: Record<string, unknown>
) {
	return airiqRequest({
		endpoint: "GetBookingDetails",
		method: "POST",
		body: bookingParams,
	});
}

/**
 * Cancel booking
 */
export async function cancelBooking(cancelParams: Record<string, unknown>) {
	return airiqRequest({
		endpoint: "Cancel",
		method: "POST",
		body: cancelParams,
	});
}

/**
 * Convert AIRiQ flight response to TBO-compatible format
 */
export function convertAiriqToTboFormat(
	airiqResponse: AiriqFlightSearchResponse
): FlightSearchResponse {
	if (
		!airiqResponse.ItineraryFlightList ||
		airiqResponse.ItineraryFlightList.length === 0
	) {
		return {
			Response: {
				TraceId: airiqResponse.Trackid,
				Results: [[]],
				Origin: "",
				Destination: "",
				FlightCabinClass: 1,
			},
		};
	}

	// Determine if this is a roundtrip based on having 2 ItineraryFlightList items
	const isRoundtrip = airiqResponse.ItineraryFlightList.length === 2;

	if (isRoundtrip) {
		console.log("🔄 Converting AIRiQ Roundtrip Flight Response");
		// For roundtrip, separate outbound and return flights
		const outboundItinerary = airiqResponse.ItineraryFlightList[0];
		const returnItinerary = airiqResponse.ItineraryFlightList[1];

		const outboundFlights: Array<Record<string, unknown>> = [];
		const returnFlights: Array<Record<string, unknown>> = [];

		// Convert outbound flights
		for (const item of outboundItinerary.Items) {
			const flight = convertAiriqItemToTboFlight(item);
			if (flight) {
				outboundFlights.push(flight);
			}
		}

		// Convert return flights
		for (const item of returnItinerary.Items) {
			const flight = convertAiriqItemToTboFlight(item);
			if (flight) {
				returnFlights.push(flight);
			}
		}

		console.log(
			`✅ Converted ${outboundFlights.length} outbound and ${returnFlights.length} return AIRiQ flights`
		);

		return {
			Response: {
				TraceId: airiqResponse.Trackid,
				Results: [
					outboundFlights as unknown as FlightSearchResponse["Response"]["Results"][0],
					returnFlights as unknown as FlightSearchResponse["Response"]["Results"][0],
				],
				Origin: "",
				Destination: "",
				FlightCabinClass: 1,
			},
		};
	} else {
		// For one-way or multi-city, keep existing behavior
		console.log("➡️ Converting AIRiQ One-way Flight Response");
		const tboFlights: Array<Record<string, unknown>> = [];

		for (const itinerary of airiqResponse.ItineraryFlightList) {
			for (const item of itinerary.Items) {
				const flight = convertAiriqItemToTboFlight(item);
				if (flight) {
					tboFlights.push(flight);
				}
			}
		}

		console.log(`✅ Converted ${tboFlights.length} AIRiQ flights`);

		return {
			Response: {
				TraceId: airiqResponse.Trackid,
				Results: [
					tboFlights as unknown as FlightSearchResponse["Response"]["Results"][0],
				],
				Origin: "",
				Destination: "",
				FlightCabinClass: 1,
			},
		};
	}
}

/**
 * Helper function to convert a single AIRiQ item to TBO flight format
 */
function convertAiriqItemToTboFlight(
	item: AiriqFlightSearchResponse["ItineraryFlightList"][0]["Items"][0]
): Record<string, unknown> | null {
	const flightDetails = item.FlightDetails;
	const fares = item.Fares[0]; // Take first fare
	const fareDesc = fares?.Faredescription[0]; // Take first passenger type

	if (!flightDetails || flightDetails.length === 0) return null;

	const firstSegment = flightDetails[0];

	// Convert segments to TBO format
	const tboSegments = flightDetails.map(
		(
			seg: AiriqFlightSearchResponse["ItineraryFlightList"][0]["Items"][0]["FlightDetails"][0]
		) => ({
			Airline: {
				AirlineCode: seg.AirlineDescription,
				AirlineName: seg.AirlineDescription,
				FlightNumber: seg.FlightNumber,
				FareClass: seg.Class,
			},
			Origin: {
				Airport: {
					AirportCode: seg.Origin,
					AirportName: seg.Origin,
					Terminal: seg.DepartureTerminal,
					CityCode: seg.Origin,
					CityName: seg.Origin,
					CountryCode: "IN",
					CountryName: "India",
				},
				DepTime: new Date(seg.DepartureDateTime).toISOString(),
			},
			Destination: {
				Airport: {
					AirportCode: seg.Destination,
					AirportName: seg.Destination,
					Terminal: seg.ArrivalTerminal,
					CityCode: seg.Destination,
					CityName: seg.Destination,
					CountryCode: "IN",
					CountryName: "India",
				},
				ArrTime: new Date(seg.ArrivalDateTime).toISOString(),
			},
			Duration: parseInt(seg.FlyingTime) || 0,
			GroundTime: 0,
			Mile: 0,
			StopOver: false,
			FlightStatus: "",
			StopPoint: seg.Via,
			Craft: "",
			Remark: seg.SegmentDetails,
			IsETicketEligible: true,
			Baggage: seg.Baggage,
			CabinBaggage: seg.CabinBaggage,
		})
	);

	// Convert fare to TBO format
	const baseFare = parseFloat(fareDesc?.BaseAmount || "0");
	const tax = parseFloat(fareDesc?.TotalTaxAmount || "0");
	const publishedFare = parseFloat(fareDesc?.GrossAmount || "0");

	return {
		ResultIndex: firstSegment.ReferenceToken,
		Source: 2, // AIRiQ source identifier
		IsLCC: firstSegment.AirlineCategory === "LCC",
		IsRefundable:
			firstSegment.Refundable === "Y" || firstSegment.Refundable === "Yes",
		IsUpsellAllowed: false,
		AirlineCode: firstSegment.AirlineDescription,
		ValidatingAirlineCode: firstSegment.PlatingCarrier,
		AirlineRemark: "",
		Segments: [tboSegments],
		Fare: {
			Currency: fares.Currency,
			BaseFare: baseFare,
			Tax: tax,
			TaxBreakup:
				fareDesc?.Taxes?.map((t: { Code: string; Amount: string }) => ({
					key: t.Code,
					value: parseFloat(t.Amount),
				})) || [],
			YQTax: 0,
			AdditionalTxnFeeOfrd: 0,
			AdditionalTxnFeePub: 0,
			PGCharge: 0,
			OtherCharges: 0,
			ChargeBU: [],
			Discount: parseFloat(fareDesc?.Discount || "0"),
			PublishedFare: publishedFare,
			CommissionEarned: 0,
			PLBEarned: parseFloat(fareDesc?.PLBAmount || "0"),
			IncentiveEarned: parseFloat(fareDesc?.Incentive || "0"),
			OfferedFare: publishedFare,
			TdsOnCommission: parseFloat(fareDesc?.TDS || "0"),
			TdsOnPLB: 0,
			TdsOnIncentive: 0,
			ServiceFee: parseFloat(fareDesc?.Servicecharge || "0"),
			TotalBaggageCharges: 0,
			TotalMealCharges: 0,
			TotalSeatCharges: 0,
			TotalSpecialServiceCharges: 0,
			NetPayable: parseFloat(fareDesc?.NetAmount || "0"),
		},
		FareBreakdown: [],
	};
}

/**
 * Helper function to convert TBO search parameters to AIRiQ format
 */
export function convertTboToAiriqParams(
	tboParams: Record<string, unknown>
): Omit<AiriqFlightSearchRequest, "Token"> {
	const agentId = process.env.AIRIQ_AGENT_ID || "AQAG060270";
	const username = process.env.AIRIQ_USERNAME || "7506209217";

	// Convert JourneyType: "1" = OneWay (O), "2" = Return (R), "3" = MultiCity (M)
	const journeyType = tboParams.JourneyType as string;
	const tripType = journeyType === "2" ? "R" : journeyType === "3" ? "M" : "O";

	// Convert cabin class: "1" = Economy (E), "4" = Business (B), "6" = First (F)
	const segments = (tboParams.Segments as FlightSegment[]) || [];
	const cabinClass = segments[0]?.FlightCabinClass || "1";
	const farecabinOption =
		cabinClass === "4" ? "B" : cabinClass === "6" ? "F" : "E";

	// Convert segments to AIRiQ AvailInfo format
	const availInfo = segments.map((segment) => {
		// Convert date from "2026-01-14T00:00:00" to "20260114"
		const dateStr = segment.PreferredDepartureTime;
		const date = new Date(dateStr);
		const flightDate = `${date.getFullYear()}${String(
			date.getMonth() + 1
		).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

		return {
			DepartureStation: segment.Origin,
			ArrivalStation: segment.Destination,
			FlightDate: flightDate,
			FarecabinOption: farecabinOption,
			FareType: "N", // Normal fare
			OnlyDirectFlight: tboParams.DirectFlight === "true" || false,
		};
	});

	return {
		AgentInfo: {
			AgentId: agentId,
			UserName: username,
			AppType: "API",
			Version: 2.0,
		},
		TripType: tripType,
		AirlineID: "", // Empty for all airlines
		AvailInfo: availInfo,
		PassengersInfo: {
			AdultCount: tboParams.AdultCount as string,
			ChildCount: tboParams.ChildCount as string,
			InfantCount: tboParams.InfantCount as string,
		},
	};
}
