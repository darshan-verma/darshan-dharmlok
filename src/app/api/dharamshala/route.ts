import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseLangParam } from "@/lib/content-lang";
import {
	findDharamshalasWithOptionalSearch,
	formatDharamshalaResponse,
	normalizeArrayInput,
	prepareTranslationsForSave,
} from "@/lib/content-api";
import { flattenDharamshalaWithFaqs } from "@/lib/localize-document";

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
			const { rows } = await findDharamshalasWithOptionalSearch({
				status: statusParam,
				state: stateParam,
				city: cityParam,
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
						.filter((s): s is string => Boolean(s))
				)
			).sort((a, b) => a.localeCompare(b));

			const cities = Array.from(
				new Set(
					normalizedLocations
						.map((row) => row.city)
						.filter((c): c is string => Boolean(c))
				)
			).sort((a, b) => a.localeCompare(b));

			return NextResponse.json({ states, cities, locations: normalizedLocations });
		}

		const skip =
			hasPaginationParams && limit > 0 ? (page - 1) * limit : undefined;
		const take = hasPaginationParams && limit > 0 ? limit : undefined;

		const { rows, total } = await findDharamshalasWithOptionalSearch({
			search: searchParam,
			state: stateParam,
			city: cityParam,
			status: statusParam,
			skip,
			limit: take,
		});

		const result = rows.map((row) =>
			formatDharamshalaResponse(
				flattenDharamshalaWithFaqs(
					row as Record<string, unknown> & {
						dharamshalaFaqs?: Record<string, unknown>[];
					},
					locale
				),
				locale
			)
		);

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
		console.error("[GET /api/dharamshala] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch dharamshalas" },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { translations, translationStatus } = prepareTranslationsForSave(
			"dharamshala",
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

		const dharamshalaFaqs = body.dharamshalaFaqs as
			| { question: string; answer: string; translations?: unknown }[]
			| undefined;

		const dharamshala = await prisma.dharamshala.create({
			data: {
				translations: translations as object,
				translationStatus,
				date: new Date(date),
				state,
				city,
				status,
				imageFile: normalizeArrayInput(body.imageFile),
				videoFile: normalizeArrayInput(body.videoFile),
				bannerImage: body.bannerImage,
				coverImage: body.coverImage,
				dharamshalaFaqs: {
					create:
						dharamshalaFaqs?.map((faq) => {
							const faqTrans = faq.translations
								? prepareTranslationsForSave("dharamshalaFaq", {
										translations: faq.translations,
									})
								: prepareTranslationsForSave("dharamshalaFaq", {
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
			include: { dharamshalaFaqs: true },
		});

		return NextResponse.json(
			formatDharamshalaResponse(
				flattenDharamshalaWithFaqs(
					dharamshala as unknown as Record<string, unknown> & {
						dharamshalaFaqs?: Record<string, unknown>[];
					},
					"en"
				),
				"en"
			)
		);
	} catch (error) {
		console.error("[POST /api/dharamshala] Error:", error);
		return NextResponse.json(
			{ error: "Failed to create dharamshala" },
			{ status: 500 }
		);
	}
}
