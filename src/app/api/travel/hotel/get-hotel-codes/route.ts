/**
 * API Route: /api/travel/hotel/get-hotel-codes
 * Helper endpoint to get hotel codes for availability search
 * Based on user selection (country, city, or hotel)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { type, code, limit } = body;

		if (!type || !code) {
			return NextResponse.json(
				{ error: "Type and code are required" },
				{ status: 400 }
			);
		}

		let hotelCodes: string[] = [];

		switch (type) {
			case "country":
				// Get hotels from all cities in this country
				const countryHotels = await prisma.tboHotel.findMany({
					where: { countryCode: code },
					select: { hotelCode: true },
					take: limit || 100,
				});
				hotelCodes = countryHotels.map((h) => h.hotelCode);
				break;

			case "city":
				// Get all hotels in this city
				const cityHotels = await prisma.tboHotel.findMany({
					where: { cityCode: code },
					select: { hotelCode: true },
					take: limit || 100,
				});
				hotelCodes = cityHotels.map((h) => h.hotelCode);
				break;

			case "hotel":
				// Single hotel code
				hotelCodes = [code];
				break;

			default:
				return NextResponse.json(
					{ error: "Invalid type. Must be country, city, or hotel" },
					{ status: 400 }
				);
		}

		if (hotelCodes.length === 0) {
			return NextResponse.json(
				{ error: `No hotels found for ${type}: ${code}` },
				{ status: 404 }
			);
		}

		// Format as comma-separated string for TBO API
		const hotelCodesString = hotelCodes.join(",");

		return NextResponse.json({
			success: true,
			type,
			code,
			hotelCodes: hotelCodesString,
			count: hotelCodes.length,
		});
	} catch (error) {
		console.error("Error getting hotel codes:", error);
		return NextResponse.json(
			{
				error: "Failed to get hotel codes",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
