import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseLangParam } from "@/lib/content-lang";
import {
	formatTempleResponse,
	prepareTranslationsForSave,
	rawFindById,
} from "@/lib/content-api";
import { flattenTempleWithFaqs } from "@/lib/localize-document";

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		const locale = parseLangParam(req.nextUrl.searchParams.get("lang")) ?? "en";

		const temple = await rawFindById("Temple", id);
		if (!temple)
			return NextResponse.json({ error: "Not found" }, { status: 404 });

		const templeFaq = await prisma.templeFaq.findMany({
			where: { templeId: id },
		});

		return NextResponse.json(
			formatTempleResponse(
				flattenTempleWithFaqs(
					{
						...temple,
						templeFaq: templeFaq as unknown as Record<string, unknown>[],
					},
					locale
				),
				locale
			)
		);
	} catch (error) {
		console.error(`[GET /api/temple/${id}] Error:`, error);
		return NextResponse.json(
			{ error: "Failed to fetch temple" },
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
			const updated = await prisma.temple.update({
				where: { id },
				data: { status: body.status },
			});
			return NextResponse.json(updated);
		}

		const existing = await prisma.temple.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const { translations, translationStatus } = prepareTranslationsForSave(
			"temple",
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

		const stringify = (v: unknown) =>
			v == null ? "[]" : typeof v === "string" ? v : JSON.stringify(v);

		await prisma.templeFaq.deleteMany({ where: { templeId: id } });

		const templeFaqInput = body.templeFaq as
			| { question: string; answer: string; translations?: unknown }[]
			| undefined;

		const faqsData =
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
					templeId: id,
				};
			}) ?? [];

		await prisma.temple.update({
			where: { id },
			data: {
				translations: translations as object,
				translationStatus,
				date: new Date(date),
				state,
				city,
				status,
				imageFile: stringify(body.imageFile),
				videoFile: stringify(body.videoFile),
				bannerImage: body.bannerImage,
				coverImage: body.coverImage,
			},
		});

		if (faqsData.length > 0) {
			await prisma.templeFaq.createMany({ data: faqsData });
		}

		const updatedTempleWithFaqs = await prisma.temple.findUnique({
			where: { id },
			include: { templeFaq: true },
		});

		if (!updatedTempleWithFaqs) {
			throw new Error("Failed to retrieve updated temple with FAQs.");
		}

		const locale = parseLangParam(body.locale as string) ?? "en";
		return NextResponse.json(
			formatTempleResponse(
				flattenTempleWithFaqs(
					updatedTempleWithFaqs as unknown as Record<string, unknown> & {
						templeFaq?: Record<string, unknown>[];
					},
					locale
				),
				locale
			)
		);
	} catch (error) {
		console.error(`[PUT /api/temple/${id}] Error:`, error);
		return NextResponse.json(
			{ error: "Failed to update temple" },
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
		await prisma.templeFaq.deleteMany({ where: { templeId: id } });
		await prisma.temple.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(`[DELETE /api/temple/${id}] Error:`, error);
		return NextResponse.json(
			{ error: "Failed to delete temple" },
			{ status: 500 }
		);
	}
}
