import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

// GET all dharamshalas
export async function GET(_: NextRequest) {
	try {
		const dharamshalas = await prisma.dharamshala.findMany({
			orderBy: { createdAt: "desc" },
			include: { dharamshalaFaqs: true }, // Use dharamshalaFaqs
		});

		const result = dharamshalas.map((dharamshala) => ({
			...dharamshala,
			amenities: parseJsonArrayField(dharamshala.amenities),
			imageFile: parseJsonArrayField(dharamshala.imageFile),
			videoFile: parseJsonArrayField(dharamshala.videoFile),
			travelByAir: parseJsonArrayField(dharamshala.travelByAir),
			travelByTrain: parseJsonArrayField(dharamshala.travelByTrain),
			travelByBus: parseJsonArrayField(dharamshala.travelByBus),
			travelByRoad: parseJsonArrayField(dharamshala.travelByRoad),
			// dharamshalaFaqs will be included directly by Prisma if the relation is named so
		}));
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
			amenities: amenities ? JSON.stringify(amenities) : "[]",
			imageFile: imageFile ? JSON.stringify(imageFile) : "[]",
			videoFile: videoFile ? JSON.stringify(videoFile) : "[]",
			travelByAir: travelByAir ? JSON.stringify(travelByAir) : "[]",
			travelByTrain: travelByTrain ? JSON.stringify(travelByTrain) : "[]",
			travelByBus: travelByBus ? JSON.stringify(travelByBus) : "[]",
			travelByRoad: travelByRoad ? JSON.stringify(travelByRoad) : "[]",
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
