import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Helper function (can be moved to a shared utils file if used in multiple places)
const parseJsonArrayField = <T = unknown>(fieldValue: unknown): T[] => {
	if (!fieldValue) return [];
	if (Array.isArray(fieldValue)) return fieldValue as T[];
	if (typeof fieldValue !== "string") return [];

	try {
		const parsed = JSON.parse(fieldValue);
		return Array.isArray(parsed) ? (parsed as T[]) : [];
	} catch {
		const trimmed = fieldValue.trim();
		return trimmed ? ([trimmed] as T[]) : [];
	}
};

// GET temples (supports optional pagination, search, and location filters)
export async function GET(req: NextRequest) {
	try {
		const searchParams = req.nextUrl.searchParams;
		const pageParam = searchParams.get("page");
		const limitParam = searchParams.get("limit");
		const searchParam = searchParams.get("search")?.trim();
		const stateParam = searchParams.get("state")?.trim();
		const cityParam = searchParams.get("city")?.trim();
		const statusParam = searchParams.get("status")?.trim();
		const filtersOnly = searchParams.get("filtersOnly") === "true";

		const parsedPage = Number(pageParam ?? "1");
		const parsedLimit = Number(limitParam ?? "0");
		const hasPaginationParams = pageParam !== null || limitParam !== null;

		const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
		const limit =
			Number.isFinite(parsedLimit) && parsedLimit > 0
				? Math.min(parsedLimit, 100)
				: 0;

		const where: Prisma.TempleWhereInput = {};
		const andConditions: Prisma.TempleWhereInput[] = [];

		if (statusParam) {
			andConditions.push({
				status: {
					equals: statusParam,
					mode: "insensitive",
				},
			});
		}

		if (stateParam) {
			andConditions.push({
				state: {
					contains: stateParam,
					mode: "insensitive",
				},
			});
		}

		if (cityParam) {
			andConditions.push({
				city: {
					contains: cityParam,
					mode: "insensitive",
				},
			});
		}

		if (searchParam) {
			andConditions.push({
				OR: [
					{ name: { contains: searchParam, mode: "insensitive" } },
					{ city: { contains: searchParam, mode: "insensitive" } },
					{ state: { contains: searchParam, mode: "insensitive" } },
					{ address: { contains: searchParam, mode: "insensitive" } },
				],
			});
		}

		if (andConditions.length > 0) {
			where.AND = andConditions;
		}

		if (filtersOnly) {
			const locationRows = await prisma.temple.findMany({
				where,
				select: {
					state: true,
					city: true,
				},
			});

			const normalizedLocations = locationRows
				.map((row) => ({
					state: row.state?.trim() || "",
					city: row.city?.trim() || "",
				}))
				.filter((row) => row.state || row.city);

			const states = Array.from(
				new Set(
					normalizedLocations
						.map((row) => row.state)
						.filter((state): state is string => Boolean(state))
				)
			).sort((a, b) => a.localeCompare(b));

			const cities = Array.from(
				new Set(
					normalizedLocations
						.map((row) => row.city)
						.filter((city): city is string => Boolean(city))
				)
			).sort((a, b) => a.localeCompare(b));

			return NextResponse.json({
				states,
				cities,
				locations: normalizedLocations,
			});
		}

		const queryOptions: {
			orderBy: { createdAt: "desc" };
			include: { templeFaq: true };
			where?: Prisma.TempleWhereInput;
			skip?: number;
			take?: number;
		} = {
			orderBy: { createdAt: "desc" },
			include: { templeFaq: true },
		};

		if (Object.keys(where).length > 0) {
			queryOptions.where = where;
		}

		if (hasPaginationParams && limit > 0) {
			queryOptions.skip = (page - 1) * limit;
			queryOptions.take = limit;
		}

		const temples = await prisma.temple.findMany(queryOptions);

		const result = temples.map((temple) => ({
			...temple,
			amenities: parseJsonArrayField(temple.amenities),
			imageFile: parseJsonArrayField(temple.imageFile),
			videoFile: parseJsonArrayField(temple.videoFile),
			travelByAir: parseJsonArrayField(temple.travelByAir),
			travelByTrain: parseJsonArrayField(temple.travelByTrain),
			travelByBus: parseJsonArrayField(temple.travelByBus),
			travelByRoad: parseJsonArrayField(temple.travelByRoad),
		}));
		if (hasPaginationParams && limit > 0) {
			const total = await prisma.temple.count({
				where: queryOptions.where,
			});
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
	} catch (error) {
		console.error("[GET /api/temple] Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ error: "Failed to fetch temples", details: errorMessage },
			{ status: 500 }
		);
	}
}

// CREATE a new temple
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			name,
			date,
			state,
			city,
			status,
			description,
			history,
			additionalInfo,
			rituals,
			address,
			location,
			travelByAir,
			travelByTrain,
			travelByBus,
			travelByRoad,
			timings,
			amenities,
			imageFile,
			videoFile,
			bannerImage, // NEW: Accept bannerImage
			coverImage, // NEW: Accept coverImage
			templeFaq,
		} = body;

		if (!name || !date || !state || !city || !status) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		type TempleCreateData = {
			name: string;
			date: Date;
			state: string;
			city: string;
			status: string;
			description?: string;
			history?: string;
			additionalInfo?: string;
			rituals?: string;
			address?: string;
			location?: string;
			timings?: string;
			amenities: string;
			imageFile: string;
			videoFile: string;
			bannerImage?: string; // NEW
			coverImage?: string; // NEW
			travelByAir: string;
			travelByTrain: string;
			travelByBus: string;
			travelByRoad: string;
			templeFaq: {
				create: { question: string; answer: string }[];
			};
		};

		const templeCreateData: TempleCreateData = {
			name,
			date: new Date(date),
			state,
			city,
			status,
			description,
			history,
			additionalInfo,
			rituals,
			address,
			location,
			timings,
			amenities: amenities ? JSON.stringify(amenities) : "[]",
			imageFile: imageFile ? JSON.stringify(imageFile) : "[]",
			videoFile: videoFile ? JSON.stringify(videoFile) : "[]",
			bannerImage, // NEW: Direct string assignment
			coverImage, // NEW: Direct string assignment
			travelByAir: travelByAir ? JSON.stringify(travelByAir) : "[]",
			travelByTrain: travelByTrain ? JSON.stringify(travelByTrain) : "[]",
			travelByBus: travelByBus ? JSON.stringify(travelByBus) : "[]",
			travelByRoad: travelByRoad ? JSON.stringify(travelByRoad) : "[]",
			templeFaq: {
				create:
					templeFaq?.map((faq: { question: string; answer: string }) => ({
						question: faq.question,
						answer: faq.answer,
					})) || [],
			},
		};

		// Remove undefined fields
		Object.keys(templeCreateData).forEach((key) => {
			if (
				templeCreateData[key as keyof TempleCreateData] === undefined &&
				key !== "templeFaq"
			) {
				// Keep templeFaq even if empty for create
				delete templeCreateData[key as keyof TempleCreateData];
			}
		});

		const temple = await prisma.temple.create({
			data: templeCreateData,
			include: { templeFaq: true },
		});

		const result = {
			...temple,
			amenities: parseJsonArrayField(temple.amenities),
			imageFile: parseJsonArrayField(temple.imageFile),
			videoFile: parseJsonArrayField(temple.videoFile),
			travelByAir: parseJsonArrayField(temple.travelByAir),
			travelByTrain: parseJsonArrayField(temple.travelByTrain),
			travelByBus: parseJsonArrayField(temple.travelByBus),
			travelByRoad: parseJsonArrayField(temple.travelByRoad),
		};
		return NextResponse.json(result);
	} catch (error) {
		console.error("[POST /api/temple] Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const errorStack = error instanceof Error ? error.stack : undefined;
		return NextResponse.json(
			{
				error: "Failed to create temple",
				details: errorMessage,
				stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
			},
			{ status: 500 }
		);
	}
}
