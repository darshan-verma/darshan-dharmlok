import { NextResponse } from "next/server";
import { getTboToken } from "@/services/tboAuth";

/**
 * GET /api/travel/test-connection
 * Test TBO API connection and authentication
 */
export async function GET() {
	try {
		console.log("=== Testing TBO Connection ===");
		
		// Test authentication
		const token = await getTboToken();
		
		if (!token) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to get authentication token",
				},
				{ status: 500 }
			);
		}

		console.log("Token obtained:", token.substring(0, 20) + "...");

		// Test a simple API call (destination search)
		const testUrl = `${process.env.TEKTRAVELS_API_URL}/GetDestination`;
		const response = await fetch(testUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				TokenId: token,
				CountryCode: "IN",
			}),
		});

		const data = await response.json();

		console.log("Test API call response status:", response.status);
		console.log("Test API call has data:", !!data);

		return NextResponse.json({
			success: true,
			message: "TBO connection successful",
			details: {
				authenticationWorking: true,
				tokenReceived: !!token,
				apiCallSuccessful: response.ok,
				sampleDataReceived: !!data,
			},
		});
	} catch (error) {
		console.error("TBO connection test failed:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Connection test failed",
				details: {
					authenticationWorking: false,
				},
			},
			{ status: 500 }
		);
	}
}
