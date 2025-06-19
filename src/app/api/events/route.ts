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

// Helper to parse array fields
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

// GET /api/events
export async function GET(_req: NextRequest) {
	try {
		const events = await prisma.event.findMany({
			orderBy: { createdAt: "desc" },
		});
		const result: EventApi[] = events.map((event) => ({
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
		}));
		return NextResponse.json(result);
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch events" },
			{ status: 500 }
		);
	}
}

// POST /api/events
export async function POST(req: NextRequest) {
	try {
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
		} = body as Omit<EventApi, "id" | "createdAt" | "updatedAt">;

		if (!title || !fromDate || !toDate || !category || !type || !status) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const event = await prisma.event.create({
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
			{ error: "Failed to create event" },
			{ status: 500 }
		);
	}
}
