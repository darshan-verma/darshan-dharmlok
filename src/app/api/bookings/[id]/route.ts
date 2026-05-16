import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isValidObjectId(s: string): boolean {
	return /^[a-f0-9]{24}$/i.test(s);
}

/**
 * Single travel booking for the signed-in user (cab snapshot, flight refs, etc.).
 */
export async function GET(
	_request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		const userId = session?.user?.id;
		if (!userId || !isValidObjectId(userId)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await context.params;
		if (!id || !isValidObjectId(id)) {
			return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
		}

		const booking = await prisma.travelBooking.findFirst({
			where: { id, userId },
			include: { destination: true },
		});

		if (!booking) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		return NextResponse.json(booking);
	} catch (error) {
		console.error("GET /api/bookings/[id] error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to load booking" },
			{ status: 500 },
		);
	}
}
