/**
 * POST /api/travel/hotel/book
 * Persists TBO hotel guest details after prebook (final TBO Book API integration pending).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function validateGuestPayload(body: Record<string, unknown>): string | null {
	if (
		!Array.isArray(body.roomTravellerInfo) ||
		body.roomTravellerInfo.length === 0
	) {
		return "roomTravellerInfo is required";
	}
	for (let i = 0; i < body.roomTravellerInfo.length; i++) {
		const room = body.roomTravellerInfo[i] as Record<string, unknown>;
		if (
			!Array.isArray(room?.travellerInfo) ||
			(room.travellerInfo as unknown[]).length === 0
		) {
			return `roomTravellerInfo[${i}].travellerInfo is required`;
		}
	}
	const di = body.deliveryInfo as Record<string, unknown> | undefined;
	if (!di?.emails || !Array.isArray(di.emails) || !di.emails[0]) {
		return "deliveryInfo.emails is required";
	}
	if (!di?.contacts || !Array.isArray(di.contacts) || !di.contacts[0]) {
		return "deliveryInfo.contacts is required";
	}
	if (!body.bookingCode || typeof body.bookingCode !== "string") {
		return "bookingCode is required";
	}
	return null;
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json(
				{ success: false, error: "Please sign in to complete your booking" },
				{ status: 401 },
			);
		}

		const body = (await request.json()) as Record<string, unknown>;
		const validationError = validateGuestPayload(body);
		if (validationError) {
			return NextResponse.json(
				{ success: false, error: validationError },
				{ status: 400 },
			);
		}

		const meta = (body.hotelMeta || {}) as Record<string, unknown>;

		const record = await prisma.hotelBooking.create({
			data: {
				userId: session.user.id,
				source: "TBO",
				tripjackBookingId: null,
				hotelName: (meta.hotelName as string) || "Hotel",
				hotelCode: (meta.hotelCode as string) || "",
				checkIn: new Date(
					(meta.checkIn as string) || new Date().toISOString(),
				),
				checkOut: new Date(
					(meta.checkOut as string) || new Date().toISOString(),
				),
				rooms: (meta.rooms as number) || 1,
				adults: (meta.adults as number) || 1,
				children: (meta.children as number) || 0,
				totalAmount: (meta.totalAmount as number) || 0,
				currency: (meta.currency as string) || "INR",
				status: "PENDING",
				guestDetails: body.roomTravellerInfo as object,
				deliveryInfo: body.deliveryInfo as object,
				optionSnapshot: {
					bookingCode: body.bookingCode as string,
					tboPreBook: (meta.preBookSnapshot as object) ?? null,
				},
			},
		});

		return NextResponse.json({
			success: true,
			bookingId: record.id,
			status: { success: true },
		});
	} catch (error) {
		console.error("TBO hotel book (guest save) error:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to save guest details",
			},
			{ status: 500 },
		);
	}
}
