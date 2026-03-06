import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";

// DELETE a post by ID (auth required; only post owner)
export async function DELETE(
	_req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}
	const { id } = await context.params;
	try {
		const post = await prisma.post.findUnique({ where: { id } });
		if (!post) {
			return NextResponse.json({ message: "Post not found" }, { status: 404 });
		}
		if (post.userId !== session.user.id) {
			return NextResponse.json({ message: "Forbidden" }, { status: 403 });
		}
		await prisma.media.deleteMany({ where: { postId: id } });
		await prisma.post.delete({ where: { id } });
		return NextResponse.json({ message: "Post deleted successfully" });
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2025") {
				return NextResponse.json(
					{ message: "Post not found" },
					{ status: 404 }
				);
			}
		}
		console.error("Error deleting post:", error);
		return NextResponse.json(
			{ message: "Failed to delete post" },
			{ status: 500 }
		);
	}
}

// PATCH (update) a post by ID (auth required; only post owner)
export async function PATCH(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}
	const { id } = await context.params;
	try {
		const post = await prisma.post.findUnique({ where: { id } });
		if (!post) {
			return NextResponse.json({ message: "Post not found" }, { status: 404 });
		}
		if (post.userId !== session.user.id) {
			return NextResponse.json({ message: "Forbidden" }, { status: 403 });
		}
		const body = await req.json();
		const { caption } = body;
		const updatedPost = await prisma.post.update({
			where: { id },
			data: { caption: caption !== undefined ? (caption ?? null) : undefined },
		});
		return NextResponse.json(updatedPost);
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2025") {
				return NextResponse.json(
					{ message: "Post not found" },
					{ status: 404 }
				);
			}
		}
		console.error("Error updating post:", error);
		return NextResponse.json(
			{ message: "Failed to update post" },
			{ status: 500 }
		);
	}
}

// GET: Get a single post by id (including likes array)
export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id: postId } = await context.params;
	try {
		const post = await prisma.post.findUnique({
			where: { id: postId },
			include: {
				user: true,
				media: true,
				comments: true,
			},
		});
		if (!post) {
			return NextResponse.json({ message: "Post not found" }, { status: 404 });
		}
		return NextResponse.json(post);
	} catch (error) {
		console.error("Error fetching post:", error);
		return NextResponse.json(
			{ message: "Failed to fetch post" },
			{ status: 500 }
		);
	}
}
