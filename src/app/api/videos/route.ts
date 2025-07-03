import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/videos?userId=...
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");
	try {
		if (!userId) {
			return NextResponse.json({ error: "Missing userId" }, { status: 400 });
		}
		// Prisma MongoDB expects userId as a string (with @db.ObjectId in schema)
		const videos = await prisma.video.findMany({
			where: { userId: userId as string },
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
	try {
		const data = await request.json();
		const {
			title,
			videoUrl,
			description,
			userId,
			category,
			type,
			thumbnailUrl,
			videoFile,
			status,
		} = data;
		if (!userId || !title || !videoUrl) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}
		const video = await prisma.video.create({
			data: {
				title,
				videoUrl,
				description,
				userId: userId as string,
				category,
				type,
				thumbnailUrl,
				videoFile,
				status: status || "active",
			},
		});
		return NextResponse.json(video);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to create video",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}
