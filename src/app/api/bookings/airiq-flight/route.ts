import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveAiriqTravelBooking } from "@/lib/saveAiriqTravelBooking";
import type { FlightResult } from "@/types/tbo";

/**
 * Persist an AIRiQ flight booking for the signed-in user so it appears under My Trips.
 * Idempotent per userId + airIqPnr.
 */
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		const userId = session?.user?.id;
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await request.json()) as Record<string, unknown>;
		const airIqPnr =
			typeof body.airIqPnr === "string" ? body.airIqPnr.trim() : "";
		const airlinePnr =
			typeof body.airlinePnr === "string" ? body.airlinePnr.trim() : undefined;
		const name = typeof body.name === "string" ? body.name.trim() : "";
		const email = typeof body.email === "string" ? body.email.trim() : "";
		const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
		const leadFirstName =
			typeof body.leadFirstName === "string" ? body.leadFirstName.trim() : undefined;
		const leadLastName =
			typeof body.leadLastName === "string" ? body.leadLastName.trim() : undefined;
		const routeSummary =
			typeof body.routeSummary === "string" ? body.routeSummary.trim() : undefined;
		const travelDateRaw = typeof body.travelDate === "string" ? body.travelDate : "";
		const returnDateRaw =
			typeof body.returnDate === "string" && body.returnDate.trim()
				? body.returnDate.trim()
				: undefined;
		const departureTime =
			typeof body.departureTime === "string" ? body.departureTime.trim() : undefined;
		const travelers =
			typeof body.travelers === "number" && body.travelers > 0
				? Math.floor(body.travelers)
				: 1;
		const totalAmount =
			typeof body.totalAmount === "number" && Number.isFinite(body.totalAmount)
				? body.totalAmount
				: undefined;
		const status =
			typeof body.status === "string" && body.status.trim()
				? body.status.trim()
				: "CONFIRMED";
		const bookingTrackId =
			typeof body.bookingTrackId === "string"
				? body.bookingTrackId.trim() || undefined
				: undefined;
		const flight =
			body.flight && typeof body.flight === "object"
				? (body.flight as FlightResult)
				: undefined;
		const returnFlight =
			body.returnFlight && typeof body.returnFlight === "object"
				? (body.returnFlight as FlightResult)
				: undefined;

		if (!airIqPnr || !name || !email) {
			return NextResponse.json(
				{ error: "airIqPnr, name, and email are required" },
				{ status: 400 }
			);
		}

		const result = await saveAiriqTravelBooking({
			userId,
			airIqPnr,
			airlinePnr,
			name,
			email,
			phone,
			leadFirstName,
			leadLastName,
			routeSummary,
			travelDate: travelDateRaw || undefined,
			returnDate: returnDateRaw,
			departureTime,
			travelers,
			totalAmount,
			status,
			bookingTrackId,
			flight,
			returnFlight,
		});

		if (!result.ok) {
			const statusCode =
				result.error === "Forbidden"
					? 403
					: result.error === "Invalid user id"
						? 401
						: 400;
			return NextResponse.json({ error: result.error }, { status: statusCode });
		}

		return NextResponse.json({
			ok: true,
			deduped: result.deduped ?? false,
			bookingId: result.bookingId,
		});
	} catch (error) {
		console.error("POST /api/bookings/airiq-flight error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to save booking" },
			{ status: 500 }
		);
	}
}
