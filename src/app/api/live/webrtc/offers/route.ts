import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { dequeueOffers } from "@/lib/live/webrtcSignaling";

export async function GET(request: NextRequest) {
	try {
		const token = await getToken({ req: request });
		if (!token?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const broadcastId = request.nextUrl.searchParams.get("broadcastId");
		if (!broadcastId) {
			return NextResponse.json({ error: "broadcastId is required" }, { status: 400 });
		}

		const session = await prisma.liveSession.findUnique({
			where: { id: broadcastId },
			select: { id: true, instructorId: true },
		});
		if (!session) {
			return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
		}
		if (session.instructorId !== token.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const offers = await dequeueOffers(broadcastId);
		return NextResponse.json({ offers });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch offers",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
