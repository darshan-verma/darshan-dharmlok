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

function getBlogIdFromRequest(req: NextRequest): string | null {
	const url = new URL(req.url);
	const pathnameParts = url.pathname.split("/");
	const id = pathnameParts[pathnameParts.length - 1];
	return id && /^[0-9a-fA-F]{24}$/.test(id) ? id : null;
}

// GET /api/blogs/[id]
export async function GET(req: NextRequest) {
	try {
		const id = getBlogIdFromRequest(req);
		if (!id) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const blog = await prisma.blog.findUnique({ where: { id } });
		if (!blog) {
			return NextResponse.json({ error: "Blog not found" }, { status: 404 });
		}
		const result: Blog = {
			id: blog.id,
			title: blog.title,
			content: blog.content,
			coverImage: blog.coverImage ?? "",
			bannerImage: blog.bannerImage ?? "",
			status: blog.status,
			createdAt: blog.createdAt?.toISOString?.() ?? "",
			updatedAt: blog.updatedAt?.toISOString?.() ?? "",
		};
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching blog:", error);
		return NextResponse.json(
			{ error: "Failed to fetch blog" },
			{ status: 500 }
		);
	}
}

// PUT /api/blogs/[id]
export async function PUT(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const body = await req.json();
		const { title, content, coverImage, bannerImage, status } = body as {
			title?: string;
			content?: string;
			coverImage?: string | null;
			bannerImage?: string | null;
			status?: string;
		};

		const updateData: {
			title?: string;
			content?: string;
			coverImage?: string | null;
			bannerImage?: string | null;
			status?: string;
		} = {};
		if (title !== undefined) updateData.title = title;
		if (content !== undefined) updateData.content = content;
		if (coverImage !== undefined) {
			updateData.coverImage =
				coverImage === "" || coverImage === null ? null : coverImage;
		}
		if (bannerImage !== undefined) {
			updateData.bannerImage =
				bannerImage === "" || bannerImage === null ? null : bannerImage;
		}
		if (status !== undefined) updateData.status = status;

		const updatedBlog = await prisma.blog.update({
			where: { id },
			data: updateData,
		});

		const result: Blog = {
			id: updatedBlog.id,
			title: updatedBlog.title,
			content: updatedBlog.content,
			coverImage: updatedBlog.coverImage ?? "",
			bannerImage: updatedBlog.bannerImage ?? "",
			status: updatedBlog.status,
			createdAt: updatedBlog.createdAt?.toISOString?.() ?? "",
			updatedAt: updatedBlog.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error updating blog:", error);
		return NextResponse.json(
			{ error: "Failed to update blog" },
			{ status: 500 }
		);
	}
}

// DELETE /api/blogs/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
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
