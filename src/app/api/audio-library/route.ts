import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface PlaylistCreateBody {
	name: string;
	date: string;
	category: string;
	status: string;
}

export async function GET(req: NextRequest) {
	try {
		const playlists = await prisma.playlist.findMany({
			orderBy: { createdAt: "desc" },
			include: { songs: true },
		});
		const result = playlists.map((playlist) => ({
			id: playlist.id,
			name: playlist.name,
			date:
				playlist.date instanceof Date
					? playlist.date.toISOString().split("T")[0]
					: playlist.date,
			category: playlist.category,
			status: playlist.status,
		}));
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch audio libraries" },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const body: PlaylistCreateBody = await req.json();
		const { name, date, category, status } = body;
		if (!name || !date || !category || !status) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}
		const playlist = await prisma.playlist.create({
			data: {
				name,
				date: new Date(date),
				category,
				status,
			},
		});
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
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to create audio library" },
			{ status: 500 }
		);
	}
}
