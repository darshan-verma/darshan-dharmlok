import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { createLiveBroadcast } from "@/lib/live/controlPlane";
import { getLiveState } from "@/lib/live/controlPlane";
import { getMediasoupLiveManager } from "@/lib/live/mediasoupManager";

export async function GET(request: NextRequest) {
	try {
		const token = await getToken({ req: request });
		const manager = getMediasoupLiveManager();
		const items = await prisma.liveSession.findMany({
			where: token?.id ? { instructorId: token.id } : undefined,
			orderBy: { createdAt: "desc" },
			take: 50,
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
		const broadcasts = await Promise.all(
			items.map(async (item) => {
				const liveState = await getLiveState(item.id);
				const viewerCount = item.status === "live" ? manager.getViewerCount(item.id) : 0;
				return {
					...item,
					playbackPath: liveState?.playbackPath || null,
					viewerCount,
				};
			})
		);
		return NextResponse.json({ broadcasts });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch broadcasts",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const token = await getToken({ req: request });
		if (!token?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const body = (await request.json()) as {
			title?: string;
			description?: string;
		};
		if (!body.title?.trim()) {
			return NextResponse.json({ error: "title is required" }, { status: 400 });
		}
		const broadcast = await createLiveBroadcast({
			title: body.title.trim(),
			description: body.description?.trim(),
			instructorId: token.id,
		});
		return NextResponse.json(broadcast, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to create broadcast",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
