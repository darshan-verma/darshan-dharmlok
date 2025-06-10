import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Get a specific BalVidhya item by id
export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Validate MongoDB ObjectId format
		if (!/^[0-9a-fA-F]{24}$/.test(params.id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		const item = await prisma.balVidhya.findUnique({
			where: { id: params.id },
		});

		if (!item) {
			return NextResponse.json({ error: "Content not found" }, { status: 404 });
		}

		// Map to frontend expected format
		const mappedItem = {
			id: item.id,
			name: item.name,
			description: item.description,
			type: item.type,
			category: item.category,
			status: item.status,
			trending: item.trendingStatus,
			thumbnailUrl: item.thumbnailUrl,
			dateAdded: item.createdAt,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		};

		return NextResponse.json(mappedItem);
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
		// Validate MongoDB ObjectId format
		if (!/^[0-9a-fA-F]{24}$/.test(params.id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		const data = await req.json();

		// Prepare update data - only include fields that are being updated
		const updateData: any = {};

		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined)
			updateData.description = data.description;
		if (data.type !== undefined) updateData.type = data.type;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.status !== undefined) updateData.status = data.status;
		if (data.trending !== undefined) updateData.trending = data.trending;
		if (data.thumbnailUrl !== undefined)
			updateData.thumbnailUrl = data.thumbnailUrl;

		const updatedItem = await prisma.balVidhya.update({
			where: { id: params.id },
			data: updateData,
		});

		// Map to frontend expected format
		const mappedItem = {
			id: updatedItem.id,
			name: updatedItem.name,
			description: updatedItem.description,
			type: updatedItem.type,
			category: updatedItem.category,
			status: updatedItem.status,
			trending: updatedItem.trendingStatus,
			thumbnailUrl: updatedItem.thumbnailUrl,
			dateAdded: updatedItem.createdAt,
			createdAt: updatedItem.createdAt,
			updatedAt: updatedItem.updatedAt,
		};

		return NextResponse.json(mappedItem);
	} catch (error) {
		console.error("Error updating BalVidhya item:", error);

		if (error.code === "P2025") {
			return NextResponse.json({ error: "Content not found" }, { status: 404 });
		}

		return NextResponse.json(
			{ error: "Failed to update item." },
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
		// Validate MongoDB ObjectId format
		if (!/^[0-9a-fA-F]{24}$/.test(params.id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
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

		if (error.code === "P2025") {
			return NextResponse.json({ error: "Content not found" }, { status: 404 });
		}

		return NextResponse.json(
			{ error: "Failed to delete item." },
			{ status: 500 }
		);
	}
}
