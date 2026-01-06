/**
 * API Route: /api/travel/tbo-sync/hotels
 * Syncs hotel data from TBO Static API to local database
 * Requires city data to be synced first
 */

import { NextRequest, NextResponse } from "next/server";
import { getHotelCodeList, getHotelDetails } from "@/lib/tboStaticClient";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { cityCode, limit, enrichDetails } = body;

		// If specific city code provided, sync only that city
		if (cityCode) {
			return await syncHotelsForCity(cityCode, enrichDetails || false);
		}

		// Otherwise, sync all cities (with optional limit)
		console.log("Starting TBO hotel sync for all cities...");

		// Get cities from database
		const cities = await prisma.tboCity.findMany({
			take: limit || undefined,
		});

		if (cities.length === 0) {
			return NextResponse.json(
				{
					error:
						"No cities found. Please sync cities first using /api/travel/tbo-sync/cities",
				},
				{ status: 400 }
			);
		}

		let totalSynced = 0;
		let totalErrors = 0;

		// Sync hotels for each city
		for (const city of cities) {
			try {
				console.log(
					`Syncing hotels for ${city.cityName} (${city.cityCode})...`
				);

				const response = await getHotelCodeList(city.cityCode);

				if (!response || !response.Hotels) {
					console.error(`Invalid response for city ${city.cityCode}`);
					totalErrors++;
					continue;
				}

				const hotels = response.Hotels;

				// Upsert hotels
				for (const hotel of hotels) {
					try {
						await prisma.tboHotel.upsert({
							where: { hotelCode: hotel.HotelCode },
							update: {
								hotelName: hotel.HotelName,
								cityCode: city.cityCode,
								cityName: hotel.CityName || city.cityName,
								countryCode: hotel.CountryCode || city.countryCode,
								countryName: hotel.CountryName,
								latitude: hotel.Latitude,
								longitude: hotel.Longitude,
								hotelRating: hotel.HotelRating,
								address: hotel.Address,
								updatedAt: new Date(),
							},
							create: {
								hotelCode: hotel.HotelCode,
								hotelName: hotel.HotelName,
								cityCode: city.cityCode,
								cityName: hotel.CityName || city.cityName,
								countryCode: hotel.CountryCode || city.countryCode,
								countryName: hotel.CountryName,
								latitude: hotel.Latitude,
								longitude: hotel.Longitude,
								hotelRating: hotel.HotelRating,
								address: hotel.Address,
							},
						});
						totalSynced++;
					} catch (error) {
						console.error(`Error syncing hotel ${hotel.HotelCode}:`, error);
						totalErrors++;
					}
				}

				console.log(`Synced ${hotels.length} hotels for ${city.cityName}`);
			} catch (error) {
				console.error(`Error processing city ${city.cityCode}:`, error);
				totalErrors++;
			}
		}

		console.log(
			`Hotel sync complete. Synced: ${totalSynced}, Errors: ${totalErrors}`
		);

		return NextResponse.json({
			success: true,
			message: "Hotel sync completed for all cities",
			synced: totalSynced,
			errors: totalErrors,
			cities: cities.length,
		});
	} catch (error) {
		console.error("Error syncing hotels:", error);
		return NextResponse.json(
			{
				error: "Failed to sync hotels",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

/**
 * Sync hotels for a specific city
 */
async function syncHotelsForCity(cityCode: string, enrichDetails: boolean) {
	try {
		console.log(`Syncing hotels for city: ${cityCode}`);

		// Verify city exists
		const city = await prisma.tboCity.findUnique({
			where: { cityCode },
		});

		if (!city) {
			return NextResponse.json(
				{
					error: `City ${cityCode} not found. Please sync cities first.`,
				},
				{ status: 404 }
			);
		}

		// Fetch hotels from TBO
		const response = await getHotelCodeList(cityCode);

		if (!response || !response.Hotels) {
			return NextResponse.json(
				{ error: "Invalid response from TBO API" },
				{ status: 500 }
			);
		}

		const hotels = response.Hotels;
		console.log(`Fetched ${hotels.length} hotels for ${cityCode}`);

		let syncedCount = 0;
		let errorCount = 0;

		// Upsert hotels
		for (const hotel of hotels) {
			try {
				// Basic hotel data
				const hotelData = {
					hotelName: hotel.HotelName,
					cityCode: cityCode,
					cityName: hotel.CityName || city.cityName,
					countryCode: hotel.CountryCode || city.countryCode,
					countryName: hotel.CountryName,
					latitude: hotel.Latitude,
					longitude: hotel.Longitude,
					hotelRating: hotel.HotelRating,
					address: hotel.Address,
					updatedAt: new Date(),
				};

				// If enrichDetails is true, fetch additional details
				if (enrichDetails) {
					try {
						const details = await getHotelDetails(hotel.HotelCode);
						if (details && details.HotelDetails) {
							Object.assign(hotelData, {
								description: details.HotelDetails.Description,
								facilities: details.HotelDetails.HotelFacilities || [],
								images: details.HotelDetails.Images || [],
							});
						}
					} catch (detailError) {
						console.error(
							`Error fetching details for hotel ${hotel.HotelCode}:`,
							detailError
						);
						// Continue with basic data
					}
				}

				await prisma.tboHotel.upsert({
					where: { hotelCode: hotel.HotelCode },
					update: hotelData,
					create: {
						hotelCode: hotel.HotelCode,
						...hotelData,
					},
				});
				syncedCount++;
			} catch (error) {
				console.error(`Error syncing hotel ${hotel.HotelCode}:`, error);
				errorCount++;
			}
		}

		console.log(
			`Hotel sync complete for ${cityCode}. Synced: ${syncedCount}, Errors: ${errorCount}`
		);

		return NextResponse.json({
			success: true,
			message: `Hotel sync completed for ${city.cityName}`,
			cityCode,
			cityName: city.cityName,
			synced: syncedCount,
			errors: errorCount,
			total: hotels.length,
			enriched: enrichDetails,
		});
	} catch (error) {
		console.error(`Error syncing hotels for ${cityCode}:`, error);
		return NextResponse.json(
			{
				error: `Failed to sync hotels for ${cityCode}`,
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
