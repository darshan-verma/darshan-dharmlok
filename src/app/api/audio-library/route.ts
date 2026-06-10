import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, type Playlist, type Song } from "@prisma/client";
import {
	applyReligiousCategoryFilter,
	mapWithReligiousCategories,
	normalizeReligiousCategories,
} from "@/lib/religious-categories";

interface PlaylistCreateBody {
	name: string;
	date: string;
	category: string;
	status: string;
	religiousCategories?: unknown;
}

function mapPlaylist(playlist: Playlist & { songs: Song[] }) {
	const withReligious = mapWithReligiousCategories({
		category: playlist.category,
		religiousCategories: playlist.religiousCategories,
	});
	return {
		id: playlist.id,
		name: playlist.name,
		date:
			playlist.date instanceof Date
				? playlist.date.toISOString().split("T")[0]
				: playlist.date,
		category: playlist.category,
		religiousCategories: withReligious.religiousCategories,
		status: playlist.status,
		songs:
			playlist.songs?.map((song) => ({
				id: song.id,
				name: song.name,
				date:
					song.date instanceof Date
						? song.date.toISOString().split("T")[0]
						: song.date,
				description: song.description ?? "",
				audioFile: song.audioFile ?? "",
				thumbnail: song.thumbnail ?? "",
				status: song.status,
			})) || [],
	};
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const religiousCategory = searchParams.get("religiousCategory");
		const search = searchParams.get("search")?.trim();
		const where = applyReligiousCategoryFilter(
			{
				...(search
					? { name: { contains: search, mode: "insensitive" as const } }
					: {}),
			} as Prisma.PlaylistWhereInput,
			religiousCategory
		);

		const playlists = await prisma.playlist.findMany({
			where,
			orderBy: { createdAt: "desc" },
			include: { songs: true },
		});
		return NextResponse.json(playlists.map(mapPlaylist));
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
		const religiousCategories = normalizeReligiousCategories(
			body.religiousCategories
		);
		const playlist = await prisma.playlist.create({
			data: {
				name,
				date: new Date(date),
				category,
				status,
				religiousCategories,
			},
		});
		return NextResponse.json(mapPlaylist({ ...playlist, songs: [] }));
	} catch {
		return NextResponse.json(
			{ error: "Failed to create audio library" },
			{ status: 500 }
		);
	}
}
