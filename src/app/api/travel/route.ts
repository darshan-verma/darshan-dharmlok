import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const location = searchParams.get("location");
		const category = searchParams.get("category");
		const maxPrice = searchParams.get("maxPrice");

		// Build filter object
		const where: Record<string, unknown> = {};

		if (location) {
			where.location = {
				contains: location,
				mode: "insensitive",
			};
		}

		if (category) {
			where.category = {
				contains: category,
				mode: "insensitive",
			};
		}

		if (maxPrice) {
			where.price = {
				lte: parseInt(maxPrice),
			};
		}

		const destinations = await prisma.destination.findMany({
			where,
			orderBy: {
				createdAt: "desc",
			},
		});

		return Response.json(destinations);
	} catch (error) {
		console.error("Error fetching destinations:", error);
		return Response.json(
			{ error: "Failed to fetch destinations" },
			{ status: 500 }
		);
	}
}
