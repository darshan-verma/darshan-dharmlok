import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: Get all comments for a post
export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id: postId } = await context.params;
	try {
		const comments = await prisma.comment.findMany({
			where: { postId },
			include: { user: true },
			orderBy: { createdAt: "desc" },
		});
		return NextResponse.json({ comments });
	} catch (error) {
		console.error("[GET /api/posts/[id]/comments] Error:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch comments",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}

// POST: Add a comment to a post (userId from session)
export async function POST(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const { id: postId } = await context.params;
	try {
		const { text } = await request.json();
		if (!text || typeof text !== "string") {
			return NextResponse.json(
				{ error: "Missing or invalid text" },
				{ status: 400 }
			);
		}
		const post = await prisma.post.findUnique({ where: { id: postId } });
		if (!post) {
			return NextResponse.json({ error: "Post not found" }, { status: 404 });
		}
		const comment = await prisma.comment.create({
			data: {
				text,
				userId: session.user.id,
				postId,
			},
			include: { user: true },
		});
		return NextResponse.json({ comment });
	} catch (error) {
		console.error("[POST /api/posts/[id]/comments] Error:", error);
		return NextResponse.json(
			{
				error: "Failed to add comment",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}
