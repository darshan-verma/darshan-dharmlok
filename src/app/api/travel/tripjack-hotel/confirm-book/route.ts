import { NextRequest, NextResponse } from "next/server";
import { confirmTripjackHotelHold } from "@/lib/tripjackClient";
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
		return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
	}
	if (!Array.isArray(body.paymentInfos) || body.paymentInfos.length === 0) {
		return NextResponse.json(
			{ error: "paymentInfos is required to confirm a held booking" },
			{ status: 400 },
		);
	}

	try {
		const result = await confirmTripjackHotelHold({
			bookingId: body.bookingId as string,
			paymentInfos: body.paymentInfos as { amount: number }[],
		});

		// Update DB record status
		try {
			await prisma.hotelBooking.updateMany({
				where: { tripjackBookingId: body.bookingId as string },
				data: { status: "IN_PROGRESS", updatedAt: new Date() },
			});
		} catch (dbErr) {
			console.error("Failed to update hotel booking status:", dbErr);
		}

		return NextResponse.json(result);
	} catch (err) {
		const resolved = resolveTripjackError(err, "TripJack hotel confirm-book request failed");
		return NextResponse.json(
			{ error: resolved.message, ...(resolved.providerError ? { providerError: resolved.providerError } : {}) },
			{ status: resolved.status },
		);
	}
}
