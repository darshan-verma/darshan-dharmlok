import { NextRequest, NextResponse } from "next/server";
import { cancelTripjackHotelBooking } from "@/lib/tripjackClient";
import { resolveTripjackError } from "@/lib/tripjackError";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	if (typeof body.bookingId !== "string" || !body.bookingId) {
		return NextResponse.json(
			{ error: "bookingId is required" },
			{ status: 400 },
		);
	}

	try {
		const result = await cancelTripjackHotelBooking(body.bookingId as string);

		// Update DB — may be CANCELLED immediately or CANCELLATION_PENDING
		try {
			await prisma.hotelBooking.updateMany({
				where: { tripjackBookingId: body.bookingId as string },
				data: { status: "CANCELLATION_PENDING", updatedAt: new Date() },
			});
		} catch (dbErr) {
			console.error("Failed to update hotel booking status:", dbErr);
		}

		return NextResponse.json(result);
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack hotel cancel-booking request failed",
		);
		return NextResponse.json(
			{
				error: resolved.message,
				...(resolved.providerError
					? { providerError: resolved.providerError }
					: {}),
			},
			{ status: resolved.status },
		);
	}
}
