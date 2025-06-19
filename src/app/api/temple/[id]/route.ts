import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper function to safely parse JSON string fields that should be arrays
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

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		const temple = await prisma.temple.findUnique({
			where: { id },
			include: { templeFaq: true },
		});
		if (!temple)
			return NextResponse.json({ error: "Not found" }, { status: 404 });

		const result = {
			...temple,
			amenities: parseJsonArrayField(temple.amenities),
			imageFile: parseJsonArrayField<string>(temple.imageFile).map((url) =>
				typeof url === "string" ? url : ""
			),
			videoFile: parseJsonArrayField<string>(temple.videoFile).map((url) =>
				typeof url === "string" ? url : ""
			),
			travelByAir: parseJsonArrayField(temple.travelByAir),
			travelByTrain: parseJsonArrayField(temple.travelByTrain),
			travelByBus: parseJsonArrayField(temple.travelByBus),
			travelByRoad: parseJsonArrayField(temple.travelByRoad),
		};
		return NextResponse.json(result);
	} catch (error) {
		console.error(`[GET /api/temple/${id}] Error:`, error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ error: "Failed to fetch temple", details: errorMessage },
			{ status: 500 }
		);
	}
}

export async function PUT(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		const body = await req.json();

		if (body.status && Object.keys(body).length === 1) {
			const updated = await prisma.temple.update({
				where: { id },
				data: { status: body.status },
			});
			return NextResponse.json(updated);
		}

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

		await prisma.templeFaq.deleteMany({ where: { templeId: id } });
		const faqsData =
			templeFaq?.map((faq: { question: string; answer: string }) => ({
				question: faq.question,
				answer: faq.answer,
				templeId: id,
			})) || [];

		const templeUpdateData: {
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
		} = {
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
		};

		// Remove undefined fields to avoid Prisma errors
		Object.keys(templeUpdateData).forEach((key) => {
			if (
				templeUpdateData[key as keyof typeof templeUpdateData] === undefined
			) {
				delete templeUpdateData[key as keyof typeof templeUpdateData];
			}
		});

		await prisma.temple.update({
			where: { id },
			data: templeUpdateData,
		});

		if (faqsData.length > 0) {
			await prisma.templeFaq.createMany({ data: faqsData });
		}

		const updatedTempleWithFaqs = await prisma.temple.findUnique({
			where: { id },
			include: { templeFaq: true },
		});

		if (!updatedTempleWithFaqs) {
			throw new Error("Failed to retrieve updated temple with FAQs.");
		}

		const result = {
			...updatedTempleWithFaqs,
			amenities: parseJsonArrayField(updatedTempleWithFaqs.amenities),
			imageFile: parseJsonArrayField<string>(
				updatedTempleWithFaqs.imageFile
			).map((url) => (typeof url === "string" ? url : "")),
			videoFile: parseJsonArrayField<string>(
				updatedTempleWithFaqs.videoFile
			).map((url) => (typeof url === "string" ? url : "")),
			travelByAir: parseJsonArrayField(updatedTempleWithFaqs.travelByAir),
			travelByTrain: parseJsonArrayField(updatedTempleWithFaqs.travelByTrain),
			travelByBus: parseJsonArrayField(updatedTempleWithFaqs.travelByBus),
			travelByRoad: parseJsonArrayField(updatedTempleWithFaqs.travelByRoad),
		};
		return NextResponse.json(result);
	} catch (error) {
		console.error(`[PUT /api/temple/${id}] Error:`, error);
		// Consider providing more specific error messages in development
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const errorStack = error instanceof Error ? error.stack : undefined;
		return NextResponse.json(
			{
				error: "Failed to update temple",
				details: errorMessage,
				stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		await prisma.templeFaq.deleteMany({ where: { templeId: id } });
		await prisma.temple.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(`[DELETE /api/temple/${id}] Error:`, error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ error: "Failed to delete temple", details: errorMessage },
			{ status: 500 }
		);
	}
}

// No changes needed; this file only handles URLs for imageFile and videoFile.
