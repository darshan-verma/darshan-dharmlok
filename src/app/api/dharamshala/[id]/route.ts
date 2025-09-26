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
	_: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		const dharamshala = await prisma.dharamshala.findUnique({
			where: { id },
			include: { dharamshalaFaqs: true }, // Use dharamshalaFaqs
		});
		if (!dharamshala)
			return NextResponse.json({ error: "Not found" }, { status: 404 });

		const result = {
			...dharamshala,
			amenities: parseJsonArrayField(dharamshala.amenities),
			imageFile: parseJsonArrayField(dharamshala.imageFile),
			videoFile: parseJsonArrayField(dharamshala.videoFile),
			travelByAir: parseJsonArrayField(dharamshala.travelByAir),
			travelByTrain: parseJsonArrayField(dharamshala.travelByTrain),
			travelByBus: parseJsonArrayField(dharamshala.travelByBus),
			travelByRoad: parseJsonArrayField(dharamshala.travelByRoad),
			// bannerImage and coverImage are already strings, no parsing needed
			// dharamshalaFaqs will be included directly
		};
		return NextResponse.json(result);
	} catch (error) {
		console.error(`[GET /api/dharamshala/${id}] Error:`, error);
		return NextResponse.json(
			{
				error: "Failed to fetch dharamshala",
				details: (error as Error).message,
			},
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
			const updated = await prisma.dharamshala.update({
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

		// Update FAQs: delete all and recreate
		await prisma.dharamshalaFaq.deleteMany({ where: { dharamshalaId: id } });
		const faqsData = // This variable name is local, 'dharamshalaFaqs' from body is used
			dharamshalaFaqs?.map((faq: { question: string; answer: string }) => ({
				question: faq.question,
				answer: faq.answer,
				dharamshalaId: id,
			})) || [];

		const dharamshalaUpdateData: {
			name: string;
			date: Date;
			state: string;
			city: string;
			status: string;
			description?: string;
			additionalInfo?: string;
			address?: string; // Updated for address field
			location?: string; // Updated for location iframe URL
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
		} = {
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
			bannerImage, // NEW: Direct string assignment
			coverImage, // NEW: Direct string assignment
			travelByAir: travelByAir ? JSON.stringify(travelByAir) : "[]",
			travelByTrain: travelByTrain ? JSON.stringify(travelByTrain) : "[]",
			travelByBus: travelByBus ? JSON.stringify(travelByBus) : "[]",
			travelByRoad: travelByRoad ? JSON.stringify(travelByRoad) : "[]",
			// No direct update for dharamshalaFaqs here as they are handled separately
		};

		Object.keys(dharamshalaUpdateData).forEach((key) => {
			const typedKey = key as keyof typeof dharamshalaUpdateData;
			if (dharamshalaUpdateData[typedKey] === undefined) {
				delete dharamshalaUpdateData[typedKey];
			}
		});

		await prisma.dharamshala.update({
			where: { id },
			data: dharamshalaUpdateData,
		});

		if (faqsData.length > 0) {
			await prisma.dharamshalaFaq.createMany({ data: faqsData });
		}

		const updatedDharamshalaWithFaqs = await prisma.dharamshala.findUnique({
			where: { id },
			include: { dharamshalaFaqs: true }, // Use dharamshalaFaqs
		});

		if (!updatedDharamshalaWithFaqs) {
			throw new Error("Failed to retrieve updated dharamshala with FAQs.");
		}

		const result = {
			...updatedDharamshalaWithFaqs,
			amenities: parseJsonArrayField(updatedDharamshalaWithFaqs.amenities),
			imageFile: parseJsonArrayField(updatedDharamshalaWithFaqs.imageFile),
			videoFile: parseJsonArrayField(updatedDharamshalaWithFaqs.videoFile),
			travelByAir: parseJsonArrayField(updatedDharamshalaWithFaqs.travelByAir),
			travelByTrain: parseJsonArrayField(
				updatedDharamshalaWithFaqs.travelByTrain
			),
			travelByBus: parseJsonArrayField(updatedDharamshalaWithFaqs.travelByBus),
			travelByRoad: parseJsonArrayField(
				updatedDharamshalaWithFaqs.travelByRoad
			),
			// bannerImage and coverImage are already strings
			// dharamshalaFaqs will be included directly
		};
		return NextResponse.json(result);
	} catch (error) {
		console.error(`[PUT /api/dharamshala/${id}] Error:`, error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const errorStack = error instanceof Error ? error.stack : undefined;
		return NextResponse.json(
			{
				error: "Failed to update dharamshala",
				details: errorMessage,
				stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		// First delete related DharamshalaFaqs
		await prisma.dharamshalaFaq.deleteMany({ where: { dharamshalaId: id } });
		// Then delete the Dharamshala
		await prisma.dharamshala.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(`[DELETE /api/dharamshala/${id}] Error:`, error);
		return NextResponse.json(
			{
				error: "Failed to delete dharamshala",
				details: (error as Error).message,
			},
			{ status: 500 }
		);
	}
}
