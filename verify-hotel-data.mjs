import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function verifyHotelData() {
	try {
		console.log("Checking hotel distribution by city...\n");

		const metroCities = [
			{ name: "Mumbai", code: "144306" },
			{ name: "Hyderabad", code: "145710" },
			{ name: "Chennai", code: "127343" },
			{ name: "Bangalore", code: "111124" },
			{ name: "Delhi NCR", code: "418069" },
			{ name: "New Delhi", code: "130443" },
		];

		for (const city of metroCities) {
			const hotels = await prisma.tboHotel.findMany({
				where: { cityCode: city.code },
				select: {
					hotelCode: true,
					hotelName: true,
					cityCode: true,
					cityName: true,
				},
				take: 5,
			});

			console.log(`\n${city.name} (${city.code}):`);
			console.log(`  Total hotels: ${hotels.length}`);
			if (hotels.length > 0) {
				console.log("  Sample hotels:");
				hotels.forEach((h, i) => {
					console.log(
						`    ${i + 1}. ${h.hotelName} (${h.hotelCode}) - City: ${h.cityName}`,
					);
				});
			}
		}

		// Check search index
		console.log("\n\n=== Checking Search Index ===\n");

		for (const city of metroCities) {
			const searchEntries = await prisma.tboSearchIndex.findMany({
				where: {
					cityCode: city.code,
					type: "hotel",
				},
				take: 5,
			});

			console.log(
				`\n${city.name} - Search Index Entries: ${searchEntries.length}`,
			);
			if (searchEntries.length > 0) {
				searchEntries.forEach((entry, i) => {
					console.log(
						`  ${i + 1}. ${entry.displayName} (Hotel Code: ${entry.hotelCode})`,
					);
				});
			} else {
				console.log("  ⚠️ No search index entries found!");
			}
		}

		// Get total counts
		console.log("\n\n=== Total Counts ===");
		const totalHotels = await prisma.tboHotel.count();
		const totalSearchIndex = await prisma.tboSearchIndex.count({
			where: { type: "hotel" },
		});
		console.log(`Total hotels in database: ${totalHotels}`);
		console.log(`Total hotels in search index: ${totalSearchIndex}`);

		if (totalHotels !== totalSearchIndex) {
			console.log("\n⚠️ MISMATCH: Search index needs to be rebuilt!");
		}
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

verifyHotelData();
