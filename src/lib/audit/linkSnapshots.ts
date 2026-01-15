/**
 * Helper to link snapshots to bookings after confirmation
 */

import prisma from "@/lib/prisma";

/**
 * Link all snapshots with a given traceId to a booking
 * This connects pre-booking intent snapshots to the final booking
 */
export async function linkSnapshotsToBooking(
	traceId: string,
	bookingId: string
): Promise<void> {
	try {
		// Update all snapshots with this traceId to link them to the booking
		await prisma.bookingAuditSnapshot.updateMany({
			where: {
				traceId: traceId,
				bookingId: null, // Only update unlinked snapshots
			},
			data: {
				bookingId: bookingId,
			},
		});
	} catch (error) {
		// Silently fail - don't break booking flow
		console.warn("Failed to link snapshots to booking:", error);
	}
}
