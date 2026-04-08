import { NextRequest, NextResponse } from "next/server";
import { getTripjackHotelPricing } from "@/lib/tripjackClient";
import { normalizeTripjackPricingResponse } from "@/lib/tripjackPricingNormalize";
import type { TripjackHotelPricingRequest } from "@/types/tripjack";
import { resolveTripjackError } from "@/lib/tripjackError";

function isValidDate(value: unknown): value is string {
	return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidRoom(room: unknown): boolean {
	if (!room || typeof room !== "object") return false;
	const r = room as Record<string, unknown>;
	if (typeof r.adults !== "number" || r.adults < 1) return false;
	if (r.children !== undefined && typeof r.children !== "number") return false;
	if ((r.children as number) > 0) {
		if (!Array.isArray(r.childAge)) return false;
	}
	return true;
}

export async function POST(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	if (!body.hid || typeof body.hid !== "string") {
		return NextResponse.json({ error: "hid is required" }, { status: 400 });
	}
	if (!isValidDate(body.checkIn)) {
		return NextResponse.json(
			{ error: "checkIn is required (YYYY-MM-DD)" },
			{ status: 400 },
		);
	}
	if (!isValidDate(body.checkOut)) {
		return NextResponse.json(
			{ error: "checkOut is required (YYYY-MM-DD)" },
			{ status: 400 },
		);
	}
	if (!Array.isArray(body.rooms) || body.rooms.length < 1) {
		return NextResponse.json(
			{ error: "rooms array is required" },
			{ status: 400 },
		);
	}
	for (const room of body.rooms) {
		if (!isValidRoom(room)) {
			return NextResponse.json(
				{ error: "Invalid room configuration" },
				{ status: 400 },
			);
		}
	}
	if (typeof body.currency !== "string" || body.currency.length !== 3) {
		return NextResponse.json(
			{ error: "currency must be a 3-letter ISO code" },
			{ status: 400 },
		);
	}
	if (typeof body.nationality !== "string") {
		return NextResponse.json(
			{ error: "nationality is required" },
			{ status: 400 },
		);
	}

	const payload: TripjackHotelPricingRequest = {
		hid: body.hid as string,
		checkIn: body.checkIn as string,
		checkOut: body.checkOut as string,
		rooms: body.rooms as TripjackHotelPricingRequest["rooms"],
		currency: (body.currency as string).toUpperCase(),
		nationality: body.nationality as string,
	};
	if (body.correlationId) payload.correlationId = body.correlationId as string;
	if (body.timeoutMs) payload.timeoutMs = body.timeoutMs as number;

	try {
		const result = await getTripjackHotelPricing(payload);
		return NextResponse.json(normalizeTripjackPricingResponse(result));
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack hotel pricing request failed",
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
