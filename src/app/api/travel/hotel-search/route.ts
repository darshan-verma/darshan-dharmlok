/**
 * API Route: /api/travel/hotel-search
 * Unified search endpoint for countries, cities, and hotels
 * Searches from local database for instant autocomplete results
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const query = searchParams.get("q");
		const limit = parseInt(searchParams.get("limit") || "10");
		const type = searchParams.get("type"); // Optional filter: 'country' | 'city' | 'hotel'

		if (!query || query.trim().length === 0) {
			return NextResponse.json(
				{ error: "Search query is required" },
				{ status: 400 }
			);
		}

		// Normalize the search text: lowercase, trim, and replace multiple spaces with single space
		const searchText = query.toLowerCase().trim().replace(/\s+/g, " ");

		console.log(
			`Searching for: "${searchText}" with type filter: ${type || "all"}`
		);

		// Build search filter - split search into words and search each
		const searchWords = searchText.split(" ").filter((word) => word.length > 0);

		type WhereClause = {
			AND: Array<{ searchText: { contains: string } }>;
			type?: string;
		};
		const whereClause: WhereClause = {
			AND: searchWords.map((word) => ({
				searchText: {
					contains: word,
				},
			})),
		};

		// Apply type filter if provided
		if (type && ["country", "city", "hotel"].includes(type)) {
			whereClause.type = type;
		}

		// Search the index
		const results = await prisma.tboSearchIndex.findMany({
			where: whereClause,
			orderBy: [
				{ priority: "desc" }, // Hotels first, then cities, then countries
				{ displayName: "asc" },
			],
			take: limit,
			select: {
				id: true,
				type: true,
				displayName: true,
				countryCode: true,
				cityCode: true,
				hotelCode: true,
				priority: true,
			},
		});

		console.log(`Found ${results.length} results`);

		// Format results for frontend
		const formattedResults = results.map((result) => ({
			id: result.id,
			type: result.type,
			name: result.displayName,
			countryCode: result.countryCode,
			cityCode: result.cityCode || undefined,
			hotelCode: result.hotelCode || undefined,
		}));

		return NextResponse.json({
			success: true,
			query: query,
			count: formattedResults.length,
			results: formattedResults,
		});
	} catch (error) {
		console.error("Error searching hotels:", error);
		return NextResponse.json(
			{
				error: "Failed to search",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

/**
 * Get details for a specific selection (country, city, or hotel)
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { type, code } = body;

		if (!type || !code) {
			return NextResponse.json(
				{ error: "Type and code are required" },
				{ status: 400 }
			);
		}

		let result;

		switch (type) {
			case "country":
				result = await prisma.tboCountry.findUnique({
					where: { countryCode: code },
				});

				// Get cities for this country
				if (result) {
					const cities = await prisma.tboCity.findMany({
						where: { countryCode: code },
						take: 10,
						orderBy: { cityName: "asc" },
					});
					(result as { cities?: unknown }).cities = cities;
				}
				break;

			case "city":
				result = await prisma.tboCity.findUnique({
					where: { cityCode: code },
				});

				// Get country and hotels for this city
				if (result) {
					const city = result as { countryCode: string; country?: unknown; hotels?: unknown };
					const country = await prisma.tboCountry.findUnique({
						where: { countryCode: city.countryCode },
					});
					const hotels = await prisma.tboHotel.findMany({
						where: { cityCode: code },
						orderBy: { hotelName: "asc" },
					});
					city.country = country;
					city.hotels = hotels;
				}
				break;

			case "hotel":
				result = await prisma.tboHotel.findUnique({
					where: { hotelCode: code },
				});

				// Get country and city for this hotel
				if (result) {
					const hotel = result as { countryCode: string; cityCode: string; country?: unknown; city?: unknown };
					const country = await prisma.tboCountry.findUnique({
						where: { countryCode: hotel.countryCode },
					});
					const city = await prisma.tboCity.findUnique({
						where: { cityCode: hotel.cityCode },
					});
					hotel.country = country;
					hotel.city = city;
				}
				break;

			default:
				return NextResponse.json(
					{ error: "Invalid type. Must be country, city, or hotel" },
					{ status: 400 }
				);
		}

		if (!result) {
			return NextResponse.json(
				{ error: `${type} not found with code: ${code}` },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			type,
			data: result,
		});
	} catch (error) {
		console.error("Error fetching details:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch details",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
