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

export async function GET(
	_: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const { id } = await context.params;

	try {
		const video = await prisma.video.findUnique({
			where: { id },
		});

		if (!video || video.source !== "live-darshan") {
			return NextResponse.json(
				{ error: "Live darshan entry not found." },
				{ status: 404 },
			);
		}

		return NextResponse.json(toLiveDarshanApi(video));
	} catch (error) {
		console.error("[GET /api/live-darshan/[id]] Error fetching entry:", error);
		return NextResponse.json(
			{ error: "Failed to fetch live darshan entry" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	req: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const { id } = await context.params;

	try {
		const body = await req.json();
		const { title, description, youtubeUrl, thumbnailUrl, status } = body;

		if (!title || !description || !youtubeUrl || !status) {
			return NextResponse.json(
				{ error: "Title, description, YouTube link, and status are required." },
				{ status: 400 },
			);
		}

		const updatedVideo = await prisma.video.update({
			where: { id },
			data: {
				title,
				description,
				status,
				videoFile: youtubeUrl,
				thumbnailUrl: thumbnailUrl || null,
				category: "Live Darshan",
				type: "YouTube",
				source: "live-darshan",
			},
		});

		return NextResponse.json(toLiveDarshanApi(updatedVideo));
	} catch (error) {
		console.error("[PUT /api/live-darshan/[id]] Error updating entry:", error);
		return NextResponse.json(
			{ error: "Failed to update live darshan entry" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const { id } = await context.params;

	try {
		await prisma.video.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(
			"[DELETE /api/live-darshan/[id]] Error deleting entry:",
			error,
		);
		return NextResponse.json(
			{ error: "Failed to delete live darshan entry" },
			{ status: 500 },
		);
	}
}
