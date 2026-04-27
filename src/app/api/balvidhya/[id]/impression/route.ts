import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;

		if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		const updated = await prisma.balVidhya.update({
			where: { id },
			// The current generated Prisma type for BalVidhya may not include
			// impressions in this branch; cast keeps runtime intent unchanged.
			data: ({ impressions: { increment: 1 } } as unknown) as never,
		});

		return NextResponse.json({
			id: updated.id,
			impressions:
				typeof (updated as { impressions?: unknown }).impressions === "number"
					? (updated as { impressions?: number }).impressions
					: null,
		});
	} catch (error) {
		console.error("Error incrementing BalVidhya impression:", error);
		return NextResponse.json(
			{ error: "Failed to increment impression." },
			{ status: 500 }
		);
	}
}
