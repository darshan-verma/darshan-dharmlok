import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getSeatMap } from "@/lib/airiqClient";
import type { FlightResult } from "@/types/tbo";
import type { PassengerDetail } from "@/types/tbo";

interface FlightWithSeatMap extends FlightResult {
	_airiqSeatMapAvailable?: boolean;
}

interface FlightDetail {
	FlightID?: string;
	FlightNumber?: string;
	Origin?: unknown;
	Destination?: unknown;
	DepartureDateTime?: string;
	ArrivalDateTime?: string;
	[key: string]: unknown;
}

/**
 * POST /api/travel/airiq/seat-map
 * Get seat map for AIRiQ flight booking
 * Uses cached token automatically via getSeatMap()
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			traceId,
			resultIndex,
			flight,
			passengers,
			pricingData, // Optional: pricing response data
			tripType: incomingTripType, // "O", "R", or "Y"
		} = body;

		console.log("🛫 Seat Map API: Request received:", {
			traceId,
			resultIndex,
			hasFlight: !!flight,
			hasPassengers: !!passengers,
			passengerCount: passengers?.length || 0,
			hasPricingData: !!pricingData,
			pricingDataType: typeof pricingData,
			pricingDataValue: pricingData,
			pricingDataKeys: pricingData ? Object.keys(pricingData) : [],
			hasPriceItenaryInfo: !!pricingData?.PriceItenaryInfo,
			hasFlightDetails: !!pricingData?.PriceItenaryInfo?.FlightDetails,
			flightDetailsLength: pricingData?.PriceItenaryInfo?.FlightDetails?.length || 0,
			airlineCode: flight?.AirlineCode || flight?.ValidatingAirlineCode,
			hasSeatMapAvailable: (flight as FlightWithSeatMap)?._airiqSeatMapAvailable,
		});

		if (!traceId || !resultIndex || !flight || !passengers) {
			console.error("❌ Seat Map API: Missing required parameters:", {
				traceId: !!traceId,
				resultIndex: !!resultIndex,
				flight: !!flight,
				passengers: !!passengers,
			});
			return brandedFlightJson(
				{ error: "Missing required parameters" },
				{ status: 400 }
			);
		}

		// Get agent credentials from environment
		const agentId = process.env.AIRIQ_AGENT_ID;
		const userName = process.env.AIRIQ_USERNAME;

		if (!agentId || !userName) {
			return brandedFlightJson(
				{ error: "Missing AIRiQ credentials" },
				{ status: 500 }
			);
		}

		// Get original AIRiQ data
		type AiriqOriginalData = {
			Trackid?: string;
			FlightDetails?: Array<{
				FlightID: string;
				FlightNumber: string;
				Origin: string;
				Destination: string;
				DepartureDateTime: string;
				ArrivalDateTime: string;
			}>;
		};
		const originalData = (flight as { _airiqOriginal?: AiriqOriginalData })?._airiqOriginal;

		console.log("🔍 Seat Map API: Original data check:", {
			hasOriginalData: !!originalData,
			hasFlightDetails: !!originalData?.FlightDetails,
			flightDetailsCount: originalData?.FlightDetails?.length || 0,
			trackId: originalData?.Trackid,
			originalFlightDetails: originalData?.FlightDetails,
		});

		if (!originalData || !originalData.FlightDetails) {
			console.error("❌ Seat Map API: Missing original AIRiQ flight data");
			return brandedFlightJson(
				{ error: "Missing original AIRiQ flight data" },
				{ status: 400 }
			);
		}

		// IMPORTANT: According to AIRiQ documentation and Postman testing:
		// - TrackId MUST come from Pricing RESPONSE (not the one sent to Pricing)
		// - FlightID MUST come from Pricing RESPONSE (different from search response)
		// The Pricing endpoint returns NEW TrackId and FlightID that must be used for seat map
		if (!pricingData?.PriceItenaryInfo || !Array.isArray(pricingData.PriceItenaryInfo) || pricingData.PriceItenaryInfo.length === 0) {
			console.error("❌ Seat Map API: Pricing data with PriceItenaryInfo array is REQUIRED for seat map");
			console.error("   Current status:", {
				hasPricingData: !!pricingData,
				hasPriceItenaryInfo: !!pricingData?.PriceItenaryInfo,
				isArray: Array.isArray(pricingData?.PriceItenaryInfo),
				priceItenaryInfoLength: Array.isArray(pricingData?.PriceItenaryInfo) ? pricingData.PriceItenaryInfo.length : 0,
			});
			return brandedFlightJson({
				FlightSeat: null,
				ResponseStatus: {
					ResultCode: "0",
					Error: "Pricing data is required for seat map. Please ensure pricing API call succeeds first.",
					SequenceID: "",
				},
				message: "Seat map requires pricing data. Please retry the booking or contact support if pricing fails.",
			}, { status: 200 }); // Return 200 so frontend can handle gracefully
		}

		// Extract TrackId from Pricing response (first element of PriceItenaryInfo array)
		const priceInfo = pricingData.PriceItenaryInfo[0];
		const airiqTrackid = priceInfo?.Trackid;
		
		if (!airiqTrackid) {
			console.error("❌ Seat Map API: TrackId not found in Pricing response");
			console.error("   PriceItenaryInfo[0]:", JSON.stringify(priceInfo, null, 2));
			return brandedFlightJson({
				FlightSeat: null,
				ResponseStatus: {
					ResultCode: "0",
					Error: "TrackId not found in pricing response",
					SequenceID: "",
				},
				message: "Seat map requires TrackId from pricing response. Please retry.",
			}, { status: 200 });
		}

		console.log("🔍 Seat Map API: TrackId from Pricing response:", {
			pricingTrackId: airiqTrackid,
			originalTrackId: originalData.Trackid,
			note: "Using NEW TrackId from Pricing response (different from the one sent to Pricing)",
		});

		// Extract FlightDetails from Pricing response
		// The response can have FlightDetails directly, or nested in AvailabilityResponse[0].Flights
		let flightDetailsArray: Array<{
			FlightID: string;
			FlightNumber: string;
			Origin: string;
			Destination: string;
			DepartureDateTime: string;
			ArrivalDateTime: string;
		}> = [];

		// Try direct FlightDetails first (if response is transformed)
		if (priceInfo.FlightDetails && Array.isArray(priceInfo.FlightDetails) && priceInfo.FlightDetails.length > 0) {
			flightDetailsArray = priceInfo.FlightDetails;
			console.log("📋 Seat Map API: Using FlightDetails from transformed Pricing response");
		}
		// Try nested structure from raw API response
		else if (priceInfo.AvailabilityResponse && Array.isArray(priceInfo.AvailabilityResponse) && priceInfo.AvailabilityResponse.length > 0) {
			const availResponse = priceInfo.AvailabilityResponse[0];
			if (availResponse.Flights && Array.isArray(availResponse.Flights) && availResponse.Flights.length > 0) {
				flightDetailsArray = availResponse.Flights.map((flight: FlightDetail) => ({
					FlightID: flight.FlightID,
					FlightNumber: flight.FlightNumber,
					Origin: flight.Origin,
					Destination: flight.Destination,
					DepartureDateTime: flight.DepartureDateTime,
					ArrivalDateTime: flight.ArrivalDateTime,
				}));
				console.log("📋 Seat Map API: Using FlightDetails from AvailabilityResponse[0].Flights (raw API structure)");
			}
		}

		if (flightDetailsArray.length === 0) {
			console.error("❌ Seat Map API: FlightDetails not found in Pricing response");
			console.error("   PriceItenaryInfo[0] structure:", JSON.stringify(priceInfo, null, 2));
			return brandedFlightJson({
				FlightSeat: null,
				ResponseStatus: {
					ResultCode: "0",
					Error: "FlightDetails not found in pricing response",
					SequenceID: "",
				},
				message: "Seat map requires FlightDetails from pricing response. Please retry.",
			}, { status: 200 });
		}

		// Map flight details to seat map request format
		const flightsInfo = flightDetailsArray.map((segment, index: number) => {
			// Map exactly as per AIRiQ documentation format (Section 7.4, lines 372-388)
			const flightInfo = {
				FlightID: segment.FlightID, // NEW FlightID from Pricing response (required)
				FlightNumber: segment.FlightNumber, // From Pricing response (required)
				Origin: segment.Origin,
				Destination: segment.Destination,
				DepartureDateTime: segment.DepartureDateTime, // Format: "DD MMM YYYY HH:MM"
				ArrivalDateTime: segment.ArrivalDateTime, // Format: "DD MMM YYYY HH:MM"
			};
			console.log(`📋 Segment ${index + 1} (${flightInfo.Origin} -> ${flightInfo.Destination}):`, {
				FlightID: flightInfo.FlightID,
				FlightNumber: flightInfo.FlightNumber,
				DepartureDateTime: flightInfo.DepartureDateTime,
				ArrivalDateTime: flightInfo.ArrivalDateTime,
				note: "Using NEW FlightID from Pricing response (different from search response)",
			});
			return flightInfo;
		});
		
		console.log("✅ Seat Map API: Mapped FlightDetails from Pricing response:", {
			segmentCount: flightsInfo.length,
			flightsInfo: JSON.stringify(flightsInfo, null, 2),
			pricingTrackId: airiqTrackid,
		});

		// Determine trip type and base origin/destination
		// According to AIRiQ docs Section 7.4 (lines 367-370)
		const baseOrigin = flightsInfo[0]?.Origin || "";
		const baseDestination =
			flightsInfo[flightsInfo.length - 1]?.Destination || "";
		const tripType = incomingTripType || "O";
		
		console.log("📍 Seat Map API: Segment info:", {
			baseOrigin,
			baseDestination,
			tripType,
		});

		// Validate that passengers are provided
		if (!passengers || passengers.length === 0) {
			console.error("❌ Seat Map API: No passengers provided");
			return brandedFlightJson(
				{ error: "No passengers provided" },
				{ status: 400 }
			);
		}

		console.log("👥 Seat Map API: Processing passengers:", {
			passengerCount: passengers.length,
			passengerNames: passengers.map((p: PassengerDetail) => `${p.FirstName || 'N/A'} ${p.LastName || 'N/A'}`),
			passengerDetails: passengers.map((p: PassengerDetail, idx: number) => ({
				index: idx,
				firstName: p.FirstName,
				lastName: p.LastName,
				title: p.Title,
				paxType: p.PaxType,
			})),
		});

		// Use passengers as-is (they should have names or placeholder names from frontend)
		// Transform passengers to AIRiQ format
		const apiPaxDetails = passengers.map((p: {
			Title: string;
			FirstName: string;
			LastName: string;
			PaxType: number;
		}, index: number) => {
			// Convert PaxType: 1=ADT, 2=CHD, 3=INF
			const paxTypeMap: Record<number, string> = {
				1: "ADT",
				2: "CHD",
				3: "INF",
			};

			const paxDetail = {
				PaxRefNumber: String(index + 1),
				Title: p.Title || "Mr",
				PaxType: paxTypeMap[p.PaxType] || "ADT",
				FirstName: (p.FirstName || `PASSENGER${index + 1}`).trim(),
				LastName: (p.LastName || "TEST").trim(),
			};
			console.log(`👤 Seat Map API: Passenger ${index + 1}:`, paxDetail);
			return paxDetail;
		});

		console.log("👥 Seat Map API: Final passenger details for AIRiQ:", apiPaxDetails);

		// Construct seat map request
		const seatMapRequest = {
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: 2.0,
			},
			SegmentInfo: {
				BaseOrigin: baseOrigin,
				BaseDestination: baseDestination,
				TripType: tripType,
			},
			FlightsInfo: flightsInfo,
			APIPaxDetails: apiPaxDetails,
			TrackId: airiqTrackid,
		};

		console.log("🛫 Seat Map API: Calling AIRiQ Seat Map API with request:", {
			trackId: seatMapRequest.TrackId,
			baseOrigin: seatMapRequest.SegmentInfo.BaseOrigin,
			baseDestination: seatMapRequest.SegmentInfo.BaseDestination,
			tripType: seatMapRequest.SegmentInfo.TripType,
			flightsCount: seatMapRequest.FlightsInfo.length,
			passengerCount: seatMapRequest.APIPaxDetails.length,
			fullRequest: JSON.stringify(seatMapRequest, null, 2),
		});

		// Call AIRiQ Seat Map API
		const seatMapResponse = await getSeatMap(seatMapRequest);

		console.log("📥 Seat Map API: AIRiQ Seat Map Response received:", {
			hasFlightSeat: !!seatMapResponse.FlightSeat,
			flightSeatLength: seatMapResponse.FlightSeat?.length || 0,
			resultCode: seatMapResponse.ResponseStatus?.ResultCode,
			error: seatMapResponse.ResponseStatus?.Error,
			fullResponse: JSON.stringify(seatMapResponse, null, 2),
		});

		// Check for errors
		if (seatMapResponse.ResponseStatus?.ResultCode !== "1") {
			const errorMsg = seatMapResponse.ResponseStatus?.Error || "Seat map request failed";
			console.error("AIRiQ Seat Map Error:", errorMsg);
			console.error("Request sent:", JSON.stringify(seatMapRequest, null, 2));
			
			// Handle specific errors gracefully instead of throwing
			if (
				errorMsg.includes("Unable to retrieve the FlightDetails") ||
				errorMsg.includes("IP address is Invalid") ||
				errorMsg.includes("IP address")
			) {
				// Return graceful response for IP validation or unavailable seat map
				return brandedFlightJson({
					FlightSeat: null,
					ResponseStatus: seatMapResponse.ResponseStatus,
					message: errorMsg.includes("IP address")
						? "Seat map unavailable due to IP validation. Please contact support."
						: "Seat map not available for this flight",
					errorCode: seatMapResponse.ResponseStatus?.ResultCode,
				}, { status: 200 }); // Return 200 so frontend can handle gracefully
			}
			
			throw new Error(errorMsg);
		}

		return brandedFlightJson(seatMapResponse);
	} catch (error) {
		console.error("AIRiQ Seat Map API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return brandedFlightJson({ error: errorMessage }, { status: 500 });
	}
}
