import { NextRequest, NextResponse } from "next/server";
import { raiseTripsafeInsuranceAmendment } from "@/lib/tripsafeClient";
import { isTripsafeConfigured } from "@/lib/tripsafeConfig";
import { resolveTripjackError } from "@/lib/tripjackError";
import { parseTripsafeAmendmentRaise } from "@/lib/tripsafeValidation";

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

		const parsed = parseTripsafeAmendmentRaise(body);
		if (!parsed.ok) {
			return NextResponse.json(
				{ success: false, error: parsed.error },
				{ status: 400 },
			);
		}

		const data = await raiseTripsafeInsuranceAmendment(parsed.data);
		return NextResponse.json({ success: true, data });
	} catch (error) {
		const { status, message, providerError } = resolveTripjackError(
			error,
			"TripSafe amendment raise failed",
		);
		return NextResponse.json(
			{ success: false, error: message, providerError },
			{ status },
		);
	}
}
