import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/categories
export async function GET() {
	try {
		const categories = await prisma.category.findMany({
			orderBy: { name: "asc" },
			select: { name: true },
		});
		return NextResponse.json(categories.map((c) => c.name));
	} catch {
		return NextResponse.json([], { status: 500 });
	}
}

// POST /api/categories
export async function POST(req: NextRequest) {
	try {
		const { name } = await req.json();
		if (!name || typeof name !== "string") {
			return NextResponse.json({ error: "Invalid name" }, { status: 400 });
		}
		await prisma.category.upsert({
			where: { name },
			update: {},
			create: { name },
		});
		const categories = await prisma.category.findMany({
			orderBy: { name: "asc" },
			select: { name: true },
		});
		return NextResponse.json(categories.map((c) => c.name));
	} catch {
		return NextResponse.json({ error: "Failed" }, { status: 500 });
	}
}

// DELETE /api/categories
export async function DELETE(req: NextRequest) {
	try {
		const { name } = await req.json();
		if (!name || typeof name !== "string") {
			return NextResponse.json({ error: "Invalid name" }, { status: 400 });
		}
		await prisma.category.deleteMany({ where: { name } });
		const categories = await prisma.category.findMany({
			orderBy: { name: "asc" },
			select: { name: true },
		});
		return NextResponse.json(categories.map((c) => c.name));
	} catch {
		return NextResponse.json({ error: "Failed" }, { status: 500 });
	}
}
