import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parseLangParam, getTranslation } from "@/lib/content-lang";
import {
	formatPoojaCategoryResponse,
	prepareTranslationsForSave,
} from "@/lib/content-api";
import { buildTranslationSearchOr } from "@/lib/translation-search";
import { rawCountCollection, rawFindCollection } from "@/lib/content-api";
import {
	mergeMongoReligiousFilter,
	normalizeReligiousCategories,
} from "@/lib/religious-categories";

// GET /api/pooja-categories?page=1&limit=12
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const pageParam = searchParams.get("page");
		const limitParam = searchParams.get("limit");
		const searchParam = searchParams.get("search")?.trim();
		const statusParam = searchParams.get("status")?.trim();
		const minPriceRaw = searchParams.get("minPrice");
		const maxPriceRaw = searchParams.get("maxPrice");
		const minPriceParam =
			minPriceRaw !== null && minPriceRaw !== ""
				? Number(minPriceRaw)
				: Number.NaN;
		const maxPriceParam =
			maxPriceRaw !== null && maxPriceRaw !== ""
				? Number(maxPriceRaw)
				: Number.NaN;
		const filtersOnly = searchParams.get("filtersOnly") === "true";
		const religiousCategory = searchParams.get("religiousCategory")?.trim();
		const locale = parseLangParam(searchParams.get("lang")) ?? "en";

		const parsedPage = Number(pageParam ?? "1");
		const parsedLimit = Number(limitParam ?? "12");
		const hasPaginationParams = pageParam !== null || limitParam !== null;

		const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
		const limit =
			Number.isFinite(parsedLimit) && parsedLimit > 0
				? Math.min(parsedLimit, 100)
				: 12;

		const andConditions: Record<string, unknown>[] = [];

		if (searchParam) {
			andConditions.push({
				$or: buildTranslationSearchOr("poojaCategory", searchParam),
			});
		}

		if (statusParam && statusParam.toLowerCase() !== "all") {
			andConditions.push({
				status: { $regex: statusParam, $options: "i" },
			});
		}

		if (Number.isFinite(minPriceParam)) {
			andConditions.push({ price: { $gte: minPriceParam } });
		}

		if (Number.isFinite(maxPriceParam)) {
			andConditions.push({ price: { $lte: maxPriceParam } });
		}

		const baseFilter =
			andConditions.length > 0 ? { $and: andConditions } : {};
		const mongoFilter = mergeMongoReligiousFilter(
			baseFilter,
			religiousCategory
		);

		if (filtersOnly) {
			const statusRows = await rawFindCollection({
				collection: "PoojaCategory",
				filter: mongoFilter,
			});
			const prices = await rawFindCollection({
				collection: "PoojaCategory",
				filter: mongoFilter,
			});
			const priceValues = prices
				.map((r) => r.price)
				.filter((p): p is number => typeof p === "number");

			const statuses = Array.from(
				new Set(
					statusRows
						.map((row) => String(row.status ?? "").trim())
						.filter(Boolean)
				)
			).sort((a, b) => a.localeCompare(b));

			return Response.json({
				statuses,
				priceRange: {
					min: priceValues.length ? Math.min(...priceValues) : null,
					max: priceValues.length ? Math.max(...priceValues) : null,
				},
			});
		}

		const skip = hasPaginationParams && limit > 0 ? (page - 1) * limit : 0;
		const take = hasPaginationParams && limit > 0 ? limit : undefined;

		const [categories, total] = await Promise.all([
			rawFindCollection({
				collection: "PoojaCategory",
				filter: mongoFilter,
				sort: { createdAt: -1 },
				skip,
				limit: take,
			}),
			rawCountCollection("PoojaCategory", mongoFilter),
		]);

		return Response.json({
			categories: categories.map((cat) =>
				formatPoojaCategoryResponse(cat, locale)
			),
			total,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(total / limit) || 1,
				limit,
			},
		});
	} catch (error) {
		console.error("Error fetching pooja categories:", error);
		return Response.json(
			{
				message: "Failed to fetch pooja categories",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

// POST /api/pooja-categories
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { date, price, images, videos, status } = body;

		const { translations, translationStatus } = prepareTranslationsForSave(
			"poojaCategory",
			body
		);

		const nameEn = getTranslation(
			{ translations } as Record<string, unknown>,
			"en",
			"name"
		);
		if (!nameEn || String(nameEn).trim().length < 2) {
			return Response.json(
				{ message: "Name is required and must be at least 2 characters" },
				{ status: 400 }
			);
		}

		const religiousCategories = normalizeReligiousCategories(
			body.religiousCategories
		);

		const created = await prisma.poojaCategory.create({
			data: {
				translations: translations as Prisma.InputJsonValue,
				translationStatus,
				date: date ? new Date(date) : undefined,
				price: price !== undefined && price !== "" ? Number(price) : undefined,
				images: images || [],
				videos: videos || [],
				status: status || "Inactive",
				religiousCategories,
			},
		});

		const locale = parseLangParam(body.locale) ?? "en";
		return Response.json(
			formatPoojaCategoryResponse(
				created as unknown as Record<string, unknown>,
				locale
			)
		);
	} catch {
		return Response.json(
			{ message: "Failed to create Pooja Category" },
			{ status: 500 }
		);
	}
}
