/**
 * API Route: /api/travel/tbo-sync/cities
 * Syncs city data from TBO Static API to local database
 * Requires country data to be synced first
 */

import { NextRequest, NextResponse } from "next/server";
import { getCityList } from "@/lib/tboStaticClient";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { countryCode } = body;

		// If specific country code provided, sync only that country
		if (countryCode) {
			return await syncCitiesForCountry(countryCode);
		}

		// Otherwise, sync all countries
		console.log("Starting TBO city sync for all countries...");

		// Get all countries from database
		const countries = await prisma.tboCountry.findMany();

		if (countries.length === 0) {
			return NextResponse.json(
				{
					error:
						"No countries found. Please sync countries first using /api/travel/tbo-sync/countries",
				},
				{ status: 400 }
			);
		}

		let totalSynced = 0;
		let totalErrors = 0;

		// Sync cities for each country
		for (const country of countries) {
			try {
				console.log(
					`Syncing cities for ${country.countryName} (${country.countryCode})...`
				);

				const response = await getCityList(country.countryCode);

				if (!response || !response.CityList) {
					console.error(`Invalid response for country ${country.countryCode}`);
					totalErrors++;
					continue;
				}

				const cities = response.CityList;

				// Upsert cities
				for (const city of cities) {
					try {
						await prisma.tboCity.upsert({
							where: { cityCode: city.Code },
							update: {
								cityName: city.Name,
								countryCode: country.countryCode, // Use from loop variable
								updatedAt: new Date(),
							},
							create: {
								cityCode: city.Code,
								cityName: city.Name,
								countryCode: country.countryCode, // Use from loop variable
							},
						});
						totalSynced++;
					} catch (error) {
						console.error(`Error syncing city ${city.Code}:`, error);
						totalErrors++;
					}
				}

				console.log(
					`Synced ${cities.length} cities for ${country.countryName}`
				);
			} catch (error) {
				console.error(
					`Error processing country ${country.countryCode}:`,
					error
				);
				totalErrors++;
			}
		}

		console.log(
			`City sync complete. Synced: ${totalSynced}, Errors: ${totalErrors}`
		);

		return NextResponse.json({
			success: true,
			message: "City sync completed for all countries",
			synced: totalSynced,
			errors: totalErrors,
			countries: countries.length,
		});
	} catch (error) {
		console.error("Error syncing cities:", error);
		return NextResponse.json(
			{
				error: "Failed to sync cities",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

/**
 * Sync cities for a specific country
 */
async function syncCitiesForCountry(countryCode: string) {
	try {
		console.log(`Syncing cities for country: ${countryCode}`);

		// Verify country exists
		const country = await prisma.tboCountry.findUnique({
			where: { countryCode },
		});

		if (!country) {
			return NextResponse.json(
				{
					error: `Country ${countryCode} not found. Please sync countries first.`,
				},
				{ status: 404 }
			);
		}

		// Fetch cities from TBO
		const response = await getCityList(countryCode);

		if (!response || !response.CityList) {
			return NextResponse.json(
				{ error: "Invalid response from TBO API" },
				{ status: 500 }
			);
		}

		const cities = response.CityList;
		console.log(`Fetched ${cities.length} cities for ${countryCode}`);

		let syncedCount = 0;
		let errorCount = 0;

		// Upsert cities
		for (const city of cities) {
			try {
				await prisma.tboCity.upsert({
					where: { cityCode: city.Code },
					update: {
						cityName: city.Name,
						countryCode: countryCode, // Use parameter, not from API
						updatedAt: new Date(),
					},
					create: {
						cityCode: city.Code,
						cityName: city.Name,
						countryCode: countryCode, // Use parameter, not from API
					},
				});
				syncedCount++;
			} catch (error) {
				console.error(`Error syncing city ${city.Code}:`, error);
				errorCount++;
			}
		}

		console.log(
			`City sync complete for ${countryCode}. Synced: ${syncedCount}, Errors: ${errorCount}`
		);

		return NextResponse.json({
			success: true,
			message: `City sync completed for ${country.countryName}`,
			countryCode,
			countryName: country.countryName,
			synced: syncedCount,
			errors: errorCount,
			total: cities.length,
		});
	} catch (error) {
		console.error(`Error syncing cities for ${countryCode}:`, error);
		return NextResponse.json(
			{
				error: `Failed to sync cities for ${countryCode}`,
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
