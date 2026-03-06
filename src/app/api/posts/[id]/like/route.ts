import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST: Like a post (userId from session)
export async function POST(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const userId = session.user.id;
	try {
		const { id: postId } = await context.params;
		const post = await prisma.post.update({
			where: { id: postId },
			data: { likes: { push: userId } },
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

// DELETE: Unlike a post (userId from session)
export async function DELETE(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const userId = session.user.id;
	try {
		const { id: postId } = await context.params;
		const current = await prisma.post.findUnique({ where: { id: postId } });
		if (!current) {
			return NextResponse.json({ error: "Post not found" }, { status: 404 });
		}
		const post = await prisma.post.update({
			where: { id: postId },
			data: {
				likes: { set: current.likes.filter((id: string) => id !== userId) },
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
