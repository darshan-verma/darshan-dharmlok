import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/suvichar/admin-auth";
import { slugifyTitle } from "@/lib/suvichar/dates";
import { serializeText } from "@/lib/suvichar/serialize";
import { validateBlocknoteContent } from "@/lib/suvichar/validation";

export async function GET(req: NextRequest) {
	const { error } = await requireAdmin();
	if (error) return error;

	try {
		const { searchParams } = new URL(req.url);
		const status = searchParams.get("status");

		const texts = await prisma.suvicharText.findMany({
			where: status ? { status } : undefined,
			orderBy: { updatedAt: "desc" },
		});

		return NextResponse.json({
			content: texts.map(serializeText),
		});
	} catch (e) {
		console.error("[GET /api/suvichar/texts]", e);
		return NextResponse.json({ error: "Failed to fetch texts" }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	const { session, error } = await requireAdmin();
	if (error) return error;

	try {
		const body = await req.json();
		const { title, blocknoteJson, language = "hi", status = "active" } = body as {
			title?: string;
			blocknoteJson?: string;
			language?: string;
			status?: string;
		};

		if (!title?.trim() || !blocknoteJson) {
			return NextResponse.json(
				{ error: "Title and content are required" },
				{ status: 400 },
			);
		}

		const validation = validateBlocknoteContent(blocknoteJson);
		if (!validation.ok) {
			return NextResponse.json({ error: validation.message }, { status: 400 });
		}

		let slug = slugifyTitle(title);
		const existingSlug = await prisma.suvicharText.findUnique({ where: { slug } });
		if (existingSlug) {
			slug = `${slug}-${Date.now()}`;
		}

		const created = await prisma.suvicharText.create({
			data: {
				title: title.trim(),
				slug,
				blocknoteJson,
				plainText: validation.plainText,
				language,
				status,
				createdBy: session!.user!.id,
			},
		});

		return NextResponse.json(serializeText(created));
	} catch (e) {
		console.error("[POST /api/suvichar/texts]", e);
		return NextResponse.json({ error: "Failed to create text" }, { status: 500 });
	}
}
