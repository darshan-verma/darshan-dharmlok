/**
 * Test script to verify both TBO and AIRiQ APIs work simultaneously
 * Run with: node test-dual-api-integration.js
 */

const API_URL = "http://localhost:3000"; // Change if your Next.js runs on different port

const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
};

function log(emoji, message, color = colors.reset) {
	console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logSection(title) {
	console.log("\n" + "=".repeat(80));
	console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
	console.log("=".repeat(80) + "\n");
}

async function testDualAPIIntegration() {
	logSection("Testing Dual API Integration (TBO + AIRiQ)");

	// Calculate future date (10 days from now)
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + 10);
	const departureDateStr = futureDate.toISOString().split("T")[0];

	const searchRequest = {
		AdultCount: "1",
		ChildCount: "0",
		InfantCount: "0",
		FlightCabinClass: "1", // Economy
		JourneyType: "1", // One-way
		DirectFlight: "false",
		OneStopFlight: "false",
		Origin: "BOM", // Mumbai
		Destination: "DEL", // Delhi
		PreferredDepartureTime: `${departureDateStr}T00:00:00`,
	};

	log("📦", "Search Request:", colors.blue);
	console.log(JSON.stringify(searchRequest, null, 2));
	log("⏳", "Sending search request to both APIs...\n", colors.yellow);

	try {
		const response = await fetch(`${API_URL}/api/travel/flights/search`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(searchRequest),
		});

		log(
			"📡",
			`Response Status: ${response.status} ${response.statusText}`,
			colors.blue
		);

		if (!response.ok) {
			const errorText = await response.text();
			log("❌", "HTTP Error Response:", colors.red);
			console.log(errorText);
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();

		if (!data.success) {
			log("❌", "Search Failed:", colors.red);
			console.log(JSON.stringify(data, null, 2));
			return false;
		}

		log("✅", "Search Successful!", colors.green);

		// Check sources
		const sources = data.sources || {};
		log("\n📊", "API Sources Status:", colors.cyan);
		log(
			sources.tbo ? "  ✅" : "  ❌",
			`TBO API: ${sources.tbo ? "SUCCESS" : "FAILED"}`,
			sources.tbo ? colors.green : colors.red
		);
		log(
			sources.airiq ? "  ✅" : "  ❌",
			`AIRiQ API: ${sources.airiq ? "SUCCESS" : "FAILED"}`,
			sources.airiq ? colors.green : colors.red
		);

		// Check stats
		const stats = data.stats || {};
		log("\n📈", "Flight Statistics:", colors.cyan);
		log("  🔵", `TBO Flights: ${stats.tboFlightCount || 0}`, colors.blue);
		log("  🟢", `AIRiQ Flights: ${stats.airiqFlightCount || 0}`, colors.green);
		log("  📊", `Total Flights: ${stats.totalFlightCount || 0}`, colors.bright);

		// Analyze results
		const results = data.data?.Response?.Results?.[0] || [];
		log(
			"\n✈️",
			`Total Flight Results Returned: ${results.length}`,
			colors.cyan
		);

		if (results.length > 0) {
			// Count flights by source
			let tboCount = 0;
			let airiqCount = 0;
			let unknownCount = 0;

			results.forEach((flight) => {
				if (flight.ApiSource === "TBO") {
					tboCount++;
				} else if (flight.ApiSource === "AIRiQ") {
					airiqCount++;
				} else {
					unknownCount++;
				}
			});

			log("\n🔍", "Detailed Flight Distribution:", colors.cyan);
			log("  📘", `TBO Flights: ${tboCount}`, colors.blue);
			log("  📗", `AIRiQ Flights: ${airiqCount}`, colors.green);
			if (unknownCount > 0) {
				log("  📙", `Unknown Source: ${unknownCount}`, colors.yellow);
			}

			// Show sample flights
			log("\n📋", "Sample Flights (first 5):", colors.cyan);

			const sampleFlights = results.slice(0, 5);
			sampleFlights.forEach((flight, index) => {
				const segment = flight.Segments?.[0]?.[0];
				if (segment) {
					const airline = segment.Airline?.AirlineCode || "??";
					const flightNo = segment.Airline?.FlightNumber || "???";
					const origin = segment.Origin?.Airport?.AirportCode || "???";
					const destination =
						segment.Destination?.Airport?.AirportCode || "???";
					const depTime = segment.Origin?.DepTime
						? new Date(segment.Origin.DepTime).toLocaleTimeString("en-IN", {
								hour: "2-digit",
								minute: "2-digit",
						  })
						: "??:??";
					const arrTime = segment.Destination?.ArrTime
						? new Date(segment.Destination.ArrTime).toLocaleTimeString(
								"en-IN",
								{
									hour: "2-digit",
									minute: "2-digit",
								}
						  )
						: "??:??";
					const price = flight.Fare?.OfferedFare || "N/A";
					const source = flight.ApiSource || "Unknown";
					const sourceColor = source === "TBO" ? colors.blue : colors.green;

					console.log(
						`\n  ${
							index + 1
						}. ${airline} ${flightNo} - ${sourceColor}[${source}]${
							colors.reset
						}`
					);
					console.log(
						`     ${origin} → ${destination} | ${depTime} - ${arrTime}`
					);
					console.log(`     Price: ₹${price}`);
				}
			});

			// Verify both APIs contributed
			if (tboCount > 0 && airiqCount > 0) {
				log(
					"\n🎉",
					"SUCCESS: Both TBO and AIRiQ APIs are working together!",
					colors.bright + colors.green
				);
				return true;
			} else if (tboCount > 0) {
				log("\n⚠️", "Warning: Only TBO API returned flights", colors.yellow);
				return true;
			} else if (airiqCount > 0) {
				log("\n⚠️", "Warning: Only AIRiQ API returned flights", colors.yellow);
				return true;
			} else {
				log("\n❌", "Error: No flights from either API", colors.red);
				return false;
			}
		} else {
			log("\n⚠️", "No flights found for search criteria", colors.yellow);
			log(
				"💡",
				"This might be normal if no flights available on selected date",
				colors.yellow
			);
			return true;
		}
	} catch (error) {
		log("\n❌", "Test Failed:", colors.red);
		console.error(error);
		return false;
	}
}

async function main() {
	console.log("\n");
	log(
		"🚀",
		"Dual API Integration Test (TBO + AIRiQ)",
		colors.bright + colors.cyan
	);
	log("📅", `Test Date: ${new Date().toISOString()}`, colors.blue);
	log(
		"💡",
		"Make sure your Next.js server is running on http://localhost:3000",
		colors.yellow
	);

	const success = await testDualAPIIntegration();

	logSection("TEST SUMMARY");
	log(
		success ? "✅" : "❌",
		success ? "Integration Test PASSED" : "Integration Test FAILED",
		success ? colors.green : colors.red
	);

	if (!success) {
		log("\n💡", "Troubleshooting tips:", colors.yellow);
		log(
			"   1. Make sure Next.js dev server is running (npm run dev)",
			colors.yellow
		);
		log(
			"   2. Check that both TBO and AIRiQ credentials are in .env.local",
			colors.yellow
		);
		log("   3. Verify network connectivity to both APIs", colors.yellow);
	}

	console.log("\n" + "=".repeat(80) + "\n");
	process.exit(success ? 0 : 1);
}

main().catch((error) => {
	console.error("\n❌ Unexpected error:", error);
	process.exit(1);
});
