import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface EventApi {
	id: string;
	title: string;
	description?: string;
	bookingUrl?: string;
	address?: string;
	fromDate: string;
	fromTime?: string;
	toDate: string;
	toTime?: string;
	place?: string;
	location?: string;
	category: string;
	type: string;
	price?: number;
	bannerImage?: string;
	relatedImages?: string[];
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

function parseArrayField(field: unknown): string[] {
	if (!field) return [];
	if (Array.isArray(field)) return field as string[];
	if (typeof field === "string") {
		try {
			const parsed = JSON.parse(field);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}

// GET /api/events/[id]
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		const event = await prisma.event.findUnique({ where: { id } });
		if (!event)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		const result: EventApi = {
			id: event.id,
			title: event.title,
			description: event.description || "",
			bookingUrl: event.bookingUrl || "",
			address: event.address || "",
			fromDate:
				event.fromDate instanceof Date
					? event.fromDate.toISOString().split("T")[0]
					: String(event.fromDate),
			fromTime: event.fromTime || "",
			toDate:
				event.toDate instanceof Date
					? event.toDate.toISOString().split("T")[0]
					: String(event.toDate),
			toTime: event.toTime || "",
			place: event.place || "",
			location: event.location || "",
			category: event.category,
			type: event.type,
			price: event.price ?? undefined,
			bannerImage: event.bannerImage || "",
			relatedImages: parseArrayField(event.relatedImages),
			status: event.status,
			createdAt: event.createdAt?.toISOString(),
			updatedAt: event.updatedAt?.toISOString(),
		};
		return NextResponse.json(result);
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch event" },
			{ status: 500 }
		);
	}
}

// PUT /api/events/[id]
export async function PUT(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		const body = await req.json();
		const {
			title,
			description,
			bookingUrl,
			address,
			fromDate,
			fromTime,
			toDate,
			toTime,
			place,
			location,
			category,
			type,
			price,
			bannerImage,
			relatedImages,
			status,
		} = body as Partial<EventApi>;

		// Allow status-only update for quick status change
		if (status && Object.keys(body).length === 1) {
			const updated = await prisma.event.update({
				where: { id },
				data: { status },
			});
			return NextResponse.json({
				id: updated.id,
				status: updated.status,
			});
		}

		if (!title || !fromDate || !toDate || !category || !type || !status) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const updated = await prisma.event.update({
			where: { id },
			data: {
				title,
				description: description || "",
				bookingUrl: bookingUrl || "",
				address: address || "",
				fromDate: new Date(fromDate),
				fromTime: fromTime || "",
				toDate: new Date(toDate),
				toTime: toTime || "",
				place: place || "",
				location: location || "",
				category,
				type,
				price: price !== undefined && price !== null ? Number(price) : null,
				bannerImage: bannerImage || "",
				relatedImages: Array.isArray(relatedImages) ? relatedImages : [],
				status,
			},
		});
		const result: EventApi = {
			id: updated.id,
			title: updated.title,
			description: updated.description || "",
			bookingUrl: updated.bookingUrl || "",
			address: updated.address || "",
			fromDate:
				updated.fromDate instanceof Date
					? updated.fromDate.toISOString().split("T")[0]
					: String(updated.fromDate),
			fromTime: updated.fromTime || "",
			toDate:
				updated.toDate instanceof Date
					? updated.toDate.toISOString().split("T")[0]
					: String(updated.toDate),
			toTime: updated.toTime || "",
			place: updated.place || "",
			location: updated.location || "",
			category: updated.category,
			type: updated.type,
			price: updated.price ?? undefined,
			bannerImage: updated.bannerImage || "",
			relatedImages: parseArrayField(updated.relatedImages),
			status: updated.status,
			createdAt: updated.createdAt?.toISOString(),
			updatedAt: updated.updatedAt?.toISOString(),
		};
		return NextResponse.json(result);
	} catch {
		return NextResponse.json(
			{ error: "Failed to update event" },
			{ status: 500 }
		);
	}
}

// DELETE /api/events/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		await prisma.event.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Failed to delete event" },
			{ status: 500 }
		);
	}
}
