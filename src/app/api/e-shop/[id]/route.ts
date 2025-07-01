import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Product type for API
interface ProductApi {
	id: string;
	name: string;
	date: string;
	category: string[]; // changed from string to string[]
	pricePerUnit: number;
	availableQty: number;
	description?: string;
	images: string[];
	videos: string[];
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

// Helper to parse array fields (for MongoDB/Prisma string[] or JSON)
function parseArrayField(field: unknown): string[] {
	if (!field) return [];
	if (Array.isArray(field)) return field as string[];
	if (typeof field === "string") {
		try {
			const parsed = JSON.parse(field);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}

// GET /api/e-shop/[id]
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		const product = await prisma.product.findUnique({ where: { id } });
		if (!product)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		const result: ProductApi = {
			id: product.id,
			name: product.name,
			date:
				product.date instanceof Date
					? product.date.toISOString().split("T")[0]
					: String(product.date),
			category: Array.isArray(product.category)
				? product.category
				: typeof product.category === "string"
				? [product.category]
				: [],
			pricePerUnit: Number(product.pricePerUnit),
			availableQty: Number(product.availableQty),
			description: product.description || "",
			images: parseArrayField(product.images),
			videos: parseArrayField(product.videos),
			status: product.status,
			createdAt: product.createdAt?.toISOString(),
			updatedAt: product.updatedAt?.toISOString(),
		};
		return NextResponse.json(result);
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch product" },
			{ status: 500 }
		);
	}
}

// PUT /api/e-shop/[id]
export async function PUT(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		const body = await req.json();
		const {
			name,
			date,
			category,
			pricePerUnit,
			availableQty,
			description,
			images,
			videos,
			status,
		} = body as Partial<ProductApi>;

		// Allow status-only update for quick status change
		if (status && Object.keys(body).length === 1) {
			const updated = await prisma.product.update({
				where: { id },
				data: { status },
			});
			return NextResponse.json({
				id: updated.id,
				status: updated.status,
			});
		}

		if (
			!name ||
			!date ||
			!category ||
			!Array.isArray(category) ||
			category.length !== 1 ||
			pricePerUnit === undefined ||
			availableQty === undefined ||
			!status
		) {
			return NextResponse.json(
				{ error: "Missing required fields or invalid category count" },
				{ status: 400 }
			);
		}

		const updated = await prisma.product.update({
			where: { id },
			data: {
				name,
				date: new Date(date),
				category: category,
				pricePerUnit: Number(pricePerUnit),
				availableQty: Number(availableQty),
				description: description || "",
				images: Array.isArray(images) ? images : [],
				videos: Array.isArray(videos) ? videos : [],
				status,
			},
		});
		const result: ProductApi = {
			id: updated.id,
			name: updated.name,
			date:
				updated.date instanceof Date
					? updated.date.toISOString().split("T")[0]
					: String(updated.date),
			category: Array.isArray(updated.category)
				? updated.category
				: typeof updated.category === "string"
				? [updated.category]
				: [],
			pricePerUnit: Number(updated.pricePerUnit),
			availableQty: Number(updated.availableQty),
			description: updated.description || "",
			images: parseArrayField(updated.images),
			videos: parseArrayField(updated.videos),
			status: updated.status,
			createdAt: updated.createdAt?.toISOString(),
			updatedAt: updated.updatedAt?.toISOString(),
		};
		return NextResponse.json(result);
	} catch {
		return NextResponse.json(
			{ error: "Failed to update product" },
			{ status: 500 }
		);
	}
}

// DELETE /api/e-shop/[id]
export async function DELETE(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const pathnameParts = url.pathname.split("/");
		const id = pathnameParts[pathnameParts.length - 1];

		await prisma.product.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Failed to delete product" },
			{ status: 500 }
		);
	}
}
