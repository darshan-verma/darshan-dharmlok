import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
	_: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		const video = await prisma.video.findUnique({ where: { id } });
		if (!video)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(video);
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
				date,
				description,
				category,
				type,
				status,
				thumbnailUrl: typeof thumbnailUrl === "undefined" ? null : thumbnailUrl,
				videoFile: typeof videoFile === "undefined" ? null : videoFile,
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
