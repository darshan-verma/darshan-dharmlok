import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
	applyReligiousCategoryFilter,
	mapWithReligiousCategories,
	normalizeReligiousCategories,
} from "@/lib/religious-categories";

export interface Ebook {
	id: string;
	title: string;
	date: string;
	description: string;
	type: string;
	category: string;
	religiousCategories?: string[];
	detail?: string;
	status: string;
	bookCover?: string;
	bookFile?: string;
	createdAt?: string;
	updatedAt?: string;
}

interface EbookListResponse {
	content: Ebook[];
	total: number;
	pagination: {
		currentPage: number;
		totalPages: number;
		itemsPerPage: number;
	};
}

interface ErrorResponse {
	error: string;
	details?: unknown;
}

function mapEbook(e: {
	id: string;
	title: string;
	date: Date;
	description: string;
	type: string;
	category: string;
	religiousCategories: string[];
	detail: string | null;
	status: string | null;
	bookCover: string | null;
	bookFile: string | null;
	createdAt: Date;
	updatedAt: Date;
}): Ebook {
	const withReligious = mapWithReligiousCategories({
		category: e.category,
		religiousCategories: e.religiousCategories,
	});
	return {
		id: e.id,
		title: e.title,
		date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date),
		description: e.description,
		type: e.type,
		category: e.category,
		religiousCategories: withReligious.religiousCategories,
		detail: e.detail ?? "",
		status: e.status ?? "Active",
		bookCover: e.bookCover ?? undefined,
		bookFile: e.bookFile ?? undefined,
		createdAt: e.createdAt?.toISOString?.() ?? "",
		updatedAt: e.updatedAt?.toISOString?.() ?? "",
	};
}

// GET /api/ebook?page=1&limit=12&category=&religiousCategory=
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "12", 10);
		const category = searchParams.get("category")?.trim();
		const status = searchParams.get("status")?.trim();
		const religiousCategory = searchParams.get("religiousCategory");
		const search = searchParams.get("search")?.trim();

		const skip = (page - 1) * limit;

		const where: Prisma.EBookWhereInput = applyReligiousCategoryFilter(
			{
				...(category && category.toLowerCase() !== "all"
					? { category: { equals: category, mode: "insensitive" } }
					: {}),
				...(status && status.toLowerCase() !== "all"
					? { status: { equals: status, mode: "insensitive" } }
					: {}),
				...(search
					? {
							OR: [
								{ title: { contains: search, mode: "insensitive" as const } },
								{ description: { contains: search, mode: "insensitive" as const } },
							],
						}
					: {}),
			},
			religiousCategory
		);

		const [ebooks, total] = await Promise.all([
			prisma.eBook.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
			}),
			prisma.eBook.count({ where }),
		]);

		const content = ebooks.map(mapEbook);
		const totalPages = Math.ceil(total / limit);

		const response: EbookListResponse = {
			content,
			total,
			pagination: {
				currentPage: page,
				totalPages,
				itemsPerPage: limit,
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Error fetching ebooks:", error);
		return NextResponse.json(
			{ error: "Failed to fetch ebooks" } as ErrorResponse,
			{ status: 500 }
		);
	}
}

// POST /api/ebook
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { title, date, description, type, category, detail, status } = body;
		const religiousCategories = normalizeReligiousCategories(
			body.religiousCategories
		);

		if (!title || !date || !description || !type || !category || !status) {
			return NextResponse.json(
				{ error: "Missing required fields" } as ErrorResponse,
				{ status: 400 }
			);
		}

		const ebook = await prisma.eBook.create({
			data: {
				title,
				date: new Date(date),
				description,
				type,
				category,
				religiousCategories,
				detail: detail ?? "",
				status,
			},
		});

		return NextResponse.json(mapEbook(ebook));
	} catch (error) {
		console.error("Error creating ebook:", error);
		return NextResponse.json(
			{ error: "Failed to create ebook" } as ErrorResponse,
			{ status: 500 }
		);
	}
}
