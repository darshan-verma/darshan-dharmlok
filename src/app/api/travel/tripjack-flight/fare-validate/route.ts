import { NextRequest, NextResponse } from "next/server";
import { fareValidateTripjackFlight } from "@/lib/tripjackClient";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const bookingId =
			typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
		if (!bookingId) {
			return NextResponse.json(
				{ error: "bookingId is required" },
				{ status: 400 },
			);
		}
		const data = await fareValidateTripjackFlight({ bookingId });
		return NextResponse.json({ success: true, data });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "TripJack fare validate failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

