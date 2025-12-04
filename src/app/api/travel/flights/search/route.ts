import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/tekTravelsClient";
import type { FlightSegment } from "@/types/tekTravels";

interface RequestSegment {
	Origin: string;
	Destination: string;
	DepartureDateTime?: string;
	PreferredDepartureTime?: string;
	PreferredArrivalTime?: string;
}

/**
 * POST /api/travel/flights/search
 * Search for available flights
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate dates are not in the past
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Set to start of today

		if (body.PreferredDepartureTime) {
			const departureDate = new Date(body.PreferredDepartureTime);
			if (departureDate < today) {
				return NextResponse.json(
					{ error: "Departure date cannot be in the past" },
					{ status: 400 }
				);
			}
		}

		if (body.ReturnPreferredDepartureTime) {
			const returnDate = new Date(body.ReturnPreferredDepartureTime);
			if (returnDate < today) {
				return NextResponse.json(
					{ error: "Return date cannot be in the past" },
					{ status: 400 }
				);
			}
		}

		// Validate multi-city segment dates
		if (body.JourneyType === "3" && body.Segments) {
			for (let i = 0; i < body.Segments.length; i++) {
				const segment = body.Segments[i];
				if (segment.PreferredDepartureTime || segment.DepartureDateTime) {
					const departureDate = new Date(
						segment.PreferredDepartureTime || segment.DepartureDateTime
					);
					if (departureDate < today) {
						return NextResponse.json(
							{
								error: `Segment ${i + 1} departure date cannot be in the past`,
							},
							{ status: 400 }
						);
					}
				}
			}
		}

		// Helper function to format date as yyyy-MM-ddTHH:mm:ss
		const formatDate = (dateStr: string) => {
			const date = new Date(dateStr);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			const hours = String(date.getHours()).padStart(2, "0");
			const minutes = String(date.getMinutes()).padStart(2, "0");
			return `${year}-${month}-${day}T${hours}:${minutes}:00`;
		};

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
			Segments: [] as FlightSegment[],
			Sources: body.Sources || null,
		};

		// Handle different journey types
		if (body.JourneyType === "3" && body.Segments) {
			// Multi-city: use segments from request body
			searchParams.Segments = body.Segments.map((segment: RequestSegment) => ({
				Origin: segment.Origin,
				Destination: segment.Destination,
				FlightCabinClass: body.FlightCabinClass || "1",
				PreferredDepartureTime:
					segment.DepartureDateTime || segment.PreferredDepartureTime || "",
				...(segment.PreferredArrivalTime && {
					PreferredArrivalTime: segment.PreferredArrivalTime,
				}),
			}));
		} else {
			// One-way or round-trip: build segments from Origin/Destination
			// Add outbound segment first
			searchParams.Segments.push({
				Origin: body.Origin,
				Destination: body.Destination,
				FlightCabinClass: body.FlightCabinClass || "1",
				PreferredDepartureTime: body.PreferredDepartureTime
					? formatDate(body.PreferredDepartureTime)
					: "",
				...(body.PreferredArrivalTime && {
					PreferredArrivalTime: formatDate(body.PreferredArrivalTime),
				}),
			});

			// If return journey, add return segment below the outbound
			if (
				body.JourneyType == "2" &&
				body.ReturnPreferredDepartureTime &&
				body.ReturnPreferredDepartureTime.trim() !== ""
			) {
				searchParams.Segments.push({
					Origin: body.Destination,
					Destination: body.Origin,
					FlightCabinClass: body.FlightCabinClass || "1",
					PreferredDepartureTime: formatDate(body.ReturnPreferredDepartureTime),
					...(body.ReturnPreferredArrivalTime && {
						PreferredArrivalTime: formatDate(body.ReturnPreferredArrivalTime),
					}),
				});
			}
		}

		console.log(
			"Search params being sent:",
			JSON.stringify(searchParams, null, 2)
		);

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
