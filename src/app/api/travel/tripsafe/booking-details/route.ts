import { NextRequest, NextResponse } from "next/server";
import { getTripsafeInsuranceBookingDetails } from "@/lib/tripsafeClient";
import { isTripsafeConfigured } from "@/lib/tripsafeConfig";
import { resolveTripjackError } from "@/lib/tripjackError";
import { parseTripsafeBookingDetails } from "@/lib/tripsafeValidation";

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

		const parsed = parseTripsafeBookingDetails(body);
		if (!parsed.ok) {
			return NextResponse.json(
				{ success: false, error: parsed.error },
				{ status: 400 },
			);
		}

		const data = await getTripsafeInsuranceBookingDetails(parsed.data);
		return NextResponse.json({ success: true, data });
	} catch (error) {
		const { status, message, providerError } = resolveTripjackError(
			error,
			"TripSafe booking details failed",
		);
		return NextResponse.json(
			{ success: false, error: message, providerError },
			{ status },
		);
	}
}
