import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

function formatDateOnly(value: unknown): string {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime())
			? ""
			: value.toISOString().split("T")[0];
	}
	if (typeof value === "string") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? value
			: parsed.toISOString().split("T")[0];
	}
	return "";
}

function formatIsoDateTime(value: unknown): string | undefined {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
	}
	if (typeof value === "string") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
	}
	return undefined;
}

// GET /api/events
export async function GET(req: NextRequest) {
	try {
		const searchParams = req.nextUrl.searchParams;
		const pageParam = searchParams.get("page");
		const limitParam = searchParams.get("limit");
		const searchParam = searchParams.get("search")?.trim();
		const categoryParam = searchParams.get("category")?.trim();
		const typeParam = searchParams.get("type")?.trim();
		const statusParam = searchParams.get("status")?.trim();
		const filtersOnly = searchParams.get("filtersOnly") === "true";

		const parsedPage = Number(pageParam ?? "1");
		const parsedLimit = Number(limitParam ?? "0");
		const hasPaginationParams = pageParam !== null || limitParam !== null;

		const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
		const limit =
			Number.isFinite(parsedLimit) && parsedLimit > 0
				? Math.min(parsedLimit, 100)
				: 0;

		const where: Prisma.EventWhereInput = {};
		const andConditions: Prisma.EventWhereInput[] = [];

		if (statusParam) {
			andConditions.push({
				status: { equals: statusParam, mode: "insensitive" },
			});
		}

		if (categoryParam) {
			andConditions.push({
				category: { contains: categoryParam, mode: "insensitive" },
			});
		}

		if (typeParam) {
			andConditions.push({
				type: { contains: typeParam, mode: "insensitive" },
			});
		}

		if (searchParam) {
			andConditions.push({
				OR: [
					{ title: { contains: searchParam, mode: "insensitive" } },
					{ description: { contains: searchParam, mode: "insensitive" } },
					{ category: { contains: searchParam, mode: "insensitive" } },
					{ type: { contains: searchParam, mode: "insensitive" } },
					{ place: { contains: searchParam, mode: "insensitive" } },
					{ location: { contains: searchParam, mode: "insensitive" } },
				],
			});
		}

		if (andConditions.length > 0) {
			where.AND = andConditions;
		}

		if (filtersOnly) {
			const rows = await prisma.event.findMany({
				where: Object.keys(where).length > 0 ? where : undefined,
				select: { category: true, type: true },
			});

			const categories = Array.from(
				new Set(
					rows
						.map((row) => row.category?.trim())
						.filter((value): value is string => Boolean(value))
				)
			).sort((a, b) => a.localeCompare(b));

			const types = Array.from(
				new Set(
					rows
						.map((row) => row.type?.trim())
						.filter((value): value is string => Boolean(value))
				)
			).sort((a, b) => a.localeCompare(b));

			return NextResponse.json({ categories, types });
		}

		const events = await prisma.event.findMany({
			where: Object.keys(where).length > 0 ? where : undefined,
			orderBy: { createdAt: "desc" },
			...(hasPaginationParams && limit > 0
				? { skip: (page - 1) * limit, take: limit }
				: {}),
		});

		const result: EventApi[] = events.map((event) => ({
			id: event.id,
			title: event.title,
			description: event.description || "",
			bookingUrl: event.bookingUrl || "",
			address: event.address || "",
			fromDate: formatDateOnly(event.fromDate),
			fromTime: event.fromTime || "",
			toDate: formatDateOnly(event.toDate),
			toTime: event.toTime || "",
			place: event.place || "",
			location: event.location || "",
			category: event.category,
			type: event.type,
			price: event.price ?? undefined,
			bannerImage: event.bannerImage || "",
			relatedImages: parseArrayField(event.relatedImages),
			status: event.status,
			createdAt: formatIsoDateTime(event.createdAt),
			updatedAt: formatIsoDateTime(event.updatedAt),
		}));

		if (hasPaginationParams && limit > 0) {
			const total = await prisma.event.count({
				where: Object.keys(where).length > 0 ? where : undefined,
			});
			const totalPages = Math.ceil(total / limit);
			return NextResponse.json({
				content: result,
				total,
				pagination: {
					currentPage: page,
					totalPages,
					limit,
				},
			});
		}

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching events:", error);
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
			fromDate: formatDateOnly(event.fromDate),
			fromTime: event.fromTime || "",
			toDate: formatDateOnly(event.toDate),
			toTime: event.toTime || "",
			place: event.place || "",
			location: event.location || "",
			category: event.category,
			type: event.type,
			price: event.price ?? undefined,
			bannerImage: event.bannerImage || "",
			relatedImages: parseArrayField(event.relatedImages),
			status: event.status,
			createdAt: formatIsoDateTime(event.createdAt),
			updatedAt: formatIsoDateTime(event.updatedAt),
		};
		return NextResponse.json(result);
	} catch {
		return NextResponse.json(
			{ error: "Failed to create event" },
			{ status: 500 }
		);
	}
}
