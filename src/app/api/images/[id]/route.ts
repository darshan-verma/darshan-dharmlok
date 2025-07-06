import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH /api/images/[id]
export async function PATCH(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const data = await request.json();
		const { title, description, url } = data;
		const image = await prisma.image.update({
			where: { id: params.id },
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
	_: Request,
	{ params }: { params: { id: string } }
) {
	try {
		await prisma.image.delete({ where: { id: params.id } });
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
