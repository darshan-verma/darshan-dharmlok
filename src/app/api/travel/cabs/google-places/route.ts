import { NextRequest, NextResponse } from "next/server";
import { searchTripjackPlaces } from "@/lib/tripjackClient";
import type { TripjackLocationSearchRequest } from "@/types/tripjack";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
	getIpAddress,
	getUserAgent,
	logTravelActivity,
} from "@/lib/travelLogger";
import { resolveTripjackError } from "@/lib/tripjackError";

function validatePayload(body: Record<string, unknown>): string | null {
	if (typeof body.input !== "string" || body.input.trim().length < 2) {
		return "input must be a string with at least 2 characters";
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

		const result = await searchTripjackPlaces(
			body as unknown as TripjackLocationSearchRequest,
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
					locationInput: body.input,
					placesCount: result?.data?.places?.length || 0,
				},
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
			});
		} catch (error) {
			console.warn("Failed to log TripJack place search", error);
		}

		return NextResponse.json({
			success: true,
			message: result.message,
			data: result.data,
		});
	} catch (error) {
		console.error("TripJack google-places error:", error);
		const { status, message, providerError } = resolveTripjackError(
			error,
			"Failed to fetch TripJack location suggestions",
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
