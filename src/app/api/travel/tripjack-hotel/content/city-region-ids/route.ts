import { NextRequest, NextResponse } from "next/server";
import { fetchTripjackHotelCityRegionIds } from "@/lib/tripjackClient";
import { resolveTripjackError } from "@/lib/tripjackError";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const limitRaw = searchParams.get("limit") || "100";
	const limit = parseInt(limitRaw, 10);
	if (!Number.isFinite(limit) || limit < 1 || limit > 2000) {
		return NextResponse.json(
			{ error: "limit query is required (1–2000)" },
			{ status: 400 },
		);
	}
	const cursor = searchParams.get("cursor") || undefined;

	try {
		const result = await fetchTripjackHotelCityRegionIds({ limit, cursor });
		return NextResponse.json(result);
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack fetch-city-regionIds failed",
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
