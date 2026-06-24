import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { confirmFareTripjackFlight } from "@/lib/tripjackClient";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const bookingId =
			typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
		if (!bookingId) {
			return brandedFlightJson(
				{ error: "bookingId is required" },
				{ status: 400 },
			);
		}
		const data = await confirmFareTripjackFlight({ bookingId });
		return brandedFlightJson({ success: true, data });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "TripJack confirm fare failed";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}

