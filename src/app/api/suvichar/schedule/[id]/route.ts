import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/suvichar/admin-auth";
import { serializeDaily } from "@/lib/suvichar/serialize";
import { parseTextStyleOverrides } from "@/lib/suvichar/textStyle";

type RouteContext = { params: Promise<{ id: string }> };

const includeRelations = {
	suvicharText: true,
	frame: true,
} as const;

export async function PUT(req: NextRequest, context: RouteContext) {
	const { error } = await requireAdmin();
	if (error) return error;

	const { id } = await context.params;

	try {
		const body = await req.json();
		const {
			status,
			publishNow,
			suvicharTextId,
			frameId,
			scheduledDate,
			textStyleOverrides: rawTextStyle,
		} = body as {
			status?: string;
			publishNow?: boolean;
			suvicharTextId?: string;
			frameId?: string;
			scheduledDate?: string;
			textStyleOverrides?: unknown;
		};

		const existing = await prisma.dailySuvichar.findUnique({
			where: { id },
			include: { frame: true },
		});
		if (!existing) {
			return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 });
		}

		const frame =
			frameId && frameId !== existing.frameId
				? await prisma.suvicharFrame.findUnique({ where: { id: frameId } })
				: existing.frame;

		const data: Prisma.DailySuvicharUncheckedUpdateInput = {};

		if (suvicharTextId) data.suvicharTextId = suvicharTextId;
		if (frameId) data.frameId = frameId;
		if (scheduledDate) data.scheduledDate = scheduledDate;

		if (rawTextStyle !== undefined) {
			data.textStyleOverrides =
				rawTextStyle != null && frame
					? (parseTextStyleOverrides(rawTextStyle, {
							defaultTextColor: frame.defaultTextColor,
							defaultTextAlign: frame.defaultTextAlign,
						}) as unknown as Prisma.InputJsonValue)
					: null;
		}

		if (publishNow || status === "published") {
			data.status = "published";
			data.publishedAt = new Date();
		} else if (status) {
			data.status = status;
		}

		const updated = await prisma.dailySuvichar.update({
			where: { id },
			data,
			include: includeRelations,
		});

		return NextResponse.json(serializeDaily(updated));
	} catch (e) {
		console.error("[PUT /api/suvichar/schedule/[id]]", e);
		return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
	}
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
	const { error } = await requireAdmin();
	if (error) return error;

	const { id } = await context.params;

	try {
		await prisma.dailySuvichar.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (e) {
		console.error("[DELETE /api/suvichar/schedule/[id]]", e);
		return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
	}
}
