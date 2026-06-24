import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { confirmBookTripjackFlight } from "@/lib/tripjackClient";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const bookingId =
			typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
		const paymentInfos = Array.isArray(body?.paymentInfos) ? body.paymentInfos : [];
		if (!bookingId || !paymentInfos.length) {
			return brandedFlightJson(
				{ error: "bookingId and paymentInfos[] are required" },
				{ status: 400 },
			);
		}
		const data = await confirmBookTripjackFlight({ bookingId, paymentInfos });
		return brandedFlightJson({ success: true, data });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "TripJack confirm-book failed";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}

