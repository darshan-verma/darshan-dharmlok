import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
	BalVidhya,
	BalVidhyaTrendingStatus,
	BalVidhyaType,
	BalVidhyaCategory,
	BalVidhyaStatus,
} from "@prisma/client";

// Helper to map Prisma BalVidhya to frontend expected structure
const mapBalVidhyaForFrontend = (item: BalVidhya) => {
	return {
		...item,
		id: item.id,
		trending:
			item.trendingStatus === BalVidhyaTrendingStatus.Trending ||
			item.trendingStatus === BalVidhyaTrendingStatus.HighlyTrending ||
			item.trendingStatus === BalVidhyaTrendingStatus.Featured,
		dateAdded: item.createdAt, // Frontend uses dateAdded
		// Ensure all fields expected by frontend are present
		name: item.name,
		description: item.description ?? "",
		type: item.type,
		category: item.category ?? BalVidhyaCategory.Other,
		status: item.status,
		thumbnailUrl: item.thumbnailUrl ?? "",
		createdAt: item.createdAt,
		updatedAt: item.updatedAt,
	};
};

// GET: Get all BalVidhya items with pagination
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const page = parseInt(searchParams.get("page") || "1");
	const limit = parseInt(searchParams.get("limit") || "12");
	const skip = (page - 1) * limit;

	try {
		const items = await prisma.balVidhya.findMany({
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc", // Default sort order
			},
		});
		const totalItems = await prisma.balVidhya.count();
		const totalPages = Math.ceil(totalItems / limit);

		const mappedItems = items.map(mapBalVidhyaForFrontend);

		return NextResponse.json({
			content: mappedItems,
			total: totalItems, // Frontend expects 'total'
			pagination: {
				totalPages,
				currentPage: page,
				limit: limit,
			},
		});
	} catch (error) {
		console.error("Error fetching BalVidhya items:", error);
		return NextResponse.json(
			{ error: "Error fetching items" },
			{ status: 500 }
		);
	}
}

// POST: Create a new BalVidhya item
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		// Validate required fields (basic example)
		if (!body.name || !body.type || !body.category || !body.status) {
			return NextResponse.json(
				{ error: "Missing required fields: name, type, category, status" },
				{ status: 400 }
			);
		}

		// Map frontend 'trending' (boolean) to Prisma 'trendingStatus' (enum)
		let trendingStatus: BalVidhyaTrendingStatus =
			BalVidhyaTrendingStatus.NotTrending;
		if (typeof body.trending === "boolean") {
			trendingStatus = body.trending
				? BalVidhyaTrendingStatus.Trending
				: BalVidhyaTrendingStatus.NotTrending;
		}

		const newItemData = {
			name: body.name as string,
			description: body.description as string | undefined,
			type: body.type as BalVidhyaType,
			category: body.category as BalVidhyaCategory | undefined,
			status: body.status as BalVidhyaStatus,
			trendingStatus: trendingStatus,
			thumbnailUrl: body.thumbnailUrl as string | undefined,
			videoUrl: body.videoUrl as string | undefined,
			bookFile: body.bookFile as string | undefined,
			videoFile: body.videoFile as string | undefined,
			approved: true,
		};

		// Type check for enums before creation
		if (!Object.values(BalVidhyaType).includes(newItemData.type)) {
			return NextResponse.json(
				{ error: `Invalid type value: ${newItemData.type}` },
				{ status: 400 }
			);
		}
		if (
			newItemData.category &&
			!Object.values(BalVidhyaCategory).includes(newItemData.category)
		) {
			return NextResponse.json(
				{ error: `Invalid category value: ${newItemData.category}` },
				{ status: 400 }
			);
		}
		if (!Object.values(BalVidhyaStatus).includes(newItemData.status)) {
			return NextResponse.json(
				{ error: `Invalid status value: ${newItemData.status}` },
				{ status: 400 }
			);
		}

		const newItem = await prisma.balVidhya.create({
			data: newItemData,
		});

		return NextResponse.json(mapBalVidhyaForFrontend(newItem), { status: 201 });
	} catch (error: any) {
		console.error("Error creating BalVidhya item:", error);
		if (error.code === "P2002") {
			// Prisma unique constraint violation
			return NextResponse.json(
				{ error: "A record with this identifier already exists." },
				{ status: 409 }
			);
		}
		if (error.name === "PrismaClientValidationError") {
			return NextResponse.json(
				{
					error: "Invalid data provided. Please check field values.",
					details: error.message,
				},
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ error: "Error creating item", details: error.message },
			{ status: 500 }
		);
	}
}
