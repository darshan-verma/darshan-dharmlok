import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIstDateString } from "@/lib/suvichar/dates";
import { serializeToday } from "@/lib/suvichar/serialize";

export const revalidate = 86400;

const includeRelations = {
	suvicharText: true,
	frame: true,
} as const;

export async function GET() {
	try {
		const today = getIstDateString();

		const row = await prisma.dailySuvichar.findFirst({
			where: {
				scheduledDate: today,
				status: { in: ["published", "scheduled"] },
				suvicharText: { status: "active" },
				frame: { status: "active" },
			},
			include: includeRelations,
		});

		if (!row) {
			return NextResponse.json(
				{ data: null, error: `No suvichar scheduled for today (${today})` },
				{ status: 404 },
			);
		}

		return NextResponse.json(serializeToday(row));
	} catch (error) {
		console.error("[GET /api/suvichar/today]", error);
		return NextResponse.json(
			{ error: "Failed to fetch today's suvichar" },
			{ status: 500 },
		);
	}
}
