import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface PlaylistCreateBody {
	name: string;
	date: string;
	category: string;
	status: string;
}
/**
 * GET /api/audio-library/[id]
 * Retrieves a single user by ID with all associated data including addresses
 *
 * @param _request - Request object (unused)
 * @param context - Contains route parameters including user ID
 * @returns JSON response with user data or error message
 */
export async function GET(
	// @typescript-eslint/no-unused-vars
	_request: NextRequest
) {
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
			// Add songs if you want to expose them in the API
			songs:
				playlist.songs?.map((song) => ({
					id: song.id,
					name: song.name,
					date:
						song.date instanceof Date
							? song.date.toISOString().split("T")[0]
							: song.date,
					description: song.description,
					audioFile: song.audioFile,
					thumbnail: song.thumbnail,
					status: song.status,
				})) || [],
		}));
		return NextResponse.json(result);
	} catch {
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
	} catch {
		return NextResponse.json(
			{ error: "Failed to create audio library" },
			{ status: 500 }
		);
	}
}
