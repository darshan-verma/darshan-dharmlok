import { NextRequest, NextResponse } from "next/server";
import { bookTripjackHotel } from "@/lib/tripjackClient";
import { resolveTripjackError } from "@/lib/tripjackError";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { TripjackHotelBookRequest } from "@/types/tripjack";

function validatePayload(body: Record<string, unknown>): string | null {
	if (typeof body.bookingId !== "string" || !body.bookingId) {
		return "bookingId is required";
	}
	if (
		!Array.isArray(body.roomTravellerInfo) ||
		body.roomTravellerInfo.length === 0
	) {
		return "roomTravellerInfo array is required with at least one room entry";
	}
	for (let i = 0; i < body.roomTravellerInfo.length; i++) {
		const room = body.roomTravellerInfo[i] as Record<string, unknown>;
		if (
			!Array.isArray(room?.travellerInfo) ||
			room.travellerInfo.length === 0
		) {
			return `roomTravellerInfo[${i}].travellerInfo must be a non-empty array`;
		}
		for (const t of room.travellerInfo as Record<string, unknown>[]) {
			if (!t.ti || !t.pt || !t.fN || !t.lN) {
				return `Each traveller must have ti, pt, fN, and lN`;
			}
		}
	}
	if (!body.deliveryInfo || typeof body.deliveryInfo !== "object") {
		return "deliveryInfo is required";
	}
	const di = body.deliveryInfo as Record<string, unknown>;
	if (!Array.isArray(di.emails) || di.emails.length === 0) {
		return "deliveryInfo.emails is required";
	}
	if (!Array.isArray(di.contacts) || di.contacts.length === 0) {
		return "deliveryInfo.contacts is required";
	}
	if (!Array.isArray(di.code) || di.code.length === 0) {
		return "deliveryInfo.code is required";
	}
	return null;
}

export async function POST(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const validationError = validatePayload(body);
	if (validationError) {
		return NextResponse.json({ error: validationError }, { status: 400 });
	}

	const payload: TripjackHotelBookRequest = {
		bookingId: body.bookingId as string,
		roomTravellerInfo:
			body.roomTravellerInfo as TripjackHotelBookRequest["roomTravellerInfo"],
		deliveryInfo: body.deliveryInfo as TripjackHotelBookRequest["deliveryInfo"],
		type: "HOTEL",
	};

	// Include paymentInfos for instant booking; omit for hold booking
	if (Array.isArray(body.paymentInfos) && body.paymentInfos.length > 0) {
		payload.paymentInfos = body.paymentInfos as { amount: number }[];
	}

	try {
		const result = await bookTripjackHotel(payload);

		// Persist booking to database if user is authenticated
		const session = await getServerSession(authOptions);
		if (session?.user?.id) {
			const meta = body.hotelMeta as Record<string, unknown> | undefined;
			try {
				await prisma.hotelBooking.create({
					data: {
						userId: session.user.id,
						source: "TRIPJACK",
						tripjackBookingId: result.bookingId || (body.bookingId as string),
						hotelName: (meta?.hotelName as string) || "Hotel",
						hotelCode: (meta?.hotelCode as string) || "",
						checkIn: new Date(
							(meta?.checkIn as string) || new Date().toISOString(),
						),
						checkOut: new Date(
							(meta?.checkOut as string) || new Date().toISOString(),
						),
						rooms: (meta?.rooms as number) || 1,
						adults: (meta?.adults as number) || 1,
						children: (meta?.children as number) || 0,
						totalAmount: (meta?.totalAmount as number) || 0,
						currency: (meta?.currency as string) || "INR",
						status: payload.paymentInfos ? "IN_PROGRESS" : "PENDING",
						guestDetails: body.roomTravellerInfo as object,
						deliveryInfo: body.deliveryInfo as object,
						cancellationPolicy: (meta?.cancellationPolicy as object) || null,
						optionSnapshot: (meta?.optionSnapshot as object) || null,
						holdDeadline: meta?.holdDeadline
							? new Date(meta.holdDeadline as string)
							: undefined,
					},
				});
			} catch (dbErr) {
				console.error("Failed to save hotel booking to DB:", dbErr);
			}
		}

		return NextResponse.json(result);
	} catch (err) {
		const resolved = resolveTripjackError(
			err,
			"TripJack hotel book request failed",
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
