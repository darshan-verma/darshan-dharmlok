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
	AiriqIssueTicketRequest,
	AiriqIssueTicketResponse,
	AiriqSSRRequest,
	AiriqSSRResponse,
	AiriqPostBookingSSRRequest,
	AiriqPostBookingSSRResponse,
	AiriqAddPostBookingSSRRequest,
	AiriqAddPostBookingSSRResponse,
	AiriqPricingRequest,
	AiriqPricingResponse,
	AiriqSeatMapRequest,
	AiriqSeatMapResponse,
	AiriqRetrieveBookingRequest,
	AiriqRetrieveBookingResponse,
	AiriqGetMultiClassRequest,
	AiriqGetMultiClassResponse,
	AiriqGetMultiClassFareRequest,
	AiriqGetMultiClassFareResponse,
} from "@/types/airiq";
import type {
	AiriqCancellationRequest,
	AiriqCancellationResponse,
	AiriqHoldCancelRequest,
	AiriqHoldCancelResponse,
	AiriqRescheduleAvailRequest,
	AiriqRescheduleAvailResponse,
	AiriqRescheduleRequest,
	AiriqRescheduleResponse,
} from "@/types/airiq";
import type { FlightSearchResponse, FlightSegment } from "@/types/tbo";

const API_BASE_URL = process.env.AIRIQ_API_URL || "";
const AUTH_HEADER = process.env.AIRIQ_AUTH_HEADER || "";

export interface AiriqRequestConfig {
	endpoint: string;
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
	headers?: Record<string, string>;
	skipStatusCheck?: boolean;
	/** Default from AIRIQ_REQUEST_TIMEOUT_MS or 45s (test host is often slow). */
	timeoutMs?: number;
}

const AIRIQ_DEFAULT_TIMEOUT_MS = Math.max(
	15_000,
	parseInt(process.env.AIRIQ_REQUEST_TIMEOUT_MS || "45000", 10) || 45_000
);

/**
 * Make an authenticated request to AIRiQ API
 * Automatically includes the authentication token and authorization header
 * Retries once with a fresh token if token timeout occurs
 */
