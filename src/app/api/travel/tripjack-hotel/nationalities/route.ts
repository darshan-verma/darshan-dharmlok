import { NextResponse } from "next/server";
import { getTripjackNationalities } from "@/lib/tripjackClient";
import { resolveTripjackError } from "@/lib/tripjackError";
import type { TripjackNationalityResponse } from "@/types/tripjack";

// In-memory cache for nationalities (static data, rarely changes)
let nationalitiesCache: TripjackNationalityResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
	const now = Date.now();

	// Return cached data if still valid
	if (nationalitiesCache && now - cacheTimestamp < CACHE_TTL_MS) {
		return NextResponse.json(nationalitiesCache);
	}

	try {
		const result = await getTripjackNationalities();
		nationalitiesCache = result;
		cacheTimestamp = now;
		return NextResponse.json(result);
	} catch (err) {
		const resolved = resolveTripjackError(err, "Failed to fetch TripJack nationalities");
		return NextResponse.json(
			{ error: resolved.message, ...(resolved.providerError ? { providerError: resolved.providerError } : {}) },
			{ status: resolved.status },
		);
	}
}
