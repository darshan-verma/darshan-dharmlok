import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function findMetroCities() {
	try {
		const metroNames = [
			"Mumbai",
			"Delhi",
			"Bangalore",
			"Bengaluru",
			"Hyderabad",
			"Chennai",
			"Kolkata",
		];

		console.log("Searching for metro cities in database...\n");

		for (const cityName of metroNames) {
			const cities = await prisma.tboCity.findMany({
				where: {
					cityName: {
						contains: cityName,
						mode: "insensitive",
					},
				},
				select: {
					cityCode: true,
					cityName: true,
					countryCode: true,
				},
			});

			if (cities.length > 0) {
				console.log(`\n${cityName}:`);
				cities.forEach((city) => {
					console.log(
						`  - ${city.cityName} (Code: ${city.cityCode}, Country: ${city.countryCode})`,
					);
				});
			}
		}
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

findMetroCities();
