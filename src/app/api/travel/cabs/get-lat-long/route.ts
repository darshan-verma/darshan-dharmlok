import { NextRequest, NextResponse } from "next/server";
import { getTripjackLatLong } from "@/lib/tripjackClient";
import type { TripjackLatLongRequest } from "@/types/tripjack";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
	getIpAddress,
	getUserAgent,
	logTravelActivity,
} from "@/lib/travelLogger";
import { resolveTripjackError } from "@/lib/tripjackError";

function validatePayload(body: Record<string, unknown>): string | null {
	if (typeof body.placeId !== "string" || !body.placeId.trim()) {
		return "placeId is required";
	}

	return null;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as Record<string, unknown>;
		const validationError = validatePayload(body);

		if (validationError) {
			return NextResponse.json(
				{
					success: false,
					error: validationError,
				},
				{ status: 400 },
			);
		}

		const result = await getTripjackLatLong(
			body as unknown as TripjackLatLongRequest,
		);

		try {
			const session = await getServerSession(authOptions);
			await logTravelActivity({
				userId: session?.user?.id,
				userEmail: session?.user?.email || undefined,
				userName: session?.user?.name || undefined,
				logType: "cab",
				action: "search",
				provider: "TRIPJACK",
				metadata: {
					placeId: body.placeId,
					lat: result?.data?.location?.lat,
					lng: result?.data?.location?.lng,
				},
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
			});
		} catch (error) {
			console.warn("Failed to log TripJack lat-long lookup", error);
		}

		return NextResponse.json({
			success: true,
			message: result.message,
			data: result.data,
		});
	} catch (error) {
		console.error("TripJack get-lat-long error:", error);
		const { status, message, providerError } = resolveTripjackError(
			error,
			"Failed to fetch TripJack latitude/longitude",
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
