import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface SongUpdateBody {
	name?: string;
	date?: string;
	description?: string;
	audioFile?: string;
	thumbnail?: string;
	status?: string;
}

export async function PUT(
	req: NextRequest,
	context: { params: Promise<{ id: string; songId: string }> }
) {
	const { songId } = await context.params;
	try {
		const body: SongUpdateBody = await req.json();
		const updateData: Record<string, unknown> = {};
		if (body.name !== undefined) updateData.name = body.name;
		if (body.date !== undefined) updateData.date = new Date(body.date);
		if (body.description !== undefined)
			updateData.description = body.description;
		if (body.audioFile !== undefined) updateData.audioFile = body.audioFile;
		if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail;
		if (body.status !== undefined) updateData.status = body.status;
		const updated = await prisma.song.update({
			where: { id: songId },
			data: updateData,
		});
		return NextResponse.json({
			id: updated.id,
			name: updated.name,
			date:
				updated.date instanceof Date
					? updated.date.toISOString().split("T")[0]
					: updated.date,
			description: updated.description || "",
			audioFile: updated.audioFile || "",
			thumbnail: updated.thumbnail || "",
			status: updated.status || "Inactive", // <-- Ensure status is returned
		});
	} catch {
		return NextResponse.json(
			{ error: "Failed to update song" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	req: NextRequest,
	context: { params: Promise<{ id: string; songId: string }> }
) {
	const { songId } = await context.params;
	try {
		await prisma.song.delete({ where: { id: songId } });
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Failed to delete song" },
			{ status: 500 }
		);
	}
}
