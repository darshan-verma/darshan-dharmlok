import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkCityEntries() {
	try {
		console.log("Checking if cities are in search index...\n");

		const cities = ["hyderabad", "chennai", "mumbai", "bangalore"];

		for (const cityName of cities) {
			const cityEntries = await prisma.tboSearchIndex.findMany({
				where: {
					type: "city",
					searchText: {
						contains: cityName,
					},
				},
			});

			console.log(`\n${cityName.toUpperCase()}:`);
			if (cityEntries.length > 0) {
				cityEntries.forEach((entry) => {
					console.log(`  ✓ Found: ${entry.displayName}`);
					console.log(`    Type: ${entry.type}, Priority: ${entry.priority}`);
					console.log(
						`    CityCode: ${entry.cityCode}, CountryCode: ${entry.countryCode}`,
					);
					console.log(`    SearchText: ${entry.searchText}`);
				});
			} else {
				console.log("  ✗ No city entry found in search index!");
			}
		}
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

checkCityEntries();
