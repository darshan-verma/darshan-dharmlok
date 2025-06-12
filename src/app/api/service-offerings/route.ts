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

	const where: any = { targetType, targetId };
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

		if (
			!providerId ||
			!serviceType ||
			!targetType ||
			!targetId ||
			typeof price !== "number"
		) {
			return Response.json(
				{ message: "Missing required fields" },
				{ status: 400 }
			);
		}

		const offering = await prisma.serviceOffering.create({
			data: {
				providerId,
				serviceType,
				targetType,
				targetId,
				price,
				details,
				metadata,
			},
		});

		return Response.json(offering);
	} catch (e) {
		return Response.json(
			{ message: "Failed to create service offering" },
			{ status: 500 }
		);
	}
}
