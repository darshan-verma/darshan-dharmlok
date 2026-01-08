/**
 * API Route: /api/travel/tbo-sync/status
 * Get sync status and statistics
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest) {
	try {
		// Get counts for each entity
		const [countryCount, cityCount, hotelCount, searchIndexCount] =
			await Promise.all([
				prisma.tboCountry.count(),
				prisma.tboCity.count(),
				prisma.tboHotel.count(),
				prisma.tboSearchIndex.count(),
			]);

		// Get breakdown of search index by type
		const indexBreakdown = await prisma.tboSearchIndex.groupBy({
			by: ["type"],
			_count: {
				type: true,
			},
		});

		// Get sample data
		const sampleCountries = await prisma.tboCountry.findMany({
			take: 5,
			select: {
				countryCode: true,
				countryName: true,
			},
		});

		// Check if system is ready
		const isReady =
			countryCount > 0 &&
			cityCount > 0 &&
			hotelCount > 0 &&
			searchIndexCount > 0;

		return NextResponse.json({
			success: true,
			isReady,
			timestamp: new Date().toISOString(),
			counts: {
				countries: countryCount,
				cities: cityCount,
				hotels: hotelCount,
				searchIndex: searchIndexCount,
			},
			indexBreakdown: indexBreakdown.map((item) => ({
				type: item.type,
				count: item._count.type,
			})),
			sampleCountries,
			message: isReady
				? "System is ready for hotel searches"
				: "System needs data sync. Please run /api/travel/tbo-sync/full-sync",
		});
	} catch (error) {
		console.error("Error getting sync status:", error);
		return NextResponse.json(
			{
				error: "Failed to get sync status",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
