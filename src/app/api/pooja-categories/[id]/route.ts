import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parseLangParam, getTranslation } from "@/lib/content-lang";
import {
	formatPoojaCategoryResponse,
	prepareTranslationsForSave,
	rawFindById,
} from "@/lib/content-api";
import { normalizeReligiousCategories } from "@/lib/religious-categories";

// GET /api/pooja-categories/[id]
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];
		const locale = parseLangParam(req.nextUrl.searchParams.get("lang")) ?? "en";

		const pooja = await rawFindById("PoojaCategory", id);
		if (!pooja) {
			return Response.json(
				{ message: "Pooja Category not found" },
				{ status: 404 }
			);
		}
		return Response.json(formatPoojaCategoryResponse(pooja, locale));
	} catch {
		return Response.json(
			{ message: "Failed to fetch Pooja Category" },
			{ status: 500 }
		);
	}
}

// PUT /api/pooja-categories/[id]
export async function PUT(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		const body = await req.json();
		const { date, price, status, images, videos } = body;

		if (
			typeof status === "string" &&
			Object.keys(body).length === 1
		) {
			const updated = await prisma.poojaCategory.update({
				where: { id },
				data: { status },
			});
			return Response.json(
				formatPoojaCategoryResponse(
					updated as unknown as Record<string, unknown>,
					"en"
				)
			);
		}

		const existing = await prisma.poojaCategory.findUnique({ where: { id } });
		if (!existing) {
			return Response.json(
				{ message: "Pooja Category not found" },
				{ status: 404 }
			);
		}

		const { translations, translationStatus } = prepareTranslationsForSave(
			"poojaCategory",
			body,
			existing
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

		const religiousCategories =
			body.religiousCategories !== undefined
				? normalizeReligiousCategories(body.religiousCategories)
				: undefined;

		const updated = await prisma.poojaCategory.update({
			where: { id },
			data: {
				translations: translations as Prisma.InputJsonValue,
				translationStatus,
				date: date ? new Date(date) : undefined,
				price: price !== undefined && price !== "" ? Number(price) : undefined,
				images: images || [],
				videos: videos || [],
				...(status && { status }),
				...(religiousCategories !== undefined && { religiousCategories }),
			},
		});

		const locale = parseLangParam(body.locale) ?? "en";
		return Response.json(
			formatPoojaCategoryResponse(
				updated as unknown as Record<string, unknown>,
				locale
			)
		);
	} catch {
		return Response.json(
			{ message: "Failed to update Pooja Category" },
			{ status: 500 }
		);
	}
}

// DELETE /api/pooja-categories/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		await prisma.poojaCategory.delete({ where: { id } });
		return Response.json({ message: "Pooja Category deleted successfully" });
	} catch {
		return Response.json(
			{ message: "Failed to delete Pooja Category" },
			{ status: 500 }
		);
	}
}
