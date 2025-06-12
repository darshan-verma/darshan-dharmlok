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
	bookFile?: string;
	createdAt?: string;
	updatedAt?: string;
}

interface ErrorResponse {
	error: string;
	details?: unknown;
}

// GET /api/ebook/[id]
export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;
		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const ebook = await prisma.eBook.findUnique({ where: { id } });
		if (!ebook) {
			return NextResponse.json({ error: "Ebook not found" }, { status: 404 });
		}
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
			bookFile: ebook.bookFile ?? "",
			createdAt: ebook.createdAt?.toISOString?.() ?? "",
			updatedAt: ebook.updatedAt?.toISOString?.() ?? "",
		};
		return NextResponse.json(result);
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
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;
		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const body = await req.json();

		// Allow partial update for status only
		if (body.status && Object.keys(body).length === 1) {
			const ebook = await prisma.eBook.update({
				where: { id },
				data: {
					status: body.status,
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
				bookFile: ebook.bookFile ?? "",
				createdAt: ebook.createdAt?.toISOString?.() ?? "",
				updatedAt: ebook.updatedAt?.toISOString?.() ?? "",
			};
			return NextResponse.json(result);
		}

		// ...existing full update code...
		const {
			title,
			date,
			description,
			type,
			category,
			detail,
			status,
			bookFile,
		} = body;

		const ebook = await prisma.eBook.update({
			where: { id },
			data: {
				title,
				date: new Date(date),
				description,
				type,
				category,
				detail: detail ?? "",
				status,
				bookFile: bookFile ?? "",
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
			bookFile: ebook.bookFile ?? "",
			createdAt: ebook.createdAt?.toISOString?.() ?? "",
			updatedAt: ebook.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
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
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;
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
