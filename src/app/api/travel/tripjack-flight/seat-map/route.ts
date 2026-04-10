import { NextRequest, NextResponse } from "next/server";
import { getTripjackSeatMap } from "@/lib/tripjackClient";

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
		const data = await getTripjackSeatMap({ bookingId });
		return NextResponse.json({ success: true, data });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to fetch seat map";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

