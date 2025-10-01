import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface Yoga {
	id: string;
	name: string;
	date: string;
	description: string;
	status: string;
	images?: string[];
	videos?: string[];
	coverImage?: string;
	createdAt?: string;
	updatedAt?: string;
}

// GET /api/yoga/[id]
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		const yoga = await prisma.yoga.findUnique({ where: { id } });
		if (!yoga) {
			return NextResponse.json({ error: "Yoga not found" }, { status: 404 });
		}

		const result: Yoga = {
			id: yoga.id,
			name: yoga.name,
			date:
				yoga.date instanceof Date
					? yoga.date.toISOString().slice(0, 10)
					: yoga.date,
			description: yoga.description,
			status: yoga.status,
			images: yoga.images || [],
			videos: yoga.videos || [],
			coverImage: yoga.coverImage || undefined,
			createdAt: yoga.createdAt?.toISOString?.() ?? "",
			updatedAt: yoga.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching yoga:", error);
		return NextResponse.json(
			{ error: "Failed to fetch yoga" },
			{ status: 500 }
		);
	}
}

// PUT /api/yoga/[id]
export async function PUT(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		const body = await req.json();
		const { name, date, description, status, images, videos, coverImage } =
			body as {
				name?: string;
				date?: string;
				description?: string;
				status?: string;
				images?: string[];
				videos?: string[];
				coverImage?: string;
			};

		const updateData: {
			name?: string;
			date?: Date;
			description?: string;
			status?: string;
			images?: string[];
			videos?: string[];
			coverImage?: string;
		} = {};
		if (name !== undefined) updateData.name = name;
		if (date !== undefined) updateData.date = new Date(date);
		if (description !== undefined) updateData.description = description;
		if (status !== undefined) updateData.status = status;
		if (images !== undefined) updateData.images = images;
		if (videos !== undefined) updateData.videos = videos;
		if (coverImage !== undefined) updateData.coverImage = coverImage;

		const updatedYoga = await prisma.yoga.update({
			where: { id },
			data: updateData,
		});

		const result: Yoga = {
			id: updatedYoga.id,
			name: updatedYoga.name,
			date:
				updatedYoga.date instanceof Date
					? updatedYoga.date.toISOString().slice(0, 10)
					: updatedYoga.date,
			description: updatedYoga.description,
			status: updatedYoga.status,
			images: updatedYoga.images || [],
			videos: updatedYoga.videos || [],
			coverImage: updatedYoga.coverImage || undefined,
			createdAt: updatedYoga.createdAt?.toISOString?.() ?? "",
			updatedAt: updatedYoga.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error updating yoga:", error);
		return NextResponse.json(
			{ error: "Failed to update yoga" },
			{ status: 500 }
		);
	}
}

// DELETE /api/yoga/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		await prisma.yoga.delete({ where: { id } });
		return NextResponse.json({ success: true, message: "Yoga deleted" });
	} catch (error) {
		console.error("Error deleting yoga:", error);
		return NextResponse.json(
			{ error: "Failed to delete yoga" },
			{ status: 500 }
		);
	}
}
