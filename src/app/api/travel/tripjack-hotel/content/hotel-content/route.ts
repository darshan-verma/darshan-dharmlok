import { NextRequest, NextResponse } from "next/server";
import { fetchTripjackHotelContentBatch } from "@/lib/tripjackClient";
import { resolveTripjackError } from "@/lib/tripjackError";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	if (!Array.isArray(body.hotelIds) || body.hotelIds.length === 0) {
		return NextResponse.json(
			{ error: "hotelIds must be a non-empty array of strings" },
			{ status: 400 },
		);
	}
	const hotelIds = (body.hotelIds as unknown[]).filter(
		(x): x is string => typeof x === "string" && x.length > 0,
	);
	if (hotelIds.length > 100) {
		return NextResponse.json(
			{ error: "hotelIds must contain at most 100 ids" },
			{ status: 400 },
		);
	}

	try {
		const result = await fetchTripjackHotelContentBatch({ hotelIds });
		return NextResponse.json(result);
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack fetch-hotel-content failed",
		);
		return NextResponse.json(
			{
				error: resolved.message,
				...(resolved.providerError ? { providerError: resolved.providerError } : {}),
			},
			{ status: resolved.status },
		);
	}
}
