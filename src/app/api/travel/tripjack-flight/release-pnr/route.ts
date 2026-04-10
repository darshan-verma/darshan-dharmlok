import { NextRequest, NextResponse } from "next/server";
import { releaseTripjackPnr } from "@/lib/tripjackClient";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const bookingId =
			typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
		const pnrs = Array.isArray(body?.pnrs)
			? body.pnrs.filter((x: unknown) => typeof x === "string" && x.trim())
			: [];
		if (!bookingId || !pnrs.length) {
			return NextResponse.json(
				{ error: "bookingId and pnrs[] are required" },
				{ status: 400 },
			);
		}
		const data = await releaseTripjackPnr({ bookingId, pnrs });
		return NextResponse.json({ success: true, data });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "TripJack release PNR failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

