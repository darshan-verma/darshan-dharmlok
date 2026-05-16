import { NextRequest, NextResponse } from "next/server";
import { runUnifiedHotelSearch } from "@/lib/unifiedHotelSearch";
import type { UnifiedHotelSearchRequest } from "@/types/unifiedHotel";

export const maxDuration = 300;

function bad(msg: string, status = 400) {
	return NextResponse.json({ success: false, error: msg }, { status });
}

export async function POST(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return bad("Invalid JSON body");
	}

	const checkIn = typeof body.checkIn === "string" ? body.checkIn.trim() : "";
	const checkOut = typeof body.checkOut === "string" ? body.checkOut.trim() : "";
	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
		return bad("checkIn and checkOut must be YYYY-MM-DD");
	}

	const roomsRaw = body.rooms;
	if (!Array.isArray(roomsRaw) || roomsRaw.length === 0) {
		return bad("rooms must be a non-empty array");
	}

	const rooms: UnifiedHotelSearchRequest["rooms"] = [];
	for (const r of roomsRaw) {
		if (!r || typeof r !== "object") return bad("Invalid room entry");
		const o = r as Record<string, unknown>;
		const adults = typeof o.adults === "number" ? o.adults : Number(o.adults);
		if (!Number.isFinite(adults) || adults < 1 || adults > 8) {
			return bad("Each room: adults must be 1–8");
		}
		const children =
			o.children !== undefined && o.children !== null
				? Number(o.children)
				: 0;
		if (!Number.isFinite(children) || children < 0 || children > 4) {
			return bad("Each room: children must be 0–4");
		}
		let childAge: number[] | undefined;
		if (children > 0) {
			if (!Array.isArray(o.childAge)) {
				return bad("childAge array required when children > 0");
			}
			childAge = o.childAge.map((a) => Number(a));
			if (childAge.length !== children) {
				return bad("childAge length must match children count");
			}
		}
		rooms.push({
			adults,
			...(children > 0 ? { children, childAge } : {}),
		});
	}

	const cityCode =
		typeof body.cityCode === "string" ? body.cityCode.trim() : undefined;
	const destination =
		typeof body.destination === "string" ? body.destination.trim() : undefined;

	if (!cityCode && !destination) {
		return bad("cityCode or destination is required");
	}

	const mode =
		body.mode === "tbo" || body.mode === "tripjack" || body.mode === "all"
			? body.mode
			: "all";

	const payload: UnifiedHotelSearchRequest = {
		...(cityCode ? { cityCode } : {}),
		...(destination ? { destination } : {}),
		checkIn,
		checkOut,
		rooms,
		mode,
		...(typeof body.nationality === "string" && body.nationality.trim()
			? { nationality: body.nationality.trim() }
			: {}),
		...(typeof body.guestNationality === "string" && body.guestNationality.trim()
			? { guestNationality: body.guestNationality.trim() }
			: {}),
		...(body.dedupe === false ? { dedupe: false } : {}),
	};

	try {
		const result = await runUnifiedHotelSearch(payload);
		return NextResponse.json(result);
	} catch (e) {
		const message = e instanceof Error ? e.message : "Unified hotel search failed";
		return NextResponse.json(
			{
				success: false,
				mode: "all" as const,
				hotels: [],
				errors: {},
				error: message,
			},
			{ status: 500 },
		);
	}
}
