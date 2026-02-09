import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function quickCheckNCRHotels() {
	try {
		// Check hotels by NCR city codes
		const ncrCityCodes = [
			"130443",
			"119513",
			"130205",
			"145430",
			"118973",
			"118129",
			"147501",
		];

		console.log("Checking indexed hotels in Delhi NCR...\n");
		console.log("=".repeat(60));

		for (const cityCode of ncrCityCodes) {
			const city = await prisma.tboCity.findUnique({
				where: { cityCode },
				select: { cityName: true, cityCode: true },
			});

			if (city) {
				const hotelCount = await prisma.tboHotel.count({
					where: { cityCode },
				});

				const icon = hotelCount > 0 ? "✅" : "❌";
				console.log(`${icon} ${city.cityName}: ${hotelCount} hotels`);
			}
		}

		// Total
		const total = await prisma.tboHotel.count({
			where: { cityCode: { in: ncrCityCodes } },
		});

		console.log("=".repeat(60));
		console.log(`\n📊 Total Delhi NCR hotels indexed: ${total}`);
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

quickCheckNCRHotels();
