import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper to validate MongoDB ObjectId
function isValidObjectId(id: string) {
	return /^[a-f\d]{24}$/i.test(id);
}

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
		console.log(
			`[GET /api/posts/${postId}/comments] Returning comments:`,
			comments
		);
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

// POST: Add a comment to a post
export async function POST(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id: postId } = await context.params;
	try {
		const { userId, text } = await request.json();
		if (!userId || !text)
			return NextResponse.json(
				{ error: "Missing userId or text" },
				{ status: 400 }
			);
		if (!isValidObjectId(userId))
			return NextResponse.json(
				{ error: "Invalid userId format" },
				{ status: 400 }
			);

		// Check if post exists before creating comment
		const post = await prisma.post.findUnique({ where: { id: postId } });
		if (!post)
			return NextResponse.json({ error: "Post not found" }, { status: 404 });

		const comment = await prisma.comment.create({
			data: {
				text,
				userId,
				postId,
			},
			include: { user: true },
		});
		console.log(
			`[POST /api/posts/${postId}/comments] Created comment:`,
			comment
		);
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
