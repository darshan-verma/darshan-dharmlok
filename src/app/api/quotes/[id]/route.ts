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

// GET /api/quotes/[id]
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const quote = await prisma.quote.findUnique({ where: { id } });
		if (!quote) {
			return NextResponse.json({ error: "Quote not found" }, { status: 404 });
		}
		const result: Quote = {
			id: quote.id,
			quote: quote.quote,
			date:
				quote.date instanceof Date
					? quote.date.toISOString().slice(0, 10)
					: quote.date,
			status: quote.status,
			createdAt: quote.createdAt?.toISOString?.() ?? "",
			updatedAt: quote.updatedAt?.toISOString?.() ?? "",
		};
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching quote:", error);
		return NextResponse.json(
			{ error: "Failed to fetch quote" },
			{ status: 500 }
		);
	}
}

// PUT /api/quotes/[id]
export async function PUT(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const body = await req.json();
		const { quote, date, status } = body as {
			quote?: string;
			date?: string;
			status?: string;
		};

		const updateData: { quote?: string; date?: Date; status?: string } = {};
		if (quote !== undefined) updateData.quote = quote;
		if (date !== undefined) updateData.date = new Date(date);
		if (status !== undefined) updateData.status = status;

		const updatedQuote = await prisma.quote.update({
			where: { id },
			data: updateData,
		});

		const result: Quote = {
			id: updatedQuote.id,
			quote: updatedQuote.quote,
			date:
				updatedQuote.date instanceof Date
					? updatedQuote.date.toISOString().slice(0, 10)
					: updatedQuote.date,
			status: updatedQuote.status,
			createdAt: updatedQuote.createdAt?.toISOString?.() ?? "",
			updatedAt: updatedQuote.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error updating quote:", error);
		return NextResponse.json(
			{ error: "Failed to update quote" },
			{ status: 500 }
		);
	}
}

// DELETE /api/quotes/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		await prisma.quote.delete({ where: { id } });
		return NextResponse.json({ success: true, message: "Quote deleted" });
	} catch (error) {
		console.error("Error deleting quote:", error);
		return NextResponse.json(
			{ error: "Failed to delete quote" },
			{ status: 500 }
		);
	}
}
