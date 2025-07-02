import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface SongCreateBody {
	name: string;
	date: string;
	description: string;
	audioFile: string;
	thumbnail: string;
	status: string;
}

export async function GET(
	_: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id: playlistId } = await context.params;
	try {
		const songs = await prisma.song.findMany({
			where: { playlistId },
			orderBy: { createdAt: "desc" },
		});
		const result = songs.map((song) => ({
			id: song.id,
			name: song.name,
			date:
				song.date instanceof Date
					? song.date.toISOString().split("T")[0]
					: song.date,
			description: song.description || "",
			audioFile: song.audioFile || "",
			thumbnail: song.thumbnail || "",
			status: song.status || "Inactive", // <-- Ensure status is returned
		}));
		return NextResponse.json(result);
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch songs" },
			{ status: 500 }
		);
	}
}

export async function POST(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id: playlistId } = await context.params;
	try {
		const body: SongCreateBody = await req.json();
		const { name, date, description, audioFile, thumbnail, status } = body;
		if (!name || !date || !audioFile || !thumbnail || !status) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}
		const song = await prisma.song.create({
			data: {
				name,
				date: new Date(date),
				description,
				audioFile,
				thumbnail,
				status,
				playlistId,
			},
		});
		return NextResponse.json({
			id: song.id,
			name: song.name,
			date:
				song.date instanceof Date
					? song.date.toISOString().split("T")[0]
					: song.date,
			description: song.description || "",
			audioFile: song.audioFile || "",
			thumbnail: song.thumbnail || "",
			status: song.status || "Inactive", // <-- Ensure status is returned
		});
	} catch {
		return NextResponse.json({ error: "Failed to add song" }, { status: 500 });
	}
}
