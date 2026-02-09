import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testSmartSearch() {
	try {
		console.log("Testing smart search logic with new sorting...\n");

		const queries = ["hyderabad", "chennai", "rajasthan", "mumbai"];

		for (const query of queries) {
			console.log(`\n${"=".repeat(70)}`);
			console.log(`SEARCHING FOR: "${query}"`);
			console.log("=".repeat(70));

			const searchText = query.toLowerCase().trim().replace(/\s+/g, " ");
			const searchWords = searchText
				.split(" ")
				.filter((word) => word.length > 0);

			const whereClause = {
				AND: searchWords.map((word) => ({
					searchText: {
						contains: word,
					},
				})),
			};

			const limit = 10;

			// Get more results initially
			const allResults = await prisma.tboSearchIndex.findMany({
				where: whereClause,
				take: limit * 10,
				select: {
					id: true,
					type: true,
					displayName: true,
					countryCode: true,
					cityCode: true,
					hotelCode: true,
					priority: true,
					searchText: true,
				},
			});

			// Smart sorting
			const sortedResults = allResults.sort((a, b) => {
				const aName = a.displayName.toLowerCase();
				const bName = b.displayName.toLowerCase();

				// Check if the result starts with the search query
				const aStartsWith = aName.startsWith(searchText);
				const bStartsWith = bName.startsWith(searchText);

				if (aStartsWith && !bStartsWith) return -1;
				if (!aStartsWith && bStartsWith) return 1;

				// Check if the result contains the exact search as a word
				const aExactWord = new RegExp(`\\b${searchText}\\b`).test(aName);
				const bExactWord = new RegExp(`\\b${searchText}\\b`).test(bName);

				if (aExactWord && !bExactWord) return -1;
				if (!aExactWord && bExactWord) return 1;

				// Prioritize cities and countries over hotels
				if (a.type !== b.type) {
					const typeOrder = { country: 0, city: 1, hotel: 2 };
					return typeOrder[a.type] - typeOrder[b.type];
				}

				// If same type, sort by name
				return aName.localeCompare(bName);
			});

			const results = sortedResults.slice(0, limit);

			console.log(
				`Found ${allResults.length} total, showing top ${results.length}:\n`,
			);

			results.forEach((result, idx) => {
				const icon =
					result.type === "city"
						? "🏙️ "
						: result.type === "hotel"
							? "🏨"
							: "🌍";
				console.log(`${idx + 1}. ${icon} ${result.displayName}`);
				console.log(`   Type: ${result.type} | Priority: ${result.priority}`);
			});
		}
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

testSmartSearch();
