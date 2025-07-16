import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Video as PrismaVideo } from "@prisma/client";

export interface Video {
	id: string;
	title: string;
	date: string;
	description: string;
	category: string;
	type: string;
	status: string;
	videoFile?: string | null;
	thumbnailUrl?: string | null;
	createdAt?: string;
	updatedAt?: string;
}

function toVideoApi(video: PrismaVideo): Video {
	return {
		id: video.id,
		title: video.title,
		date: video.date?.toISOString?.() ?? "",
		description: video.description,
		category: video.category,
		type: video.type,
		status: video.status,
		videoFile: video.videoFile ?? "",
		thumbnailUrl: video.thumbnailUrl,
		createdAt: video.createdAt?.toISOString?.(),
		updatedAt: video.updatedAt?.toISOString?.(),
	};
}

// GET /api/video
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "50", 10);
		const skip = (page - 1) * limit;

		console.log(
			"[GET /api/launch-video] page:",
			page,
			"limit:",
			limit,
			"skip:",
			skip
		);

		const whereClause = { source: "launch-video" };

		const [total, videos] = await Promise.all([
			prisma.video.count({ where: whereClause }),
			prisma.video.findMany({
				where: whereClause,
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
		]);

		console.log("[GET /api/launch-video] total videos:", total);
		console.log("[GET /api/launch-video] videos:", videos);

		const content: Video[] = videos.map(toVideoApi);

		return NextResponse.json({
			content,
			total,
			pagination: {
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("[GET /api/launch-video] Error fetching videos:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch videos",
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

// POST /api/video
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		console.log("[POST /api/launch-video] body:", body);
		const {
			title,
			date,
			description,
			category,
			type,
			status,
			videoFile,
			userId,
		} = body;

		if (
			!title ||
			!date ||
			!description ||
			!category ||
			!type ||
			!status ||
			!videoFile ||
			!userId ||
			!body.source // Check for source
		) {
			console.warn("[POST /api/launch-video] Missing required fields", body);
			return NextResponse.json(
				{
					error:
						"All required fields must be provided, including userId and videoFile (S3 URL)",
				},
				{ status: 400 }
			);
		}

		console.log("[POST /api/launch-video] Creating video with data:", {
			title,
			date,
			description,
			category,
			type,
			status,
			videoFile,
			userId,
			source: body.source, // Use source from body
		});

		const newVideo = await prisma.video.create({
			data: {
				title,
				date: new Date(date),
				description,
				category,
				type,
				status,
				videoFile,
				source: body.source, // Save the source
				user: { connect: { id: userId } },
			},
		});
		console.log("[POST /api/launch-video] Created video:", newVideo);
		return NextResponse.json(newVideo);
	} catch (error) {
		console.error("[POST /api/launch-video] Error creating video:", error);
		return NextResponse.json(
			{
				error: "Failed to create video",
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
