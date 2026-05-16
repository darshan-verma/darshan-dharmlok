import { NextRequest, NextResponse } from "next/server";
import { getTripjackHotelListing } from "@/lib/tripjackClient";
import type { TripjackHotelListingRequest } from "@/types/tripjack";
import { resolveTripjackError } from "@/lib/tripjackError";

/** Allow TripJack listing to complete before platform cuts the route (Vercel, etc.). */
export const maxDuration = 120;

function isValidDate(value: unknown): value is string {
	if (typeof value !== "string") return false;
	return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidRoom(room: unknown): boolean {
	if (!room || typeof room !== "object") return false;
	const r = room as Record<string, unknown>;
	if (typeof r.adults !== "number" || r.adults < 1 || r.adults > 9)
		return false;
	if (r.children !== undefined) {
		if (typeof r.children !== "number" || r.children < 0 || r.children > 6)
			return false;
		if (r.children > 0) {
			if (!Array.isArray(r.childAge) || r.childAge.length !== r.children)
				return false;
			if (!r.childAge.every((age) => typeof age === "number" && age >= 0))
				return false;
		}
	}
	return true;
}

function validatePayload(body: Record<string, unknown>): string | null {
	if (!isValidDate(body.checkIn)) {
		return "checkIn is required and must be in YYYY-MM-DD format";
	}
	if (!isValidDate(body.checkOut)) {
		return "checkOut is required and must be in YYYY-MM-DD format";
	}

	const checkIn = new Date(body.checkIn as string);
	const checkOut = new Date(body.checkOut as string);
	if (checkOut <= checkIn) {
		return "checkOut must be after checkIn";
	}

	if (
		!Array.isArray(body.rooms) ||
		body.rooms.length < 1 ||
		body.rooms.length > 9
	) {
		return "rooms must be an array with 1–9 entries";
	}
	for (const room of body.rooms) {
		if (!isValidRoom(room)) {
			return "Each room must have adults (1–9), optional children (0–6), and childAge array when children > 0";
		}
	}

	if (body.hids === undefined && !body.cityCode) {
		return "cityCode is required when hids is not provided";
	}

	if (typeof body.currency !== "string" || body.currency.length !== 3) {
		return "currency is required and must be a 3-letter ISO 4217 code";
	}

	if (body.hids !== undefined) {
		// TripJack accepts up to 100 in docs, but 100 IDs often returns success with zero hotels;
		// keep server validation aligned with the app's safe chunk size (90).
		if (!Array.isArray(body.hids) || body.hids.length > 90) {
			return "hids must be an array of up to 90 hotel IDs";
		}
		if (
			!body.hids.every((id) => typeof id === "number" || typeof id === "string")
		) {
			return "hids must contain only hotel ID values";
		}
	}

	return null;
}

export async function POST(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const validationError = validatePayload(body);
	if (validationError) {
		return NextResponse.json({ error: validationError }, { status: 400 });
	}

	const payload: TripjackHotelListingRequest = {
		checkIn: body.checkIn as string,
		checkOut: body.checkOut as string,
		rooms: body.rooms as TripjackHotelListingRequest["rooms"],
		currency: (body.currency as string).toUpperCase(),
		...(body.cityCode !== undefined && { cityCode: body.cityCode as string }),
		...(body.hids !== undefined && {
			hids: body.hids as TripjackHotelListingRequest["hids"],
		}),
		...(body.correlationId !== undefined && {
			correlationId: body.correlationId as string,
		}),
		...(body.nationality !== undefined && {
			nationality: body.nationality as string,
		}),
		...(body.timeoutMs !== undefined && {
			timeoutMs: body.timeoutMs as number,
		}),
	};

	try {
		const result = await getTripjackHotelListing(payload);
		return NextResponse.json(result);
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack hotel listing request failed",
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
