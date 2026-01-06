/**
 * API Route: /api/travel/tbo-sync/full-sync
 * Orchestrates the complete sync process
 * Syncs countries → cities → hotels → builds search index
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			syncCountries = true,
			syncCities = true,
			syncHotels = true,
			buildIndex = true,
			cityLimit = null,
			countryCode = null, // Optional: sync specific country only
		} = body;

		const baseUrl = request.nextUrl.origin;
		const results: any = {
			success: true,
			steps: [],
			errors: [],
		};

		// Step 1: Sync Countries
		if (syncCountries) {
			console.log("Step 1: Syncing countries...");
			try {
				const response = await fetch(
					`${baseUrl}/api/travel/tbo-sync/countries`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
					}
				);
				const data = await response.json();
				results.steps.push({
					step: "countries",
					success: response.ok,
					data,
				});
				console.log("Countries synced:", data);
			} catch (error) {
				const errorMsg = `Countries sync failed: ${error}`;
				console.error(errorMsg);
				results.errors.push(errorMsg);
			}
		}

		// Step 2: Sync Cities
		if (syncCities) {
			console.log("Step 2: Syncing cities...");
			try {
				const payload = countryCode ? { countryCode } : {};
				const response = await fetch(`${baseUrl}/api/travel/tbo-sync/cities`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await response.json();
				results.steps.push({
					step: "cities",
					success: response.ok,
					data,
				});
				console.log("Cities synced:", data);
			} catch (error) {
				const errorMsg = `Cities sync failed: ${error}`;
				console.error(errorMsg);
				results.errors.push(errorMsg);
			}
		}

		// Step 3: Sync Hotels
		if (syncHotels) {
			console.log("Step 3: Syncing hotels...");
			try {
				const payload: any = {};
				if (cityLimit) payload.limit = cityLimit;
				if (countryCode) {
					// If country code specified, we need to get cities first
					// This is handled by the cities sync above
				}

				const response = await fetch(`${baseUrl}/api/travel/tbo-sync/hotels`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await response.json();
				results.steps.push({
					step: "hotels",
					success: response.ok,
					data,
				});
				console.log("Hotels synced:", data);
			} catch (error) {
				const errorMsg = `Hotels sync failed: ${error}`;
				console.error(errorMsg);
				results.errors.push(errorMsg);
			}
		}

		// Step 4: Build Search Index
		if (buildIndex) {
			console.log("Step 4: Building search index...");
			try {
				const response = await fetch(
					`${baseUrl}/api/travel/tbo-sync/search-index`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
					}
				);
				const data = await response.json();
				results.steps.push({
					step: "search-index",
					success: response.ok,
					data,
				});
				console.log("Search index built:", data);
			} catch (error) {
				const errorMsg = `Search index build failed: ${error}`;
				console.error(errorMsg);
				results.errors.push(errorMsg);
			}
		}

		// Summary
		const successCount = results.steps.filter((s: any) => s.success).length;
		const totalSteps = results.steps.length;

		return NextResponse.json({
			success: successCount === totalSteps && results.errors.length === 0,
			message: `Full sync completed: ${successCount}/${totalSteps} steps successful`,
			results,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Full sync error:", error);
		return NextResponse.json(
			{
				error: "Failed to complete full sync",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
