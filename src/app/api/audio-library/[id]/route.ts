import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface PlaylistUpdateBody {
	name?: string;
	date?: string;
	category?: string;
	status?: string;
}

export async function GET(
	_: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		const playlist = await prisma.playlist.findUnique({
			where: { id },
			include: { songs: true },
		});
		if (!playlist)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json({
			id: playlist.id,
			name: playlist.name,
			date:
				playlist.date instanceof Date
					? playlist.date.toISOString().split("T")[0]
					: playlist.date,
			category: playlist.category,
			status: playlist.status,
		});
	} catch{
		return NextResponse.json(
			{ error: "Failed to fetch audio library" },
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
		const body: PlaylistUpdateBody = await req.json();
		const { name, date, category, status } = body;
		const updateData: Record<string, unknown> = {};
		if (name !== undefined) updateData.name = name;
		if (date !== undefined) updateData.date = new Date(date);
		if (category !== undefined) updateData.category = category;
		if (status !== undefined) updateData.status = status;
		const updated = await prisma.playlist.update({
			where: { id },
			data: updateData,
		});
		return NextResponse.json({
			id: updated.id,
			name: updated.name,
			date:
				updated.date instanceof Date
					? updated.date.toISOString().split("T")[0]
					: updated.date,
			category: updated.category,
			status: updated.status,
		});
	} catch{
		return NextResponse.json(
			{ error: "Failed to update audio library" },
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
		await prisma.song.deleteMany({ where: { playlistId: id } });
		await prisma.playlist.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch{
		return NextResponse.json(
			{ error: "Failed to delete audio library" },
			{ status: 500 }
		);
	}
}
