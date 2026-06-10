import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
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
	bookFile?: string;
	bookCover?: string;
	createdAt?: string;
	updatedAt?: string;
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
	bookFile: string | null;
	bookCover: string | null;
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
		date:
			e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date),
		description: e.description,
		type: e.type,
		category: e.category,
		religiousCategories: withReligious.religiousCategories,
		detail: e.detail ?? "",
		status: e.status ?? "Active",
		bookFile: e.bookFile ?? "",
		bookCover: e.bookCover ?? "",
		createdAt: e.createdAt?.toISOString?.() ?? "",
		updatedAt: e.updatedAt?.toISOString?.() ?? "",
	};
}

// GET /api/ebook/[id]
export async function GET(
	_: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const ebook = await prisma.eBook.findUnique({ where: { id } });
		if (!ebook) {
			return NextResponse.json({ error: "Ebook not found" }, { status: 404 });
		}
		return NextResponse.json(mapEbook(ebook));
	} catch (error) {
		console.error("Error fetching ebook:", error);
		return NextResponse.json(
			{ error: "Failed to fetch ebook" } as ErrorResponse,
			{ status: 500 }
		);
	}
}

// PUT /api/ebook/[id]
export async function PUT(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const body = await req.json();

		if (body.status && Object.keys(body).length === 1) {
			const ebook = await prisma.eBook.update({
				where: { id },
				data: { status: body.status },
			});
			return NextResponse.json(mapEbook(ebook));
		}

		const {
			title,
			date,
			description,
			type,
			category,
			detail,
			status,
			bookFile,
			bookCover,
		} = body;

		const religiousCategories =
			body.religiousCategories !== undefined
				? normalizeReligiousCategories(body.religiousCategories)
				: undefined;

		const ebook = await prisma.eBook.update({
			where: { id },
			data: {
				title,
				date: new Date(date),
				description,
				type,
				category,
				...(religiousCategories !== undefined && { religiousCategories }),
				detail: detail ?? "",
				status,
				bookFile: bookFile ?? "",
				bookCover: bookCover ?? "",
			},
		});

		return NextResponse.json(mapEbook(ebook));
	} catch (error) {
		console.error("Error updating ebook:", error);
		return NextResponse.json(
			{ error: "Failed to update ebook" } as ErrorResponse,
			{ status: 500 }
		);
	}
}

// DELETE /api/ebook/[id]
export async function DELETE(
	_: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		await prisma.eBook.delete({ where: { id } });
		return NextResponse.json({ success: true, message: "Ebook deleted" });
	} catch (error) {
		console.error("Error deleting ebook:", error);
		return NextResponse.json(
			{ error: "Failed to delete ebook" } as ErrorResponse,
			{ status: 500 }
		);
	}
}
