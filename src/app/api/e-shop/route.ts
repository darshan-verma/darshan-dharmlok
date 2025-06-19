import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Product type for API
interface ProductApi {
	id: string;
	name: string;
	date: string;
	category: string[];
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

// GET /api/e-shop
export async function GET(_req: NextRequest) {
	try {
		const products = await prisma.product.findMany({
			orderBy: { createdAt: "desc" },
		});
		const result: ProductApi[] = products.map((product) => ({
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
				: [], // fallback for old data
			pricePerUnit: Number(product.pricePerUnit),
			availableQty: Number(product.availableQty),
			description: product.description || "",
			images: parseArrayField(product.images),
			videos: parseArrayField(product.videos),
			status: product.status,
			createdAt: product.createdAt?.toISOString(),
			updatedAt: product.updatedAt?.toISOString(),
		}));
		return NextResponse.json(result);
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch products" },
			{ status: 500 }
		);
	}
}

// POST /api/e-shop
export async function POST(req: NextRequest) {
	try {
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
		} = body as Omit<ProductApi, "id" | "createdAt" | "updatedAt">;

		if (
			!name ||
			!date ||
			!category ||
			!Array.isArray(category) ||
			category.length !== 1 || // Changed: must be exactly one category
			pricePerUnit === undefined ||
			availableQty === undefined ||
			!status
		) {
			return NextResponse.json(
				{ error: "Missing required fields or invalid category count" },
				{ status: 400 }
			);
		}

		const product = await prisma.product.create({
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
			id: product.id,
			name: product.name,
			date:
				product.date instanceof Date
					? product.date.toISOString().split("T")[0]
					: String(product.date),
			category: product.category, // use directly, no parseArrayField
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
			{ error: "Failed to create product" },
			{ status: 500 }
		);
	}
}
