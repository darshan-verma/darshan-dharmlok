import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { getAnswer, setAnswer } from "@/lib/live/webrtcSignaling";

export async function POST(request: NextRequest) {
	try {
		const token = await getToken({ req: request });
		if (!token?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
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
			select: { id: true, instructorId: true },
		});
		if (!session) {
			return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
		}
		if (session.instructorId !== token.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		await setAnswer(body.broadcastId, body.viewerId, {
			sdp: body.sdp,
			type: body.type,
		});
		return NextResponse.json({ ok: true });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to submit answer",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const broadcastId = request.nextUrl.searchParams.get("broadcastId");
		const viewerId = request.nextUrl.searchParams.get("viewerId");
		if (!broadcastId || !viewerId) {
			return NextResponse.json(
				{ error: "broadcastId and viewerId are required" },
				{ status: 400 }
			);
		}
		const answer = await getAnswer(broadcastId, viewerId);
		return NextResponse.json({ answer });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch answer",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
