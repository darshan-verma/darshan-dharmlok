import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
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
			passengerCounts: {
				adultCount,
				childCount,
				infantCount,
				total: (adultCount || 0) + (childCount || 0) + (infantCount || 0),
			},
		});

		if (!traceId || !resultIndex || !flight) {
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
			return brandedFlightJson(
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

		// Helper function to safely parse amount strings, removing any non-numeric characters except decimal point
		const cleanAndParseAmount = (value: string | number | null | undefined): number => {
			if (value === null || value === undefined) return 0;
			if (typeof value === 'number') {
				return isNaN(value) ? 0 : value;
			}
			// Remove any non-numeric characters except decimal point
			const cleaned = String(value).replace(/[^\d.]/g, '');
			const parsed = parseFloat(cleaned);
			return isNaN(parsed) ? 0 : parsed;
		};

		// Get fare amounts from original AIRiQ data
		// Amounts should be formatted as "XXXX.XX" strings per AIRiQ API requirements
		const fareDesc = originalData.Fares?.[0]?.Faredescription?.[0];
		const flightFare = flight.Fare;
		
		// Extract base amount - prefer from AIRiQ original data, fallback to TBO format
		// Amounts from search response are totals for the searched passenger count
		let baseAmountValue = 0;
		if (fareDesc?.BaseAmount) {
			baseAmountValue = cleanAndParseAmount(fareDesc.BaseAmount);
		} else if (flightFare?.BaseFare !== undefined && flightFare.BaseFare !== null) {
			baseAmountValue = cleanAndParseAmount(flightFare.BaseFare);
		}
		
		// Extract gross amount
		let grossAmountValue = 0;
		if (fareDesc?.GrossAmount) {
			grossAmountValue = cleanAndParseAmount(fareDesc.GrossAmount);
		} else if (flightFare?.PublishedFare !== undefined && flightFare.PublishedFare !== null) {
			// TBO format - use PublishedFare (total for all passengers from search)
			grossAmountValue = cleanAndParseAmount(flightFare.PublishedFare);
		} else if (flightFare?.OfferedFare !== undefined && flightFare.OfferedFare !== null) {
			grossAmountValue = cleanAndParseAmount(flightFare.OfferedFare);
		}
		
		// Validate amounts before formatting
		if (isNaN(baseAmountValue) || baseAmountValue <= 0) {
			console.error("❌ Invalid BaseAmount:", {
				fareDescBaseAmount: fareDesc?.BaseAmount,
				flightFareBaseFare: flightFare?.BaseFare,
				calculatedValue: baseAmountValue,
			});
			throw new Error("Invalid base amount in flight data");
		}
		
		if (isNaN(grossAmountValue) || grossAmountValue <= 0) {
			console.error("❌ Invalid GrossAmount:", {
				fareDescGrossAmount: fareDesc?.GrossAmount,
				flightFarePublishedFare: flightFare?.PublishedFare,
				flightFareOfferedFare: flightFare?.OfferedFare,
				calculatedValue: grossAmountValue,
			});
			throw new Error("Invalid gross amount in flight data");
		}
		
		// Format amounts as "XXXX.XX" strings (2 decimal places)
		// Ensure no special characters or formatting issues
		const baseAmount = baseAmountValue.toFixed(2);
		const grossAmount = grossAmountValue.toFixed(2);
		
		console.log("💰 Pricing amounts:", {
			baseAmount,
			grossAmount,
			adultCount: adultCount || 1,
			childCount: childCount || 0,
			infantCount: infantCount || 0,
			source: fareDesc ? "AIRiQ original" : "TBO format",
		});

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
				
				// Calculate return flight amounts with proper formatting using the same helper
				let returnBaseAmountValue = 0;
				if (returnFareDesc?.BaseAmount) {
					returnBaseAmountValue = cleanAndParseAmount(returnFareDesc.BaseAmount);
				} else if (returnFlight.Fare?.BaseFare !== undefined && returnFlight.Fare.BaseFare !== null) {
					returnBaseAmountValue = cleanAndParseAmount(returnFlight.Fare.BaseFare);
				}
				
				let returnGrossAmountValue = 0;
				if (returnFareDesc?.GrossAmount) {
					returnGrossAmountValue = cleanAndParseAmount(returnFareDesc.GrossAmount);
				} else if (returnFlight.Fare?.PublishedFare !== undefined && returnFlight.Fare.PublishedFare !== null) {
					returnGrossAmountValue = cleanAndParseAmount(returnFlight.Fare.PublishedFare);
				} else if (returnFlight.Fare?.OfferedFare !== undefined && returnFlight.Fare.OfferedFare !== null) {
					returnGrossAmountValue = cleanAndParseAmount(returnFlight.Fare.OfferedFare);
				}
				
				// Validate return amounts
				if (isNaN(returnBaseAmountValue) || returnBaseAmountValue <= 0) {
					throw new Error("Invalid base amount in return flight data");
				}
				if (isNaN(returnGrossAmountValue) || returnGrossAmountValue <= 0) {
					throw new Error("Invalid gross amount in return flight data");
				}
				
				// Format amounts as "XXXX.XX" strings (2 decimal places)
				const returnBaseAmount = returnBaseAmountValue.toFixed(2);
				const returnGrossAmount = returnGrossAmountValue.toFixed(2);

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

		// Log the full pricing request for debugging
		console.log("🚀 AIRiQ Pricing Request:", JSON.stringify(pricingRequest, null, 2));
		console.log("🚀 Pricing Request Details:", {
			passengerCounts: {
				adultCount: String(adultCount || 1),
				childCount: String(childCount || 0),
				infantCount: String(infantCount || 0),
				total: (adultCount || 1) + (childCount || 0) + (infantCount || 0),
			},
			itineraryCount: itineraryInfo.length,
			itineraryAmounts: itineraryInfo.map((itin, idx) => ({
				index: idx,
				baseAmount: itin.BaseAmount,
				grossAmount: itin.GrossAmount,
				flightCount: itin.FlightDetails.length,
			})),
			trackId: airiqTrackid,
		});

		// Call AIRiQ Pricing API - this will automatically use cached token
		const pricingResponse = await getPricing(pricingRequest);

		// Check for errors
		if (pricingResponse.ResponseStatus?.ResultCode !== "1") {
			throw new Error(
				pricingResponse.ResponseStatus?.Error || "Pricing request failed"
			);
		}

		return brandedFlightJson(pricingResponse);
	} catch (error) {
		console.error("AIRiQ Pricing API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return brandedFlightJson({ error: errorMessage }, { status: 500 });
	}
}
