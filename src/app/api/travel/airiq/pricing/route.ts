import { NextRequest, NextResponse } from "next/server";
import { getPricing } from "@/lib/airiqClient";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			traceId,
			resultIndex,
			flight,
			returnFlight, // Return flight data for round-trip
			adultCount,
			childCount,
			infantCount,
		} = body;

		console.log("📥 Pricing API received:", {
			traceId,
			resultIndex,
			hasFlightData: !!flight,
			hasReturnFlight: !!returnFlight,
		});

		if (!traceId || !resultIndex || !flight) {
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

		// Check if we have original AIRiQ data
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
			Fares?: Array<{
				Faredescription?: Array<{
					BaseAmount?: string;
					GrossAmount?: string;
				}>;
			}>;
		};
		const originalData = (flight as { _airiqOriginal?: AiriqOriginalData })?._airiqOriginal;

		// Reduced logging for better performance

		if (!originalData || !originalData.FlightDetails) {
			console.error("❌ Missing original AIRiQ data in flight object");
			console.error("Flight object:", JSON.stringify(flight, null, 2));
			return NextResponse.json(
				{ error: "Missing original AIRiQ flight data. Please search again." },
				{ status: 400 }
			);
		}

		// Use AirIQ Trackid from stored data, fallback to traceId if not available
		const airiqTrackid = originalData.Trackid || traceId;

		// Extract only the required fields for Pricing API
		// According to AirIQ documentation, Pricing API only needs:
		// FlightID, FlightNumber, Origin, Destination, DepartureDateTime, ArrivalDateTime
		const flightDetails = originalData.FlightDetails.map((segment) => ({
			FlightID: segment.FlightID,
			FlightNumber: segment.FlightNumber,
			Origin: segment.Origin,
			Destination: segment.Destination,
			DepartureDateTime: segment.DepartureDateTime,
			ArrivalDateTime: segment.ArrivalDateTime,
		}));

		// FlightDetails extracted

		// Determine trip type - check if there's a return flight
		// For AIRiQ, round-trip means separate outbound and return itineraries
		// A single connecting flight (multiple segments) is still one-way
		let tripType = "O"; // Default to One-way
		const returnFlightData = returnFlight as { _airiqOriginal?: AiriqOriginalData } | undefined;
		const returnFlightDetailsLength = returnFlightData?._airiqOriginal?.FlightDetails?.length ?? 0;
		const hasReturnFlight =
			returnFlight &&
			(returnFlightDetailsLength > 0 ||
				!!(flight as { ReturnResultIndex?: string }).ReturnResultIndex);

		if (hasReturnFlight) {
			tripType = "R"; // Round-trip
		}

		// Trip type determined

		// Extract origin and destination from original data for onward flight
		const baseOrigin = flightDetails[0]?.Origin || "";
		let baseDestination =
			flightDetails[flightDetails.length - 1]?.Destination || "";

		// Get fare amounts from original AIRiQ data
		const fareDesc = originalData.Fares?.[0]?.Faredescription?.[0];
		const flightFare = flight.Fare;
		const baseAmount =
			fareDesc?.BaseAmount || String(flightFare?.BaseFare || 0);
		const grossAmount =
			fareDesc?.GrossAmount ||
			String(flightFare?.PublishedFare || flightFare?.OfferedFare || 0);

		// Build ItineraryInfo array
		// For domestic round trips, onward and return segments MUST be in separate itineraries
		type ItineraryInfo = {
			FlightDetails: Array<{
				FlightID: string;
				FlightNumber: string;
				Origin: string;
				Destination: string;
				DepartureDateTime: string;
				ArrivalDateTime: string;
			}>;
			BaseAmount: string;
			GrossAmount: string;
		};
		const itineraryInfo: ItineraryInfo[] = [];

		// First itinerary: Onward flight segments only
		itineraryInfo.push({
			FlightDetails: flightDetails, // Only onward segments
			BaseAmount: baseAmount,
			GrossAmount: grossAmount,
		});

		// If round-trip, add return flight as SECOND separate itinerary
		// This is critical for domestic round trips per AirIQ requirements
		if (tripType === "R" && returnFlight) {
			const returnOriginalData = (returnFlight as { _airiqOriginal?: AiriqOriginalData })?._airiqOriginal;

			if (returnOriginalData?.FlightDetails) {
				// Extract only the required fields for Pricing API
				// According to AirIQ documentation, Pricing API only needs:
				// FlightID, FlightNumber, Origin, Destination, DepartureDateTime, ArrivalDateTime
				const returnFlightDetails = returnOriginalData.FlightDetails.map(
					(segment) => ({
						FlightID: segment.FlightID,
						FlightNumber: segment.FlightNumber,
						Origin: segment.Origin,
						Destination: segment.Destination,
						DepartureDateTime: segment.DepartureDateTime,
						ArrivalDateTime: segment.ArrivalDateTime,
					})
				);

				const returnFareDesc =
					returnOriginalData.Fares?.[0]?.Faredescription?.[0];
				const returnBaseAmount =
					returnFareDesc?.BaseAmount ||
					String(returnFlight.Fare?.BaseFare || 0);
				const returnGrossAmount =
					returnFareDesc?.GrossAmount ||
					String(
						returnFlight.Fare?.PublishedFare ||
							returnFlight.Fare?.OfferedFare ||
							0
					);

				// Second itinerary: Return flight segments only
				itineraryInfo.push({
					FlightDetails: returnFlightDetails, // Only return segments
					BaseAmount: returnBaseAmount,
					GrossAmount: returnGrossAmount,
				});

				// Return flight details added

				// Update baseDestination to the return origin for round trip
				// This ensures SegmentInfo reflects the complete journey
				if (returnFlightDetails[0]?.Origin) {
					// For round trip, baseDestination should be the final destination
					// which is the return flight's destination
					baseDestination =
						returnFlightDetails[returnFlightDetails.length - 1]
							?.Destination || baseDestination;
				}
			} else {
				// If return flight data is missing, fall back to one-way
				tripType = "O";
			}
		}

		// Construct pricing request
		const pricingRequest = {
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
				AdultCount: String(adultCount || 1),
				ChildCount: String(childCount || 0),
				InfantCount: String(infantCount || 0),
			},
			Trackid: airiqTrackid, // Use AirIQ Trackid, not the generic traceId
			ItineraryInfo: itineraryInfo,
		};

		// Call AIRiQ Pricing API - this will automatically use cached token
		const pricingResponse = await getPricing(pricingRequest);

		// Check for errors
		if (pricingResponse.ResponseStatus?.ResultCode !== "1") {
			throw new Error(
				pricingResponse.ResponseStatus?.Error || "Pricing request failed"
			);
		}

		return NextResponse.json(pricingResponse);
	} catch (error) {
		console.error("AIRiQ Pricing API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
