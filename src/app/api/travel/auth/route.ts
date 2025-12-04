import { NextResponse } from "next/server";
import {
	getTekTravelsToken,
	clearTokenCache,
	getTokenExpiration,
	hasValidToken,
} from "@/services/tekTravelsAuth";

/**
 * GET /api/travel/auth
 * Returns the current authentication token and its expiration
 */
export async function GET() {
	try {
		const token = await getTekTravelsToken();
		const expiresAt = getTokenExpiration();

		return NextResponse.json({
			success: true,
			token,
			expiresAt,
			isCached: hasValidToken(),
		});
	} catch (error) {
		console.error("Failed to get TekTravels token:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Authentication failed",
			},
			{ status: 500 }
		);
	}
}

/**
 * POST /api/travel/auth
 * Force refresh the authentication token
 */
export async function POST() {
	try {
		// Clear existing cache to force new authentication
		clearTokenCache();

		const token = await getTekTravelsToken();
		const expiresAt = getTokenExpiration();

		return NextResponse.json({
			success: true,
			token,
			expiresAt,
			message: "Token refreshed successfully",
		});
	} catch (error) {
		console.error("Failed to refresh TekTravels token:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Token refresh failed",
			},
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/travel/auth
 * Clear the cached token
 */
export async function DELETE() {
	try {
		clearTokenCache();
		return NextResponse.json({
			success: true,
			message: "Token cache cleared",
		});
	} catch (_error) {
		return NextResponse.json(
			{
				success: false,
				error: "Failed to clear token cache",
			},
			{ status: 500 }
		);
	}
}
