import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
		const whereClause: { userId: string; source?: string | { in: string[] } } = {
			userId: userId as string,
		};

		if (source) {
			const sources = source.split(",");
			if (sources.length > 1) {
				whereClause.source = { in: sources };
			} else {
				whereClause.source = source;
			}
		}

		// Prisma MongoDB expects userId as a string (with @db.ObjectId in schema)
		const videos = await prisma.video.findMany({
			where: whereClause,
			orderBy: { createdAt: "desc" },
		});
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
