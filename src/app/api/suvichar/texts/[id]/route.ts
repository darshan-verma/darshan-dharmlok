import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/suvichar/admin-auth";
import { serializeText } from "@/lib/suvichar/serialize";
import { validateBlocknoteContent } from "@/lib/suvichar/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
	const { error } = await requireAdmin();
	if (error) return error;

	const { id } = await context.params;

	try {
		const row = await prisma.suvicharText.findUnique({ where: { id } });
		if (!row) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}
		return NextResponse.json(serializeText(row));
	} catch (e) {
		console.error("[GET /api/suvichar/texts/[id]]", e);
		return NextResponse.json({ error: "Failed to fetch text" }, { status: 500 });
	}
}

export async function PUT(req: NextRequest, context: RouteContext) {
	const { error } = await requireAdmin();
	if (error) return error;

	const { id } = await context.params;

	try {
		const body = await req.json();
		const { title, blocknoteJson, language, status } = body as {
			title?: string;
			blocknoteJson?: string;
			language?: string;
			status?: string;
		};

		const data: {
			title?: string;
			blocknoteJson?: string;
			plainText?: string;
			language?: string;
			status?: string;
		} = {};

		if (title !== undefined) data.title = title.trim();
		if (language !== undefined) data.language = language;
		if (status !== undefined) data.status = status;

		if (blocknoteJson !== undefined) {
			const validation = validateBlocknoteContent(blocknoteJson);
			if (!validation.ok) {
				return NextResponse.json({ error: validation.message }, { status: 400 });
			}
			data.blocknoteJson = blocknoteJson;
			data.plainText = validation.plainText;
		}

		const updated = await prisma.suvicharText.update({
			where: { id },
			data,
		});

		return NextResponse.json(serializeText(updated));
	} catch (e) {
		console.error("[PUT /api/suvichar/texts/[id]]", e);
		return NextResponse.json({ error: "Failed to update text" }, { status: 500 });
	}
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
	const { error } = await requireAdmin();
	if (error) return error;

	const { id } = await context.params;

	try {
		const inUse = await prisma.dailySuvichar.count({
			where: { suvicharTextId: id },
		});
		if (inUse > 0) {
			return NextResponse.json(
				{ error: "Text is used in the daily schedule and cannot be deleted." },
				{ status: 400 },
			);
		}

		await prisma.suvicharText.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (e) {
		console.error("[DELETE /api/suvichar/texts/[id]]", e);
		return NextResponse.json({ error: "Failed to delete text" }, { status: 500 });
	}
}
