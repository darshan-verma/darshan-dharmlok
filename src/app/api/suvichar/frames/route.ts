import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/suvichar/admin-auth";
import { serializeFrame } from "@/lib/suvichar/serialize";
import { validateSafeArea } from "@/lib/suvichar/validation";

export async function GET() {
	const { error } = await requireAdmin();
	if (error) return error;

	try {
		const frames = await prisma.suvicharFrame.findMany({
			orderBy: { updatedAt: "desc" },
		});
		return NextResponse.json({ content: frames.map(serializeFrame) });
	} catch (e) {
		console.error("[GET /api/suvichar/frames]", e);
		return NextResponse.json({ error: "Failed to fetch frames" }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	const { error } = await requireAdmin();
	if (error) return error;

	try {
		const body = await req.json();
		const {
			name,
			imageUrl,
			thumbnailUrl,
			width = 1080,
			height = 1080,
			safeAreaX = 120,
			safeAreaY = 220,
			safeAreaWidth = 840,
			safeAreaHeight = 560,
			defaultTextColor = "#1a1a1a",
			defaultFontSize = 32,
			defaultTextAlign = "center",
			status = "active",
		} = body as Record<string, unknown>;

		if (!name || !imageUrl) {
			return NextResponse.json(
				{ error: "Name and image URL are required" },
				{ status: 400 },
			);
		}

		const safeCheck = validateSafeArea({
			safeAreaWidth: Number(safeAreaWidth),
			safeAreaHeight: Number(safeAreaHeight),
		});
		if (!safeCheck.ok) {
			return NextResponse.json({ error: safeCheck.message }, { status: 400 });
		}

		const created = await prisma.suvicharFrame.create({
			data: {
				name: String(name),
				imageUrl: String(imageUrl),
				thumbnailUrl: thumbnailUrl ? String(thumbnailUrl) : null,
				width: Number(width),
				height: Number(height),
				safeAreaX: Number(safeAreaX),
				safeAreaY: Number(safeAreaY),
				safeAreaWidth: Number(safeAreaWidth),
				safeAreaHeight: Number(safeAreaHeight),
				defaultTextColor: String(defaultTextColor),
				defaultFontSize: Number(defaultFontSize),
				defaultTextAlign: String(defaultTextAlign),
				status: String(status),
			},
		});

		return NextResponse.json(serializeFrame(created));
	} catch (e) {
		console.error("[POST /api/suvichar/frames]", e);
		return NextResponse.json({ error: "Failed to create frame" }, { status: 500 });
	}
}
