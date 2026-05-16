import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { TripjackCabBookingSnapshot } from "@/types/tripjack";

function isValidObjectId(s: string): boolean {
	return /^[a-f0-9]{24}$/i.test(s);
}

export type SaveTripjackCabTravelBookingResult =
	| { ok: true; deduped?: boolean; bookingId: string }
	| { ok: false; error: string };

/**
 * Persist TripJack cab booking for the signed-in user (My Trips).
 * Idempotent per `tripjackBookingId` (unique).
 */
export async function saveTripjackCabTravelBooking(params: {
	userId: string;
	data: TripjackCabBookingSnapshot;
}): Promise<SaveTripjackCabTravelBookingResult> {
	const { userId, data } = params;
	if (!isValidObjectId(userId)) {
		return { ok: false, error: "Invalid user id" };
	}

	const tripjackBookingId = typeof data.id === "string" ? data.id.trim() : "";
	if (!tripjackBookingId) {
		return { ok: false, error: "Missing TripJack booking id" };
	}

	const passenger = data.passenger;
	const name =
		(passenger?.fullName && passenger.fullName.trim()) ||
		[passenger?.firstName, passenger?.lastName].filter(Boolean).join(" ").trim() ||
		"Cab passenger";
	const email = passenger?.email?.trim() || "";
	if (!email) {
		return { ok: false, error: "Missing passenger email" };
	}

	const journey = data.journey;
	const pickupRaw = journey?.pickupDate;
	if (!pickupRaw) {
		return { ok: false, error: "Missing journey pickup date" };
	}

	const travelDate = new Date(pickupRaw);
	if (Number.isNaN(travelDate.getTime())) {
		return { ok: false, error: "Invalid journey pickup date" };
	}

	const returnRaw = journey?.returnDate;
	const returnDate =
		returnRaw != null && returnRaw !== "" ? new Date(returnRaw) : null;
	const returnDateOrNull =
		returnDate && !Number.isNaN(returnDate.getTime()) ? returnDate : null;

	const fromLocation =
		journey?.source && journey?.destination
			? `${journey.source} → ${journey.destination}`
			: journey?.source || journey?.destination || null;

	const travelers =
		typeof data.passengerCount === "number" && data.passengerCount > 0
			? Math.floor(data.passengerCount)
			: 1;

	const existing = await prisma.travelBooking.findUnique({
		where: { tripjackBookingId },
	});
	if (existing) {
		if (existing.userId !== userId) {
			return { ok: false, error: "Forbidden" };
		}
		return { ok: true, deduped: true, bookingId: existing.id };
	}

	const bookingSnapshot = data as unknown as Prisma.InputJsonValue;

	const booking = await prisma.travelBooking.create({
		data: {
			userId,
			destinationId: null,
			name,
			email,
			phone: passenger?.phone?.trim() || null,
			fromLocation,
			transportType: "cab",
			travelDate,
			returnDate: returnDateOrNull,
			departureTime: null,
			travelers,
			totalAmount:
				typeof data.totalPrice === "number" && Number.isFinite(data.totalPrice)
					? data.totalPrice
					: null,
			status: data.status?.trim() || "PENDING",
			source: "TRIPJACK_CAB",
			tripjackBookingId,
			tripjackAirlinePnr: null,
			bookingSnapshot,
		},
	});

	return { ok: true, bookingId: booking.id };
}
