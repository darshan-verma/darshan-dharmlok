import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

const LAUNCH_VIDEO_SOURCES = [
	"launch-video",
	"launch video",
	"launch videos",
];
const NORMALIZED_LAUNCH_VIDEO_SOURCE = "launch-video";

function normalizeDateValue(value: unknown): string {
	if (!value) return "";
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "string") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
	}
	if (typeof value === "object" && value !== null) {
		const maybeDate = (value as { $date?: string | number | Date }).$date;
		if (maybeDate) {
			const parsed = new Date(maybeDate);
			return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
		}
	}
	return "";
}

function getObjectId(value: unknown): string {
	if (typeof value === "string") return value;
	if (typeof value === "object" && value !== null) {
		const oid = (value as { $oid?: string }).$oid;
		if (typeof oid === "string") return oid;
	}
	return "";
}

function toVideoApi(video: Record<string, unknown>): Video {
	const legacy =
		typeof video._legacy === "object" && video._legacy !== null
			? (video._legacy as Record<string, unknown>)
			: {};

	const createdAt = normalizeDateValue(video.createdAt ?? legacy.createdAt);
	const updatedAt = normalizeDateValue(video.updatedAt ?? legacy.updatedAt);

	return {
		id: getObjectId(video._id) || String(video.id ?? ""),
		title: String(video.title ?? legacy.title ?? ""),
		date: normalizeDateValue(
			video.date ?? video.createdAt ?? legacy.createdAt ?? video.updatedAt
		),
		description: String(video.description ?? legacy.description ?? ""),
		category: String(video.category ?? legacy.category ?? "Other"),
		type: String(video.type ?? legacy.type ?? "MP4"),
		status: String(video.status ?? legacy.status ?? "Draft"),
		videoFile: String(
			video.videoFile ?? video.videoUrl ?? legacy.videoFile ?? legacy.videoUrl ?? ""
		),
		thumbnailUrl: String(video.thumbnailUrl ?? legacy.thumbnailUrl ?? ""),
		createdAt,
		updatedAt,
	};
}

// GET /api/video
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const pageParam = searchParams.get("page");
		const limitParam = searchParams.get("limit");
		const hasPaginationParams = pageParam !== null || limitParam !== null;

		const page = parseInt(pageParam || "1", 10);
		const limit = parseInt(limitParam || "50", 10);
		const safePage = Number.isFinite(page) && page > 0 ? page : 1;
		const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 50;
		const skip = (safePage - 1) * safeLimit;

		const launchRegex = "launch[\\s_-]*videos?";
		const rawResult = await prisma.video.aggregateRaw({
			pipeline: [
				{
					$match: {
						$or: [
							{
								source: {
									$in: LAUNCH_VIDEO_SOURCES,
								},
							},
							{
								source: {
									$regex: launchRegex,
									$options: "i",
								},
							},
							{
								"_legacy.source": {
									$regex: launchRegex,
									$options: "i",
								},
							},
						],
					},
				},
				{ $sort: { createdAt: -1 } },
			],
		});
		const rawVideos = (
			Array.isArray(rawResult) ? rawResult : []
		) as unknown as Record<string, unknown>[];

		const normalizedVideos = rawVideos.map(toVideoApi);
		const total = normalizedVideos.length;
		const content = hasPaginationParams
			? normalizedVideos.slice(skip, skip + safeLimit)
			: normalizedVideos;

		return NextResponse.json({
			content,
			total,
			pagination: {
				page: safePage,
				limit: hasPaginationParams ? safeLimit : total,
				totalPages: hasPaginationParams
					? Math.ceil(total / safeLimit)
					: 1,
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
				source: NORMALIZED_LAUNCH_VIDEO_SOURCE,
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
