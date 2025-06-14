import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all temples
export async function GET(req: NextRequest) {
	try {
		const temples = await prisma.temple.findMany({
			orderBy: { createdAt: "desc" },
			include: { faqs: true },
		});
		// Parse amenities from string to array
		const result = temples.map((temple) => ({
			...temple,
			amenities: temple.amenities ? JSON.parse(temple.amenities) : [],
		}));
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch temples" },
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
			latitude,
			longitude,
			travelByAir,
			travelByTrain,
			travelByBus,
			travelByRoad,
			timings,
			amenities,
			imageFile,
			videoFile,
			faqs,
		} = body;

		if (!name || !date || !state || !city || !status) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const temple = await prisma.temple.create({
			data: {
				name,
				date: new Date(date),
				state,
				city,
				status,
				description,
				history,
				additionalInfo,
				rituals,
				latitude,
				longitude,
				travelByAir,
				travelByTrain,
				travelByBus,
				travelByRoad,
				timings,
				amenities: amenities ? JSON.stringify(amenities) : "[]",
				imageFile: imageFile
					? JSON.stringify(Array.isArray(imageFile) ? imageFile : [imageFile])
					: "[]",
				videoFile: videoFile
					? JSON.stringify(Array.isArray(videoFile) ? videoFile : [videoFile])
					: "[]",
				faqs: {
					create:
						faqs?.map((faq: { question: string; answer: string }) => ({
							question: faq.question,
							answer: faq.answer,
						})) || [],
				},
			},
			include: { faqs: true },
		});
		const result = {
			...temple,
			amenities: temple.amenities ? JSON.parse(temple.amenities) : [],
		};
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to create temple" },
			{ status: 500 }
		);
	}
}
