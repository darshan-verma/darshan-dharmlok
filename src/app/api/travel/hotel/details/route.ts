/**
 * API Route: Hotel Details
 * GET /api/travel/hotel/details?hotelCode=xxx
 *
 * Get detailed information for a hotel using TBO HotelDetails API
 */

import { NextRequest, NextResponse } from "next/server";
import { getHotelDetails } from "@/lib/tboStaticClient";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const hotelCode = searchParams.get("hotelCode");
		const language = searchParams.get("language") || "EN";
		const isRoomDetailRequired =
			searchParams.get("isRoomDetailRequired") === "true";

		if (!hotelCode) {
			return NextResponse.json(
				{
					success: false,
					error: "hotelCode is required",
				},
				{ status: 400 }
			);
		}

		// Validate hotel code is a number
		const hotelCodeNum = parseInt(hotelCode);
		if (isNaN(hotelCodeNum)) {
			return NextResponse.json(
				{
					success: false,
					error: "hotelCode must be a valid number",
				},
				{ status: 400 }
			);
		}

		// Call TBO HotelDetails API using the working tboStaticClient implementation
		// This uses the correct Static API credentials (TBOStaticAPITest / Tbo@11530818)
		const result = await getHotelDetails(
			hotelCode, // Pass as string
			language,
			isRoomDetailRequired
		);

		// Log the full response to see the structure
		console.log(
			"✅ Hotel Details API full response:",
			JSON.stringify(result, null, 2)
		);
		console.log("✅ Hotel Details API response:", {
			hotelCode,
			hasDetails: !!result.HotelDetails,
			hotelName: result.HotelDetails?.HotelName,
			resultKeys: Object.keys(result),
		});

		// The API might return a Status field - check for errors
		type ResultWithStatus = {
			Status?: {
				Code: number;
				Description?: string;
			};
		};
		if ((result as ResultWithStatus).Status) {
			const status = (result as ResultWithStatus).Status;
			if (
				status &&
				status.Code !== 1 &&
				status.Code !== 0 &&
				status.Code !== 200
			) {
				return NextResponse.json(
					{
						success: false,
						error: status.Description || "Hotel details API returned an error",
					},
					{ status: 400 }
				);
			}
		}

		let hotelDetailsData = null;

		if (result.HotelDetails) {
			if (
				Array.isArray(result.HotelDetails) &&
				result.HotelDetails.length > 0
			) {
				// HotelDetails is an array, get the first element
				hotelDetailsData = result.HotelDetails[0];
			} else if (typeof result.HotelDetails === "object") {
				// HotelDetails is already an object
				hotelDetailsData = result.HotelDetails;
			}
		}

		if (!hotelDetailsData) {
			return NextResponse.json(
				{
					success: false,
					error: "Hotel details not found in response",
				},
				{ status: 404 }
			);
		}

		// Return the hotel details as an object (not array)
		return NextResponse.json({
			success: true,
			data: {
				HotelDetails: hotelDetailsData, // Return as object, not array
			},
		});
	} catch (error) {
		console.error("Hotel details error:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch hotel details",
			},
			{ status: 500 }
		);
	}
}
