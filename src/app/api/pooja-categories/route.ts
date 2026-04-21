import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/pooja-categories?page=1&limit=12
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const pageParam = searchParams.get("page");
		const limitParam = searchParams.get("limit");
		const searchParam = searchParams.get("search")?.trim();
		const statusParam = searchParams.get("status")?.trim();
		const minPriceParam = Number(searchParams.get("minPrice"));
		const maxPriceParam = Number(searchParams.get("maxPrice"));
		const filtersOnly = searchParams.get("filtersOnly") === "true";

		const parsedPage = Number(pageParam ?? "1");
		const parsedLimit = Number(limitParam ?? "12");
		const hasPaginationParams = pageParam !== null || limitParam !== null;

		const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
		const limit =
			Number.isFinite(parsedLimit) && parsedLimit > 0
				? Math.min(parsedLimit, 100)
				: 12;

		const andConditions: Prisma.PoojaCategoryWhereInput[] = [];

		if (searchParam) {
			andConditions.push({
				OR: [
					{ name: { contains: searchParam, mode: "insensitive" } },
					{ description: { contains: searchParam, mode: "insensitive" } },
					{ details: { contains: searchParam, mode: "insensitive" } },
				],
			});
		}

		if (statusParam && statusParam.toLowerCase() !== "all") {
			andConditions.push({
				status: {
					equals: statusParam,
					mode: "insensitive",
				},
			});
		}

		if (Number.isFinite(minPriceParam)) {
			andConditions.push({
				price: {
					gte: minPriceParam,
				},
			});
		}

		if (Number.isFinite(maxPriceParam)) {
			andConditions.push({
				price: {
					lte: maxPriceParam,
				},
			});
		}

		const where: Prisma.PoojaCategoryWhereInput =
			andConditions.length > 0 ? { AND: andConditions } : {};

		if (filtersOnly) {
			const [statusRows, priceStats] = await Promise.all([
				prisma.poojaCategory.findMany({
					where,
					select: { status: true },
				}),
				prisma.poojaCategory.aggregate({
					where,
					_min: { price: true },
					_max: { price: true },
				}),
			]);

			const statuses = Array.from(
				new Set(
					statusRows
						.map((row) => row.status?.trim())
						.filter((value): value is string => Boolean(value))
				)
			).sort((a, b) => a.localeCompare(b));

			return Response.json({
				statuses,
				priceRange: {
					min: typeof priceStats._min.price === "number" ? priceStats._min.price : null,
					max: typeof priceStats._max.price === "number" ? priceStats._max.price : null,
				},
			});
		}

		const queryOptions: {
			where?: Prisma.PoojaCategoryWhereInput;
			skip?: number;
			take?: number;
			orderBy: { createdAt: "desc" };
		} = {
			orderBy: { createdAt: "desc" },
		};

		if (Object.keys(where).length > 0) {
			queryOptions.where = where;
		}

		if (hasPaginationParams && limit > 0) {
			queryOptions.skip = (page - 1) * limit;
			queryOptions.take = limit;
		}

		const [categories, total] = await Promise.all([
			prisma.poojaCategory.findMany(queryOptions),
			prisma.poojaCategory.count({ where: queryOptions.where }),
		]);

		return Response.json({
			categories: categories.map((cat) => ({
				id: cat.id,
				name: cat.name,
				description: cat.description || "",
				date: cat.date ? cat.date.toISOString() : "",
				price: typeof cat.price === "number" ? cat.price : undefined,
				details: cat.details || "",
				status: cat.status || "Inactive",
				images:
					cat.images && cat.images.length > 0
						? cat.images
						: ["https://via.placeholder.com/300x200?text=Pooja+Image"],
				videos: cat.videos && cat.videos.length > 0 ? cat.videos : [],
			})),
			total,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(total / limit),
				limit,
			},
		});
	} catch (error) {
		console.error("Error fetching pooja categories:", error);
		return Response.json(
			{
				message: "Failed to fetch pooja categories",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

// POST /api/pooja-categories
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { name, description, date, price, details, images, videos } = body;

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
				images: images || [],
				videos: videos || [],
			},
		});

		return Response.json({
			id: created.id,
			name: created.name,
			description: created.description || "",
			date: created.date ? created.date.toISOString() : "",
			price: typeof created.price === "number" ? created.price : undefined,
			details: created.details || "",
			images:
				created.images && created.images.length > 0
					? created.images
					: ["https://via.placeholder.com/300x200?text=Pooja+Image"],
			videos: created.videos && created.videos.length > 0 ? created.videos : [],
		});
	} catch {
		return Response.json(
			{ message: "Failed to create Pooja Category" },
			{ status: 500 }
		);
	}
}
