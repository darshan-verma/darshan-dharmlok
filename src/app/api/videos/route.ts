import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/videos?userId=...
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");
	const source = searchParams.get("source"); // Get source from query params

	try {
		if (!userId) {
			return NextResponse.json({ error: "Missing userId" }, { status: 400 });
		}

		// Build the where clause for filtering
		// For MongoDB, we need to handle both:
		// 1. Videos saved with individual source values (e.g., "kathavachak-dashboard")
		// 2. Videos saved with comma-separated source values (e.g., "kathavachak-dashboard,kathavachak-post")
		let whereClause: Prisma.VideoWhereInput = {
			userId: userId as string,
		};

		if (source) {
			const sources = source.split(",").map(s => s.trim());
			if (sources.length > 1) {
				// Use AND to ensure userId matches AND source matches one of the conditions
				whereClause = {
					AND: [
						{ userId: userId as string },
						{
							OR: [
								{ source: { in: sources } }, // Matches individual values like "kathavachak-dashboard"
								{ source: source }, // Matches the full comma-separated string like "kathavachak-dashboard,kathavachak-post"
							],
						},
					],
				};
			} else {
				whereClause.source = source;
			}
		}

		console.log("[GET /api/videos] Query params - userId:", userId, "source:", source);
		console.log("[GET /api/videos] Where clause:", JSON.stringify(whereClause, null, 2));

		// Prisma MongoDB expects userId as a string (with @db.ObjectId in schema)
		const videos = await prisma.video.findMany({
			where: whereClause,
			orderBy: { createdAt: "desc" },
		});
		
		// Also check all videos for this user to debug source mismatch
		const allUserVideos = await prisma.video.findMany({
			where: { userId: userId as string },
			select: { id: true, title: true, userId: true, source: true, videoFile: true },
			orderBy: { createdAt: "desc" },
			take: 5, // Just get a few for debugging
		});
		
		console.log("[GET /api/videos] Found videos with filter:", videos.length);
		console.log("[GET /api/videos] Total videos for user (sample):", allUserVideos.length);
		if (allUserVideos.length > 0) {
			console.log("[GET /api/videos] Sample videos in DB:", allUserVideos.map(v => ({
				id: v.id,
				title: v.title,
				userId: v.userId,
				source: v.source,
				hasVideoFile: !!v.videoFile,
			})));
		}
		
		// If no videos found with source filter, try without source filter (for backward compatibility)
		// This helps if videos were saved without a source or with a different source format
		if (videos.length === 0 && source) {
			console.log("[GET /api/videos] No videos found with source filter, trying without source filter...");
			const videosWithoutSource = await prisma.video.findMany({
				where: { userId: userId as string },
				orderBy: { createdAt: "desc" },
			});
			console.log("[GET /api/videos] Found videos without source filter:", videosWithoutSource.length);
			// Only use these if we actually found videos (they might be from a different source)
			// For now, we'll return empty and let the logs show what's in the DB
		}
		
		if (videos.length > 0) {
			console.log("[GET /api/videos] First filtered video:", {
				id: videos[0].id,
				title: videos[0].title,
				userId: videos[0].userId,
				source: videos[0].source,
				videoFile: videos[0].videoFile,
			});
		}
		
		return NextResponse.json({ videos });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch videos",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}

// POST /api/videos
export async function POST(request: Request) {
	console.log("Received POST request to /api/videos");
	try {
		const data = await request.json();
		console.log("Request body:", JSON.stringify(data, null, 2));

		const {
			title,
			description,
			userId,
			category,
			type,
			thumbnailUrl,
			videoFile,
			status,
			source, // Destructure source from the request body
		} = data;
		if (!userId || !title || !category) {
			const errorMessage =
				"Missing required fields: userId, title, and category are required";
			console.error(errorMessage);
			return NextResponse.json({ error: errorMessage }, { status: 400 });
		}

		const videoData = {
			title,
			description,
			userId: userId as string,
			category,
			type,
			thumbnailUrl,
			videoFile,
			source, // Add source to the created video data
			status: status || "active",
			// videoUrl is deprecated in the schema, using videoFile instead
		};

		console.log("Attempting to create video with data:", videoData);
		const video = await prisma.video.create({
			data: videoData,
		});

		console.log("Successfully created video:", video);
		return NextResponse.json(video);
	} catch (error) {
		console.error("Error creating video:", error);
		return NextResponse.json(
			{
				error: "Failed to create video",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
