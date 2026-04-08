/**
 * POST /api/admin/tripjack-pending-cancellations
 *
 * Polls TripJack booking-details for all bookings in CANCELLATION_PENDING
 * status and updates the DB when books transition to CANCELLED.
 *
 * Designed to be called daily by an external cron or from the admin dashboard.
 * TripJack docs: "Poll Booking Details once per day until status updates to CANCELLED."
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTripjackHotelBookingDetails } from "@/lib/tripjackClient";

export async function POST() {
	const pendingBookings = await prisma.hotelBooking.findMany({
		where: {
			source: "TRIPJACK",
			status: "CANCELLATION_PENDING",
			tripjackBookingId: { not: null },
		},
		select: {
			id: true,
			tripjackBookingId: true,
			hotelName: true,
		},
	});

	if (pendingBookings.length === 0) {
		return NextResponse.json({
			checked: 0,
			updated: 0,
			message: "No CANCELLATION_PENDING bookings found",
		});
	}

	const results: Array<{
		bookingId: string;
		previousStatus: string;
		newStatus: string | null;
		error?: string;
	}> = [];

	for (const booking of pendingBookings) {
		const tjId = booking.tripjackBookingId!;
		try {
			const details = await getTripjackHotelBookingDetails(tjId);
			const newStatus = details.order?.status;

			if (newStatus && newStatus !== "CANCELLATION_PENDING") {
				await prisma.hotelBooking.update({
					where: { id: booking.id },
					data: { status: newStatus, updatedAt: new Date() },
				});
				results.push({
					bookingId: tjId,
					previousStatus: "CANCELLATION_PENDING",
					newStatus,
				});
			} else {
				results.push({
					bookingId: tjId,
					previousStatus: "CANCELLATION_PENDING",
					newStatus: null,
				});
			}
		} catch (err) {
			results.push({
				bookingId: tjId,
				previousStatus: "CANCELLATION_PENDING",
				newStatus: null,
				error: err instanceof Error ? err.message : "Unknown error",
			});
		}
	}

	const updated = results.filter((r) => r.newStatus !== null).length;

	return NextResponse.json({
		checked: pendingBookings.length,
		updated,
		results,
	});
}
