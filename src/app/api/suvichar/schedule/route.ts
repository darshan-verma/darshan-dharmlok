import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/suvichar/admin-auth";
import { getIstDateString } from "@/lib/suvichar/dates";
import { serializeDaily } from "@/lib/suvichar/serialize";
import { parseTextStyleOverrides, serializeTextStyleForDb } from "@/lib/suvichar/textStyle";
import {
	estimateTextOverflowWarning,
	validateScheduledDate,
	validateSuvicharFrame,
	validateSuvicharText,
	validateTextStyleOverrides,
} from "@/lib/suvichar/validation";

const includeRelations = {
	suvicharText: true,
	frame: true,
} as const;

export async function GET(req: NextRequest) {
	const { error } = await requireAdmin();
	if (error) return error;

	try {
		const { searchParams } = new URL(req.url);
		const from = searchParams.get("from");
		const to = searchParams.get("to");

		const items = await prisma.dailySuvichar.findMany({
			where:
				from && to
					? { scheduledDate: { gte: from, lte: to } }
					: undefined,
			orderBy: { scheduledDate: "asc" },
			include: includeRelations,
		});

		return NextResponse.json({
			content: items.map(serializeDaily),
		});
	} catch (e) {
		console.error("[GET /api/suvichar/schedule]", e);
		return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	const { error } = await requireAdmin();
	if (error) return error;

	try {
		const body = await req.json();
		const {
			suvicharTextId,
			frameId,
			scheduledDate,
			status = "scheduled",
			replace = false,
			publishNow = false,
			textStyleOverrides: rawTextStyle,
		} = body as {
			suvicharTextId?: string;
			frameId?: string;
			scheduledDate?: string;
			status?: string;
			replace?: boolean;
			publishNow?: boolean;
			textStyleOverrides?: unknown;
		};

		if (!suvicharTextId || !frameId || !scheduledDate) {
			return NextResponse.json(
				{ error: "Quote, frame, and date are required" },
				{ status: 400 },
			);
		}

		const dateValidation = validateScheduledDate(scheduledDate);
		if (!dateValidation.valid) {
			return NextResponse.json({ error: dateValidation.errors[0] }, { status: 400 });
		}

		const [text, frame] = await Promise.all([
			prisma.suvicharText.findUnique({ where: { id: suvicharTextId } }),
			prisma.suvicharFrame.findUnique({ where: { id: frameId } }),
		]);

		if (!text || text.status !== "active") {
			return NextResponse.json({ error: "Quote not found or inactive" }, { status: 400 });
		}
		if (!frame || frame.status !== "active") {
			return NextResponse.json({ error: "Frame not found or inactive" }, { status: 400 });
		}

		const textValidation = validateSuvicharText({
			plainText: text.plainText,
			blocknoteJson: text.blocknoteJson,
		});
		if (!textValidation.valid) {
			return NextResponse.json({ error: textValidation.errors[0] }, { status: 400 });
		}

		const frameValidation = validateSuvicharFrame(frame);
		if (!frameValidation.valid) {
			return NextResponse.json({ error: frameValidation.errors[0] }, { status: 400 });
		}

		const frameDefaults = {
			defaultTextColor: frame.defaultTextColor,
			defaultTextAlign: frame.defaultTextAlign,
		};

		const parsedOverrides =
			rawTextStyle != null
				? parseTextStyleOverrides(rawTextStyle, frameDefaults)
				: null;

		if (parsedOverrides) {
			const overrideValidation = validateTextStyleOverrides(parsedOverrides);
			if (!overrideValidation.valid) {
				return NextResponse.json({ error: overrideValidation.errors[0] }, { status: 400 });
			}
		}

		const overflowWarning = estimateTextOverflowWarning(
			text.plainText,
			frame.defaultFontSize,
			frame,
		);

		const existing = await prisma.dailySuvichar.findUnique({
			where: { scheduledDate },
		});

		if (existing && !replace) {
			return NextResponse.json(
				{
					error: "A suvichar already exists for this date",
					existingId: existing.id,
					requiresReplace: true,
				},
				{ status: 409 },
			);
		}

		const today = getIstDateString();
		const finalStatus = publishNow
			? "published"
			: scheduledDate === today
				? status
				: status;

		const publishedAt =
			finalStatus === "published" || publishNow ? new Date() : null;

		const data: Prisma.DailySuvicharUncheckedCreateInput = {
			suvicharTextId,
			frameId,
			scheduledDate,
			status: publishNow ? "published" : finalStatus,
			publishedAt,
		};

		if (rawTextStyle !== undefined) {
			const storedOverrides =
				parsedOverrides != null
					? serializeTextStyleForDb(parsedOverrides, frameDefaults)
					: null;

			data.textStyleOverrides =
				storedOverrides != null
					? (storedOverrides as Prisma.InputJsonValue)
					: null;
		}

		const row = existing
			? await prisma.dailySuvichar.update({
					where: { id: existing.id },
					data,
					include: includeRelations,
				})
			: await prisma.dailySuvichar.create({
					data,
					include: includeRelations,
				});

		return NextResponse.json({
			...serializeDaily(row),
			warning: overflowWarning,
		});
	} catch (e) {
		console.error("[POST /api/suvichar/schedule]", e);
		return NextResponse.json({ error: "Failed to save schedule" }, { status: 500 });
	}
}
