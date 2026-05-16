import { NextRequest, NextResponse } from "next/server";
import { fetchTripjackHotelMappingSync } from "@/lib/tripjackClient";
import { resolveTripjackError } from "@/lib/tripjackError";
import type { TripjackHotelMappingSyncType } from "@/types/tripjack";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const type = body.type as string;
	if (type !== "NEW" && type !== "UPDATE") {
		return NextResponse.json(
			{ error: 'type must be "NEW" or "UPDATE"' },
			{ status: 400 },
		);
	}
	if (typeof body.lastUpdateTime !== "string" || !body.lastUpdateTime.trim()) {
		return NextResponse.json(
			{ error: "lastUpdateTime is required (ISO 8601)" },
			{ status: 400 },
		);
	}

	const cursor =
		typeof body.cursor === "string" && body.cursor.trim()
			? body.cursor.trim()
			: undefined;
	const page =
		body.page !== undefined && body.page !== null
			? Number(body.page)
			: undefined;

	try {
		const result = await fetchTripjackHotelMappingSync(
			{
				type: type as TripjackHotelMappingSyncType,
				lastUpdateTime: body.lastUpdateTime as string,
				...(cursor ? { cursor } : {}),
			},
			page !== undefined && Number.isFinite(page) ? page : undefined,
		);
		return NextResponse.json(result);
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack fetch-hotel-mapping-sync failed",
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
