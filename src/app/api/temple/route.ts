import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseLangParam } from "@/lib/content-lang";
import {
	findTemplesWithOptionalSearch,
	formatTempleResponse,
	prepareTranslationsForSave,
} from "@/lib/content-api";
import { flattenTempleWithFaqs } from "@/lib/localize-document";
import { normalizeReligiousCategories } from "@/lib/religious-categories";

export async function GET(req: NextRequest) {
	try {
		const searchParams = req.nextUrl.searchParams;
		const locale = parseLangParam(searchParams.get("lang")) ?? "en";
		const pageParam = searchParams.get("page");
		const limitParam = searchParams.get("limit");
		const searchParam = searchParams.get("search")?.trim();
		const stateParam = searchParams.get("state")?.trim();
		const cityParam = searchParams.get("city")?.trim();
		const statusParam = searchParams.get("status")?.trim();
		const religiousCategoryParam = searchParams.get("religiousCategory")?.trim();
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
			const { rows } = await findTemplesWithOptionalSearch({
				locale,
				status: statusParam,
				state: stateParam,
				city: cityParam,
				religiousCategory: religiousCategoryParam,
			});

			const normalizedLocations = rows
				.map((row) => ({
					state: String(row.state ?? "").trim(),
					city: String(row.city ?? "").trim(),
				}))
				.filter((row) => row.state || row.city);

			const states = Array.from(
				new Set(
					normalizedLocations
						.map((row) => row.state)
						.filter((state): state is string => Boolean(state))
				)
			).sort((a, b) => a.localeCompare(b));

			const cities = Array.from(
				new Set(
					normalizedLocations
						.map((row) => row.city)
						.filter((city): city is string => Boolean(city))
				)
			).sort((a, b) => a.localeCompare(b));

			return NextResponse.json({
				states,
				cities,
				locations: normalizedLocations,
			});
		}

		const skip =
			hasPaginationParams && limit > 0 ? (page - 1) * limit : undefined;
		const take = hasPaginationParams && limit > 0 ? limit : undefined;

		const { rows, total } = await findTemplesWithOptionalSearch({
			locale,
			search: searchParam,
			state: stateParam,
			city: cityParam,
			status: statusParam,
			religiousCategory: religiousCategoryParam,
			skip,
			limit: take,
		});

		const result = rows.map((row) => {
			const withFaqs = flattenTempleWithFaqs(
				row as Record<string, unknown> & { templeFaq?: Record<string, unknown>[] },
				locale
			);
			return formatTempleResponse(withFaqs, locale);
		});

		if (hasPaginationParams && limit > 0) {
			return NextResponse.json({
				content: result,
				total,
				pagination: {
					currentPage: page,
					totalPages: Math.ceil(total / limit),
					limit,
				},
			});
		}

		return NextResponse.json(result);
	} catch (error) {
		console.error("[GET /api/temple] Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ error: "Failed to fetch temples", details: errorMessage },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { translations, translationStatus } = prepareTranslationsForSave(
			"temple",
			body
		);

		const en = translations.en ?? {};
		const name = String(en.name ?? body.name ?? "");
		const { date, state, city, status } = body;

		if (!name || !date || !state || !city || !status) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const stringify = (v: unknown) =>
			v == null ? "[]" : typeof v === "string" ? v : JSON.stringify(v);

		const templeFaqInput = body.templeFaq as
			| { question: string; answer: string; translations?: unknown }[]
			| undefined;

		const religiousCategories = normalizeReligiousCategories(
			body.religiousCategories
		);

		const temple = await prisma.temple.create({
			data: {
				translations: translations as object,
				translationStatus,
				date: new Date(date),
				state,
				city,
				status,
				religiousCategories,
				imageFile: stringify(body.imageFile),
				videoFile: stringify(body.videoFile),
				bannerImage: body.bannerImage,
				coverImage: body.coverImage,
				templeFaq: {
					create:
						templeFaqInput?.map((faq) => {
							const faqTrans = faq.translations
								? prepareTranslationsForSave("templeFaq", {
										translations: faq.translations,
									})
								: prepareTranslationsForSave("templeFaq", {
										locale: "en",
										question: faq.question,
										answer: faq.answer,
									});
							return {
								translations: faqTrans.translations as object,
								translationStatus: faqTrans.translationStatus,
							};
						}) ?? [],
				},
			},
			include: { templeFaq: true },
		});

		return NextResponse.json(
			formatTempleResponse(
				flattenTempleWithFaqs(
					temple as unknown as Record<string, unknown> & {
						templeFaq?: Record<string, unknown>[];
					},
					"en"
				),
				"en"
			)
		);
	} catch (error) {
		console.error("[POST /api/temple] Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ error: "Failed to create temple", details: errorMessage },
			{ status: 500 }
		);
	}
}
