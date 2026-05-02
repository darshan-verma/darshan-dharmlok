import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bookTripsafeInsurance } from "@/lib/tripsafeClient";
import { isTripsafeConfigured } from "@/lib/tripsafeConfig";
import { resolveTripjackError } from "@/lib/tripjackError";
import {
	getIpAddress,
	getUserAgent,
	logTravelActivity,
} from "@/lib/travelLogger";
import { parseTripsafeBook } from "@/lib/tripsafeValidation";

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

		const parsed = parseTripsafeBook(body);
		if (!parsed.ok) {
			return NextResponse.json(
				{ success: false, error: parsed.error },
				{ status: 400 },
			);
		}

		const data = await bookTripsafeInsurance(parsed.data);
		const raw = data as Record<string, unknown>;
		const providerErr = extractProviderError(raw);
		if (providerErr) {
			return NextResponse.json(
				{ success: false, error: providerErr, data },
				{ status: 400 },
			);
		}

		try {
			const session = await getServerSession(authOptions);
			await logTravelActivity({
				userId: session?.user?.id,
				userEmail: session?.user?.email || undefined,
				userName: session?.user?.name || undefined,
				logType: "insurance",
				action: "booking",
				provider: "TripJack",
				bookingCode:
					(typeof raw.bookingId === "string" && raw.bookingId) ||
					parsed.data.bookingId,
				traceId: parsed.data.bookingId,
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
				metadata: { phase: "book" },
			});
		} catch {
			// non-blocking
		}

		return NextResponse.json({ success: true, data });
	} catch (error) {
		const { status, message, providerError } = resolveTripjackError(
			error,
			"TripSafe booking failed",
		);
		return NextResponse.json(
			{ success: false, error: message, providerError },
			{ status },
		);
	}
}
