/**
 * API Route: /api/travel/tbo-sync/countries
 * Syncs country data from TBO Static API to local database
 */

import { NextRequest, NextResponse } from "next/server";
import { getCountryList } from "@/lib/tboStaticClient";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		console.log("Starting TBO country sync...");

		// Fetch countries from TBO
		const response = await getCountryList();

		console.log("TBO API Response:", JSON.stringify(response, null, 2));

		if (!response || !response.CountryList) {
			return NextResponse.json(
				{ error: "Invalid response from TBO API", response },
				{ status: 500 }
			);
		}

		const countries = response.CountryList;
		console.log(`Fetched ${countries.length} countries from TBO`);
		console.log("First country sample:", countries[0]);

		// Upsert countries to database
		let syncedCount = 0;
		let errorCount = 0;

		for (const country of countries) {
			try {
				await prisma.tboCountry.upsert({
					where: { countryCode: country.Code },
					update: {
						countryName: country.Name,
						updatedAt: new Date(),
					},
					create: {
						countryCode: country.Code,
						countryName: country.Name,
					},
				});
				syncedCount++;
			} catch (error) {
				console.error(`Error syncing country ${country.Code}:`, error);
				errorCount++;
			}
		}

		console.log(
			`Country sync complete. Synced: ${syncedCount}, Errors: ${errorCount}`
		);

		return NextResponse.json({
			success: true,
			message: "Country sync completed",
			synced: syncedCount,
			errors: errorCount,
			total: countries.length,
		});
	} catch (error) {
		console.error("Error syncing countries:", error);
		return NextResponse.json(
			{
				error: "Failed to sync countries",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
