import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testSearchQueries() {
	try {
		console.log("Testing different search queries...\n");

		const queries = ["hyderabad", "chennai", "rajasthan", "jaipur"];

		for (const query of queries) {
			console.log(`\n${"=".repeat(60)}`);
			console.log(`SEARCHING FOR: "${query}"`);
			console.log("=".repeat(60));

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

			const results = await prisma.tboSearchIndex.findMany({
				where: whereClause,
				orderBy: [{ priority: "desc" }, { displayName: "asc" }],
				take: 10,
			});

			console.log(`Found ${results.length} results:\n`);

			if (results.length > 0) {
				results.forEach((result, idx) => {
					console.log(`${idx + 1}. ${result.displayName}`);
					console.log(`   Type: ${result.type}`);
					console.log(`   Priority: ${result.priority}`);
					console.log(
						`   Codes: ${result.cityCode || result.hotelCode || result.countryCode}`,
					);
					console.log(`   SearchText: ${result.searchText}`);
					console.log();
				});
			} else {
				console.log("No results found!");
			}
		}
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

testSearchQueries();
