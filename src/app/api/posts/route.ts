import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const postInclude = {
	user: {
		select: {
			id: true,
			name: true,
			profileImageUrl: true,
			image: true,
		},
	},
	media: true,
	_count: {
		select: { comments: true },
	},
};

/**
 * GET /api/posts
 * Query: feed=community | feed=own
 * - feed=community: all posts (auth required)
 * - feed=own: current user's posts (auth required, userId from session)
 * Legacy: userId + userType (no feed param) still supported for own posts
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const feed = searchParams.get("feed");
	const userId = searchParams.get("userId");
	const userType = searchParams.get("userType");
	const session = await getServerSession(authOptions);

	if (feed === "community") {
		if (!session?.user?.id) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}
		try {
			const posts = await prisma.post.findMany({
				where: {},
				orderBy: { createdAt: "desc" },
				include: postInclude,
			});
			const postsWithCommentCount = posts.map((post) => ({
				...post,
				commentCount: post._count?.comments ?? 0,
			}));
			return NextResponse.json(postsWithCommentCount);
		} catch (error) {
			console.error("Error fetching community posts:", error);
			return NextResponse.json(
				{ message: "Failed to fetch posts" },
				{ status: 500 }
			);
		}
	}

	if (feed === "own" || (userId && userType)) {
		const effectiveUserId = feed === "own" ? session?.user?.id : userId;
		const effectiveUserType = userType ?? session?.user?.role ?? "user";
		if (!effectiveUserId) {
			return NextResponse.json(
				{ message: "Unauthorized or missing userId" },
				{ status: 401 }
			);
		}
		try {
			const posts = await prisma.post.findMany({
				where: {
					userId: effectiveUserId,
					...(effectiveUserType && { userType: effectiveUserType }),
				},
				orderBy: { createdAt: "desc" },
				include: postInclude,
			});
			const postsWithCommentCount = posts.map((post) => ({
				...post,
				commentCount: post._count?.comments ?? 0,
			}));
			return NextResponse.json(postsWithCommentCount);
		} catch (error) {
			console.error("Error fetching posts:", error);
			return NextResponse.json(
				{ message: "Failed to fetch posts" },
				{ status: 500 }
			);
		}
	}

	return NextResponse.json(
		{ message: "Missing feed (community|own) or userId+userType" },
		{ status: 400 }
	);
}

/**
 * POST /api/posts
 * Body: { caption?, media, userType? }
 * userId from session. caption optional (image/video-only posts).
 */
export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}
	try {
		const body = await req.json();
		const { caption, media, userType } = body;
		const userId = session.user.id;

		if (!media || !Array.isArray(media) || media.length === 0) {
			return NextResponse.json(
				{ message: "At least one media item is required" },
				{ status: 400 }
			);
		}

		const newPost = await prisma.post.create({
			data: {
				caption: caption ?? "",
				userType: userType ?? (session.user.role ?? "user"),
				user: { connect: { id: userId } },
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
						id: true,
						name: true,
						profileImageUrl: true,
						image: true,
					},
				},
			},
		});

		return NextResponse.json(newPost, { status: 201 });
	} catch (error) {
		console.error("Error creating post:", error);
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
