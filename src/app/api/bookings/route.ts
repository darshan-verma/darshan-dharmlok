import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
	const bookings = await prisma.travelBooking.findMany({
		where: { userId: "1" }, // Hardcoded for now
		include: { destination: true },
	});
	return Response.json(bookings);
}
