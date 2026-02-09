import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkHotelCounts() {
	try {
		console.log("Checking hotel counts for major cities...\n");

		const cities = [
			{ name: "Hyderabad", code: "145710" },
			{ name: "Chennai", code: "127343" },
			{ name: "Mumbai", code: "144306" },
			{ name: "Bangalore", code: "111124" },
			{ name: "Jaipur", code: "122175" },
			{ name: "Delhi", code: "130443" },
		];

		for (const city of cities) {
			const hotelCount = await prisma.tboHotel.count({
				where: {
					cityCode: city.code,
				},
			});

			const hotelSampleLimit = 5;
			const hotelSample = await prisma.tboHotel.findMany({
				where: {
					cityCode: city.code,
				},
				take: hotelSampleLimit,
				select: {
					hotelName: true,
					hotelCode: true,
				},
			});

			console.log(`\n${city.name} (${city.code}):`);
			console.log(`  Total hotels in database: ${hotelCount}`);
			console.log(`  Sample hotels (first ${hotelSampleLimit}):`);
			hotelSample.forEach((hotel, idx) => {
				console.log(`    ${idx + 1}. ${hotel.hotelName}`);
			});
		}
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

checkHotelCounts();
