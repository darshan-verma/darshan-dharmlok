// ...existing code from pooja-category/route.ts...
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/pooja-categories?page=1&limit=12
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const page = parseInt(searchParams.get("page") || "1");
	const limit = parseInt(searchParams.get("limit") || "12");
	const skip = (page - 1) * limit;

	const [categories, total] = await Promise.all([
		prisma.poojaCategory.findMany({
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
		}),
		prisma.poojaCategory.count(),
	]);

	return Response.json({
		categories: categories.map((cat) => ({
			id: cat.id,
			name: cat.name,
			description: cat.description || "",
			date: cat.date ? cat.date.toISOString() : "",
			price: typeof cat.price === "number" ? cat.price : undefined,
			details: cat.details || "",
		})),
		total,
		pagination: { totalPages: Math.ceil(total / limit) },
	});
}

// POST /api/pooja-categories
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { name, description, date, price, details } = body;

		if (!name || typeof name !== "string" || name.trim().length < 2)
			return Response.json(
				{ message: "Name is required and must be at least 2 characters" },
				{ status: 400 }
			);

		const created = await prisma.poojaCategory.create({
			data: {
				name,
				description: description ?? "",
				date: date ? new Date(date) : undefined,
				price: price !== undefined && price !== "" ? Number(price) : undefined,
				details: details ?? "",
			},
		});

		return Response.json({
			id: created.id,
			name: created.name,
			description: created.description || "",
			date: created.date ? created.date.toISOString() : "",
			price: typeof created.price === "number" ? created.price : undefined,
			details: created.details || "",
		});
	} catch (e) {
		return Response.json(
			{ message: "Failed to create Pooja Category" },
			{ status: 500 }
		);
	}
}
