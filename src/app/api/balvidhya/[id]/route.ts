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

// GET: Get a specific BalVidhya item by id
export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		if (!params.id || !/^[0-9a-fA-F]{24}$/.test(params.id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const item = await prisma.balVidhya.findUnique({
			where: { id: params.id },
		});

		if (!item) {
			return NextResponse.json({ error: "Content not found" }, { status: 404 });
		}

		return NextResponse.json(mapBalVidhyaForFrontend(item));
	} catch (error) {
		console.error("Error fetching BalVidhya item:", error);
		return NextResponse.json(
			{ error: "Failed to fetch item." },
			{ status: 500 }
		);
	}
}

// PUT: Update a specific BalVidhya item
export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		if (!params.id || !/^[0-9a-fA-F]{24}$/.test(params.id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}
		const body = await req.json();
		const updateData: Partial<BalVidhya> = {};

		// Map fields from body to updateData, ensuring type safety and handling optionals
		if (body.name !== undefined) updateData.name = body.name;
		if (body.description !== undefined)
			updateData.description = body.description;
		if (body.type !== undefined) {
			if (!Object.values(BalVidhyaType).includes(body.type)) {
				return NextResponse.json(
					{ error: `Invalid type value: ${body.type}` },
					{ status: 400 }
				);
			}
			updateData.type = body.type;
		}
		if (body.category !== undefined) {
			if (!Object.values(BalVidhyaCategory).includes(body.category)) {
				return NextResponse.json(
					{ error: `Invalid category value: ${body.category}` },
					{ status: 400 }
				);
			}
			updateData.category = body.category;
		}
		if (body.status !== undefined) {
			if (!Object.values(BalVidhyaStatus).includes(body.status)) {
				return NextResponse.json(
					{ error: `Invalid status value: ${body.status}` },
					{ status: 400 }
				);
			}
			updateData.status = body.status;
		}
		if (body.thumbnailUrl !== undefined)
			updateData.thumbnailUrl =
				body.thumbnailUrl === "" ? null : body.thumbnailUrl;
		if (body.videoUrl !== undefined)
			updateData.videoUrl = body.videoUrl === "" ? null : body.videoUrl;
		if (body.bookFile !== undefined)
			updateData.bookFile = body.bookFile === "" ? null : body.bookFile;
		if (body.videoFile !== undefined)
			updateData.videoFile = body.videoFile === "" ? null : body.videoFile;

		// Map frontend 'trending' (boolean) to Prisma 'trendingStatus' (enum)
		if (typeof body.trending === "boolean") {
			updateData.trendingStatus = body.trending
				? BalVidhyaTrendingStatus.Trending
				: BalVidhyaTrendingStatus.NotTrending;
		}

		if (body.approved !== undefined && typeof body.approved === "boolean") {
			updateData.approved = body.approved;
		}

		if (Object.keys(updateData).length === 0) {
			return NextResponse.json(
				{ error: "No update data provided" },
				{ status: 400 }
			);
		}

		// Ensure item exists before update
		const existingItem = await prisma.balVidhya.findUnique({
			where: { id: params.id },
		});
		if (!existingItem) {
			return NextResponse.json({ error: "Content not found" }, { status: 404 });
		}

		const updatedItem = await prisma.balVidhya.update({
			where: { id: params.id },
			data: updateData,
		});

		return NextResponse.json(mapBalVidhyaForFrontend(updatedItem));
	} catch (error) {
		console.error("Error updating BalVidhya item:", error);
		// @ts-expect-error: error may not be typed
		if (error.name === "PrismaClientValidationError") {
			return NextResponse.json(
				{
					error: "Invalid data provided for update.",
					details: (error as Error).message,
				},
				{ status: 400 }
			);
		}
		// @ts-expect-error: error may not be typed
		if (error.code === "P2025") {
			// Record to update not found
			return NextResponse.json(
				{ error: "Content not found for update" },
				{ status: 404 }
			);
		}
		return NextResponse.json(
			{ error: "Failed to update item.", details: (error as Error).message },
			{ status: 500 }
		);
	}
}

// DELETE: Delete a specific BalVidhya item
export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		if (!params.id || !/^[0-9a-fA-F]{24}$/.test(params.id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		// Ensure item exists before delete
		const existingItem = await prisma.balVidhya.findUnique({
			where: { id: params.id },
		});
		if (!existingItem) {
			return NextResponse.json({ error: "Content not found" }, { status: 404 });
		}

		await prisma.balVidhya.delete({
			where: { id: params.id },
		});

		return NextResponse.json({
			success: true,
			message: "Content deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting BalVidhya item:", error);
		// @ts-expect-error: error may not be typed
		if (error.code === "P2025") {
			// Record to delete not found
			return NextResponse.json(
				{ error: "Content not found for deletion" },
				{ status: 404 }
			);
		}
		return NextResponse.json(
			{ error: "Failed to delete item.", details: (error as Error).message },
			{ status: 500 }
		);
	}
}
