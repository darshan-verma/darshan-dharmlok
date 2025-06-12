import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface Ebook {
	id: string;
	title: string;
	date: string;
	description: string;
	type: string;
	category: string;
	detail?: string;
	status: string;
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

// GET /api/ebook?page=1&limit=12
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "12", 10);

		const skip = (page - 1) * limit;

		const [ebooks, total] = await Promise.all([
			prisma.eBook.findMany({
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
			}),
			prisma.eBook.count(),
		]);

		const content: Ebook[] = ebooks.map((e) => ({
			id: e.id,
			title: e.title,
			date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : e.date,
			description: e.description,
			type: e.type,
			category: e.category,
			detail: e.detail ?? "",
			status: e.status ?? "Active",
			createdAt: e.createdAt?.toISOString?.() ?? "",
			updatedAt: e.updatedAt?.toISOString?.() ?? "",
		}));

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
				detail: detail ?? "",
				status,
			},
		});

		const result: Ebook = {
			id: ebook.id,
			title: ebook.title,
			date:
				ebook.date instanceof Date
					? ebook.date.toISOString().slice(0, 10)
					: ebook.date,
			description: ebook.description,
			type: ebook.type,
			category: ebook.category,
			detail: ebook.detail ?? "",
			status: ebook.status ?? "Active",
			createdAt: ebook.createdAt?.toISOString?.() ?? "",
			updatedAt: ebook.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating ebook:", error);
		return NextResponse.json(
			{ error: "Failed to create ebook" } as ErrorResponse,
			{ status: 500 }
		);
	}
}
