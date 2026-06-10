import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseLangParam } from "@/lib/content-lang";
import {
	formatDharamshalaResponse,
	normalizeArrayInput,
	prepareTranslationsForSave,
	rawFindById,
} from "@/lib/content-api";
import { normalizeReligiousCategories } from "@/lib/religious-categories";
import { flattenDharamshalaWithFaqs } from "@/lib/localize-document";

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		const locale = parseLangParam(req.nextUrl.searchParams.get("lang")) ?? "en";

		const dharamshala = await rawFindById("Dharamshala", id);
		if (!dharamshala)
			return NextResponse.json({ error: "Not found" }, { status: 404 });

		const dharamshalaFaqs = await prisma.dharamshalaFaq.findMany({
			where: { dharamshalaId: id },
		});

		return NextResponse.json(
			formatDharamshalaResponse(
				flattenDharamshalaWithFaqs(
					{
						...dharamshala,
						dharamshalaFaqs: dharamshalaFaqs as unknown as Record<
							string,
							unknown
						>[],
					},
					locale
				),
				locale
			)
		);
	} catch (error) {
		console.error(`[GET /api/dharamshala/${id}] Error:`, error);
		return NextResponse.json(
			{ error: "Failed to fetch dharamshala" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		const body = await req.json();

		if (body.status && Object.keys(body).length === 1) {
			const updated = await prisma.dharamshala.update({
				where: { id },
				data: { status: body.status },
			});
			return NextResponse.json(updated);
		}

		const existing = await prisma.dharamshala.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const { translations, translationStatus } = prepareTranslationsForSave(
			"dharamshala",
			body,
			existing
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

		await prisma.dharamshalaFaq.deleteMany({ where: { dharamshalaId: id } });

		const dharamshalaFaqs = body.dharamshalaFaqs as
			| { question: string; answer: string; translations?: unknown }[]
			| undefined;

		const faqsData =
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
					dharamshalaId: id,
				};
			}) ?? [];

		await prisma.dharamshala.update({
			where: { id },
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
				...(body.religiousCategories !== undefined
					? {
							religiousCategories: normalizeReligiousCategories(
								body.religiousCategories
							),
						}
					: {}),
			},
		});

		if (faqsData.length > 0) {
			await prisma.dharamshalaFaq.createMany({ data: faqsData });
		}

		const updated = await prisma.dharamshala.findUnique({
			where: { id },
			include: { dharamshalaFaqs: true },
		});

		if (!updated) {
			throw new Error("Failed to retrieve updated dharamshala.");
		}

		const locale = parseLangParam(body.locale as string) ?? "en";
		return NextResponse.json(
			formatDharamshalaResponse(
				flattenDharamshalaWithFaqs(
					updated as unknown as Record<string, unknown> & {
						dharamshalaFaqs?: Record<string, unknown>[];
					},
					locale
				),
				locale
			)
		);
	} catch (error) {
		console.error(`[PUT /api/dharamshala/${id}] Error:`, error);
		return NextResponse.json(
			{ error: "Failed to update dharamshala" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		await prisma.dharamshalaFaq.deleteMany({ where: { dharamshalaId: id } });
		await prisma.dharamshala.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(`[DELETE /api/dharamshala/${id}] Error:`, error);
		return NextResponse.json(
			{ error: "Failed to delete dharamshala" },
			{ status: 500 }
		);
	}
}
