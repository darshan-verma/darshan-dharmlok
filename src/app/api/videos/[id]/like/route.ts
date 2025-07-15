import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Like a video
export async function POST(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id: videoId } = await context.params;
	try {
		const { userId } = await request.json();
		if (!userId)
			return NextResponse.json({ error: "Missing userId" }, { status: 400 });

		// Add userId to likes array if not already present
		const video = await prisma.video.update({
			where: { id: videoId },
			data: {
				likes: { push: userId },
			},
		});
		return NextResponse.json({ likes: video.likes });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to like video",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}

// DELETE: Unlike a video
export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id: videoId } = await context.params;
	try {
		const { userId } = await request.json();
		if (!userId)
			return NextResponse.json({ error: "Missing userId" }, { status: 400 });

		// Remove userId from likes array
		const video = await prisma.video.update({
			where: { id: videoId },
			data: {
				likes: {
					set:
						(
							await prisma.video.findUnique({ where: { id: videoId } })
						)?.likes.filter((id: string) => id !== userId) || [],
				},
			},
		});
		return NextResponse.json({ likes: video.likes });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to unlike video",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}
