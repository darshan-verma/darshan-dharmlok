import { NextRequest, NextResponse } from "next/server";
import { createTripjackEmbeddedBooking } from "@/lib/tripjackClient";
import { normalizeTripjackCabBookingPayload } from "@/lib/tripjackCabBookingNormalize";
import type {
	TripjackBookingRequest,
	TripjackEmbeddedBookingRequest,
} from "@/types/tripjack";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
	getIpAddress,
	getUserAgent,
	logTravelActivity,
} from "@/lib/travelLogger";
import { resolveTripjackError } from "@/lib/tripjackError";

function validatePayload(body: Record<string, unknown>): string | null {
	if (
		typeof body.sourceBookingId !== "string" ||
		!body.sourceBookingId.trim()
	) {
		return "sourceBookingId is required";
	}

	if (typeof body.productType !== "string" || !body.productType.trim()) {
		return "productType is required";
	}

	if (
		!Array.isArray(body.bookingRequestList) ||
		body.bookingRequestList.length < 1
	) {
		return "bookingRequestList must contain at least one booking request";
	}

	return null;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as Record<string, unknown>;
		const validationError = validatePayload(body);

		if (validationError) {
			return NextResponse.json(
				{ success: false, error: validationError },
				{ status: 400 },
			);
		}

		const bookingRequestList = (
			body.bookingRequestList as TripjackBookingRequest[]
		).map((req) => normalizeTripjackCabBookingPayload(req));

		const result = await createTripjackEmbeddedBooking({
			...(body as unknown as TripjackEmbeddedBookingRequest),
			bookingRequestList,
		});

		try {
			const session = await getServerSession(authOptions);
			await logTravelActivity({
				userId: session?.user?.id,
				userEmail: session?.user?.email || undefined,
				userName: session?.user?.name || undefined,
				logType: "cab",
				action: "booking",
				provider: "TRIPJACK",
				bookingCode: result?.data?.pickupBookingId,
				metadata: {
					sourceBookingId: body.sourceBookingId,
					productType: body.productType,
					bookingRequestCount: (body.bookingRequestList as unknown[]).length,
				},
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
			});
		} catch (error) {
			console.warn("Failed to log TripJack embedded booking", error);
		}

		return NextResponse.json({
			success: true,
			message: result.message,
			data: result.data,
		});
	} catch (error) {
		console.error("TripJack embedded booking error:", error);
		const { status, message, providerError } = resolveTripjackError(
			error,
			"Failed to create embedded booking",
		);

		return NextResponse.json(
			{ success: false, error: message, providerError },
			{ status },
		);
	}
}
