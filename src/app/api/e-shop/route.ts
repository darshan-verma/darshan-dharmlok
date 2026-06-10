import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { Prisma } from "@prisma/client";
import {
	applyReligiousCategoryFilter,
	mapWithReligiousCategories,
	normalizeReligiousCategories,
} from "@/lib/religious-categories";

// Product type for API
interface ProductApi {
	id: string;
	name: string;
	date: string;
	category: string[];
	religiousCategories?: string[];
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

const mapProductToApi = (product: {
	id: string;
	name: string;
	date: Date;
	category: string[];
	religiousCategories: string[];
	pricePerUnit: number;
	availableQty: number;
	description: string | null;
	images: string[];
	videos: string[];
	status: string;
	createdAt: Date;
	updatedAt: Date;
}): ProductApi => {
	const withReligious = mapWithReligiousCategories({
		category: null,
		religiousCategories: product.religiousCategories,
	});
	return {
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
	religiousCategories: withReligious.religiousCategories,
	pricePerUnit: Number(product.pricePerUnit),
	availableQty: Number(product.availableQty),
	description: product.description || "",
	images: parseArrayField(product.images),
	videos: parseArrayField(product.videos),
	status: product.status,
	createdAt: product.createdAt?.toISOString(),
	updatedAt: product.updatedAt?.toISOString(),
};
};

// GET /api/e-shop
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const mine = url.searchParams.get("mine");
		const pageParam = url.searchParams.get("page");
		const limitParam = url.searchParams.get("limit");
		const searchParam = url.searchParams.get("search")?.trim();
		const categoryParam = url.searchParams.get("category")?.trim();
		const religiousCategoryParam = url.searchParams.get("religiousCategory");
		const statusParam = url.searchParams.get("status")?.trim();
		const filtersOnly = url.searchParams.get("filtersOnly") === "true";

		const parsedPage = Number(pageParam ?? "1");
		const parsedLimit = Number(limitParam ?? "0");
		const hasPaginationParams = pageParam !== null || limitParam !== null;

		const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
		const limit =
			Number.isFinite(parsedLimit) && parsedLimit > 0
				? Math.min(parsedLimit, 100)
				: 0;

		let where: Prisma.ProductWhereInput = {};
		const andConditions: Prisma.ProductWhereInput[] = [];

		if (mine === "true") {
			const token = await getToken({ req });
			const userId = token?.sub;
			if (!userId) {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
			andConditions.push({ sellerId: userId });
		}

		if (statusParam) {
			andConditions.push({
				status: {
					equals: statusParam,
					mode: "insensitive",
				},
			});
		}

		if (categoryParam) {
			andConditions.push({
				category: {
					has: categoryParam,
				},
			});
		}

		if (searchParam) {
			andConditions.push({
				OR: [
					{ name: { contains: searchParam, mode: "insensitive" } },
					{ description: { contains: searchParam, mode: "insensitive" } },
				],
			});
		}

		if (andConditions.length > 0) {
			where.AND = andConditions;
		}

		where = applyReligiousCategoryFilter(where, religiousCategoryParam);

		if (filtersOnly) {
			const productsForFilters = await prisma.product.findMany({
				where,
				select: {
					category: true,
				},
			});

			const categories = Array.from(
				new Set(
					productsForFilters
						.flatMap((product) =>
							Array.isArray(product.category) ? product.category : []
						)
						.map((category) => category?.trim())
						.filter((category): category is string => Boolean(category))
				)
			).sort((a, b) => a.localeCompare(b));

			return NextResponse.json({ categories });
		}

		const queryOptions: {
			where: Prisma.ProductWhereInput;
			orderBy: { createdAt: "desc" };
			skip?: number;
			take?: number;
		} = {
			where,
			orderBy: { createdAt: "desc" },
		};

		if (hasPaginationParams && limit > 0) {
			queryOptions.skip = (page - 1) * limit;
			queryOptions.take = limit;
		}

		const products = await prisma.product.findMany(queryOptions);
		const result: ProductApi[] = products.map(mapProductToApi);

		if (hasPaginationParams && limit > 0) {
			const total = await prisma.product.count({ where });
			const totalPages = Math.ceil(total / limit);
			return NextResponse.json({
				content: result,
				total,
				pagination: {
					currentPage: page,
					totalPages,
					limit,
				},
			});
		}

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
		const token = await getToken({ req });
		const userId = token?.sub;
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
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
			category.length !== 1 || // must be exactly one category
			pricePerUnit === undefined ||
			availableQty === undefined ||
			!status
		) {
			return NextResponse.json(
				{ error: "Missing required fields or invalid category count" },
				{ status: 400 }
			);
		}

		const religiousCategories = normalizeReligiousCategories(
			body.religiousCategories
		);

		const product = await prisma.product.create({
			data: {
				name,
				date: new Date(date),
				category: category,
				religiousCategories,
				pricePerUnit: Number(pricePerUnit),
				availableQty: Number(availableQty),
				description: description || "",
				images: Array.isArray(images) ? images : [],
				videos: Array.isArray(videos) ? videos : [],
				status,
				sellerId: userId,
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
