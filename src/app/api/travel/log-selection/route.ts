/**
 * API Route: Log Travel Selection
 * POST /api/travel/log-selection
 *
 * Lightweight endpoint to log user selections (flight/hotel)
 */

import { NextRequest, NextResponse } from "next/server";
import {
	logTravelActivity,
	getIpAddress,
	getUserAgent,
	type FlightLogData,
	type HotelLogData,
} from "@/lib/travelLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { logType, action, flightData, hotelData, traceId, resultIndex, provider } = body;

		// Get user session (non-blocking)
		let userId: string | undefined;
		let userEmail: string | undefined;
		let userName: string | undefined;

		try {
			const session = await getServerSession(authOptions);
			userId = session?.user?.id;
			userEmail = session?.user?.email || undefined;
			userName = session?.user?.name || undefined;
		} catch (_error) {
			// Continue without user info
		}

		// Log the selection
		logTravelActivity({
			userId,
			userEmail,
			userName,
			logType: logType || "flight",
			action: action || "selection",
			provider,
			flightData: flightData as FlightLogData | undefined,
			hotelData: hotelData as HotelLogData | undefined,
			traceId,
			resultIndex,
			ipAddress: getIpAddress(request),
			userAgent: getUserAgent(request),
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		// Silently fail - logging should never break user flow
		console.warn("Failed to log selection:", error);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
