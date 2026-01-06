import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function getCitiesWithHotels() {
	try {
		// Get distinct city codes from hotels
		const hotels = await prisma.tboHotel.findMany({
			select: { cityCode: true },
			distinct: ["cityCode"],
		});

		const cityCodes = hotels.map((h) => h.cityCode);

		// Get city details
		const cities = await prisma.tboCity.findMany({
			where: { cityCode: { in: cityCodes } },
			select: { cityCode: true, cityName: true, countryCode: true },
			orderBy: { cityName: "asc" },
		});

		console.log(`\nTotal cities with hotels indexed: ${cities.length}\n`);
		cities.forEach((city, idx) => {
			console.log(`${idx + 1}. ${city.cityName} (${city.cityCode})`);
		});
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

getCitiesWithHotels();
