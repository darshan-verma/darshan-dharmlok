import { NextRequest, NextResponse } from "next/server";
import { reviewTripsafeInsurance } from "@/lib/tripsafeClient";
import { isTripsafeConfigured } from "@/lib/tripsafeConfig";
import { resolveTripjackError } from "@/lib/tripjackError";
import {
	getIpAddress,
	getUserAgent,
	logTravelActivity,
} from "@/lib/travelLogger";
import { parseTripsafeReview } from "@/lib/tripsafeValidation";

function extractProviderError(data: Record<string, unknown>): string | undefined {
	const status = data.status as { success?: boolean; message?: string } | undefined;
	if (status?.success === false && status.message) return status.message;
	const errors = data.errors as Array<{ message?: string }> | undefined;
	return errors?.[0]?.message;
}

export async function POST(request: NextRequest) {
	try {
		if (!isTripsafeConfigured()) {
			return NextResponse.json(
				{ success: false, error: "TripSafe API is not configured" },
				{ status: 503 },
			);
		}

		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json(
				{ success: false, error: "Invalid JSON body" },
				{ status: 400 },
			);
		}

		const parsed = parseTripsafeReview(body);
		if (!parsed.ok) {
			return NextResponse.json(
				{ success: false, error: parsed.error },
				{ status: 400 },
			);
		}

		const data = await reviewTripsafeInsurance(parsed.data);
		const raw = data as Record<string, unknown>;
		const statusBlock = raw.status as { success?: boolean; message?: string } | undefined;
		const providerErr = extractProviderError(raw);
		if (providerErr || statusBlock?.success === false) {
			return NextResponse.json(
				{
					success: false,
					error:
						providerErr ||
						statusBlock?.message ||
						"TripSafe review failed",
					data,
				},
				{ status: 400 },
			);
		}

		const bookingId =
			(typeof raw.bid === "string" && raw.bid) ||
			(typeof raw.bookingId === "string" && raw.bookingId) ||
			undefined;

		try {
			await logTravelActivity({
				logType: "insurance",
				action: "selection",
				provider: "TripJack",
				traceId: bookingId || parsed.data.pli[0]?.plid,
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
				metadata: {
					phase: "review",
					plid: parsed.data.pli[0]?.plid,
					hasBookingId: Boolean(bookingId),
				},
			});
		} catch {
			// non-blocking
		}

		return NextResponse.json({ success: true, data });
	} catch (error) {
		const { status, message, providerError } = resolveTripjackError(
			error,
			"TripSafe review failed",
		);
		return NextResponse.json(
			{ success: false, error: message, providerError },
			{ status },
		);
	}
}
