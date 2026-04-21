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

const isInputJsonValue = (value: unknown): value is Prisma.InputJsonValue => {
	if (value === null) return true;
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return true;
	}

	if (Array.isArray(value)) {
		return value.every(
			(item) => item !== undefined && isInputJsonValue(item)
		);
	}

	if (typeof value === "object") {
		return Object.values(value as Record<string, unknown>).every(
			(item) => item !== undefined && isInputJsonValue(item)
		);
	}

	return false;
};

const normalizeArrayInput = (value: unknown): Prisma.InputJsonValue => {
	if (!value) return [];

	if (Array.isArray(value)) {
		return value.filter(
			(item): item is Prisma.InputJsonValue =>
				item !== undefined && isInputJsonValue(item)
		);
	}

	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			if (Array.isArray(parsed)) {
				return parsed.filter(
					(item): item is Prisma.InputJsonValue =>
						item !== undefined && isInputJsonValue(item)
				);
			}
			return [];
		} catch {
			const trimmed = value.trim();
			return trimmed ? [trimmed] : [];
		}
	}

	return [];
};

// GET dharamshalas (supports optional pagination via page + limit)
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

		const where: Prisma.DharamshalaWhereInput = {};
		const andConditions: Prisma.DharamshalaWhereInput[] = [];

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
			const locationRows = await prisma.dharamshala.findMany({
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
			include: { dharamshalaFaqs: true };
			where?: Prisma.DharamshalaWhereInput;
			skip?: number;
			take?: number;
		} = {
			orderBy: { createdAt: "desc" },
			include: { dharamshalaFaqs: true }, // Use dharamshalaFaqs
		};

		if (Object.keys(where).length > 0) {
			queryOptions.where = where;
		}

		if (hasPaginationParams && limit > 0) {
			queryOptions.skip = (page - 1) * limit;
			queryOptions.take = limit;
		}

		const dharamshalas = await prisma.dharamshala.findMany(queryOptions);

		const result = dharamshalas.map((dharamshala) => ({
			...dharamshala,
			amenities: parseJsonArrayField(dharamshala.amenities),
			imageFile: parseJsonArrayField(dharamshala.imageFile),
			videoFile: parseJsonArrayField(dharamshala.videoFile),
			travelByAir: parseJsonArrayField(dharamshala.travelByAir),
			travelByTrain: parseJsonArrayField(dharamshala.travelByTrain),
			travelByBus: parseJsonArrayField(dharamshala.travelByBus),
			travelByRoad: parseJsonArrayField(dharamshala.travelByRoad),
			// Explicitly include bannerImage and coverImage as they are direct string fields
			bannerImage: dharamshala.bannerImage,
			coverImage: dharamshala.coverImage,
			// dharamshalaFaqs will be included directly by Prisma if the relation is named so
		}));
		if (hasPaginationParams && limit > 0) {
			const total = await prisma.dharamshala.count({
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
		console.error("[GET /api/dharamshala] Error:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch dharamshalas",
				details: (error as Error).message,
			},
			{ status: 500 }
		);
	}
}

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
			additionalInfo,
			address, // Added for text address
			location, // Added for iframe URL
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
			dharamshalaFaqs, // Expect 'dharamshalaFaqs' from client
		} = body;

		if (!name || !date || !state || !city || !status) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const dharamshalaCreateData: Prisma.DharamshalaCreateInput = {
			name,
			date: new Date(date),
			state,
			city,
			status,
			description,
			additionalInfo,
			address, // Use address field
			location, // Use location field for iframe
			timings,
			amenities: normalizeArrayInput(amenities),
			imageFile: normalizeArrayInput(imageFile),
			videoFile: normalizeArrayInput(videoFile),
			bannerImage, // NEW: Direct string assignment
			coverImage, // NEW: Direct string assignment
			travelByAir: normalizeArrayInput(travelByAir),
			travelByTrain: normalizeArrayInput(travelByTrain),
			travelByBus: normalizeArrayInput(travelByBus),
			travelByRoad: normalizeArrayInput(travelByRoad),
			dharamshalaFaqs: {
				create:
					dharamshalaFaqs?.map((faq: { question: string; answer: string }) => ({
						question: faq.question,
						answer: faq.answer,
					})) || [],
			},
		};

		Object.keys(dharamshalaCreateData).forEach((key) => {
			if (
				dharamshalaCreateData[key as keyof Prisma.DharamshalaCreateInput] ===
					undefined &&
				key !== "dharamshalaFaqs"
			) {
				// Corrected key name
				delete dharamshalaCreateData[
					key as keyof Prisma.DharamshalaCreateInput
				];
			}
		});

		const dharamshala = await prisma.dharamshala.create({
			data: dharamshalaCreateData,
			include: { dharamshalaFaqs: true }, // Use dharamshalaFaqs
		});

		const result = {
			...dharamshala,
			amenities: parseJsonArrayField(dharamshala.amenities),
			imageFile: parseJsonArrayField(dharamshala.imageFile),
			videoFile: parseJsonArrayField(dharamshala.videoFile),
			travelByAir: parseJsonArrayField(dharamshala.travelByAir),
			travelByTrain: parseJsonArrayField(dharamshala.travelByTrain),
			travelByBus: parseJsonArrayField(dharamshala.travelByBus),
			travelByRoad: parseJsonArrayField(dharamshala.travelByRoad),
			// Explicitly include bannerImage and coverImage as they are direct string fields
			bannerImage: dharamshala.bannerImage,
			coverImage: dharamshala.coverImage,
			// dharamshalaFaqs will be included directly
		};
		return NextResponse.json(result);
	} catch (error) {
		console.error("[POST /api/dharamshala] Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const errorStack = error instanceof Error ? error.stack : undefined;
		return NextResponse.json(
			{
				error: "Failed to create dharamshala",
				details: errorMessage,
				stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
			},
			{ status: 500 }
		);
	}
}
