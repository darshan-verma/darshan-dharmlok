import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface MotivationSpeaker {
	id: string;
	name: string;
	date: string;
	phone: string;
	email: string;
	timings: string;
	category: string;
	status: string;
	coverImage?: string;
	bannerImage?: string;
	profileImage?: string;
	images: string[];
	videos: string[];
	description?: string;
	createdAt?: string;
	updatedAt?: string;
}

// GET /api/motivation-speaker
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "12", 10);
		const skip = (page - 1) * limit;

		const [total, speakers] = await Promise.all([
			prisma.motivationSpeaker.count(),
			prisma.motivationSpeaker.findMany({
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
		]);

		const data: MotivationSpeaker[] = speakers.map((s) => ({
			id: s.id,
			name: s.name,
			date: s.date instanceof Date ? s.date.toISOString().slice(0, 10) : s.date,
			phone: s.phone,
			email: s.email,
			timings: s.timings,
			category: s.category,
			status: s.status,
			coverImage: s.coverImage || undefined,
			bannerImage: s.bannerImage || undefined,
			profileImage: s.profileImage || undefined,
			images: s.images,
			videos: s.videos,
			description: s.description || undefined,
			createdAt: s.createdAt?.toISOString?.() ?? "",
			updatedAt: s.updatedAt?.toISOString?.() ?? "",
		}));

		return NextResponse.json({
			data,
			pagination: {
				page,
				limit,
				totalCount: total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching motivation speakers:", error);
		return NextResponse.json(
			{ error: "Failed to fetch motivation speakers" },
			{ status: 500 }
		);
	}
}

// POST /api/motivation-speaker
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			name,
			date,
			phone,
			email,
			timings,
			category,
			status,
			coverImage,
			bannerImage,
			profileImage,
			images,
			videos,
			description,
		} = body as {
			name: string;
			date: string;
			phone: string;
			email: string;
			timings: string;
			category: string;
			status: string;
			coverImage?: string;
			bannerImage?: string;
			profileImage?: string;
			images?: string[];
			videos?: string[];
			description?: string;
		};

		if (
			!name ||
			!date ||
			!phone ||
			!email ||
			!timings ||
			!category ||
			!status
		) {
			return NextResponse.json(
				{
					error:
						"Name, date, phone, email, timings, category, and status are required",
				},
				{ status: 400 }
			);
		}

		const newSpeaker = await prisma.motivationSpeaker.create({
			data: {
				name,
				date: new Date(date),
				phone,
				email,
				timings,
				category,
				status,
				coverImage,
				bannerImage,
				profileImage,
				images: images || [],
				videos: videos || [],
				description,
			},
		});

		const result: MotivationSpeaker = {
			id: newSpeaker.id,
			name: newSpeaker.name,
			date:
				newSpeaker.date instanceof Date
					? newSpeaker.date.toISOString().slice(0, 10)
					: newSpeaker.date,
			phone: newSpeaker.phone,
			email: newSpeaker.email,
			timings: newSpeaker.timings,
			category: newSpeaker.category,
			status: newSpeaker.status,
			coverImage: newSpeaker.coverImage || undefined,
			bannerImage: newSpeaker.bannerImage || undefined,
			profileImage: newSpeaker.profileImage || undefined,
			images: newSpeaker.images,
			videos: newSpeaker.videos,
			description: newSpeaker.description || undefined,
			createdAt: newSpeaker.createdAt?.toISOString?.() ?? "",
			updatedAt: newSpeaker.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating motivation speaker:", error);
		return NextResponse.json(
			{ error: "Failed to create motivation speaker" },
			{ status: 500 }
		);
	}
}
