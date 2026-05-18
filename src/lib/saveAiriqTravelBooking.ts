import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { FlightResult } from "@/types/tbo";
import { flightLegDates, flightRouteSummary } from "@/lib/flightTripMeta";

function isValidObjectId(s: string): boolean {
	return /^[a-f0-9]{24}$/i.test(s);
}

export type SaveAiriqTravelBookingParams = {
	userId: string;
	airIqPnr: string;
	airlinePnr?: string | null;
	leadFirstName?: string | null;
	leadLastName?: string | null;
	name: string;
	email: string;
	phone?: string | null;
	flight?: FlightResult | null;
	returnFlight?: FlightResult | null;
	routeSummary?: string | null;
	travelDate?: string | Date | null;
	returnDate?: string | Date | null;
	departureTime?: string | null;
	travelers?: number;
	totalAmount?: number | null;
	status?: string;
	bookingTrackId?: string | null;
};

export type SaveAiriqTravelBookingResult =
	| { ok: true; deduped?: boolean; bookingId: string }
	| { ok: false; error: string };

/**
 * Persist AIRiQ flight booking for the signed-in user (My Trips).
 * Idempotent per userId + airIqPnr.
 */
export async function saveAiriqTravelBooking(
	params: SaveAiriqTravelBookingParams
): Promise<SaveAiriqTravelBookingResult> {
	const { userId } = params;
	if (!isValidObjectId(userId)) {
		return { ok: false, error: "Invalid user id" };
	}

	const airIqPnr = params.airIqPnr?.trim() || "";
	if (!airIqPnr) {
		return { ok: false, error: "Missing AIRiQ PNR" };
	}

	const email = params.email?.trim() || "";
	if (!email) {
		return { ok: false, error: "Missing contact email" };
	}

	const name = params.name?.trim() || "Flight passenger";
	const flight = params.flight ?? null;
	const returnFlight = params.returnFlight ?? null;

	const routeSummary =
		params.routeSummary?.trim() ||
		(flight ? flightRouteSummary(flight, returnFlight) : "Flight booking");

	const legDates = flight
		? flightLegDates(flight, returnFlight)
		: null;

	let travelDate: Date;
	if (params.travelDate) {
		travelDate = new Date(params.travelDate);
	} else if (legDates) {
		travelDate = new Date(legDates.travelDateIso);
	} else {
		travelDate = new Date();
	}
	if (Number.isNaN(travelDate.getTime())) {
		return { ok: false, error: "Invalid travelDate" };
	}

	let returnDateOrNull: Date | null = null;
	if (params.returnDate) {
		const rd = new Date(params.returnDate);
		if (!Number.isNaN(rd.getTime())) returnDateOrNull = rd;
	} else if (legDates?.returnDateIso) {
		const rd = new Date(legDates.returnDateIso);
		if (!Number.isNaN(rd.getTime())) returnDateOrNull = rd;
	}

	const travelers =
		typeof params.travelers === "number" && params.travelers > 0
			? Math.floor(params.travelers)
			: 1;

	const existing = await prisma.travelBooking.findFirst({
		where: { userId, airIqPnr },
	});
	if (existing) {
		return { ok: true, deduped: true, bookingId: existing.id };
	}

	const bookingSnapshot: Prisma.InputJsonValue | undefined = params.bookingTrackId
		? { airIqTrackId: params.bookingTrackId, provider: "AIRiQ" }
		: undefined;

	const booking = await prisma.travelBooking.create({
		data: {
			userId,
			destinationId: null,
			name,
			email,
			phone: params.phone?.trim() || null,
			fromLocation: routeSummary,
			transportType: "air",
			travelDate,
			returnDate: returnDateOrNull,
			departureTime:
				params.departureTime?.trim() || legDates?.departureTimeLabel || null,
			travelers,
			totalAmount:
				typeof params.totalAmount === "number" && Number.isFinite(params.totalAmount)
					? params.totalAmount
					: null,
			status: params.status?.trim() || "CONFIRMED",
			source: "AIRiQ",
			airIqPnr,
			airlinePnr: params.airlinePnr?.trim() || null,
			leadFirstName: params.leadFirstName?.trim() || null,
			leadLastName: params.leadLastName?.trim() || null,
			bookingSnapshot,
		},
	});

	return { ok: true, bookingId: booking.id };
}
