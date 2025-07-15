import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Like a post
export async function POST(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id: postId } = await context.params;
		const { userId } = await request.json();
		if (!userId)
			return NextResponse.json({ error: "Missing userId" }, { status: 400 });

		// Add userId to likes array if not already present
		const post = await prisma.post.update({
			where: { id: postId },
			data: {
				likes: { push: userId },
			},
		});
		return NextResponse.json({ likes: post.likes });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to like post",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}

// DELETE: Unlike a post
export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id: postId } = await context.params;
		const { userId } = await request.json();
		if (!userId)
			return NextResponse.json({ error: "Missing userId" }, { status: 400 });

		// Remove userId from likes array
		const post = await prisma.post.update({
			where: { id: postId },
			data: {
				likes: {
					set:
						(
							await prisma.post.findUnique({ where: { id: postId } })
						)?.likes.filter((id: string) => id !== userId) || [],
				},
			},
		});
		return NextResponse.json({ likes: post.likes });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to unlike post",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}
