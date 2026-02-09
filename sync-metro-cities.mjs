/**
 * Script to sync hotels for top 5 metro cities
 */

const metroCities = [
	{ name: "Mumbai", code: "144306" },
	{ name: "Delhi NCR", code: "418069" },
	{ name: "Bangalore", code: "111124" },
	{ name: "Hyderabad", code: "145710" },
	{ name: "Chennai", code: "127343" },
];

async function syncMetroCities() {
	console.log("Starting hotel sync for top 5 metro cities...\n");

	for (const city of metroCities) {
		console.log(`\n${"=".repeat(60)}`);
		console.log(`Syncing: ${city.name} (${city.code})`);
		console.log("=".repeat(60));

		try {
			const response = await fetch(
				"http://localhost:3000/api/travel/tbo-sync/hotels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						cityCode: city.code,
						enrichDetails: false, // Set to true if you want full hotel details
					}),
				},
			);

			const result = await response.json();

			if (response.ok) {
				console.log(`✓ ${city.name}: Successfully synced`);
				console.log(`  - Hotels synced: ${result.synced || 0}`);
				console.log(`  - Errors: ${result.errors || 0}`);
			} else {
				console.error(`✗ ${city.name}: Failed`);
				console.error(`  Error: ${result.error || "Unknown error"}`);
			}
		} catch (error) {
			console.error(`✗ ${city.name}: Network error`);
			console.error(`  ${error.message}`);
		}

		// Small delay between requests
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	console.log("\n" + "=".repeat(60));
	console.log("Metro cities hotel sync complete!");
	console.log("=".repeat(60));
}

syncMetroCities();
