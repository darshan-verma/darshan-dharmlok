import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/suvichar/admin-auth";
import { serializeFrame } from "@/lib/suvichar/serialize";
import { validateSuvicharFrame } from "@/lib/suvichar/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
	const { error } = await requireAdmin();
	if (error) return error;

	const { id } = await context.params;

	try {
		const existing = await prisma.suvicharFrame.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json({ error: "Frame not found" }, { status: 404 });
		}

		const body = await req.json();
		const merged = {
			safeAreaX: body.safeAreaX ?? existing.safeAreaX,
			safeAreaY: body.safeAreaY ?? existing.safeAreaY,
			safeAreaWidth: body.safeAreaWidth ?? existing.safeAreaWidth,
			safeAreaHeight: body.safeAreaHeight ?? existing.safeAreaHeight,
			defaultTextColor: body.defaultTextColor ?? existing.defaultTextColor,
			defaultFontSize: body.defaultFontSize ?? existing.defaultFontSize,
			width: body.width ?? existing.width,
			height: body.height ?? existing.height,
		};

		const validation = validateSuvicharFrame(merged);
		if (!validation.valid) {
			return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
		}

		const updated = await prisma.suvicharFrame.update({
			where: { id },
			data: body,
		});

		return NextResponse.json(serializeFrame(updated));
	} catch (e) {
		console.error("[PUT /api/suvichar/frames/[id]]", e);
		return NextResponse.json({ error: "Failed to update frame" }, { status: 400 });
	}
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
	const { error } = await requireAdmin();
	if (error) return error;

	const { id } = await context.params;

	try {
		const inUse = await prisma.dailySuvichar.count({ where: { frameId: id } });
		if (inUse > 0) {
			return NextResponse.json(
				{ error: "Frame is used in the daily schedule and cannot be deleted." },
				{ status: 400 },
			);
		}

		await prisma.suvicharFrame.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (e) {
		console.error("[DELETE /api/suvichar/frames/[id]]", e);
		return NextResponse.json({ error: "Failed to delete frame" }, { status: 500 });
	}
}
