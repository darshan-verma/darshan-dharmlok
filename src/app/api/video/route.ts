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
	videoUrl: string;
	thumbnailUrl?: string | null;
	detail?: string;
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
		videoUrl: video.videoUrl ?? "",
		thumbnailUrl: video.thumbnailUrl,
		// detail: video.detail ?? "",
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

		const [total, videos] = await Promise.all([
			prisma.video.count(),
			prisma.video.findMany({
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
		]);

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
		console.error("Error fetching videos:", error);
		return NextResponse.json(
			{ error: "Failed to fetch videos" },
			{ status: 500 }
		);
	}
}

// POST /api/video
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { title, date, description, category, type, status, videoUrl } = body;

		if (
			!title ||
			!date ||
			!description ||
			!category ||
			!type ||
			!status ||
			!videoUrl
		) {
			return NextResponse.json(
				{ error: "All required fields must be provided" },
				{ status: 400 }
			);
		}

		const newVideo = await prisma.video.create({
			data: {
				title,
				date,
				description,
				category,
				type,
				status,
				videoUrl,
			},
		});
		return NextResponse.json(newVideo);
	} catch {
		return NextResponse.json(
			{ error: "Failed to create video" },
			{ status: 500 }
		);
	}
}
