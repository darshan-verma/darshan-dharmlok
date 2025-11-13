import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
const prisma = new PrismaClient();

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const destination = await prisma.destination.findUnique({
			where: { id },
			include: {
				bookings: {
					select: {
						id: true,
						date: true,
						status: true,
					},
					orderBy: {
						date: "desc",
					},
					take: 10,
				},
			},
		});

		if (!destination) {
			return Response.json({ error: "Destination not found" }, { status: 404 });
		}

		return Response.json(destination);
	} catch (error) {
		console.error("Error fetching destination:", error);
		return Response.json(
			{ error: "Failed to fetch destination" },
			{ status: 500 }
		);
	}
}
