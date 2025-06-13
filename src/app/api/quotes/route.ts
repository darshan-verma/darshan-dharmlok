import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface Quote {
	id: string;
	quote: string;
	date: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

// GET /api/quotes
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "50", 10);
		const skip = (page - 1) * limit;

		const [total, quotes] = await Promise.all([
			prisma.quote.count(),
			prisma.quote.findMany({
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
		]);

		const content: Quote[] = quotes.map((q) => ({
			id: q.id,
			quote: q.quote,
			date: q.date instanceof Date ? q.date.toISOString().slice(0, 10) : q.date,
			status: q.status,
			createdAt: q.createdAt?.toISOString?.() ?? "",
			updatedAt: q.updatedAt?.toISOString?.() ?? "",
		}));

		return NextResponse.json({
			content,
			total,
			pagination: {
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching quotes:", error);
		return NextResponse.json(
			{ error: "Failed to fetch quotes" },
			{ status: 500 }
		);
	}
}

// POST /api/quotes
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { quote, date, status } = body as {
			quote: string;
			date: string;
			status: string;
		};

		if (!quote || !date || !status) {
			return NextResponse.json(
				{ error: "Quote, date, and status are required" },
				{ status: 400 }
			);
		}

		const newQuote = await prisma.quote.create({
			data: {
				quote,
				date: new Date(date),
				status,
			},
		});

		const result: Quote = {
			id: newQuote.id,
			quote: newQuote.quote,
			date:
				newQuote.date instanceof Date
					? newQuote.date.toISOString().slice(0, 10)
					: newQuote.date,
			status: newQuote.status,
			createdAt: newQuote.createdAt?.toISOString?.() ?? "",
			updatedAt: newQuote.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating quote:", error);
		return NextResponse.json(
			{ error: "Failed to create quote" },
			{ status: 500 }
		);
	}
}
