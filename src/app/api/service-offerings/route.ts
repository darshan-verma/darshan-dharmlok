import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

//targetType=PoojaCategory&targetId=abc123
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const targetType = searchParams.get("targetType");
	const targetId = searchParams.get("targetId");
	const providerId = searchParams.get("providerId"); // optional, for filtering by Panditji

	if (!targetType || !targetId) {
		return Response.json(
			{ message: "targetType and targetId are required" },
			{ status: 400 }
		);
	}

	const where: Record<string, unknown> = { targetType, targetId };
	if (providerId) where.providerId = providerId;

	const offerings = await prisma.serviceOffering.findMany({
		where,
		include: { provider: true }, // join user for Panditji info
		orderBy: { createdAt: "desc" },
	});

	return Response.json({
		offerings: offerings.map((o) => ({
			id: o.id,
			providerId: o.providerId,
			provider: {
				id: o.provider.id,
				name: o.provider.name,
				// add more user fields if needed
			},
			serviceType: o.serviceType,
			targetType: o.targetType,
			targetId: o.targetId,
			price: o.price,
			details: o.details,
			metadata: o.metadata,
			status: o.status || "Active", // <-- ensure status is present
			createdAt: o.createdAt,
			updatedAt: o.updatedAt,
		})),
	});
}

// POST /api/service-offerings
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			providerId,
			serviceType,
			targetType,
			targetId,
			price,
			details,
			metadata,
		} = body;

		console.log("POST /api/service-offerings body:", body);

		if (
			!providerId ||
			!serviceType ||
			!targetType ||
			!targetId ||
			typeof price !== "number"
		) {
			console.error("Missing required fields", {
				providerId,
				serviceType,
				targetType,
				targetId,
				price,
			});
			return Response.json(
				{ message: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Debug: Check if prisma and prisma.serviceOffering are defined
		console.log(
			"prisma is",
			typeof prisma,
			"prisma.serviceOffering is",
			typeof prisma.serviceOffering
		);

		if (!prisma || !prisma.serviceOffering) {
			console.error("Prisma client or serviceOffering model is undefined!");
			return Response.json(
				{ message: "Internal server error: Prisma client or model not loaded" },
				{ status: 500 }
			);
		}

		try {
			const offering = await prisma.serviceOffering.create({
				data: {
					providerId,
					serviceType,
					targetType,
					targetId,
					price,
					details,
					metadata,
					status: "Active",
				},
			});
			console.log("Created offering:", offering);
			return Response.json(offering);
		} catch (dbError) {
			console.error("Prisma create error:", dbError);
			return Response.json(
				{ message: "Prisma error", error: String(dbError) },
				{ status: 500 }
			);
		}
	} catch (e) {
		console.error("Failed to create service offering", e);
		return Response.json(
			{ message: "Failed to create service offering", error: String(e) },
			{ status: 500 }
		);
	}
}
