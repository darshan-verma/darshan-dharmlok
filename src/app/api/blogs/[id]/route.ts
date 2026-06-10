import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseLangParam, getTranslation } from "@/lib/content-lang";
import {
	formatBlogResponse,
	prepareTranslationsForSave,
	rawFindById,
} from "@/lib/content-api";
import { normalizeReligiousCategories } from "@/lib/religious-categories";

function getBlogIdFromRequest(req: NextRequest): string | null {
	const url = new URL(req.url);
	const pathnameParts = url.pathname.split("/");
	const id = pathnameParts[pathnameParts.length - 1];
	return id && /^[0-9a-fA-F]{24}$/.test(id) ? id : null;
}

export async function GET(req: NextRequest) {
	try {
		const id = getBlogIdFromRequest(req);
		if (!id) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const locale = parseLangParam(new URL(req.url).searchParams.get("lang")) ?? "en";
		const blog = await rawFindById("Blog", id);
		if (!blog) {
			return NextResponse.json({ error: "Blog not found" }, { status: 404 });
		}
		return NextResponse.json(formatBlogResponse(blog, locale));
	} catch (error) {
		console.error("Error fetching blog:", error);
		return NextResponse.json(
			{ error: "Failed to fetch blog" },
			{ status: 500 }
		);
	}
}

export async function PUT(req: NextRequest) {
	try {
		const id = getBlogIdFromRequest(req);
		if (!id) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		const existing = await prisma.blog.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json({ error: "Blog not found" }, { status: 404 });
		}

		const body = await req.json();
		const { translations, translationStatus } = prepareTranslationsForSave(
			"blog",
			body,
			existing
		);

		const title = getTranslation(
			{ translations } as Record<string, unknown>,
			"en",
			"title"
		);
		const content = getTranslation(
			{ translations } as Record<string, unknown>,
			"en",
			"content"
		);

		if (!title || !content) {
			return NextResponse.json(
				{ error: "Title and content are required" },
				{ status: 400 }
			);
		}

		const updatedBlog = await prisma.blog.update({
			where: { id },
			data: {
				translations: translations as object,
				translationStatus,
				...(body.coverImage !== undefined
					? {
							coverImage:
								body.coverImage === "" || body.coverImage === null
									? null
									: body.coverImage,
						}
					: {}),
				...(body.bannerImage !== undefined
					? {
							bannerImage:
								body.bannerImage === "" || body.bannerImage === null
									? null
									: body.bannerImage,
						}
					: {}),
				...(body.status !== undefined ? { status: body.status } : {}),
				...(body.religiousCategories !== undefined
					? {
							religiousCategories: normalizeReligiousCategories(
								body.religiousCategories
							),
						}
					: {}),
			},
		});

		const locale = parseLangParam(body.locale) ?? "en";
		return NextResponse.json(
			formatBlogResponse(
				updatedBlog as unknown as Record<string, unknown>,
				locale
			)
		);
	} catch (error) {
		console.error("Error updating blog:", error);
		return NextResponse.json(
			{ error: "Failed to update blog" },
			{ status: 500 }
		);
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const id = getBlogIdFromRequest(req);
		if (!id) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		await prisma.blog.delete({ where: { id } });
		return NextResponse.json({ success: true, message: "Blog deleted" });
	} catch (error) {
		console.error("Error deleting blog:", error);
		return NextResponse.json(
			{ error: "Failed to delete blog" },
			{ status: 500 }
		);
	}
}
