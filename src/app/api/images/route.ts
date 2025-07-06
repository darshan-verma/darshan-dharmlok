import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/images?userId=...
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");
	try {
		if (!userId) {
			return NextResponse.json({ error: "Missing userId" }, { status: 400 });
		}
		const images = await prisma.image.findMany({
			where: { userId: userId as string },
			orderBy: { createdAt: "desc" },
		});
		return NextResponse.json({ images });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch images",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}

// POST /api/images
export async function POST(request: Request) {
	try {
		const data = await request.json();
		const { url, title, description, userId } = data;
		if (!userId || !url) {
			return NextResponse.json(
				{ error: "Missing userId or url" },
				{ status: 400 }
			);
		}
		const image = await prisma.image.create({
			data: {
				url,
				title,
				description,
				userId: userId as string,
			},
		});
		return NextResponse.json(image);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to create image",
				details: error instanceof Error ? error.message : error,
			},
			{ status: 500 }
		);
	}
}
