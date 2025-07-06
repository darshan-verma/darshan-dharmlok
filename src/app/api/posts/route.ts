import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * @swagger
 * /api/posts:
 *   get:
 *     description: Returns all posts
 *     responses:
 *       200:
 *         description: A list of posts
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");
	const userType = searchParams.get("userType");

	if (!userId || !userType) {
		return NextResponse.json(
			{ message: "Missing userId or userType" },
			{ status: 400 }
		);
	}

	try {
		const posts = await prisma.post.findMany({
			where: {
				userId,
				userType,
			},
			orderBy: {
				createdAt: "desc",
			},
			include: {
				user: {
					select: {
						name: true,
						profileImageUrl: true,
					},
				},
				media: true,
			},
		});
		return NextResponse.json(posts);
	} catch (error) {
		console.error("Error fetching posts:", error);
		return NextResponse.json(
			{ message: "Failed to fetch posts" },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/posts:
 *   post:
 *     description: Creates a new post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *               media:
 *                 type: array
 *     responses:
 *       201:
 *         description: The created post
 */
export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { userId, caption, media, userType } = body;

		if (!userId || !caption || !media || !userType) {
			return NextResponse.json(
				{ message: "Missing required fields" },
				{ status: 400 }
			);
		}

		const newPost = await prisma.post.create({
			data: {
				caption,
				userType, // <-- add userType here
				user: {
					connect: {
						id: userId,
					},
				},
				media: {
					create: media.map((m: { url: string; type: string }) => ({
						url: m.url,
						type: m.type,
					})),
				},
			},
			include: {
				media: true,
				user: {
					select: {
						name: true,
						profileImageUrl: true,
					},
				},
			},
		});

		return NextResponse.json(newPost, { status: 201 });
	} catch (error) {
		console.error("Error creating post:", error);
		// Provide more specific error messages in development
		if (error instanceof Prisma.PrismaClientValidationError) {
			return NextResponse.json(
				{
					message: "Invalid data provided for post creation.",
					error: error.message,
				},
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ message: "Failed to create post" },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     description: Deletes a post by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
export async function DELETE(request: Request) {
	try {
		const url = new URL(request.url);
		const pathnameParts = url.pathname.split("/");
		const postId = pathnameParts[pathnameParts.length - 1];

		const postIndex = await prisma.post.findUnique({
			where: { id: postId },
		});

		if (!postIndex) {
			return NextResponse.json({ message: "Post not found" }, { status: 404 });
		}

		// In a real app, you would also delete the associated media from S3 here
		await prisma.post.delete({ where: { id: postId } });
		return NextResponse.json({ message: "Post deleted successfully" });
	} catch (error) {
		console.error("Error deleting post:", error);
		return NextResponse.json(
			{ message: "Failed to delete post" },
			{ status: 500 }
		);
	}
}
