import { NextRequest, NextResponse } from "next/server";
import { enqueueOffer } from "@/lib/live/webrtcSignaling";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			broadcastId?: string;
			viewerId?: string;
			sdp?: string;
			type?: RTCSdpType;
		};
		if (!body.broadcastId || !body.viewerId || !body.sdp || !body.type) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const session = await prisma.liveSession.findUnique({
			where: { id: body.broadcastId },
			select: { id: true, status: true },
		});
		if (!session) {
			return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
		}
		if (session.status !== "live") {
			return NextResponse.json({ error: "Broadcast is not live" }, { status: 409 });
		}

		await enqueueOffer(body.broadcastId, {
			viewerId: body.viewerId,
			sdp: body.sdp,
			type: body.type,
			createdAt: new Date().toISOString(),
		});
		return NextResponse.json({ ok: true });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to submit offer",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
