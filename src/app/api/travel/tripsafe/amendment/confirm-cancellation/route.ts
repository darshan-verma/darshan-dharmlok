import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { confirmTripsafeInsuranceCancellation } from "@/lib/tripsafeClient";
import { isTripsafeConfigured } from "@/lib/tripsafeConfig";
import { resolveTripjackError } from "@/lib/tripjackError";
import {
	getIpAddress,
	getUserAgent,
	logTravelActivity,
} from "@/lib/travelLogger";
import { parseTripsafeAmendmentConfirm } from "@/lib/tripsafeValidation";

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

		const parsed = parseTripsafeAmendmentConfirm(body);
		if (!parsed.ok) {
			return NextResponse.json(
				{ success: false, error: parsed.error },
				{ status: 400 },
			);
		}

		const data = await confirmTripsafeInsuranceCancellation(parsed.data);
		const raw = data as Record<string, unknown>;
		const statusVal = raw.status;

		try {
			const session = await getServerSession(authOptions);
			await logTravelActivity({
				userId: session?.user?.id,
				userEmail: session?.user?.email || undefined,
				userName: session?.user?.name || undefined,
				logType: "insurance",
				action: "booking",
				provider: "TripJack",
				bookingCode: parsed.data.bookingId,
				traceId: parsed.data.amendmentId,
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
				metadata: {
					phase: "confirm_insurance_cancellation",
					bookingId: parsed.data.bookingId,
					amendmentId: parsed.data.amendmentId,
					providerStatus: statusVal,
				},
			});
		} catch {
			// non-blocking
		}

		return NextResponse.json({ success: true, data });
	} catch (error) {
		const { status, message, providerError } = resolveTripjackError(
			error,
			"TripSafe cancellation confirm failed",
		);
		return NextResponse.json(
			{ success: false, error: message, providerError },
			{ status },
		);
	}
}
