import { NextRequest, NextResponse } from "next/server";
import { TripjackApiError } from "@/lib/tripjackClient";
import { searchTripsafeInsurance } from "@/lib/tripsafeClient";
import { isTripsafeConfigured } from "@/lib/tripsafeConfig";
import { resolveTripjackError } from "@/lib/tripjackError";
import { parseTripsafeSearch } from "@/lib/tripsafeValidation";

const TRIPSAFE_403_HINT =
	"TripJack returned 403: verify TRIPSAFE_API_URL (or TRIPJACK_API_URL) and TRIPJACK_API_KEY. If Postman works from your laptop but this fails, your TripJack key is likely IP-restricted—the Next.js server uses a different outbound IP than your PC; ask TripJack to whitelist your server IP (or dev machine IP when testing locally may still differ from Postman if requests go through another host).";

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

		const parsed = parseTripsafeSearch(body);
		if (!parsed.ok) {
			return NextResponse.json(
				{ success: false, error: parsed.error },
				{ status: 400 },
			);
		}

		const data = await searchTripsafeInsurance(parsed.data);
		return NextResponse.json({ success: true, data });
	} catch (error) {
		const { status, message, providerError } = resolveTripjackError(
			error,
			"TripSafe search failed",
		);
		const is403 =
			status === 403 ||
			(error instanceof TripjackApiError && error.status === 403);
		const errorText = is403 ? `${message} ${TRIPSAFE_403_HINT}` : message;
		return NextResponse.json(
			{ success: false, error: errorText, providerError },
			{ status },
		);
	}
}
