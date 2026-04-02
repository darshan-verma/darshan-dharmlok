import { NextRequest, NextResponse } from "next/server";
import { getTripjackBookingDetails } from "@/lib/tripjackClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
	getIpAddress,
	getUserAgent,
	logTravelActivity,
} from "@/lib/travelLogger";
import { resolveTripjackError } from "@/lib/tripjackError";

export async function GET(request: NextRequest) {
	try {
		const bookingIds = request.nextUrl.searchParams.get("bookingIds");
		if (!bookingIds || !bookingIds.trim()) {
			return NextResponse.json(
				{
					success: false,
					error: "bookingIds query param is required",
				},
				{ status: 400 },
			);
		}

		const result = await getTripjackBookingDetails(bookingIds);

		try {
			const session = await getServerSession(authOptions);
			await logTravelActivity({
				userId: session?.user?.id,
				userEmail: session?.user?.email || undefined,
				userName: session?.user?.name || undefined,
				logType: "cab",
				action: "selection",
				provider: "TRIPJACK",
				metadata: {
					bookingIds,
					count: Array.isArray(result?.data) ? result.data.length : 0,
				},
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
			});
		} catch (error) {
			console.warn("Failed to log TripJack booking details fetch", error);
		}

		return NextResponse.json({
			success: true,
			message: result.message,
			data: result.data,
		});
	} catch (error) {
		console.error("TripJack booking details error:", error);

		const { status, message, providerError } = resolveTripjackError(
			error,
			"Failed to fetch TripJack booking details",
		);

		return NextResponse.json(
			{
				success: false,
				error: message,
				providerError,
			},
			{ status },
		);
	}
}
