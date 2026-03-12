import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { getLiveState, setLiveStatus, clearBroadcastRedisState } from "@/lib/live/controlPlane";
import { getMediasoupLiveManager } from "@/lib/live/mediasoupManager";

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;
		const session = await prisma.liveSession.findUnique({
			where: { id },
			select: {
				id: true,
				title: true,
				description: true,
				status: true,
				startTime: true,
				durationMin: true,
				participantCount: true,
				createdAt: true,
				instructorId: true,
			},
		});
		if (!session) {
			return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
		}
		const liveState = await getLiveState(id);
		const viewerCount = session.status === "live" ? getMediasoupLiveManager().getViewerCount(id) : 0;
		return NextResponse.json({
			...session,
			viewerCount,
			liveState: liveState
				? {
						status: liveState.status,
						playbackPath: liveState.playbackPath,
				  }
				: null,
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch broadcast",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const token = await getToken({ req: request });
		if (!token?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { id } = await context.params;
		const session = await prisma.liveSession.findUnique({
			where: { id },
			select: { id: true, instructorId: true },
		});
		if (!session) {
			return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
		}
		if (session.instructorId !== token.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		const body = (await request.json()) as { title?: string; description?: string };
		const data: { title?: string; description?: string } = {};
		if (typeof body.title === "string" && body.title.trim()) {
			data.title = body.title.trim();
		}
		if (typeof body.description === "string") {
			data.description = body.description.trim() || undefined;
		}
		if (Object.keys(data).length === 0) {
			return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
		}
		const updated = await prisma.liveSession.update({
			where: { id },
			data,
			select: {
				id: true,
				title: true,
				description: true,
				status: true,
				startTime: true,
				participantCount: true,
				createdAt: true,
				instructorId: true,
			},
		});
		return NextResponse.json(updated);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to update broadcast",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const token = await getToken({ req: request });
		if (!token?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { id } = await context.params;
		const session = await prisma.liveSession.findUnique({
			where: { id },
			select: { id: true, instructorId: true, status: true },
		});
		if (!session) {
			return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
		}
		if (session.instructorId !== token.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		if (session.status === "live") {
			await setLiveStatus(id, "ended");
			await getMediasoupLiveManager().closeRoom(id);
		}
		await clearBroadcastRedisState(id);
		await prisma.sessionParticipant.deleteMany({ where: { sessionId: id } });
		await prisma.reminder.deleteMany({ where: { sessionId: id } });
		await prisma.liveSession.delete({ where: { id } });
		return NextResponse.json({ ok: true, deleted: id });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to delete broadcast",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
