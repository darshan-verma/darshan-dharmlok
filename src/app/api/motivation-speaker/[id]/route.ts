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
	images: string[];
	videos: string[];
	description?: string;
	createdAt?: string;
	updatedAt?: string;
}

// GET /api/motivation-speaker/[id]
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		const speaker = await prisma.motivationSpeaker.findUnique({
			where: { id },
		});
		if (!speaker) {
			return NextResponse.json(
				{ error: "Motivation speaker not found" },
				{ status: 404 }
			);
		}

		const result: MotivationSpeaker = {
			id: speaker.id,
			name: speaker.name,
			date:
				speaker.date instanceof Date
					? speaker.date.toISOString().slice(0, 10)
					: speaker.date,
			phone: speaker.phone,
			email: speaker.email,
			timings: speaker.timings,
			category: speaker.category,
			status: speaker.status,
			coverImage: speaker.coverImage || undefined,
			bannerImage: speaker.bannerImage || undefined,
			images: speaker.images,
			videos: speaker.videos,
			description: speaker.description || undefined,
			createdAt: speaker.createdAt?.toISOString?.() ?? "",
			updatedAt: speaker.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching motivation speaker:", error);
		return NextResponse.json(
			{ error: "Failed to fetch motivation speaker" },
			{ status: 500 }
		);
	}
}

// PUT /api/motivation-speaker/[id]
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
			name,
			date,
			phone,
			email,
			timings,
			category,
			status,
			coverImage,
			bannerImage,
			images,
			videos,
			description,
		} = body as {
			name?: string;
			date?: string;
			phone?: string;
			email?: string;
			timings?: string;
			category?: string;
			status?: string;
			coverImage?: string;
			bannerImage?: string;
			images?: string[];
			videos?: string[];
			description?: string;
		};

		const updateData: {
			name?: string;
			date?: Date;
			phone?: string;
			email?: string;
			timings?: string;
			category?: string;
			status?: string;
			coverImage?: string;
			bannerImage?: string;
			images?: string[];
			videos?: string[];
			description?: string;
		} = {};
		if (name !== undefined) updateData.name = name;
		if (date !== undefined) updateData.date = new Date(date);
		if (phone !== undefined) updateData.phone = phone;
		if (email !== undefined) updateData.email = email;
		if (timings !== undefined) updateData.timings = timings;
		if (category !== undefined) updateData.category = category;
		if (status !== undefined) updateData.status = status;
		if (coverImage !== undefined) updateData.coverImage = coverImage;
		if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
		if (images !== undefined) updateData.images = images;
		if (videos !== undefined) updateData.videos = videos;
		if (description !== undefined) updateData.description = description;

		const updatedSpeaker = await prisma.motivationSpeaker.update({
			where: { id },
			data: updateData,
		});

		const result: MotivationSpeaker = {
			id: updatedSpeaker.id,
			name: updatedSpeaker.name,
			date:
				updatedSpeaker.date instanceof Date
					? updatedSpeaker.date.toISOString().slice(0, 10)
					: updatedSpeaker.date,
			phone: updatedSpeaker.phone,
			email: updatedSpeaker.email,
			timings: updatedSpeaker.timings,
			category: updatedSpeaker.category,
			status: updatedSpeaker.status,
			coverImage: updatedSpeaker.coverImage || undefined,
			bannerImage: updatedSpeaker.bannerImage || undefined,
			images: updatedSpeaker.images,
			videos: updatedSpeaker.videos,
			description: updatedSpeaker.description || undefined,
			createdAt: updatedSpeaker.createdAt?.toISOString?.() ?? "",
			updatedAt: updatedSpeaker.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error updating motivation speaker:", error);
		return NextResponse.json(
			{ error: "Failed to update motivation speaker" },
			{ status: 500 }
		);
	}
}

// DELETE /api/motivation-speaker/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		await prisma.motivationSpeaker.delete({ where: { id } });
		return NextResponse.json({
			success: true,
			message: "Motivation speaker deleted",
		});
	} catch (error) {
		console.error("Error deleting motivation speaker:", error);
		return NextResponse.json(
			{ error: "Failed to delete motivation speaker" },
			{ status: 500 }
		);
	}
}
