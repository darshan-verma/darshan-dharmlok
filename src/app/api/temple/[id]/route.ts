import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	try {
		const temple = await prisma.temple.findUnique({
			where: { id },
			include: { faqs: true },
		});
		if (!temple)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		const result = {
			...temple,
			amenities: temple.amenities ? JSON.parse(temple.amenities) : [],
		};
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch temple" },
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

		// Allow status-only update for quick toggle
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

		// Update FAQs: delete all and recreate (simple approach)
		await prisma.faq.deleteMany({ where: { templeId: id } });
		const faqsData =
			faqs?.map((faq: { question: string; answer: string }) => ({
				question: faq.question,
				answer: faq.answer,
				templeId: id,
			})) || [];

		const updated = await prisma.temple.update({
			where: { id },
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
			},
		});
		// Recreate FAQs
		if (faqsData.length > 0) {
			await prisma.faq.createMany({ data: faqsData });
		}
		const templeWithFaqs = await prisma.temple.findUnique({
			where: { id },
			include: { faqs: true },
		});
		const result = {
			...templeWithFaqs,
			amenities: templeWithFaqs?.amenities
				? JSON.parse(templeWithFaqs.amenities)
				: [],
		};
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update temple" },
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
		await prisma.faq.deleteMany({ where: { templeId: id } });
		await prisma.temple.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to delete temple" },
			{ status: 500 }
		);
	}
}
