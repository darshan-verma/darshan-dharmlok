import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getLiveState } from "@/lib/live/controlPlane";
import { getMediasoupLiveManager } from "@/lib/live/mediasoupManager";

export async function GET() {
	try {
		const manager = getMediasoupLiveManager();
		const sessions = await prisma.liveSession.findMany({
			where: { status: "live" },
			orderBy: { updatedAt: "desc" },
			take: 30,
			select: {
				id: true,
				title: true,
				description: true,
				startTime: true,
				updatedAt: true,
				instructor: {
					select: {
						id: true,
						name: true,
						userType: true,
						profileImageUrl: true,
					},
				},
			},
		});

		const streams = await Promise.all(
			sessions.map(async (session) => {
				const state = await getLiveState(session.id);
				return {
					id: session.id,
					title: session.title,
					description: session.description,
					startTime: session.startTime,
					updatedAt: session.updatedAt,
					playbackPath: state?.playbackPath || null,
					viewerCount: manager.getViewerCount(session.id),
					instructor: session.instructor,
				};
			})
		);

		return NextResponse.json({ streams });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch live streams",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
