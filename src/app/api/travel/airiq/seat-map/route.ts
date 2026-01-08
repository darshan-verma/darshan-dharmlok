import { NextRequest, NextResponse } from "next/server";
import { getSeatMap } from "@/lib/airiqClient";

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
		} = body;

		if (!traceId || !resultIndex || !flight || !passengers) {
			return NextResponse.json(
				{ error: "Missing required parameters" },
				{ status: 400 }
			);
		}

		// Get agent credentials from environment
		const agentId = process.env.AIRIQ_AGENT_ID;
		const userName = process.env.AIRIQ_USERNAME;

		if (!agentId || !userName) {
			return NextResponse.json(
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

		if (!originalData || !originalData.FlightDetails) {
			return NextResponse.json(
				{ error: "Missing original AIRiQ flight data" },
				{ status: 400 }
			);
		}

		// Prefer TrackId from pricing response if available, otherwise use search TrackId
		// The seat map API might need the pricing TrackId
		let airiqTrackid = originalData.Trackid || traceId;
		
		// Try to get TrackId from pricing response if available
		if (pricingData?.PriceItenaryInfo) {
			// Pricing response doesn't directly have TrackId, but we can use the original TrackId
			// The key is to use the correct FlightDetails format
			console.log("Using pricing data for seat map - TrackId:", airiqTrackid);
		}

		// Extract flight details - use FlightDetails from pricing response if available
		// Otherwise use from original search data
		let flightsInfo;
		if (pricingData?.PriceItenaryInfo?.FlightDetails && pricingData.PriceItenaryInfo.FlightDetails.length > 0) {
			// Use FlightDetails from pricing response (more accurate)
			flightsInfo = pricingData.PriceItenaryInfo.FlightDetails.map((segment: {
				FlightID: string;
				FlightNumber: string;
				Origin: string;
				Destination: string;
				DepartureDateTime: string;
				ArrivalDateTime: string;
			}) => ({
				FlightID: segment.FlightID,
				FlightNumber: segment.FlightNumber,
				Origin: segment.Origin,
				Destination: segment.Destination,
				DepartureDateTime: segment.DepartureDateTime,
				ArrivalDateTime: segment.ArrivalDateTime,
			}));
			console.log("Using FlightDetails from pricing response");
		} else {
			// Fallback to original search data
			flightsInfo = originalData.FlightDetails.map((segment) => ({
				FlightID: segment.FlightID,
				FlightNumber: segment.FlightNumber,
				Origin: segment.Origin,
				Destination: segment.Destination,
				DepartureDateTime: segment.DepartureDateTime,
				ArrivalDateTime: segment.ArrivalDateTime,
			}));
			console.log("Using FlightDetails from original search data");
		}

		// Determine trip type
		const baseOrigin = flightsInfo[0]?.Origin || "";
		const baseDestination =
			flightsInfo[flightsInfo.length - 1]?.Destination || "";
		const tripType = "O"; // Default to one-way, can be enhanced for round-trip

		// Validate that passengers are provided
		if (!passengers || passengers.length === 0) {
			return NextResponse.json(
				{ error: "No passengers provided" },
				{ status: 400 }
			);
		}

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

			return {
				PaxRefNumber: String(index + 1),
				Title: p.Title || "Mr",
				PaxType: paxTypeMap[p.PaxType] || "ADT",
				FirstName: p.FirstName.trim(),
				LastName: p.LastName.trim(),
			};
		});

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

		console.log("AIRiQ Seat Map Request:", JSON.stringify(seatMapRequest, null, 2));

		// Call AIRiQ Seat Map API
		const seatMapResponse = await getSeatMap(seatMapRequest);

		console.log("AIRiQ Seat Map Response:", JSON.stringify(seatMapResponse, null, 2));

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
				return NextResponse.json({
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

		return NextResponse.json(seatMapResponse);
	} catch (error) {
		console.error("AIRiQ Seat Map API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
