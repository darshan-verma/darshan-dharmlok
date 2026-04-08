import { NextRequest, NextResponse } from "next/server";
import { reviewTripjackHotel } from "@/lib/tripjackClient";
import type { TripjackHotelReviewRequest } from "@/types/tripjack";
import { resolveTripjackError } from "@/lib/tripjackError";

function asTrimmedString(v: unknown): string | undefined {
	if (v == null) return undefined;
	if (typeof v === "string") {
		const t = v.trim();
		return t.length > 0 ? t : undefined;
	}
	if (typeof v === "number" && Number.isFinite(v)) return String(v);
	return undefined;
}

export async function POST(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const correlationId = asTrimmedString(
		body.correlationId ?? body.correlation_id,
	);
	const optionId = asTrimmedString(
		body.optionId ?? body.bookingCode ?? body.option_id,
	);
	const reviewHash = asTrimmedString(
		body.reviewHash ?? body.review_hash ?? body.reviewhash,
	);
	const hid = asTrimmedString(body.hid ?? body.hotelCode ?? body.hotel_code);

	if (!correlationId || !optionId || !reviewHash || !hid) {
		const missing: string[] = [];
		if (!correlationId) missing.push("correlationId");
		if (!optionId) missing.push("optionId");
		if (!reviewHash) missing.push("reviewHash");
		if (!hid) missing.push("hid");
		return NextResponse.json(
			{ error: `Missing or empty: ${missing.join(", ")}` },
			{ status: 400 },
		);
	}

	const payload: TripjackHotelReviewRequest = {
		correlationId,
		optionId,
		reviewHash,
		hid,
	};

	try {
		const result = await reviewTripjackHotel(payload);
		return NextResponse.json(result);
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack hotel review request failed",
		);
		return NextResponse.json(
			{
				error: resolved.message,
				...(resolved.providerError
					? { providerError: resolved.providerError }
					: {}),
			},
			{ status: resolved.status },
		);
	}
}
