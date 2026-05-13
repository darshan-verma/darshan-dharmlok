import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isValidObjectId(s: string): boolean {
	return /^[a-f0-9]{24}$/i.test(s);
}

/**
 * Persist a TripJack flight booking for the signed-in user so it appears under My Trips.
 * Idempotent per `tripjackBookingId` (unique).
 */
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		const userId = session?.user?.id;
		if (!userId || !isValidObjectId(userId)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await request.json()) as Record<string, unknown>;
		const tripjackBookingId =
			typeof body.tripjackBookingId === "string" ? body.tripjackBookingId.trim() : "";
		const name = typeof body.name === "string" ? body.name.trim() : "";
		const email = typeof body.email === "string" ? body.email.trim() : "";
		const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
		const leadFirstName =
			typeof body.leadFirstName === "string" ? body.leadFirstName.trim() : undefined;
		const leadLastName =
			typeof body.leadLastName === "string" ? body.leadLastName.trim() : undefined;
		const routeSummary =
			typeof body.routeSummary === "string" ? body.routeSummary.trim() : "";
		const travelDateRaw = typeof body.travelDate === "string" ? body.travelDate : "";
		const returnDateRaw =
			typeof body.returnDate === "string" && body.returnDate.trim()
				? body.returnDate.trim()
				: undefined;
		const travelers =
			typeof body.travelers === "number" && body.travelers > 0
				? Math.floor(body.travelers)
				: 1;
		const totalAmount =
			typeof body.totalAmount === "number" && Number.isFinite(body.totalAmount)
				? body.totalAmount
				: undefined;
		const departureTime =
			typeof body.departureTime === "string" ? body.departureTime.trim() : undefined;
		const tripjackAirlinePnr =
			typeof body.tripjackAirlinePnr === "string"
				? body.tripjackAirlinePnr.trim() || undefined
				: undefined;
		const status =
			typeof body.status === "string" && body.status.trim()
				? body.status.trim()
				: "CONFIRMED";

		if (!tripjackBookingId || !name || !email || !travelDateRaw) {
			return NextResponse.json(
				{ error: "tripjackBookingId, name, email, and travelDate are required" },
				{ status: 400 },
			);
		}

		const travelDate = new Date(travelDateRaw);
		if (Number.isNaN(travelDate.getTime())) {
			return NextResponse.json({ error: "Invalid travelDate" }, { status: 400 });
		}

		const returnDate =
			returnDateRaw != null && returnDateRaw !== ""
				? new Date(returnDateRaw)
				: null;
		const returnDateOrNull =
			returnDate && !Number.isNaN(returnDate.getTime()) ? returnDate : null;

		const existing = await prisma.travelBooking.findUnique({
			where: { tripjackBookingId },
		});
		if (existing) {
			if (existing.userId !== userId) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}
			return NextResponse.json({
				ok: true,
				deduped: true,
				booking: await prisma.travelBooking.findUnique({
					where: { id: existing.id },
					include: { destination: true },
				}),
			});
		}

		const booking = await prisma.travelBooking.create({
			data: {
				userId,
				destinationId: null,
				name,
				email,
				phone: phone || null,
				fromLocation: routeSummary || null,
				transportType: "air",
				travelDate,
				returnDate: returnDateOrNull,
				departureTime: departureTime || null,
				travelers,
				totalAmount: totalAmount ?? null,
				status,
				source: "TRIPJACK",
				tripjackBookingId,
				tripjackAirlinePnr: tripjackAirlinePnr ?? null,
				leadFirstName: leadFirstName ?? null,
				leadLastName: leadLastName ?? null,
			},
			include: { destination: true },
		});

		return NextResponse.json({ ok: true, booking });
	} catch (error) {
		console.error("POST /api/bookings/tripjack-flight error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to save booking" },
			{ status: 500 },
		);
	}
}
