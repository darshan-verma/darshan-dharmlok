import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
	mapWithReligiousCategories,
	normalizeReligiousCategories,
} from "@/lib/religious-categories";

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
	religiousCategories?: string[];
	createdAt?: string;
	updatedAt?: string;
}

// GET /api/yoga-sessions/[id]
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		const session = await prisma.yogaSession.findUnique({
			where: { id },
			include: {
				trainer: {
					select: {
						name: true,
					},
				},
			},
		});
		if (!session) {
			return NextResponse.json(
				{ error: "Yoga session not found" },
				{ status: 404 }
			);
		}

		const result: YogaSession = {
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
			religiousCategories: mapWithReligiousCategories({
				category: null,
				religiousCategories: session.religiousCategories,
			}).religiousCategories,
			createdAt: session.createdAt?.toISOString?.() ?? "",
			updatedAt: session.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching yoga session:", error);
		return NextResponse.json(
			{ error: "Failed to fetch yoga session" },
			{ status: 500 }
		);
	}
}

// PUT /api/yoga-sessions/[id]
export async function PUT(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

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
			trainerId?: string;
			name?: string;
			date?: string;
			serviceType?: string;
			description?: string;
			status?: string;
			bannerImage?: string;
			coverImage?: string;
			images?: string[];
			videos?: string[];
			price?: number;
			duration?: number;
			capacity?: number;
		};

		const updateData: {
			trainerId?: string;
			name?: string;
			date?: Date;
			serviceType?: string;
			description?: string;
			status?: string;
			bannerImage?: string;
			coverImage?: string;
			images?: string[];
			videos?: string[];
			price?: number;
			duration?: number;
			capacity?: number;
			religiousCategories?: string[];
		} = {};
		if (trainerId !== undefined) updateData.trainerId = trainerId;
		if (name !== undefined) updateData.name = name;
		if (date !== undefined) updateData.date = new Date(date);
		if (serviceType !== undefined) updateData.serviceType = serviceType;
		if (description !== undefined) updateData.description = description;
		if (status !== undefined) updateData.status = status;
		if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
		if (coverImage !== undefined) updateData.coverImage = coverImage;
		if (images !== undefined) updateData.images = images;
		if (videos !== undefined) updateData.videos = videos;
		if (price !== undefined) updateData.price = price;
		if (duration !== undefined) updateData.duration = duration;
		if (capacity !== undefined) updateData.capacity = capacity;
		if (body.religiousCategories !== undefined) {
			updateData.religiousCategories = normalizeReligiousCategories(
				body.religiousCategories
			);
		}

		const updatedSession = await prisma.yogaSession.update({
			where: { id },
			data: updateData,
			include: {
				trainer: {
					select: {
						name: true,
					},
				},
			},
		});

		const result: YogaSession = {
			id: updatedSession.id,
			trainerId: updatedSession.trainerId,
			trainerName: updatedSession.trainer.name,
			name: updatedSession.name,
			date:
				updatedSession.date instanceof Date
					? updatedSession.date.toISOString().slice(0, 10)
					: updatedSession.date,
			serviceType: updatedSession.serviceType,
			description: updatedSession.description,
			status: updatedSession.status,
			bannerImage: updatedSession.bannerImage || undefined,
			coverImage: updatedSession.coverImage || undefined,
			images: updatedSession.images || [],
			videos: updatedSession.videos || [],
			price: updatedSession.price || undefined,
			duration: updatedSession.duration || undefined,
			capacity: updatedSession.capacity || undefined,
			religiousCategories: mapWithReligiousCategories({
				category: null,
				religiousCategories: updatedSession.religiousCategories,
			}).religiousCategories,
			createdAt: updatedSession.createdAt?.toISOString?.() ?? "",
			updatedAt: updatedSession.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error updating yoga session:", error);
		return NextResponse.json(
			{ error: "Failed to update yoga session" },
			{ status: 500 }
		);
	}
}

// DELETE /api/yoga-sessions/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		await prisma.yogaSession.delete({ where: { id } });
		return NextResponse.json({
			success: true,
			message: "Yoga session deleted",
		});
	} catch (error) {
		console.error("Error deleting yoga session:", error);
		return NextResponse.json(
			{ error: "Failed to delete yoga session" },
			{ status: 500 }
		);
	}
}
