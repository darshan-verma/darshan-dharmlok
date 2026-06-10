import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseLangParam, getTranslation } from "@/lib/content-lang";
import {
	formatEventResponse,
	prepareTranslationsForSave,
	rawFindById,
	safeFormatDate,
	safeFormatDateOnly,
} from "@/lib/content-api";
import { buildDualWriteReligiousFields } from "@/lib/religious-categories";

export interface EventApi {
	id: string;
	title: string;
	description?: string;
	bookingUrl?: string;
	address?: string;
	fromDate: string;
	fromTime?: string;
	toDate: string;
	toTime?: string;
	place?: string;
	location?: string;
	category: string;
	type: string;
	price?: number;
	bannerImage?: string;
	relatedImages?: string[];
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

function parseArrayField(field: unknown): string[] {
	if (!field) return [];
	if (Array.isArray(field)) return field as string[];
	if (typeof field === "string") {
		try {
			const parsed = JSON.parse(field);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}

// GET /api/events/[id]
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		const locale = parseLangParam(req.nextUrl.searchParams.get("lang")) ?? "en";
		const event = await rawFindById("Event", id);
		if (!event)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(
			formatEventResponse(event, locale, {
				formatDateOnly: safeFormatDateOnly,
				formatIsoDateTime: (v) => safeFormatDate(v) || undefined,
				parseArrayField,
			})
		);
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch event" },
			{ status: 500 }
		);
	}
}

// PUT /api/events/[id]
export async function PUT(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		const body = await req.json();
		const {
			bookingUrl,
			fromDate,
			toDate,
			category,
			type,
			price,
			bannerImage,
			relatedImages,
			status,
		} = body as Partial<EventApi>;

		// Allow status-only update for quick status change
		if (status && Object.keys(body).length === 1) {
			const updated = await prisma.event.update({
				where: { id },
				data: { status },
			});
			return NextResponse.json({
				id: updated.id,
				status: updated.status,
			});
		}

		const existing = await prisma.event.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const { translations, translationStatus } = prepareTranslationsForSave(
			"event",
			body,
			existing
		);

		const titleEn = getTranslation(
			{ translations } as Record<string, unknown>,
			"en",
			"title"
		);
		if (!titleEn || !fromDate || !toDate || !category || !type || !status) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const { religiousCategories, category: legacyCategory } =
			buildDualWriteReligiousFields({
				religiousCategories: (body as { religiousCategories?: unknown })
					.religiousCategories,
				category,
			});

		const updated = await prisma.event.update({
			where: { id },
			data: {
				translations: translations as object,
				translationStatus,
				bookingUrl: bookingUrl || "",
				fromDate: new Date(fromDate),
				toDate: new Date(toDate),
				category: legacyCategory ?? category,
				religiousCategories,
				type,
				price: price !== undefined && price !== null ? Number(price) : null,
				bannerImage: bannerImage || "",
				relatedImages: Array.isArray(relatedImages) ? relatedImages : [],
				status,
			},
		});

		const locale = parseLangParam(body.locale) ?? "en";
		return NextResponse.json(
			formatEventResponse(updated as unknown as Record<string, unknown>, locale, {
				formatDateOnly: safeFormatDateOnly,
				formatIsoDateTime: (v) => safeFormatDate(v) || undefined,
				parseArrayField,
			})
		);
	} catch {
		return NextResponse.json(
			{ error: "Failed to update event" },
			{ status: 500 }
		);
	}
}

// DELETE /api/events/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		await prisma.event.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Failed to delete event" },
			{ status: 500 }
		);
	}
}
