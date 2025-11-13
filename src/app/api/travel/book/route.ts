import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const {
			userId,
			destinationId,
			name,
			email,
			phone,
			fromLocation,
			transportType,
			travelDate,
			returnDate,
			departureTime,
			travelers,
			totalAmount,
		} = body;

		// Validate required fields
		if (
			!userId ||
			!destinationId ||
			!name ||
			!email ||
			!phone ||
			!fromLocation ||
			!transportType ||
			!travelDate ||
			!returnDate ||
			!travelers
		) {
			return Response.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Validate destination exists
		const destination = await prisma.destination.findUnique({
			where: { id: destinationId },
		});

		if (!destination) {
			return Response.json({ error: "Destination not found" }, { status: 404 });
		}

		// Validate transport type
		const validTransportTypes = ["air", "train", "bus", "road"];
		if (!validTransportTypes.includes(transportType)) {
			return Response.json(
				{ error: "Invalid transport type" },
				{ status: 400 }
			);
		}

		// Create booking with all details
		const booking = await prisma.travelBooking.create({
			data: {
				userId,
				destinationId,
				name,
				email,
				phone,
				fromLocation,
				transportType,
				travelDate: new Date(travelDate),
				returnDate: returnDate ? new Date(returnDate) : null,
				departureTime,
				travelers,
				totalAmount,
				status: "PENDING",
			},
			include: {
				destination: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		return Response.json({
			message: "Booking successful!",
			booking,
		});
	} catch (error) {
		console.error("Booking error:", error);
		return Response.json(
			{ error: "Failed to create booking" },
			{ status: 500 }
		);
	}
}
