import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type LiveDarshanApi = {
	id: string;
	title: string;
	description: string;
	youtubeUrl: string;
	thumbnailUrl?: string | null;
	status: string;
	date: string;
	createdAt: string;
	updatedAt: string;
};

function toLiveDarshanApi(video: Record<string, unknown>): LiveDarshanApi {
	return {
		id: String(video.id ?? ""),
		title: String(video.title ?? ""),
		description: String(video.description ?? ""),
		youtubeUrl: String(video.videoFile ?? ""),
		thumbnailUrl:
			typeof video.thumbnailUrl === "string" ? video.thumbnailUrl : null,
		status: String(video.status ?? "Inactive"),
		date:
			video.date instanceof Date
				? video.date.toISOString()
				: String(video.date ?? new Date().toISOString()),
		createdAt:
			video.createdAt instanceof Date
				? video.createdAt.toISOString()
				: String(video.createdAt ?? new Date().toISOString()),
		updatedAt:
			video.updatedAt instanceof Date
				? video.updatedAt.toISOString()
				: String(video.updatedAt ?? new Date().toISOString()),
	};
}

export async function GET(_req: NextRequest) {
	try {
		const videos = await prisma.video.findMany({
			where: { source: "live-darshan" },
			orderBy: { createdAt: "desc" },
		});

		const content = videos.map(toLiveDarshanApi);

		return NextResponse.json({
			content,
			total: content.length,
		});
	} catch (error) {
		console.error(
			"[GET /api/live-darshan] Error fetching live darshan entries:",
			error,
		);
		return NextResponse.json(
			{
				error: "Failed to fetch live darshan entries",
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { title, description, youtubeUrl, thumbnailUrl, status, userId } =
			body;

		if (!title || !description || !youtubeUrl || !status || !userId) {
			return NextResponse.json(
				{
					error:
						"Title, description, YouTube link, status, and userId are required.",
				},
				{ status: 400 },
			);
		}

		const newVideo = await prisma.video.create({
			data: {
				title,
				description,
				category: "Live Darshan",
				type: "YouTube",
				status,
				videoFile: youtubeUrl,
				thumbnailUrl: thumbnailUrl || null,
				source: "live-darshan",
				date: new Date(),
				user: { connect: { id: userId } },
			},
		});

		return NextResponse.json(toLiveDarshanApi(newVideo));
	} catch (error) {
		console.error(
			"[POST /api/live-darshan] Error creating live darshan entry:",
			error,
		);
		return NextResponse.json(
			{
				error: "Failed to create live darshan entry",
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
