import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serializeDaily } from "@/lib/suvichar/serialize";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
	const { id } = await context.params;

	if (!id || id.length !== 24) {
		return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
	}

	try {
		const suvichar = await prisma.dailySuvichar.findUnique({
			where: { id },
			include: { suvicharText: true, frame: true },
		});

		if (!suvichar) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		if (suvichar.status !== "published") {
			return NextResponse.json({ error: "Not published" }, { status: 403 });
		}

		return NextResponse.json(serializeDaily(suvichar), {
			headers: { "Cache-Control": "public, max-age=3600" },
		});
	} catch (e) {
		console.error("[GET /api/suvichar/public/[id]]", e);
		return NextResponse.json({ error: "Failed" }, { status: 500 });
	}
}
