import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: List all BalVidhya items with pagination
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "12");
		const skip = (page - 1) * limit;

		// Get total count for pagination
		const total = await prisma.balVidhya.count();

		// Get paginated items
		const items = await prisma.balVidhya.findMany({
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
		});

		// Map database fields to frontend expected format
		const mappedItems = items.map((item) => ({
			id: item.id,
			name: item.name,
			description: item.description,
			type: item.type,
			category: item.category,
			status: item.status,
			trending: item.trendingStatus,
			thumbnailUrl: item.thumbnailUrl,
			dateAdded: item.createdAt, // Use createdAt as dateAdded
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		}));

		// Return format expected by frontend
		return NextResponse.json({
			content: mappedItems,
			total,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(total / limit),
				itemsPerPage: limit,
			},
		});
	} catch (error) {
		console.error("Error fetching BalVidhya items:", error);
		return NextResponse.json(
			{ error: "Failed to fetch items." },
			{ status: 500 }
		);
	}
}

// POST: Create a new BalVidhya item
export async function POST(req: NextRequest) {
	try {
		const data = await req.json();

		// Prepare data for database
		const dbData = {
			name: data.name,
			description: data.description,
			type: data.type,
			category: data.category,
			status: data.status || "Active",
			trending: data.trending || false,
			thumbnailUrl: data.thumbnailUrl || null,
		};

		const newItem = await prisma.balVidhya.create({
			data: dbData,
		});

		// Return mapped format
		const mappedItem = {
			id: newItem.id,
			name: newItem.name,
			description: newItem.description,
			type: newItem.type,
			category: newItem.category,
			status: newItem.status,
			trending: newItem.trendingStatus,
			thumbnailUrl: newItem.thumbnailUrl,
			dateAdded: newItem.createdAt,
			createdAt: newItem.createdAt,
			updatedAt: newItem.updatedAt,
		};

		return NextResponse.json(mappedItem, { status: 201 });
	} catch (error) {
		console.error("Error creating BalVidhya item:", error);
		return NextResponse.json(
			{ error: "Failed to create item." },
			{ status: 500 }
		);
	}
}
