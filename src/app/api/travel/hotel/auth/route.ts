/**
 * API Route: TBO Hotel Authentication
 * GET /api/travel/hotel/auth
 *
 * Returns the current TBO authentication token status and token info
 */

import { NextRequest, NextResponse } from "next/server";
import {
	getTboToken,
	hasValidToken,
	getTokenExpiration,
	clearTokenCache,
} from "@/services/tboAuth";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const refresh = searchParams.get("refresh") === "true";

		// If refresh is requested, clear cache and get new token
		if (refresh) {
			clearTokenCache();
			console.log("🔄 Token refresh requested");
		}

		// Get or refresh token
		const token = await getTboToken();
		const expiration = getTokenExpiration();

		return NextResponse.json({
			success: true,
			hasValidToken: hasValidToken(),
			token: token.substring(0, 20) + "...", // Only return partial token for security
			tokenLength: token.length,
			expiresAt: expiration?.toISOString(),
			message: refresh
				? "Token refreshed successfully"
				: "Token retrieved successfully",
		});
	} catch (error) {
		console.error("Hotel auth error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to authenticate with TBO Hotel API",
			},
			{ status: 500 }
		);
	}
}

/**
 * POST /api/travel/hotel/auth
 * Force refresh the authentication token
 */
export async function POST(_request: NextRequest) {
	try {
		// Clear existing token cache
		clearTokenCache();
		console.log("🔄 Force refresh requested");

		// Get new token
		const token = await getTboToken();
		const expiration = getTokenExpiration();

		return NextResponse.json({
			success: true,
			message: "Token force refreshed successfully",
			hasValidToken: hasValidToken(),
			tokenLength: token.length,
			expiresAt: expiration?.toISOString(),
		});
	} catch (error) {
		console.error("Hotel auth force refresh error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to force refresh TBO Hotel API token",
			},
			{ status: 500 }
		);
	}
}
