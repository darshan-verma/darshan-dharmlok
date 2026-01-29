import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface Banner {
	id: string;
	title: string;
	date: string;
	description: string;
	category: string;
	type: string;
	status: string;
	imageUrl?: string;
	pageSlug?: string;
	createdAt?: string;
	updatedAt?: string;
}

// GET /api/banner/[id]
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const banner = await prisma.banner.findUnique({ where: { id } });
		if (!banner) {
			return NextResponse.json({ error: "Banner not found" }, { status: 404 });
		}
		const result: Banner = {
			id: banner.id,
			title: banner.title,
			date:
				banner.date instanceof Date
					? banner.date.toISOString().slice(0, 10)
					: banner.date,
			description: banner.description,
			category: banner.category,
			type: banner.type,
			status: banner.status,
			imageUrl: banner.imageUrl ?? "",
			pageSlug: banner.pageSlug ?? undefined,
			createdAt: banner.createdAt?.toISOString?.() ?? "",
			updatedAt: banner.updatedAt?.toISOString?.() ?? "",
		};
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching banner:", error);
		return NextResponse.json(
			{ error: "Failed to fetch banner" },
			{ status: 500 }
		);
	}
}

// PUT /api/banner/[id]
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
			title,
			date,
			description,
			category,
			type,
			status,
			imageUrl,
			pageSlug,
		} = body as {
			title?: string;
			date?: string;
			description?: string;
			category?: string;
			type?: string;
			status?: string;
			imageUrl?: string | null;
			pageSlug?: string | null;
		};

		const updateData: {
			title?: string;
			date?: Date;
			description?: string;
			category?: string;
			type?: string;
			status?: string;
			imageUrl?: string | null;
			pageSlug?: string | null;
		} = {};
		if (title !== undefined) updateData.title = title;
		if (date !== undefined) updateData.date = new Date(date);
		if (description !== undefined) updateData.description = description;
		if (category !== undefined) updateData.category = category;
		if (type !== undefined) updateData.type = type;
		if (status !== undefined) updateData.status = status;

		if (imageUrl !== undefined) {
			updateData.imageUrl =
				imageUrl === "" || imageUrl === null ? null : imageUrl;
		}
		if (pageSlug !== undefined) {
			updateData.pageSlug =
				typeof pageSlug === "string" && pageSlug.trim() !== "" ? pageSlug : null;
		}

		const updatedBanner = await prisma.banner.update({
			where: { id },
			data: updateData,
		});

		const result: Banner = {
			id: updatedBanner.id,
			title: updatedBanner.title,
			date:
				updatedBanner.date instanceof Date
					? updatedBanner.date.toISOString().slice(0, 10)
					: updatedBanner.date,
			description: updatedBanner.description,
			category: updatedBanner.category,
			type: updatedBanner.type,
			status: updatedBanner.status,
			imageUrl: updatedBanner.imageUrl ?? "",
			pageSlug: updatedBanner.pageSlug ?? undefined,
			createdAt: updatedBanner.createdAt?.toISOString?.() ?? "",
			updatedAt: updatedBanner.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error updating banner:", error);
		return NextResponse.json(
			{ error: "Failed to update banner" },
			{ status: 500 }
		);
	}
}

// DELETE /api/banner/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		await prisma.banner.delete({ where: { id } });
		return NextResponse.json({ success: true, message: "Banner deleted" });
	} catch (error) {
		console.error("Error deleting banner:", error);
		return NextResponse.json(
			{ error: "Failed to delete banner" },
			{ status: 500 }
		);
	}
}
