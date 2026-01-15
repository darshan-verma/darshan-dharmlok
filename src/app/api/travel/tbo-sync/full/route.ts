/**
 * API Route: /api/travel/tbo-sync/full
 * Full sync orchestration endpoint
 * Syncs countries → cities → hotels → search index in sequence
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json().catch(() => ({}));
		const { countryCodes, cityLimit, enrichHotelDetails } = body;

		console.log("Starting full TBO sync process...");

		type SyncResults = {
			countries: {
				success: boolean;
				message: string;
				synced: number;
				errors: number;
				total: number;
			} | null;
			cities: {
				success: boolean;
				message: string;
				countryCode: string;
				countryName: string;
				synced: number;
				errors: number;
				total: number;
			} | null;
			hotels: {
				success: boolean;
				message: string;
				cityCode: string;
				cityName: string;
				synced: number;
				errors: number;
				total: number;
				enriched: boolean;
			} | null;
			searchIndex: {
				success: boolean;
				message: string;
				indexed: number;
				errors: number;
				breakdown: {
					countries: number;
					cities: number;
					hotels: number;
				};
			} | null;
			errors: string[];
		};
		const results: SyncResults = {
			countries: null,
			cities: null,
			hotels: null,
			searchIndex: null,
			errors: [],
		};

		// Step 1: Sync Countries
		console.log("Step 1/4: Syncing countries...");
		try {
			const countryResponse = await fetch(
				`${
					process.env.NEXTAUTH_URL || "http://localhost:3000"
				}/api/travel/tbo-sync/countries`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
				}
			);

			if (!countryResponse.ok) {
				throw new Error(`Country sync failed: ${countryResponse.statusText}`);
			}

			results.countries = await countryResponse.json();
			console.log(`✓ Countries synced: ${results.countries!.synced}`);
		} catch (error) {
			const errorMsg = `Country sync failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`;
			console.error(errorMsg);
			results.errors.push(errorMsg);
			return NextResponse.json(
				{ success: false, error: errorMsg, results },
				{ status: 500 }
			);
		}

		// Step 2: Sync Cities
		console.log("Step 2/4: Syncing cities...");
		try {
			if (countryCodes && Array.isArray(countryCodes)) {
				// Sync specific countries
				for (const countryCode of countryCodes) {
					const cityResponse = await fetch(
						`${
							process.env.NEXTAUTH_URL || "http://localhost:3000"
						}/api/travel/tbo-sync/cities`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ countryCode }),
						}
					);

					if (!cityResponse.ok) {
						throw new Error(
							`City sync failed for ${countryCode}: ${cityResponse.statusText}`
						);
					}
				}
			} else {
				// Sync all countries
				const cityResponse = await fetch(
					`${
						process.env.NEXTAUTH_URL || "http://localhost:3000"
					}/api/travel/tbo-sync/cities`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({}),
					}
				);

				if (!cityResponse.ok) {
					throw new Error(`City sync failed: ${cityResponse.statusText}`);
				}

				results.cities = await cityResponse.json();
			}

			console.log(`✓ Cities synced: ${results.cities?.synced || "all"}`);
		} catch (error) {
			const errorMsg = `City sync failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`;
			console.error(errorMsg);
			results.errors.push(errorMsg);
			return NextResponse.json(
				{ success: false, error: errorMsg, results },
				{ status: 500 }
			);
		}

		// Step 3: Sync Hotels
		console.log("Step 3/4: Syncing hotels...");
		try {
			type HotelPayload = {
				limit?: number;
				enrichDetails?: boolean;
			};
			const hotelPayload: HotelPayload = {};
			if (cityLimit) hotelPayload.limit = cityLimit;
			if (enrichHotelDetails) hotelPayload.enrichDetails = true;

			const hotelResponse = await fetch(
				`${
					process.env.NEXTAUTH_URL || "http://localhost:3000"
				}/api/travel/tbo-sync/hotels`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(hotelPayload),
				}
			);

			if (!hotelResponse.ok) {
				throw new Error(`Hotel sync failed: ${hotelResponse.statusText}`);
			}

			results.hotels = await hotelResponse.json();
			console.log(`✓ Hotels synced: ${results.hotels!.synced}`);
		} catch (error) {
			const errorMsg = `Hotel sync failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`;
			console.error(errorMsg);
			results.errors.push(errorMsg);
			return NextResponse.json(
				{ success: false, error: errorMsg, results },
				{ status: 500 }
			);
		}

		// Step 4: Build Search Index
		console.log("Step 4/4: Building search index...");
		try {
			const searchIndexResponse = await fetch(
				`${
					process.env.NEXTAUTH_URL || "http://localhost:3000"
				}/api/travel/tbo-sync/search-index`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
				}
			);

			if (!searchIndexResponse.ok) {
				throw new Error(
					`Search index build failed: ${searchIndexResponse.statusText}`
				);
			}

			results.searchIndex = await searchIndexResponse.json();
			console.log(`✓ Search index built: ${results.searchIndex!.indexed}`);
		} catch (error) {
			const errorMsg = `Search index build failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`;
			console.error(errorMsg);
			results.errors.push(errorMsg);
			return NextResponse.json(
				{ success: false, error: errorMsg, results },
				{ status: 500 }
			);
		}

		console.log("✓ Full TBO sync completed successfully!");

		return NextResponse.json({
			success: true,
			message: "Full sync completed successfully",
			results,
			summary: {
				countries: results.countries?.synced || 0,
				cities: results.cities?.synced || 0,
				hotels: results.hotels?.synced || 0,
				searchIndexed: results.searchIndex?.indexed || 0,
				totalErrors: results.errors.length,
			},
		});
	} catch (error) {
		console.error("Full sync error:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Full sync failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
