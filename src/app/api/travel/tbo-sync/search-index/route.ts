/**
 * API Route: /api/travel/tbo-sync/search-index
 * Builds the unified search index from synced data
 * This enables fast autocomplete searches across countries, cities, and hotels
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		console.log("Starting search index rebuild...");

		// Clear existing search index
		console.log("Clearing existing search index...");
		await prisma.tboSearchIndex.deleteMany({});

		let totalIndexed = 0;
		let errorCount = 0;

		// 1. Index Countries (Priority: 1)
		console.log("Indexing countries...");
		const countries = await prisma.tboCountry.findMany();

		for (const country of countries) {
			try {
				await prisma.tboSearchIndex.create({
					data: {
						type: "country",
						displayName: country.countryName,
						countryCode: country.countryCode,
						searchText: country.countryName.toLowerCase(),
						priority: 1,
					},
				});
				totalIndexed++;
			} catch (error) {
				console.error(`Error indexing country ${country.countryCode}:`, error);
				errorCount++;
			}
		}

		console.log(`Indexed ${countries.length} countries`);

		// 2. Index Cities (Priority: 2)
		console.log("Indexing cities...");
		const cities = await prisma.tboCity.findMany();

		for (const city of cities) {
			try {
				// Get country name for display
				const country = await prisma.tboCountry.findUnique({
					where: { countryCode: city.countryCode },
				});

				if (!country) {
					console.warn(`Country not found for city ${city.cityCode}`);
					continue;
				}

				// Search text includes city name and country name
				const searchText = `${city.cityName} ${country.countryName}`
					.toLowerCase()
					.trim();

				await prisma.tboSearchIndex.create({
					data: {
						type: "city",
						displayName: `${city.cityName}, ${country.countryName}`,
						countryCode: city.countryCode,
						cityCode: city.cityCode,
						searchText,
						priority: 2,
					},
				});
				totalIndexed++;
			} catch (error) {
				console.error(`Error indexing city ${city.cityCode}:`, error);
				errorCount++;
			}
		}

		console.log(`Indexed ${cities.length} cities`);

		// 3. Index Hotels (Priority: 3)
		console.log("Indexing hotels...");
		const hotels = await prisma.tboHotel.findMany();

		for (const hotel of hotels) {
			try {
				// Search text includes hotel name, city name, and country name
				const searchText =
					`${hotel.hotelName} ${hotel.cityName} ${hotel.countryName}`
						.toLowerCase()
						.trim();

				await prisma.tboSearchIndex.create({
					data: {
						type: "hotel",
						displayName: hotel.hotelName,
						countryCode: hotel.countryCode,
						cityCode: hotel.cityCode,
						hotelCode: hotel.hotelCode,
						searchText,
						priority: 3,
					},
				});
				totalIndexed++;
			} catch (error) {
				console.error(`Error indexing hotel ${hotel.hotelCode}:`, error);
				errorCount++;
			}
		}

		console.log(`Indexed ${hotels.length} hotels`);

		console.log(
			`Search index rebuild complete. Total indexed: ${totalIndexed}, Errors: ${errorCount}`
		);

		return NextResponse.json({
			success: true,
			message: "Search index rebuilt successfully",
			indexed: totalIndexed,
			errors: errorCount,
			breakdown: {
				countries: countries.length,
				cities: cities.length,
				hotels: hotels.length,
			},
		});
	} catch (error) {
		console.error("Error rebuilding search index:", error);
		return NextResponse.json(
			{
				error: "Failed to rebuild search index",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