export async function airiqRequest<T = unknown>(
	config: AiriqRequestConfig,
	isRetry = false
): Promise<T> {
	const {
		endpoint,
		method = "POST",
		body,
		headers = {},
		skipStatusCheck = false,
		timeoutMs = AIRIQ_DEFAULT_TIMEOUT_MS,
	} = config;

	try {
		// Get valid token (from cache or by authenticating)
		const token = await getAiriqToken();

		const url = endpoint.startsWith("http")
			? endpoint
			: `${API_BASE_URL}/${endpoint}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		const requestOptions: RequestInit = {
			method,
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
				Authorization: AUTH_HEADER,
				TOKEN: token, // Token must be sent in header as "TOKEN" (all caps)
				...headers,
			},
		};

		// Add body for POST/PUT requests (Token is in header, not body)
		if (body && (method === "POST" || method === "PUT")) {
			requestOptions.body = JSON.stringify(body);
		}
		let response: Response;
		try {
			response = await fetch(url, requestOptions);
		} finally {
			clearTimeout(timeoutId);
		}

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
		// Booking endpoint uses "2" for pending which the caller handles directly
		if (data.Status) {
			const status = data.Status as Record<string, unknown>;
			const { ResultCode, SequenceID } = data.Status;
			const errorMsg = status.Error ?? status.Message ?? (data.Status as { Error?: string }).Error;
			console.log(
				`📊 AIRiQ ${endpoint} Status - ResultCode: ${ResultCode}, SequenceID: ${SequenceID}`
			);

			if (!skipStatusCheck && ResultCode !== "1") {
				const errorMessage =
					typeof errorMsg === "string" && errorMsg.trim()
						? errorMsg
						: "API request failed";
				console.error(
					`❌ AIRiQ ${endpoint} Error - Code: ${ResultCode}, Message: ${errorMessage}`
				);
				// Log full response for diagnostics (Status, AvailDetails, Trackid, etc.)
				console.error(`❌ AIRiQ ${endpoint} full response:`, JSON.stringify({
					Status: data.Status,
					AvailDetails: data.AvailDetails ?? null,
					Trackid: data.Trackid ?? null,
				}));

				if (
					!isRetry &&
					(errorMessage.toLowerCase().includes("token") ||
						errorMessage.toLowerCase().includes("timeout"))
				) {
					console.log(
						"🔄 Token issue detected, clearing cache and retrying..."
					);
					await clearTokenCache();
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
		// Surface clear message for connect/timeout and other network errors
		const cause = error instanceof Error ? (error as Error & { cause?: { code?: string } }).cause : undefined;
		const causeCode = cause && typeof cause === "object" && "code" in cause ? (cause as { code?: string }).code : undefined;
		const errMessage = error instanceof Error ? error.message : String(error);
		const isAbort =
			error instanceof Error && error.name === "AbortError";
		const isTimeout =
			isAbort ||
			causeCode === "UND_ERR_CONNECT_TIMEOUT" ||
			/timeout|ETIMEDOUT|aborted/i.test(errMessage) ||
			(cause && typeof cause === "object" && "message" in cause && /timeout|ETIMEDOUT|aborted/i.test(String((cause as { message?: string }).message)));
		const isNetwork =
			isTimeout ||
			/ECONNREFUSED|ENOTFOUND|fetch failed|network/i.test(errMessage) ||
			(causeCode && /UND_ERR|ECONNREFUSED|ENOTFOUND/i.test(causeCode));
		if (isNetwork) {
			const friendlyMessage =
				isTimeout
					? "AIRiQ service timed out or unreachable. Please try again."
					: "AIRiQ service unreachable. Please try again.";
			throw new Error(friendlyMessage, { cause: error });
		}
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
	fareRuleParams: AiriqFareRuleRequest
): Promise<AiriqFareRuleResponse> {
	return airiqRequest<AiriqFareRuleResponse>({
		endpoint: "GetFareRule",
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
 * Get SSR (Special Service Request) options (pre-booking)
 * Doc: GetSSR → {URL}/GetSSR
 */
export async function getSSR(
	ssrParams: Omit<AiriqSSRRequest, "Token">
): Promise<AiriqSSRResponse> {
	return airiqRequest<AiriqSSRResponse>({
		endpoint: "GetSSR",
		method: "POST",
		body: ssrParams,
	});
}

/**
 * Get post-booking SSR (PostAncillaryAvail) - uses PNRs
 * Naming aligned with doc: RescheduleAvail, GetAvailSeatMap (PascalCase, no spaces)
 */
export async function getPostBookingSSR(
	ssrParams: Omit<AiriqPostBookingSSRRequest, "Token">
): Promise<AiriqPostBookingSSRResponse> {
	return airiqRequest<AiriqPostBookingSSRResponse>({
		endpoint: "PostAncillaryAvail",
		method: "POST",
		body: ssrParams,
	});
}

/**
 * Add post-booking SSR (Add SSR) - doc 15.6–15.9. Uses TrackId from Get SSR and PNRs.
 */
export async function addPostBookingSSR(
	params: AiriqAddPostBookingSSRRequest
): Promise<AiriqAddPostBookingSSRResponse> {
	return airiqRequest<AiriqAddPostBookingSSRResponse>({
		endpoint: "AddSSR",
		method: "POST",
		body: params,
		skipStatusCheck: true,
	});
}

/**
 * Get detailed pricing for selected flight
 * Re-prices the chosen route and returns full fare breakdown, baggage allowance,
 * mandatory booking details, and available SSRs (meals, baggage, seats, etc.)
 */
export async function getPricing(
	pricingParams: AiriqPricingRequest
): Promise<AiriqPricingResponse> {
	return airiqRequest<AiriqPricingResponse>({
		endpoint: "Pricing",
		method: "POST",
		body: pricingParams,
	});
}

/**
 * GetMultiClass (doc 17) – available fare classes per flight
 */
export async function getMultiClass(
	params: AiriqGetMultiClassRequest
): Promise<AiriqGetMultiClassResponse> {
	return airiqRequest<AiriqGetMultiClassResponse>({
		endpoint: "GetMultiClass",
		method: "POST",
		body: params,
		skipStatusCheck: true,
		timeoutMs: Math.max(
			AIRIQ_DEFAULT_TIMEOUT_MS,
			parseInt(process.env.AIRIQ_MULTICLASS_TIMEOUT_MS || "60000", 10) || 60_000
		),
	});
}

/**
 * GetMultiClassFare (doc 18) – fare for selected class; returns new Trackid and FlightDetails
 */
export async function getMultiClassFare(
	params: AiriqGetMultiClassFareRequest
): Promise<AiriqGetMultiClassFareResponse> {
	return airiqRequest<AiriqGetMultiClassFareResponse>({
		endpoint: "GetMultiClassFare",
		method: "POST",
		body: params,
		timeoutMs: Math.max(
			AIRIQ_DEFAULT_TIMEOUT_MS,
			parseInt(process.env.AIRIQ_MULTICLASS_TIMEOUT_MS || "60000", 10) || 60_000
		),
	});
}

/**
 * Get seat map for selected flight
 * Returns seat layout, availability, and pricing for each seat
 */
export async function getSeatMap(
	seatMapParams: AiriqSeatMapRequest
): Promise<AiriqSeatMapResponse> {
	return airiqRequest<AiriqSeatMapResponse>({
		endpoint: "GetAvailSeatMap",
		method: "POST",
		body: seatMapParams,
	});
}

/**
 * Book a flight (Section 8 of Airiq API docs)
 * skipStatusCheck is true because the Book endpoint can return ResultCode "2" (pending)
 * which the route handler needs to distinguish from errors.
 */
export async function bookFlight(
	bookingParams: AiriqBookingRequest
): Promise<AiriqBookingResponse> {
	return airiqRequest<AiriqBookingResponse>({
		endpoint: "Book",
		method: "POST",
		body: bookingParams,
		skipStatusCheck: true,
	});
}

/**
 * Issue ticket (Section 9 - Ticketing, doc method: IssueTicket, URL: {URL}/IssueTicket)
 * Confirm the ticket for an already blocked itinerary. Call after Book returns success (ResultCode "1").
 * Response per 9.5: TrackId, Bookingresponse.ItinearyDetails, Status (Error, ResultCode, SequenceID).
 */
export async function issueTicket(
	params: AiriqIssueTicketRequest
): Promise<AiriqIssueTicketResponse> {
	return airiqRequest<AiriqIssueTicketResponse>({
		endpoint: "IssueTicket",
		method: "POST",
		body: params,
		skipStatusCheck: true,
	});
}

/**
 * Get booking details (RetrieveBooking). Doc 10: confirm ticket for already blocked itinerary.
 * Uses AirIqPNR, AirlinePNR, or CRSPNR in Item[]. skipStatusCheck so caller can handle failure/exception.
 */
export async function getBookingDetails(
	params: AiriqRetrieveBookingRequest
): Promise<AiriqRetrieveBookingResponse> {
	return airiqRequest<AiriqRetrieveBookingResponse>({
		endpoint: "RetrieveBooking",
		method: "POST",
		body: params,
		skipStatusCheck: true,
	});
}

/**
 * Cancel booking
 */
export async function cancelOrPenalty(
	params: AiriqCancellationRequest
): Promise<AiriqCancellationResponse> {
	return airiqRequest<AiriqCancellationResponse>({
		endpoint: "Cancel",
		method: "POST",
		body: params,
		skipStatusCheck: true,
	});
}

/**
 * Hold Cancel – cancel a held PNR (Section 16). Request: AgentInfo, AirIqPNR, AirlinePNR.
 */
export async function holdCancel(
	params: AiriqHoldCancelRequest
): Promise<AiriqHoldCancelResponse> {
	return airiqRequest<AiriqHoldCancelResponse>({
		endpoint: "HoldCancel",
		method: "POST",
		body: params,
		skipStatusCheck: true,
	});
}

/**
 * Reschedule Avail – check availability for new date and revised fare (Section 14).
 * Returns Trackid and ItineraryFlightList; route interprets ResultCode.
 */
export async function rescheduleAvail(
	params: AiriqRescheduleAvailRequest
): Promise<AiriqRescheduleAvailResponse> {
	return airiqRequest<AiriqRescheduleAvailResponse>({
		endpoint: "RescheduleAvail",
		method: "POST",
		body: params,
		skipStatusCheck: true,
	});
}

/**
 * Reschedule – confirm reschedule (Flag CONFIRM) or compare fare (Flag CHECKFARE).
 * On success, response.AirIqPNR is the new PNR to use for all subsequent actions.
 */
export async function reschedule(
	params: AiriqRescheduleRequest
): Promise<AiriqRescheduleResponse> {
	return airiqRequest<AiriqRescheduleResponse>({
		endpoint: "Reschedule",
		method: "POST",
		body: params,
		skipStatusCheck: true,
	});
}

/**
 * Convert AIRiQ flight response to TBO-compatible format
 */
export function convertAiriqToTboFormat(
	airiqResponse: AiriqFlightSearchResponse,
	journeyType?: string
): FlightSearchResponse {
	console.log(
		"🔄 convertAiriqToTboFormat called with journeyType:",
		journeyType
	);

	if (
		!airiqResponse.ItineraryFlightList ||
		airiqResponse.ItineraryFlightList.length === 0
	) {
		console.log("⚠️ No ItineraryFlightList in AIRiQ response");
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

	console.log("📊 AIRiQ Response Analysis:", {
		itineraryCount: airiqResponse.ItineraryFlightList.length,
		itemsPerItinerary: airiqResponse.ItineraryFlightList.map(
			(it) => it.Items.length
		),
		journeyType,
	});

	// Determine journey type handling
	// Roundtrip: 2 ItineraryFlightList items
	// Multi-city: Could be multiple items or single item with multi-segment flights
	// One-way: 1 ItineraryFlightList item
	const isRoundtrip =
		airiqResponse.ItineraryFlightList.length === 2 && journeyType === "2";
	const isMultiCity = journeyType === "3";

	console.log("🎯 Flight Type Detection:", { isRoundtrip, isMultiCity });

	if (isRoundtrip) {
		console.log("🔄 Converting AIRiQ Roundtrip Flight Response");
		// For roundtrip, separate outbound and return flights
		const outboundItinerary = airiqResponse.ItineraryFlightList[0];
		const returnItinerary = airiqResponse.ItineraryFlightList[1];

		const outboundFlights: Array<Record<string, unknown>> = [];
		const returnFlights: Array<Record<string, unknown>> = [];

		// Convert outbound flights
		for (const item of outboundItinerary.Items) {
			const flight = convertAiriqItemToTboFlight(item, airiqResponse.Trackid);
			if (flight) {
				outboundFlights.push(flight);
			}
		}

		// Convert return flights
		for (const item of returnItinerary.Items) {
			const flight = convertAiriqItemToTboFlight(item, airiqResponse.Trackid);
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
	} else if (isMultiCity) {
		// Multi-city flights
		console.log(
			`🔄 Converting AIRiQ Multi-city Flight Response with ${airiqResponse.ItineraryFlightList.length} leg(s)`
		);

		// For multi-city, AIRiQ may return:
		// Option 1: Multiple ItineraryFlightList items (one per leg) - need to combine them
		// Option 2: Single ItineraryFlightList with items containing all segments

		if (airiqResponse.ItineraryFlightList.length > 1) {
			// Option 1: Multiple legs - create flight combinations
			// Each flight should have segments from all legs combined
			const legFlights: Array<Array<Record<string, unknown>>> = [];

		// Convert flights from each leg
		for (const itinerary of airiqResponse.ItineraryFlightList) {
			const flights: Array<Record<string, unknown>> = [];
			for (const item of itinerary.Items) {
				const flight = convertAiriqItemToTboFlight(item, airiqResponse.Trackid);
				if (flight) {
					flights.push(flight);
				}
			}
			legFlights.push(flights);
		}

			// Combine flights from all legs (each combination represents one complete journey)
			const combinedFlights: Array<Record<string, unknown>> = [];

			// Generate all combinations recursively
			type FlightSegment = Record<string, unknown>;
			function generateCombinations(
				legIndex: number,
				currentSegments: FlightSegment[],
				currentFare: number
			) {
				if (legIndex === legFlights.length) {
					// All legs processed, create combined flight
					if (currentSegments.length > 0) {
						const firstFlight = legFlights[0][0] as { ResultIndex?: string; Fare?: Record<string, unknown> };
						combinedFlights.push({
							...firstFlight,
							ResultIndex: `${firstFlight.ResultIndex || "UNKNOWN"}_MULTI_${
								combinedFlights.length
							}`,
							Segments: currentSegments,
							Fare: {
								...(firstFlight.Fare || {}),
								OfferedFare: currentFare,
								PublishedFare: currentFare,
								NetPayable: currentFare,
							},
						});
					}
					return;
				}

			// Process current leg
			const currentLegFlights = legFlights[legIndex];
			for (const flight of currentLegFlights) {
				const flightWithSegments = flight as { Segments?: FlightSegment[]; Fare?: { OfferedFare?: number } };
				const flightSegments = flightWithSegments.Segments || [];
				const flightFare = flightWithSegments.Fare?.OfferedFare || 0;
				generateCombinations(
					legIndex + 1,
					[...currentSegments, ...flightSegments],
					currentFare + flightFare
				);
			}
		}

		generateCombinations(0, [], 0);

		console.log(
			`✅ Created ${combinedFlights.length} AIRiQ multi-city flight combinations`
		);

		return {
			Response: {
				TraceId: airiqResponse.Trackid,
				Results: [
					combinedFlights as unknown as FlightSearchResponse["Response"]["Results"][0],
				],
				Origin: "",
				Destination: "",
				FlightCabinClass: 1,
			},
		};
	} else {
		// Option 2: Single list with multi-segment flights - already combined by AIRiQ
		console.log(
			`➡️ Converting AIRiQ Multi-city Flight Response (pre-combined)`
		);
		const tboFlights: Array<Record<string, unknown>> = [];

		for (const itinerary of airiqResponse.ItineraryFlightList) {
			for (const item of itinerary.Items) {
				const flight = convertAiriqItemToTboFlight(item, airiqResponse.Trackid);
				if (flight) {
					tboFlights.push(flight);
				}
			}
		}

			console.log(`✅ Converted ${tboFlights.length} AIRiQ multi-city flights`);

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
	} else {
		// One-way or multi-city (single list)
		console.log(
			`➡️ Converting AIRiQ ${
				isMultiCity ? "Multi-city" : "One-way"
			} Flight Response`
		);
		const tboFlights: Array<Record<string, unknown>> = [];

		for (const itinerary of airiqResponse.ItineraryFlightList) {
			for (const item of itinerary.Items) {
				const flight = convertAiriqItemToTboFlight(item, airiqResponse.Trackid);
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
	item: AiriqFlightSearchResponse["ItineraryFlightList"][0]["Items"][0],
	trackid: string
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
		// Store original AIRiQ data for Pricing API
		_airiqOriginal: {
			Trackid: trackid, // Store AirIQ Trackid for Pricing API
			FlightDetails: flightDetails,
			Fares: item.Fares,
		},
		// Store seat map availability from AIRiQ response
		_airiqSeatMapAvailable: flightDetails.some(
			(seg) => seg.AvailSeat && seg.AvailSeat.trim() !== ""
		),
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

	console.log("🔄 Converting TBO to AIRiQ params:", {
		journeyType,
		tripType,
		segmentsCount: (tboParams.Segments as FlightSegment[])?.length || 0,
	});

	// TBO FlightCabinClass: 2=Economy, 3=PremiumEconomy, 4=Business, 6=First
	const segments = (tboParams.Segments as FlightSegment[]) || [];
	const cabinClass = segments[0]?.FlightCabinClass || "2";
	const farecabinOption =
		cabinClass === "6"
			? "F"
			: cabinClass === "4" || cabinClass === "5"
				? "B"
				: "E";

	// Convert segments to AIRiQ AvailInfo format
	const availInfo = segments.map((segment, index) => {
		// Convert date from "2026-01-14T00:00:00" to "20260114"
		const dateStr = segment.PreferredDepartureTime;
		const date = new Date(dateStr);
		const flightDate = `${date.getFullYear()}${String(
			date.getMonth() + 1
		).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

		console.log(
			`  Segment ${index + 1}: ${segment.Origin} → ${
				segment.Destination
			} on ${flightDate}`
		);

		return {
			DepartureStation: segment.Origin,
			ArrivalStation: segment.Destination,
			FlightDate: flightDate,
			FarecabinOption: farecabinOption,
			FareType: "N", // Normal fare
			OnlyDirectFlight: tboParams.DirectFlight === "true" || false,
		};
	});

	const airiqParams = {
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

	console.log("✅ AIRiQ params created:", JSON.stringify(airiqParams, null, 2));

	return airiqParams;
}
