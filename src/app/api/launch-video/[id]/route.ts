import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

function toVideoDetailApi(video: Record<string, unknown>) {
	const legacy =
		typeof video._legacy === "object" && video._legacy !== null
			? (video._legacy as Record<string, unknown>)
			: {};

	const date = normalizeDateValue(
		video.date ?? video.createdAt ?? legacy.createdAt ?? video.updatedAt
	);
	const videoUrl = String(
		video.videoFile ?? video.videoUrl ?? legacy.videoFile ?? legacy.videoUrl ?? ""
	);

	return {
		id: String(video.id ?? (video._id as { $oid?: string })?.$oid ?? ""),
		title: String(video.title ?? legacy.title ?? ""),
		date,
		description: String(video.description ?? legacy.description ?? ""),
		category: String(video.category ?? legacy.category ?? "Other"),
		type: String(video.type ?? legacy.type ?? "MP4"),
		status: String(video.status ?? legacy.status ?? "Draft"),
		videoUrl,
		videoFile: videoUrl,
		thumbnailUrl: String(video.thumbnailUrl ?? legacy.thumbnailUrl ?? ""),
		createdAt: normalizeDateValue(video.createdAt ?? legacy.createdAt),
		updatedAt: normalizeDateValue(video.updatedAt ?? legacy.updatedAt),
	};
}

export async function GET(
	_: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		const rawResult = await prisma.video.findRaw({
			filter: { _id: { $oid: id } },
		});
		const rows = Array.isArray(rawResult) ? rawResult : [];
		if (rows.length === 0)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(toVideoDetailApi(rows[0] as Record<string, unknown>));
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch video" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		const body = await req.json();
		const {
			title,
			date,
			description,
			category,
			type,
			status,
			thumbnailUrl,
			videoFile,
			videoUrl,
		} = body;

		if (!title || !date || !description || !category || !type || !status) {
			return NextResponse.json(
				{ error: "All required fields must be provided" },
				{ status: 400 }
			);
		}

		const updated = await prisma.video.update({
			where: { id },
			data: {
				title,
				date: new Date(date),
				description,
				category,
				type,
				status,
				thumbnailUrl: typeof thumbnailUrl === "undefined" ? null : thumbnailUrl,
				videoFile:
					typeof videoFile === "undefined"
						? typeof videoUrl === "undefined"
							? null
							: videoUrl
						: videoFile,
				source: "launch-video",
			},
		});
		return NextResponse.json(updated);
	} catch {
		return NextResponse.json(
			{ error: "Failed to update video" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		await prisma.video.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Failed to delete video" },
			{ status: 500 }
		);
	}
}
