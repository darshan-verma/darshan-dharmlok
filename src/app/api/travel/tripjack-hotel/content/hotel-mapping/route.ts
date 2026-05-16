import { NextRequest, NextResponse } from "next/server";
import { fetchTripjackHotelContentMapping } from "@/lib/tripjackClient";
import { resolveTripjackError } from "@/lib/tripjackError";
import type { TripjackFetchHotelMappingRequest } from "@/types/tripjack";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const countryName =
		typeof body.countryName === "string" ? body.countryName.trim() : "";
	const regionIds = Array.isArray(body.regionIds)
		? (body.regionIds as unknown[]).filter((x) => typeof x === "string")
		: [];

	if (!countryName && regionIds.length === 0) {
		return NextResponse.json(
			{ error: "Provide countryName or regionIds (at least one required)" },
			{ status: 400 },
		);
	}

	const page = typeof body.page === "number" ? body.page : Number(body.page);
	const size = typeof body.size === "number" ? body.size : Number(body.size);
	if (!Number.isFinite(page) || page < 0) {
		return NextResponse.json(
			{ error: "page is required (non-negative integer)" },
			{ status: 400 },
		);
	}
	if (!Number.isFinite(size) || size < 1 || size > 2000) {
		return NextResponse.json(
			{ error: "size is required (1–2000)" },
			{ status: 400 },
		);
	}

	const payload: TripjackFetchHotelMappingRequest = {
		page: Math.floor(page),
		size: Math.floor(size),
		...(countryName ? { countryName: countryName.toUpperCase() } : {}),
		...(regionIds.length > 0 ? { regionIds: regionIds as string[] } : {}),
	};

	try {
		const result = await fetchTripjackHotelContentMapping(payload);
		return NextResponse.json(result);
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack fetch-hotel-mapping failed",
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
