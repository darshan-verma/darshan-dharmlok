import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getLiveState } from "@/lib/live/controlPlane";
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
