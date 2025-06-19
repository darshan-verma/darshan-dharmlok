import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper function (can be moved to a shared utils file if used in multiple places)
const parseJsonArrayField = <T = unknown>(
	fieldValue: string | null | undefined
): T[] => {
	if (!fieldValue) return [];
	try {
		const parsed = JSON.parse(fieldValue);
		return Array.isArray(parsed) ? (parsed as T[]) : [];
	} catch {
		return [];
	}
};

// GET all temples
export async function GET(req: NextRequest) {
	try {
		const temples = await prisma.temple.findMany({
			orderBy: { createdAt: "desc" },
			include: { templeFaq: true },
		});

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
