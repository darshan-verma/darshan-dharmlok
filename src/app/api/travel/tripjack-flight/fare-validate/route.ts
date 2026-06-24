import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { fareValidateTripjackFlight } from "@/lib/tripjackClient";

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
		const data = await fareValidateTripjackFlight({ bookingId });
		return brandedFlightJson({ success: true, data });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "TripJack fare validate failed";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}

