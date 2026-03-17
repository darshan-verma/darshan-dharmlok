import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/** Valid 24-char hex MongoDB ObjectId (optional guard) */
function isValidObjectId(s: string): boolean {
	return /^[a-f0-9]{24}$/i.test(s);
}

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		const userId = session?.user?.id;
		if (!userId || !isValidObjectId(userId)) {
			return Response.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}
		const bookings = await prisma.travelBooking.findMany({
			where: { userId },
			include: { destination: true },
		});
		return Response.json(bookings);
	} catch (error) {
		console.error("GET /api/bookings error:", error);
		return Response.json(
			{ error: error instanceof Error ? error.message : "Failed to fetch bookings" },
			{ status: 500 }
		);
	}
}
