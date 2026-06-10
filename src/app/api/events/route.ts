import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseLangParam, getTranslation } from "@/lib/content-lang";
import {
	findEventsWithOptionalSearch,
	formatEventResponse,
	prepareTranslationsForSave,
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

// Helper to parse array fields
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

// GET /api/events
export async function GET(req: NextRequest) {
	try {
		const locale = parseLangParam(req.nextUrl.searchParams.get("lang")) ?? "en";
		const searchParams = req.nextUrl.searchParams;
		const pageParam = searchParams.get("page");
		const limitParam = searchParams.get("limit");
		const searchParam = searchParams.get("search")?.trim();
		const categoryParam = searchParams.get("category")?.trim();
		const religiousCategoryParam =
			searchParams.get("religiousCategory")?.trim() || categoryParam;
		const typeParam = searchParams.get("type")?.trim();
		const statusParam = searchParams.get("status")?.trim();
		const filtersOnly = searchParams.get("filtersOnly") === "true";

		const parsedPage = Number(pageParam ?? "1");
		const parsedLimit = Number(limitParam ?? "0");
		const hasPaginationParams = pageParam !== null || limitParam !== null;

		const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
		const limit =
			Number.isFinite(parsedLimit) && parsedLimit > 0
				? Math.min(parsedLimit, 100)
				: 0;

		if (filtersOnly) {
			const { rows } = await findEventsWithOptionalSearch({
				status: statusParam,
				religiousCategory: religiousCategoryParam,
				type: typeParam,
			});

			const categories = Array.from(
				new Set(
					rows
						.map((row) =>
							typeof row.category === "string" ? row.category.trim() : ""
						)
						.filter((value): value is string => Boolean(value))
				)
			).sort((a, b) => a.localeCompare(b));

			const types = Array.from(
				new Set(
					rows
						.map((row) =>
							typeof row.type === "string" ? row.type.trim() : ""
						)
						.filter((value): value is string => Boolean(value))
				)
			).sort((a, b) => a.localeCompare(b));

			return NextResponse.json({ categories, types });
		}

		const skip =
			hasPaginationParams && limit > 0 ? (page - 1) * limit : undefined;
		const take = hasPaginationParams && limit > 0 ? limit : undefined;

		const { rows: events, total } = await findEventsWithOptionalSearch({
			search: searchParam,
			religiousCategory: religiousCategoryParam,
			type: typeParam,
			status: statusParam,
			skip,
			limit: take,
		});

		const result = events.map((event) =>
			formatEventResponse(event, locale, {
				formatDateOnly: safeFormatDateOnly,
				formatIsoDateTime: (v) => safeFormatDate(v) || undefined,
				parseArrayField: parseArrayField,
			})
		) as unknown as EventApi[];

		if (hasPaginationParams && limit > 0) {
			const totalPages = Math.ceil(total / limit);
			return NextResponse.json({
				content: result,
				total,
				pagination: {
					currentPage: page,
					totalPages,
					limit,
				},
			});
		}

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching events:", error);
		return NextResponse.json(
			{ error: "Failed to fetch events" },
			{ status: 500 }
		);
	}
}

// POST /api/events
export async function POST(req: NextRequest) {
	try {
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
		} = body as Omit<EventApi, "id" | "createdAt" | "updatedAt">;

		const { translations, translationStatus } = prepareTranslationsForSave(
			"event",
			body
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

		const event = await prisma.event.create({
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
		return NextResponse.json(
			formatEventResponse(event as unknown as Record<string, unknown>, "en", {
				formatDateOnly: safeFormatDateOnly,
				formatIsoDateTime: (v) => safeFormatDate(v) || undefined,
				parseArrayField,
			})
		);
	} catch {
		return NextResponse.json(
			{ error: "Failed to create event" },
			{ status: 500 }
		);
	}
}
