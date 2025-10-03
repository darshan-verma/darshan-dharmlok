import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface Yoga {
	id: string;
	name: string;
	date: string;
	description: string;
	status: string;
	coverImage?: string;
	bannerImage?: string;
	images?: string[];
	videos?: string[];
	createdAt?: string;
	updatedAt?: string;
}

// GET /api/yoga
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "12", 10);
		const skip = (page - 1) * limit;

		const [total, yogas] = await Promise.all([
			prisma.yoga.count(),
			prisma.yoga.findMany({
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
				select: {
					id: true,
					name: true,
					date: true,
					description: true,
					status: true,
					coverImage: true,
					images: true,
					videos: true,
					createdAt: true,
					updatedAt: true,
				},
			}),
		]);

		const data: Yoga[] = yogas.map((y) => ({
			id: y.id,
			name: y.name,
			date: y.date instanceof Date ? y.date.toISOString().slice(0, 10) : y.date,
			description: y.description,
			status: y.status,
			coverImage: y.coverImage || undefined,
			images: y.images || [],
			videos: y.videos || [],
			createdAt: y.createdAt?.toISOString?.() ?? "",
			updatedAt: y.updatedAt?.toISOString?.() ?? "",
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
		console.error("Error fetching yogas:", error);
		return NextResponse.json(
			{ error: "Failed to fetch yogas" },
			{ status: 500 }
		);
	}
}

// POST /api/yoga
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { name, date, description, status, coverImage, images, videos } =
			body as {
				name: string;
				date: string;
				description: string;
				status: string;
				coverImage?: string;
				images?: string[];
				videos?: string[];
			};

		if (!name || !date || !description || !status) {
			return NextResponse.json(
				{ error: "Name, date, description, and status are required" },
				{ status: 400 }
			);
		}

		const newYoga = await prisma.yoga.create({
			data: {
				name,
				date: new Date(date),
				description,
				status,
				coverImage: coverImage || null,
				images: images || [],
				videos: videos || [],
			},
		});

		const result: Yoga = {
			id: newYoga.id,
			name: newYoga.name,
			date:
				newYoga.date instanceof Date
					? newYoga.date.toISOString().slice(0, 10)
					: newYoga.date,
			description: newYoga.description,
			status: newYoga.status,
			coverImage: newYoga.coverImage || undefined,
			images: newYoga.images || [],
			videos: newYoga.videos || [],
			createdAt: newYoga.createdAt?.toISOString?.() ?? "",
			updatedAt: newYoga.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating yoga:", error);
		return NextResponse.json(
			{ error: "Failed to create yoga" },
			{ status: 500 }
		);
	}
}
