import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/suvichar/admin-auth";
import { serializeFrame } from "@/lib/suvichar/serialize";
import { validateSafeArea } from "@/lib/suvichar/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
	const { error } = await requireAdmin();
	if (error) return error;

	const { id } = await context.params;

	try {
		const body = await req.json();
		const safeAreaWidth = body.safeAreaWidth as number | undefined;
		const safeAreaHeight = body.safeAreaHeight as number | undefined;

		if (safeAreaWidth !== undefined && safeAreaHeight !== undefined) {
			const safeCheck = validateSafeArea({ safeAreaWidth, safeAreaHeight });
			if (!safeCheck.ok) {
				return NextResponse.json({ error: safeCheck.message }, { status: 400 });
			}
		}

		const updated = await prisma.suvicharFrame.update({
			where: { id },
			data: body,
		});

		return NextResponse.json(serializeFrame(updated));
	} catch (e) {
		console.error("[PUT /api/suvichar/frames/[id]]", e);
		return NextResponse.json({ error: "Failed to update frame" }, { status: 500 });
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
