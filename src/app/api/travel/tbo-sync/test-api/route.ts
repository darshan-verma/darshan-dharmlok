/**
 * Test endpoint for TBO Static API
 * GET /api/travel/tbo-sync/test-api
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const endpoint = searchParams.get("endpoint") || "CountryList";
		const countryCode = searchParams.get("countryCode");

		const username = "TBOStaticAPITest";
		const password = "Tbo@11530818";
		const credentials = Buffer.from(`${username}:${password}`).toString(
			"base64"
		);

		let url = `http://api.tbotechnology.in/TBOHolidays_HotelAPI/${endpoint}`;
		let method = "GET";
		let body = null;

		if (endpoint === "CityList" && countryCode) {
			method = "POST";
			body = JSON.stringify({ CountryCode: countryCode });
		}

		console.log(`Testing TBO ${endpoint} API...`);
		console.log("URL:", url);
		console.log("Method:", method);
		if (body) console.log("Body:", body);

		const response = await fetch(url, {
			method,
			headers: {
				Authorization: `Basic ${credentials}`,
				"Content-Type": "application/json",
			},
			body,
		});

		console.log("Response status:", response.status);

		const text = await response.text();
		console.log("Raw response (first 500 chars):", text.substring(0, 500));

		let data;
		try {
			data = JSON.parse(text);
		} catch (e) {
			return NextResponse.json({
				error: "Failed to parse JSON",
				status: response.status,
				rawResponse: text.substring(0, 1000),
			});
		}

		// Show first item if it's an array
		let sampleItem = null;
		if (data.CityList && data.CityList.length > 0) {
			sampleItem = data.CityList[0];
		} else if (data.CountryList && data.CountryList.length > 0) {
			sampleItem = data.CountryList[0];
		}

		return NextResponse.json({
			success: response.ok,
			status: response.status,
			dataKeys: data ? Object.keys(data) : [],
			totalItems: data.CityList?.length || data.CountryList?.length || 0,
			sampleItem,
			fullData: data,
		});
	} catch (error) {
		console.error("Test API error:", error);
		return NextResponse.json(
			{
				error: "Failed to test API",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
