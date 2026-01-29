import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface Banner {
	id: string;
	title: string;
	date: string;
	description: string;
	category: string;
	type: string;
	status: string;
	imageUrl?: string;
	pageSlug?: string;
	createdAt?: string;
	updatedAt?: string;
}

function mapBannerToResponse(b: {
	id: string;
	title: string;
	date: Date | string;
	description: string;
	category: string;
	type: string;
	status: string;
	imageUrl: string | null;
	pageSlug: string | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}): Banner {
	return {
		id: b.id,
		title: b.title,
		date: b.date instanceof Date ? b.date.toISOString().slice(0, 10) : b.date,
		description: b.description,
		category: b.category,
		type: b.type,
		status: b.status,
		imageUrl: b.imageUrl ?? "",
		pageSlug: b.pageSlug ?? undefined,
		createdAt: b.createdAt?.toISOString?.() ?? "",
		updatedAt: b.updatedAt?.toISOString?.() ?? "",
	};
}

// GET /api/banner
// If pageSlug is provided: returns single active banner for that page (for frontend).
// Otherwise: returns paginated list (for admin).
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const pageSlug = searchParams.get("pageSlug");

		if (pageSlug) {
			const banner = await prisma.banner.findFirst({
				where: { pageSlug, status: "Active" },
				orderBy: { updatedAt: "desc" },
			});
			return NextResponse.json({ banner: banner ? mapBannerToResponse(banner) : null });
		}

		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "50", 10);
		const skip = (page - 1) * limit;

		const [total, banners] = await Promise.all([
			prisma.banner.count(),
			prisma.banner.findMany({
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
		]);

		const content: Banner[] = banners.map((b) => mapBannerToResponse(b));

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
		console.error("Error fetching banners:", error);
		return NextResponse.json(
			{ error: "Failed to fetch banners" },
			{ status: 500 }
		);
	}
}

// POST /api/banner
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { title, date, description, imageUrl, pageSlug } =
			body as {
				title: string;
				date: string;
				description: string;
				imageUrl?: string;
				pageSlug?: string | null;
			};

		if (!title?.trim() || !date?.trim() || !description?.trim()) {
			return NextResponse.json(
				{ error: "Title, date, and description are required" },
				{ status: 400 }
			);
		}

		if (!pageSlug || typeof pageSlug !== "string" || !pageSlug.trim()) {
			return NextResponse.json(
				{ error: "Page is required" },
				{ status: 400 }
			);
		}

		// Handle imageUrl: if empty string or undefined, store as empty string
		const normalizedImageUrl =
			typeof imageUrl === "string" && imageUrl.trim() === ""
				? ""
				: imageUrl ?? "";
		const normalizedPageSlug = pageSlug.trim();

		// Defaults for legacy DB fields (no longer in form)
		const category = "Other";
		const type = "Image";
		const status = "Active";

		const newBanner = await prisma.banner.create({
			data: {
				title: title.trim(),
				date: new Date(date),
				description: description.trim(),
				category,
				type,
				status,
				imageUrl: normalizedImageUrl,
				pageSlug: normalizedPageSlug,
			},
		});

		const result: Banner = mapBannerToResponse(newBanner);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating banner:", error);
		return NextResponse.json(
			{ error: "Failed to create banner" },
			{ status: 500 }
		);
	}
}
