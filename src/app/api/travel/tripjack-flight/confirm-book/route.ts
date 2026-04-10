import { NextRequest, NextResponse } from "next/server";
import { confirmBookTripjackFlight } from "@/lib/tripjackClient";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const bookingId =
			typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
		const paymentInfos = Array.isArray(body?.paymentInfos) ? body.paymentInfos : [];
		if (!bookingId || !paymentInfos.length) {
			return NextResponse.json(
				{ error: "bookingId and paymentInfos[] are required" },
				{ status: 400 },
			);
		}
		const data = await confirmBookTripjackFlight({ bookingId, paymentInfos });
		return NextResponse.json({ success: true, data });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "TripJack confirm-book failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

