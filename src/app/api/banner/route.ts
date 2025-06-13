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
	createdAt?: string;
	updatedAt?: string;
}

// GET /api/banner
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
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

		const content: Banner[] = banners.map((b) => ({
			id: b.id,
			title: b.title,
			date: b.date instanceof Date ? b.date.toISOString().slice(0, 10) : b.date,
			description: b.description,
			category: b.category,
			type: b.type,
			status: b.status,
			imageUrl: b.imageUrl ?? "",
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
		const { title, date, description, category, type, status, imageUrl } =
			body as {
				title: string;
				date: string;
				description: string;
				category: string;
				type: string;
				status: string;
				imageUrl?: string;
			};

		if (!title || !date || !description || !category || !type || !status) {
			return NextResponse.json(
				{
					error:
						"Title, date, description, category, type, and status are required",
				},
				{ status: 400 }
			);
		}

		// Handle imageUrl: if empty string or undefined, store as empty string
		const normalizedImageUrl =
			typeof imageUrl === "string" && imageUrl.trim() === ""
				? ""
				: imageUrl ?? "";

		const newBanner = await prisma.banner.create({
			data: {
				title,
				date: new Date(date),
				description,
				category,
				type,
				status,
				imageUrl: normalizedImageUrl,
			},
		});

		const result: Banner = {
			id: newBanner.id,
			title: newBanner.title,
			date:
				newBanner.date instanceof Date
					? newBanner.date.toISOString().slice(0, 10)
					: newBanner.date,
			description: newBanner.description,
			category: newBanner.category,
			type: newBanner.type,
			status: newBanner.status,
			imageUrl: newBanner.imageUrl ?? "",
			createdAt: newBanner.createdAt?.toISOString?.() ?? "",
			updatedAt: newBanner.updatedAt?.toISOString?.() ?? "",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating banner:", error);
		return NextResponse.json(
			{ error: "Failed to create banner" },
			{ status: 500 }
		);
	}
}
