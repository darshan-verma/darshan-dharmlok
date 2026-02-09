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
				{ status: 400 },
			);
		}

		// Normalize the search text: lowercase, trim, and replace multiple spaces with single space
		const searchText = query.toLowerCase().trim().replace(/\s+/g, " ");

		console.log(
			`Searching for: "${searchText}" with type filter: ${type || "all"}`,
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

		// Search the index - get more results initially to allow for proper sorting
		const allResults = await prisma.tboSearchIndex.findMany({
			where: whereClause,
			take: limit * 10, // Get more results initially
			select: {
				id: true,
				type: true,
				displayName: true,
				countryCode: true,
				cityCode: true,
				hotelCode: true,
				priority: true,
				searchText: true,
			},
		});

		console.log(`Found ${allResults.length} initial results`);

		// Smart sorting: prioritize exact/close matches and cities/countries over hotels
		const sortedResults = allResults.sort((a, b) => {
			const aName = a.displayName.toLowerCase();
			const bName = b.displayName.toLowerCase();

			// Check if the result starts with the search query (exact match at start)
			const aStartsWith = aName.startsWith(searchText);
			const bStartsWith = bName.startsWith(searchText);

			if (aStartsWith && !bStartsWith) return -1;
			if (!aStartsWith && bStartsWith) return 1;

			// Check if the result contains the exact search as a word
			const aExactWord = new RegExp(`\\b${searchText}\\b`).test(aName);
			const bExactWord = new RegExp(`\\b${searchText}\\b`).test(bName);

			if (aExactWord && !bExactWord) return -1;
			if (!aExactWord && bExactWord) return 1;

			// Prioritize cities and countries over hotels for better UX
			// Cities should appear before hotels when searching location names
			if (a.type !== b.type) {
				// Country > City > Hotel
				const typeOrder = { country: 0, city: 1, hotel: 2 };
				return (
					typeOrder[a.type as keyof typeof typeOrder] -
					typeOrder[b.type as keyof typeof typeOrder]
				);
			}

			// If same type, sort by name
			return aName.localeCompare(bName);
		});

		// Take only the requested limit after sorting
		const results = sortedResults.slice(0, limit);

		console.log(`Returning ${results.length} results after smart sorting`);

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
			{ status: 500 },
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
				{ status: 400 },
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
				// Special handling for Delhi NCR meta-city (418069)
				// This code doesn't have direct hotels, so we aggregate from all NCR cities
				if (code === "418069") {
					const ncrCityCodes = [
						"130443",
						"119513",
						"130205",
						"145430",
						"118973",
						"118129",
						"147501",
					];

					console.log(
						"🏙️  Delhi NCR meta-city detected, searching all NCR cities:",
						ncrCityCodes,
					);

					// Get all hotels from NCR cities
					const hotels = await prisma.tboHotel.findMany({
						where: { cityCode: { in: ncrCityCodes } },
						orderBy: { hotelName: "asc" },
					});

					console.log(`📊 Found ${hotels.length} hotels across Delhi NCR`);

					// Get the Delhi NCR city info
					const city = await prisma.tboCity.findUnique({
						where: { cityCode: code },
					});

					if (city) {
						const country = await prisma.tboCountry.findUnique({
							where: { countryCode: city.countryCode },
						});

						result = {
							...city,
							country,
							hotels,
						};
					} else {
						// Fallback: create a synthetic result even if city not in DB
						result = {
							cityCode: code,
							cityName: "Delhi NCR",
							countryCode: "IN",
							countryName: "India",
							hotels,
						};
					}
					break;
				}

				result = await prisma.tboCity.findUnique({
					where: { cityCode: code },
				});

				// Get country and hotels for this city
				if (result) {
					const city = result as {
						countryCode: string;
						country?: unknown;
						hotels?: unknown;
					};
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
					const hotel = result as {
						countryCode: string;
						cityCode: string;
						country?: unknown;
						city?: unknown;
					};
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
					{ status: 400 },
				);
		}

		if (!result) {
			return NextResponse.json(
				{ error: `${type} not found with code: ${code}` },
				{ status: 404 },
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
			{ status: 500 },
		);
	}
}
