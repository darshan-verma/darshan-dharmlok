import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface Blog {
	id: string;
	title: string;
	content: string;
	coverImage?: string;
	bannerImage?: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

// GET /api/blogs
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "50", 10);
		const skip = (page - 1) * limit;

		const [total, blogs] = await Promise.all([
			prisma.blog.count(),
			prisma.blog.findMany({
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
		]);

		const content: Blog[] = blogs.map((b) => ({
			id: b.id,
			title: b.title,
			content: b.content,
			coverImage: b.coverImage ?? "",
			bannerImage: b.bannerImage ?? "",
			status: b.status,
			createdAt: b.createdAt?.toISOString?.() ?? "",
			updatedAt: b.updatedAt?.toISOString?.() ?? "",
		}));

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

// POST /api/blogs
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { title, content, coverImage, bannerImage, status } = body as {
			title: string;
			content: string;
			coverImage?: string;
			bannerImage?: string;
			status: string;
		};

		if (!title || !content || !status) {
			return NextResponse.json(
				{
					error: "Title, content, and status are required",
				},
				{ status: 400 }
			);
		}

		const newBlog = await prisma.blog.create({
			data: {
				title,
				content,
				coverImage: coverImage || null,
				bannerImage: bannerImage || null,
				status,
			},
		});

		const result: Blog = {
			id: newBlog.id,
			title: newBlog.title,
			content: newBlog.content,
			coverImage: newBlog.coverImage ?? "",
			bannerImage: newBlog.bannerImage ?? "",
			status: newBlog.status,
			createdAt: newBlog.createdAt?.toISOString?.() ?? "",
			updatedAt: newBlog.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating blog:", error);
		return NextResponse.json(
			{ error: "Failed to create blog" },
			{ status: 500 }
		);
	}
}
