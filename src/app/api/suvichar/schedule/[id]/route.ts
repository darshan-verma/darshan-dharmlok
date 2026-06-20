import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/suvichar/admin-auth";
import { serializeDaily } from "@/lib/suvichar/serialize";
import { parseTextStyleOverrides, serializeTextStyleForDb } from "@/lib/suvichar/textStyle";
import {
	validateScheduledDate,
	validateSuvicharText,
	validateTextStyleOverrides,
} from "@/lib/suvichar/validation";

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
			include: { frame: true, suvicharText: true },
		});
		if (!existing) {
			return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 });
		}

		if (scheduledDate) {
			const dateValidation = validateScheduledDate(scheduledDate);
			if (!dateValidation.valid) {
				return NextResponse.json({ error: dateValidation.errors[0] }, { status: 400 });
			}
		}

		if (suvicharTextId && suvicharTextId !== existing.suvicharTextId) {
			const text = await prisma.suvicharText.findUnique({
				where: { id: suvicharTextId },
			});
			if (!text || text.status !== "active") {
				return NextResponse.json({ error: "Quote not found or inactive" }, { status: 400 });
			}
			const textValidation = validateSuvicharText({
				plainText: text.plainText,
				blocknoteJson: text.blocknoteJson,
			});
			if (!textValidation.valid) {
				return NextResponse.json({ error: textValidation.errors[0] }, { status: 400 });
			}
		}

		const frame =
			frameId && frameId !== existing.frameId
				? await prisma.suvicharFrame.findUnique({ where: { id: frameId } })
				: existing.frame;

		if (frameId && (!frame || frame.status !== "active")) {
			return NextResponse.json({ error: "Frame not found or inactive" }, { status: 400 });
		}

		const data: Prisma.DailySuvicharUncheckedUpdateInput = {};

		if (suvicharTextId) data.suvicharTextId = suvicharTextId;
		if (frameId) data.frameId = frameId;
		if (scheduledDate) data.scheduledDate = scheduledDate;

		if (rawTextStyle !== undefined) {
			const frameDefaults = frame
				? {
						defaultTextColor: frame.defaultTextColor,
						defaultTextAlign: frame.defaultTextAlign,
					}
				: undefined;

			const parsedOverrides =
				rawTextStyle != null && frameDefaults
					? parseTextStyleOverrides(rawTextStyle, frameDefaults)
					: null;

			if (parsedOverrides) {
				const overrideValidation = validateTextStyleOverrides(parsedOverrides);
				if (!overrideValidation.valid) {
					return NextResponse.json({ error: overrideValidation.errors[0] }, { status: 400 });
				}
			}

			const storedOverrides =
				parsedOverrides != null && frameDefaults
					? serializeTextStyleForDb(parsedOverrides, frameDefaults)
					: null;

			data.textStyleOverrides =
				storedOverrides != null
					? (storedOverrides as Prisma.InputJsonValue)
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
