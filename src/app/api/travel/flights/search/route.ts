import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/tboClient";
import {
	searchFlights as searchAiriqFlights,
	convertTboToAiriqParams,
	convertAiriqToTboFormat,
} from "@/lib/airiqClient";
import { calculateNetPayable } from "@/lib/tboFareCalculations";
import type { FlightSegment, FlightSearchResponse } from "@/types/tbo";
import type { AiriqFlightSearchResponse } from "@/types/airiq";

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

		// Format search parameters to match TBO API exactly
		const searchParams = {
			EndUserIp: "183.83.54.192", // Use the IP provided by user
			AdultCount: body.AdultCount || "1",
			ChildCount: body.ChildCount || "0",
			InfantCount: body.InfantCount || "0",
			DirectFlight: "false", // Include all flight types
			OneStopFlight: "false", // Include all flight types
			JourneyType: body.JourneyType || "1", // 1: OneWay, 2: Return, 3: MultiCity
			PreferredAirlines: body.PreferredAirlines || null,
			Segments: [] as FlightSegment[],
			Sources: null, // Let TBO decide the best sources
			MaxResults: 100, // Maximum number of results to return
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

		// Call both TBO and AIRiQ APIs simultaneously
		const [tboResult, airiqResult] = await Promise.allSettled([
			searchFlights(searchParams),
			searchAiriqFlights(convertTboToAiriqParams(searchParams)).catch((err) => {
				console.error("AIRiQ search error:", err);
				return null;
			}),
		]);

		// Process TBO results
		let tboFlights: FlightSearchResponse | null = null;
		if (tboResult.status === "fulfilled") {
			tboFlights = tboResult.value;

			// Calculate NetPayable for each TBO flight result
			if (tboFlights?.Response?.Results) {
				for (const resultArray of tboFlights.Response.Results) {
					if (resultArray && Array.isArray(resultArray)) {
						for (const flight of resultArray) {
							if (flight?.Fare) {
								flight.Fare.NetPayable = calculateNetPayable(flight.Fare);
								// Mark as TBO source
								(flight as any).ApiSource = "TBO";
							}
						}
					}
				}
			}
		} else {
			console.error("TBO search failed:", tboResult.reason);
		}

		// Process AIRiQ results
		let airiqFlights: FlightSearchResponse | null = null;
		if (airiqResult.status === "fulfilled" && airiqResult.value) {
			const rawAiriqResponse = airiqResult.value as AiriqFlightSearchResponse;
			console.log("📦 Raw AIRiQ Response Structure:", {
				hasTrackid: !!rawAiriqResponse.Trackid,
				hasItineraryFlightList: !!rawAiriqResponse.ItineraryFlightList,
				flightListCount: rawAiriqResponse.ItineraryFlightList?.length || 0,
			});

			// Convert AIRiQ format to TBO-compatible format
			airiqFlights = convertAiriqToTboFormat(
				rawAiriqResponse
			) as FlightSearchResponse;

			// Calculate NetPayable for each AIRiQ flight result
			if (airiqFlights?.Response?.Results) {
				for (const resultArray of airiqFlights.Response.Results) {
					if (resultArray && Array.isArray(resultArray)) {
						for (const flight of resultArray) {
							if (flight?.Fare) {
								// Use same calculation method or adjust if AIRiQ has different structure
								flight.Fare.NetPayable = calculateNetPayable(
									flight.Fare as any
								);
								// Mark as AIRiQ source
								(flight as any).ApiSource = "AIRiQ";
							}
						}
					}
				}
			}
		} else if (airiqResult.status === "rejected") {
			console.error("AIRiQ search failed:", airiqResult.reason);
		}

		// Merge results from both APIs
		const mergedResults: {
			Response: {
				TraceId: string;
				Results: any[][];
				TboResults: any[][];
				AiriqResults: any[][];
				Error?: any;
			};
		} = {
			Response: {
				TraceId: tboFlights?.Response?.TraceId || "",
				Results: [],
				TboResults: tboFlights?.Response?.Results || [],
				AiriqResults: airiqFlights?.Response?.Results || [],
				Error:
					(tboFlights as any)?.Response?.Error ||
					(airiqFlights as any)?.Response?.Error,
			},
		};

		// Combine results arrays
		if (
			tboFlights?.Response?.Results &&
			Array.isArray(tboFlights.Response.Results)
		) {
			mergedResults.Response.Results = [...tboFlights.Response.Results];
		}

		if (
			airiqFlights?.Response?.Results &&
			Array.isArray(airiqFlights.Response.Results)
		) {
			if (mergedResults.Response.Results.length === 0) {
				mergedResults.Response.Results = [...airiqFlights.Response.Results];
			} else {
				// Merge each result array (for multi-segment flights)
				for (let i = 0; i < airiqFlights.Response.Results.length; i++) {
					if (mergedResults.Response.Results[i]) {
						mergedResults.Response.Results[i] = [
							...mergedResults.Response.Results[i],
							...airiqFlights.Response.Results[i],
						];
					} else {
						mergedResults.Response.Results[i] =
							airiqFlights.Response.Results[i];
					}
				}
			}
		}

		console.log("Search Results Summary:", {
			tboCount: tboFlights?.Response?.Results?.[0]?.length || 0,
			airiqCount: airiqFlights?.Response?.Results?.[0]?.length || 0,
			totalCount: mergedResults.Response.Results?.[0]?.length || 0,
		});

		// Count flights from each API source
		let tboFlightCount = 0;
		let airiqFlightCount = 0;

		if (mergedResults?.Response?.Results) {
			for (const resultArray of mergedResults.Response.Results) {
				if (resultArray && Array.isArray(resultArray)) {
					for (const flight of resultArray) {
						if ((flight as any).ApiSource === "TBO") {
							tboFlightCount++;
						} else if ((flight as any).ApiSource === "AIRiQ") {
							airiqFlightCount++;
						}
					}
				}
			}
		}

		console.log("📊 Flight Distribution by API:");
		console.log(`   🔵 TBO: ${tboFlightCount} flights`);
		console.log(`   🟢 AIRiQ: ${airiqFlightCount} flights`);
		console.log(`   📈 Total: ${tboFlightCount + airiqFlightCount} flights`);

		// Log the number of results returned
		console.log("TBO API Response Results count:", {
			hasResults: !!tboFlights?.Response?.Results,
			resultsLength: tboFlights?.Response?.Results?.length,
			firstArrayLength: tboFlights?.Response?.Results?.[0]?.length,
			secondArrayLength: tboFlights?.Response?.Results?.[1]?.length,
		});

		console.log("AIRiQ API Response Results count:", {
			hasResults: !!airiqFlights?.Response?.Results,
			resultsLength: airiqFlights?.Response?.Results?.length,
			firstArrayLength: airiqFlights?.Response?.Results?.[0]?.length,
			secondArrayLength: airiqFlights?.Response?.Results?.[1]?.length,
		});

		// Calculate NetPayable for each flight result
		if (mergedResults?.Response?.Results) {
			for (const resultArray of mergedResults.Response.Results) {
				if (resultArray && Array.isArray(resultArray)) {
					for (const flight of resultArray) {
						if (flight?.Fare && !flight.Fare.NetPayable) {
							flight.Fare.NetPayable = calculateNetPayable(flight.Fare);
						}
					}
				}
			}
		}

		// Log the first flight's date format for debugging
		if (mergedResults?.Response?.Results?.[0]?.[0]) {
			const firstFlight = mergedResults.Response.Results[0][0];
			console.log("Sample flight data structure:", {
				resultIndex: firstFlight.ResultIndex,
				isUpsellAllowed: firstFlight.IsUpsellAllowed,
				isLCC: firstFlight.IsLCC,
				isRefundable: firstFlight.IsRefundable,
				airlineCode: firstFlight.AirlineCode,
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
			data: mergedResults,
			sources: {
				tbo: tboResult.status === "fulfilled",
				airiq: airiqResult.status === "fulfilled" && !!airiqResult.value,
			},
			stats: {
				tboFlightCount,
				airiqFlightCount,
				totalFlightCount: tboFlightCount + airiqFlightCount,
			},
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
