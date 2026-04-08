import { NextRequest, NextResponse } from "next/server";
import { getTripjackHotelBookingDetails } from "@/lib/tripjackClient";
import { resolveTripjackError } from "@/lib/tripjackError";
import prisma from "@/lib/prisma";

const TERMINAL_STATUSES = new Set([
	"SUCCESS",
	"ON_HOLD",
	"ABORTED",
	"FAILED",
	"CANCELLED",
]);

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
		const result = await getTripjackHotelBookingDetails(
			body.bookingId as string,
		);

		// Sync terminal status to DB
		const orderStatus = result.order?.status;
		if (orderStatus && TERMINAL_STATUSES.has(orderStatus)) {
			try {
				const updateData: Record<string, unknown> = {
					status: orderStatus,
					updatedAt: new Date(),
				};
				if (orderStatus === "SUCCESS" && result.order?.amount) {
					updateData.totalAmount = result.order.amount;
				}
				await prisma.hotelBooking.updateMany({
					where: { tripjackBookingId: body.bookingId as string },
					data: updateData,
				});
			} catch (dbErr) {
				console.error("Failed to update hotel booking status:", dbErr);
			}
		}

		// Enrich with holdDeadline from DB for ON_HOLD bookings
		let holdDeadline: string | undefined;
		if (result.order?.status === "ON_HOLD") {
			try {
				const dbRecord = await prisma.hotelBooking.findFirst({
					where: { tripjackBookingId: body.bookingId as string },
					select: { holdDeadline: true },
				});
				if (dbRecord?.holdDeadline) {
					holdDeadline = dbRecord.holdDeadline.toISOString();
				}
			} catch {
				// non-critical
			}
		}

		return NextResponse.json({
			...result,
			...(holdDeadline && { holdDeadline }),
		});
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack hotel booking-details request failed",
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
