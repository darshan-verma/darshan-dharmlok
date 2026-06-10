import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseLangParam } from "@/lib/content-lang";
import {
	findBlogs,
	formatBlogResponse,
	prepareTranslationsForSave,
} from "@/lib/content-api";
import { getTranslation } from "@/lib/content-lang";
import { normalizeReligiousCategories } from "@/lib/religious-categories";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const locale = parseLangParam(searchParams.get("lang")) ?? "en";
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "50", 10);
		const religiousCategory = searchParams.get("religiousCategory");
		const search = searchParams.get("search")?.trim();
		const skip = (page - 1) * limit;

		const { rows: blogs, total } = await findBlogs({
			skip,
			limit,
			religiousCategory: religiousCategory ?? undefined,
			search: search || undefined,
		});

		const content = blogs.map((b) => formatBlogResponse(b, locale));

		return NextResponse.json({
			content,
			total,
			pagination: {
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching blogs:", error);
		return NextResponse.json(
			{ error: "Failed to fetch blogs" },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { translations, translationStatus } = prepareTranslationsForSave(
			"blog",
			body
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

		if (!title || !content || !body.status) {
			return NextResponse.json(
				{ error: "Title, content, and status are required" },
				{ status: 400 }
			);
		}

		const religiousCategories = normalizeReligiousCategories(
			body.religiousCategories
		);

		const newBlog = await prisma.blog.create({
			data: {
				translations: translations as object,
				translationStatus,
				coverImage: body.coverImage || null,
				bannerImage: body.bannerImage || null,
				status: body.status,
				religiousCategories,
			},
		});

		return NextResponse.json(
			formatBlogResponse(newBlog as unknown as Record<string, unknown>, "en")
		);
	} catch (error) {
		console.error("Error creating blog:", error);
		return NextResponse.json(
			{ error: "Failed to create blog" },
			{ status: 500 }
		);
	}
}
