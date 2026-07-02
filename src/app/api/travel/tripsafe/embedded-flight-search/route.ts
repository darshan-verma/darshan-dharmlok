import { NextRequest, NextResponse } from "next/server";
import { isTripsafeConfigured } from "@/lib/tripsafeConfig";
import { resolveTripjackError } from "@/lib/tripjackError";
import {
	resolveTripsafeEmbeddedFlights,
	type TripsafeEmbeddedJourneyType,
} from "@/lib/tripsafeEmbeddedFlight";
import type { TripjackCabinClass } from "@/types/tripjackFlight";

const CABIN_CLASSES: TripjackCabinClass[] = [
	"ECONOMY",
	"PREMIUM_ECONOMY",
	"BUSINESS",
	"FIRST",
];

export async function POST(request: NextRequest) {
	try {
		if (!isTripsafeConfigured()) {
			return NextResponse.json(
				{ success: false, error: "TripSafe API is not configured" },
				{ status: 503 },
			);
		}

		let body: Record<string, unknown>;
		try {
			body = (await request.json()) as Record<string, unknown>;
		} catch {
			return NextResponse.json(
				{ success: false, error: "Invalid JSON body" },
				{ status: 400 },
			);
		}

		const from = typeof body.from === "string" ? body.from.trim() : "";
		const to = typeof body.to === "string" ? body.to.trim() : "";
		const departDate = typeof body.departDate === "string" ? body.departDate.trim() : "";
		const returnDate = typeof body.returnDate === "string" ? body.returnDate.trim() : "";
		const journeyType: TripsafeEmbeddedJourneyType =
			body.journeyType === "RETURN" ? "RETURN" : "ONEWAY";

		if (!from || !to || !departDate) {
			return NextResponse.json(
				{ success: false, error: "from, to and departDate are required" },
				{ status: 400 },
			);
		}
		if (journeyType === "RETURN" && !returnDate) {
			return NextResponse.json(
				{ success: false, error: "returnDate is required for a RETURN journey" },
				{ status: 400 },
			);
		}

		// ISO YYYY-MM-DD compares lexicographically, so string comparison is safe here.
		const today = new Date().toISOString().slice(0, 10);
		if (departDate < today) {
			return NextResponse.json(
				{ success: false, error: "departDate cannot be in the past" },
				{ status: 400 },
			);
		}
		if (journeyType === "RETURN" && returnDate && returnDate < departDate) {
			return NextResponse.json(
				{ success: false, error: "returnDate must be on or after departDate" },
				{ status: 400 },
			);
		}
		if (from.toUpperCase() === to.toUpperCase()) {
			return NextResponse.json(
				{ success: false, error: "from and to must be different airports" },
				{ status: 400 },
			);
		}

		const cabinClass =
			typeof body.cabinClass === "string" &&
			CABIN_CLASSES.includes(body.cabinClass as TripjackCabinClass)
				? (body.cabinClass as TripjackCabinClass)
				: "ECONOMY";

		const toCount = (v: unknown): number | undefined =>
			typeof v === "number" && Number.isFinite(v) ? v : undefined;

		const data = await resolveTripsafeEmbeddedFlights({
			from,
			to,
			departDate,
			returnDate: returnDate || undefined,
			journeyType,
			adults: toCount(body.adults),
			children: toCount(body.children),
			infants: toCount(body.infants),
			cabinClass,
		});

		return NextResponse.json({ success: true, data });
	} catch (error) {
		const { status, message, providerError } = resolveTripjackError(
			error,
			"Embedded flight search failed",
		);
		return NextResponse.json(
			{ success: false, error: message, providerError },
			{ status },
		);
	}
}
