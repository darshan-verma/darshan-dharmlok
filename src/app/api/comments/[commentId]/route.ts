import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// DELETE: Delete a comment by id
export async function DELETE(
	_request: NextRequest,
	context: { params: Promise<{ commentId: string }> }
) {
	try {
		const { commentId } = await context.params;
		await prisma.comment.delete({ where: { id: commentId } });
		return NextResponse.json({ message: "Comment deleted" });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to delete comment",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}
