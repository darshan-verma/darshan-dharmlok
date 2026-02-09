/**
 * Script to rebuild the search index after syncing hotels
 */

async function rebuildSearchIndex() {
	console.log("Rebuilding hotel search index...\n");

	try {
		const response = await fetch(
			"http://localhost:3000/api/travel/tbo-sync/search-index",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
			},
		);

		const result = await response.json();

		if (response.ok) {
			console.log("✓ Search index rebuilt successfully!");
			console.log("\nBreakdown:");
			console.log(`  - Countries: ${result.breakdown.countries}`);
			console.log(`  - Cities: ${result.breakdown.cities}`);
			console.log(`  - Hotels: ${result.breakdown.hotels}`);
			console.log(`\nTotal indexed: ${result.indexed}`);
			console.log(`Errors: ${result.errors}`);
		} else {
			console.error("✗ Failed to rebuild search index");
			console.error(`  Error: ${result.error || "Unknown error"}`);
			if (result.details) {
				console.error(`  Details: ${result.details}`);
			}
		}
	} catch (error) {
		console.error("✗ Network error");
		console.error(`  ${error.message}`);
	}
}

rebuildSearchIndex();
