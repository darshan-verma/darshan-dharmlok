import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// DELETE a post by ID
export async function DELETE(req: Request) {
	const url = new URL(req.url);
	const pathnameParts = url.pathname.split("/");
	const id = pathnameParts[pathnameParts.length - 1];
	try {
		// First, delete all media associated with the post
		await prisma.media.deleteMany({
			where: {
				postId: id,
			},
		});

		// Then, delete the post itself
		await prisma.post.delete({
			where: { id },
		});
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

// PATCH (update) a post by ID
export async function PATCH(req: Request) {
	const url = new URL(req.url);
	const pathnameParts = url.pathname.split("/");
	const id = pathnameParts[pathnameParts.length - 1];
	try {
		const { caption } = await req.json();
		if (typeof caption !== "string") {
			return NextResponse.json({ message: "Invalid caption" }, { status: 400 });
		}

		const updatedPost = await prisma.post.update({
			where: { id },
			data: { caption },
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
