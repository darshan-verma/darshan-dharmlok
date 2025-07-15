import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH /api/images/[id]
export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;
		const data = await request.json();
		const { title, description, url } = data;
		const image = await prisma.image.update({
			where: { id },
			data: {
				...(title !== undefined && { title }),
				...(description !== undefined && { description }),
				...(url !== undefined && { url }),
			},
		});
		return NextResponse.json(image);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to update image",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}

// DELETE /api/images/[id]
export async function DELETE(
	_request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;
		await prisma.image.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to delete image",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}
