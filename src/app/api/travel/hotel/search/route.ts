/**
 * API Route: Hotel Search
 * POST /api/travel/hotel/search
 *
 * Search for hotels using TBO Hotel API
 */

import { NextRequest, NextResponse } from "next/server";
import { searchHotels } from "@/lib/tboHotelClient";
import {
	logTravelActivity,
	getIpAddress,
	getUserAgent,
	type HotelLogData,
} from "@/lib/travelLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate required fields
		const requiredFields = ["checkIn", "checkOut", "guestNationality", "rooms"];
		for (const field of requiredFields) {
			if (!body[field]) {
				return NextResponse.json(
					{
						success: false,
						error: `Missing required field: ${field}`,
					},
					{ status: 400 }
				);
			}
		}

		// Validate date format (YYYY-MM-DD)
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(body.checkIn) || !dateRegex.test(body.checkOut)) {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid date format. Use YYYY-MM-DD",
				},
				{ status: 400 }
			);
		}

		// Validate rooms array
		if (!Array.isArray(body.rooms) || body.rooms.length === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "Rooms must be a non-empty array",
				},
				{ status: 400 }
			);
		}

		// Validate each room configuration
		for (const [index, room] of body.rooms.entries()) {
			if (!room.adults || room.adults < 1 || room.adults > 8) {
				return NextResponse.json(
					{
						success: false,
						error: `Room ${index + 1}: Adults must be between 1 and 8`,
					},
					{ status: 400 }
				);
			}

			if (room.children < 0 || room.children > 4) {
				return NextResponse.json(
					{
						success: false,
						error: `Room ${index + 1}: Children must be between 0 and 4`,
					},
					{ status: 400 }
				);
			}

			if (
				room.children > 0 &&
				(!Array.isArray(room.childrenAges) ||
					room.childrenAges.length !== room.children)
			) {
				return NextResponse.json(
					{
						success: false,
						error: `Room ${
							index + 1
						}: childrenAges array length must match children count`,
					},
					{ status: 400 }
				);
			}
		}

		// Call TBO Hotel API
		const searchParams = {
			checkIn: body.checkIn,
			checkOut: body.checkOut,
			hotelCodes: body.hotelCodes,
			cityCode: body.cityCode,
			countryCode: body.countryCode,
			guestNationality: body.guestNationality,
			rooms: body.rooms,
			isDetailedResponse: body.isDetailedResponse ?? false,
			filters: body.filters,
		};

		const results = await searchHotels(searchParams);

		// Log the search activity (non-blocking)
		try {
			const session = await getServerSession(authOptions);
			const userId = session?.user?.id;
			const userEmail = session?.user?.email || undefined;
			const userName = session?.user?.name || undefined;

			interface RoomConfig {
				adults: number;
				children?: number;
				roomType?: string;
				mealType?: string;
				[key: string]: unknown;
			}

			const hotelLogData: HotelLogData = {
				checkIn: body.checkIn,
				checkOut: body.checkOut,
				rooms: body.rooms?.map((room: RoomConfig) => ({
					adults: room.adults,
					children: room.children || 0,
					roomType: room.roomType,
					mealType: room.mealType,
				})),
			};

			// Count hotels found
			interface HotelSearchResponse {
				HotelResult?: unknown[];
				[key: string]: unknown;
			}
			const hotelCount = (results as HotelSearchResponse)?.HotelResult?.length || 0;

			logTravelActivity({
				userId,
				userEmail,
				userName,
				logType: "hotel",
				action: "search",
				provider: "TBO",
				hotelData: hotelLogData,
				metadata: {
					hotelCount,
					guestNationality: body.guestNationality,
				},
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
			});
		} catch (error) {
			// Silently fail - logging should never break search
			console.warn("Failed to log hotel search:", error);
		}

		// Log the response structure for debugging
		console.log("🔍 TBO API Response structure:", JSON.stringify(results, null, 2));
		console.log("🔍 Response keys:", Object.keys(results || {}));
		console.log(
			"🔍 HotelResult exists?",
			typeof results === "object" && results !== null && "HotelResult" in results
		);
		type ResultsWithHotelResult = {
			HotelResult?: unknown;
		};
		console.log("🔍 HotelResult value:", (results as ResultsWithHotelResult)?.HotelResult);

		return NextResponse.json({
			success: true,
			data: results,
			searchParams: {
				checkIn: body.checkIn,
				checkOut: body.checkOut,
				noOfRooms: body.rooms.length,
				guestNationality: body.guestNationality,
			},
		});
	} catch (error) {
		console.error("Hotel search error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to search hotels",
			},
			{ status: 500 }
		);
	}
}
