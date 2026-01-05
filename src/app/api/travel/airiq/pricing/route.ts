import { NextRequest, NextResponse } from "next/server";
import { getPricing } from "@/lib/airiqClient";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			traceId,
			resultIndex,
			flight,
			adultCount,
			childCount,
			infantCount,
		} = body;

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

		// Extract flight details from the flight object
		// The flight object should have segments with flight details
		const flightDetails: any[] = [];
		const firstSegmentGroup = flight.Segments?.[0] || [];

		for (const segment of firstSegmentGroup) {
			flightDetails.push({
				FlightID: segment.FlightID || resultIndex,
				FlightNumber: `${segment.Airline?.AirlineCode || ""} ${
					segment.Airline?.FlightNumber || ""
				}`.trim(),
				Origin: segment.Origin?.Airport?.AirportCode || "",
				Destination: segment.Destination?.Airport?.AirportCode || "",
				DepartureDateTime: segment.Origin?.DepTime || "",
				ArrivalDateTime: segment.Destination?.ArrTime || "",
			});
		}

		// Determine trip type
		let tripType = "O"; // One-way
		if (flight.Segments && flight.Segments.length > 1) {
			tripType = "R"; // Round-trip
		}

		// Extract origin and destination
		const baseOrigin = firstSegmentGroup[0]?.Origin?.Airport?.AirportCode || "";
		const baseDestination =
			firstSegmentGroup[firstSegmentGroup.length - 1]?.Destination?.Airport
				?.AirportCode || "";

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
			Trackid: traceId,
			ItineraryInfo: [
				{
					FlightDetails: flightDetails,
					BaseAmount: String(flight.Fare?.BaseFare || 0),
					GrossAmount: String(
						flight.Fare?.PublishedFare || flight.Fare?.OfferedFare || 0
					),
				},
			],
		};

		console.log(
			"AIRiQ Pricing Request:",
			JSON.stringify(pricingRequest, null, 2)
		);

		// Call AIRiQ Pricing API
		const pricingResponse = await getPricing(pricingRequest);

		console.log(
			"AIRiQ Pricing Response:",
			JSON.stringify(pricingResponse, null, 2)
		);

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
