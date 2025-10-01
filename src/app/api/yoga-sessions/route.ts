import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface YogaSession {
	id: string;
	trainerId: string;
	trainerName: string;
	name: string;
	date: string;
	serviceType: string;
	description: string;
	status: string;
	bannerImage?: string;
	coverImage?: string;
	images: string[];
	videos: string[];
	price?: number;
	duration?: number;
	capacity?: number;
	createdAt?: string;
	updatedAt?: string;
}

// GET /api/yoga-sessions
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "12", 10);
		const skip = (page - 1) * limit;

		const [total, yogaSessions] = await Promise.all([
			prisma.yogaSession.count(),
			prisma.yogaSession.findMany({
				include: {
					trainer: {
						select: {
							name: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
		]);

		const data: YogaSession[] = yogaSessions.map((session) => ({
			id: session.id,
			trainerId: session.trainerId,
			trainerName: session.trainer.name,
			name: session.name,
			date:
				session.date instanceof Date
					? session.date.toISOString().slice(0, 10)
					: session.date,
			serviceType: session.serviceType,
			description: session.description,
			status: session.status,
			bannerImage: session.bannerImage || undefined,
			coverImage: session.coverImage || undefined,
			images: session.images || [],
			videos: session.videos || [],
			price: session.price || undefined,
			duration: session.duration || undefined,
			capacity: session.capacity || undefined,
			createdAt: session.createdAt?.toISOString?.() ?? "",
			updatedAt: session.updatedAt?.toISOString?.() ?? "",
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
		console.error("Error fetching yoga sessions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch yoga sessions" },
			{ status: 500 }
		);
	}
}

// POST /api/yoga-sessions
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			trainerId,
			name,
			date,
			serviceType,
			description,
			status,
			bannerImage,
			coverImage,
			images,
			videos,
			price,
			duration,
			capacity,
		} = body as {
			trainerId: string;
			name: string;
			date: string;
			serviceType: string;
			description: string;
			status: string;
			bannerImage?: string;
			coverImage?: string;
			images?: string[];
			videos?: string[];
			price?: number;
			duration?: number;
			capacity?: number;
		};

		if (
			!trainerId ||
			!name ||
			!date ||
			!serviceType ||
			!description ||
			!status
		) {
			return NextResponse.json(
				{
					error:
						"Trainer ID, name, date, service type, description, and status are required",
				},
				{ status: 400 }
			);
		}

		const newSession = await prisma.yogaSession.create({
			data: {
				trainerId,
				name,
				date: new Date(date),
				serviceType,
				description,
				status,
				bannerImage,
				coverImage,
				images: images || [],
				videos: videos || [],
				price,
				duration,
				capacity,
			},
			include: {
				trainer: {
					select: {
						name: true,
					},
				},
			},
		});

		const result: YogaSession = {
			id: newSession.id,
			trainerId: newSession.trainerId,
			trainerName: newSession.trainer.name,
			name: newSession.name,
			date:
				newSession.date instanceof Date
					? newSession.date.toISOString().slice(0, 10)
					: newSession.date,
			serviceType: newSession.serviceType,
			description: newSession.description,
			status: newSession.status,
			bannerImage: newSession.bannerImage || undefined,
			coverImage: newSession.coverImage || undefined,
			images: newSession.images || [],
			videos: newSession.videos || [],
			price: newSession.price || undefined,
			duration: newSession.duration || undefined,
			capacity: newSession.capacity || undefined,
			createdAt: newSession.createdAt?.toISOString?.() ?? "",
			updatedAt: newSession.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating yoga session:", error);
		return NextResponse.json(
			{ error: "Failed to create yoga session" },
			{ status: 500 }
		);
	}
}
