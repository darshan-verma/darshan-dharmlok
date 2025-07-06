import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch comments for a video
export async function GET(
	_: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const videoId = params.id;
		const comments = await prisma.comment.findMany({
			where: { videoId },
			include: {
				user: { select: { id: true, name: true, profileImageUrl: true } },
			},
			orderBy: { createdAt: "desc" },
		});
		return NextResponse.json({ comments });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch comments",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}

// POST: Add a comment to a video
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const videoId = params.id;
		const { userId, text } = await request.json();
		if (!userId || !text)
			return NextResponse.json(
				{ error: "Missing userId or text" },
				{ status: 400 }
			);

		const comment = await prisma.comment.create({
			data: {
				text,
				userId,
				videoId,
			},
			include: {
				user: { select: { id: true, name: true, profileImageUrl: true } },
			},
		});
		return NextResponse.json({ comment });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to add comment",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}
