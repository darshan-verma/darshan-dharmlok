import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/tekTravelsClient";

/**
 * POST /api/travel/flights/search
 * Search for available flights
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate required parameters
		if (!body.Origin || !body.Destination) {
			return NextResponse.json(
				{ error: "Origin and Destination are required" },
				{ status: 400 }
			);
		}

		// Format search parameters to match TekTravels API exactly
		const searchParams = {
			EndUserIp: "183.83.54.192", // Use the IP provided by user
			AdultCount: body.AdultCount || "1",
			ChildCount: body.ChildCount || "0",
			InfantCount: body.InfantCount || "0",
			DirectFlight:
				body.DirectFlight !== undefined ? String(body.DirectFlight) : "true",
			OneStopFlight:
				body.OneStopFlight !== undefined ? String(body.OneStopFlight) : "false",
			JourneyType: body.JourneyType || "1", // 1: OneWay, 2: Return, 3: MultiCity
			PreferredAirlines: body.PreferredAirlines || null,
			Segments: [
				{
					Origin: body.Origin,
					Destination: body.Destination,
					FlightCabinClass: body.FlightCabinClass || "1", // 1: All, 2: Economy, 3: Premium Economy, 4: Business, 5: Premium Business, 6: First
					PreferredDepartureTime: body.PreferredDepartureTime,
					PreferredArrivalTime: body.PreferredArrivalTime,
				},
			],
			Sources: body.Sources || null,
		};

		// If return journey, add return segment
		if (body.JourneyType == "2" && body.ReturnDate) {
			searchParams.Segments.push({
				Origin: body.Destination,
				Destination: body.Origin,
				FlightCabinClass: body.FlightCabinClass || "1",
				PreferredDepartureTime: body.ReturnPreferredDepartureTime,
				PreferredArrivalTime: body.ReturnPreferredArrivalTime,
			});
		}

		const result = await searchFlights(searchParams);

		// Log the first flight's date format for debugging
		if (result?.Response?.Results?.[0]?.[0]) {
			const firstFlight = result.Response.Results[0][0];
			console.log("Sample flight data structure:", {
				segments: firstFlight.Segments,
				segmentLength: firstFlight.Segments?.[0]?.length,
				firstSegment: firstFlight.Segments?.[0]?.[0],
				lastSegment:
					firstFlight.Segments?.[0]?.[firstFlight.Segments[0].length - 1],
				departure:
					firstFlight.Segments?.[0]?.[0]?.Origin?.DepTime ||
					firstFlight.Segments?.[0]?.[0]?.DepartureTime,
				arrival:
					firstFlight.Segments?.[0]?.[firstFlight.Segments[0].length - 1]
						?.Destination?.ArrTime ||
					firstFlight.Segments?.[0]?.[firstFlight.Segments[0].length - 1]
						?.ArrivalTime,
				fullFlight:
					JSON.stringify(firstFlight, null, 2).substring(0, 500) + "...",
			});
		}

		return NextResponse.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Flight search error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Flight search failed",
			},
			{ status: 500 }
		);
	}
}
