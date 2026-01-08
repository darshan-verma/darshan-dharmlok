import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getHotelCodes() {
	try {
		// Get 10 hotel codes from database
		const hotels = await prisma.tboSearchIndex.findMany({
			where: {
				type: "hotel",
				hotelCode: { not: null },
			},
			select: {
				hotelCode: true,
				displayName: true,
				cityCode: true,
			},
			take: 10,
		});

		console.log("Found hotels:");
		hotels.forEach((h, i) => {
			console.log(
				`${i + 1}. ${h.hotelCode} - ${h.displayName} (City: ${h.cityCode})`
			);
		});

		console.log("\n\nHotel Codes (comma-separated):");
		console.log(hotels.map((h) => h.hotelCode).join(","));
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

getHotelCodes();
