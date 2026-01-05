/**
 * Complete AIRiQ API Test Script
 * Tests both Login and Availability endpoints
 * Run with: node test-airiq-complete.js
 */

// Configuration
const API_CONFIG = {
	apiUrl: "http://airiqnewapi.mywebcheck.in/TravelAPI.svc",
	agentId: "AQAG060270",
	username: "7506209217",
	password: "7506209217",
	authHeader: "QVFBRzA2MDI3MCo3NTA2MjA5MjE3Ojc1MDYyMDkyMTc=",
};

// ANSI color codes for better readability
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

/**
 * Step 1: Test Login Endpoint
 */
async function testLogin() {
	logSection("STEP 1: Testing AIRiQ Login Endpoint");

	const requestBody = {
		AgentId: API_CONFIG.agentId,
		Username: API_CONFIG.username,
		Password: API_CONFIG.password,
	};

	log("📍", "Endpoint: " + API_CONFIG.apiUrl + "/Login", colors.blue);
	log("📦", "Request Body:", colors.blue);
	console.log(JSON.stringify(requestBody, null, 2));
	log("🔑", "Auth Header: " + API_CONFIG.authHeader, colors.blue);
	log("⏳", "Sending login request...\n", colors.yellow);

	try {
		const response = await fetch(`${API_CONFIG.apiUrl}/Login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: API_CONFIG.authHeader,
			},
			body: JSON.stringify(requestBody),
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

		const responseText = await response.text();
		log("📦", "Raw Response:", colors.blue);
		console.log(responseText.substring(0, 500));

		const data = JSON.parse(responseText);

		// Check Status
		if (!data.Status) {
			log("❌", "No Status object in response", colors.red);
			console.log("Full response:", JSON.stringify(data, null, 2));
			return null;
		}

		log(
			"📊",
			`Status ResultCode: ${data.Status.ResultCode} | SequenceID: ${data.Status.SequenceID}`,
			colors.blue
		);

		if (data.Status.ResultCode !== "1") {
			log(
				"❌",
				`Login Failed - ResultCode: ${data.Status.ResultCode}`,
				colors.red
			);
			log("❌", `Error Message: ${data.Status.Error}`, colors.red);
			return null;
		}

		if (!data.Token) {
			log("❌", "Login succeeded but no Token in response!", colors.red);
			console.log("Full response:", JSON.stringify(data, null, 2));
			return null;
		}

		log("✅", "Login Successful!", colors.green);
		log("🎫", "AgentID: " + data.AgentID, colors.green);
		log("🎫", "UserName: " + data.UserName, colors.green);
		log("🎫", "TerminalID: " + data.TerminalID, colors.green);
		log(
			"🎫",
			"Token (first 50 chars): " + data.Token.substring(0, 50) + "...",
			colors.green
		);

		return data.Token;
	} catch (error) {
		log("❌", "Login Request Failed:", colors.red);
		console.error(error);
		return null;
	}
}

/**
 * Step 2: Test Availability Endpoint
 */
async function testAvailability(token) {
	logSection("STEP 2: Testing AIRiQ Availability Endpoint");

	if (!token) {
		log("❌", "Cannot test Availability - No token from login", colors.red);
		return false;
	}

	// Calculate a future date (10 days from now)
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + 10);
	const flightDate = futureDate.toISOString().split("T")[0].replace(/-/g, "");

	const requestBody = {
		AgentInfo: {
			AgentId: API_CONFIG.agentId,
			UserName: API_CONFIG.username,
			AppType: "API",
			Version: 2.0,
		},
		TripType: "O", // O=OneWay
		AirlineID: "", // Empty = all airlines
		AvailInfo: [
			{
				DepartureStation: "BOM", // Mumbai
				ArrivalStation: "DEL", // Delhi
				FlightDate: flightDate, // YYYYMMDD format
				FarecabinOption: "E", // E=Economy
				FareType: "N", // N=Normal
				OnlyDirectFlight: false,
			},
		],
		PassengersInfo: {
			AdultCount: "1",
			ChildCount: "0",
			InfantCount: "0",
		},
	};

	log("📍", "Endpoint: " + API_CONFIG.apiUrl + "/Availability", colors.blue);
	log(
		"🔑",
		"Token Header: TOKEN = " + token.substring(0, 30) + "...",
		colors.blue
	);
	log("📦", "Request Body:", colors.blue);
	console.log(JSON.stringify(requestBody, null, 2));
	log("⏳", "Sending availability request...\n", colors.yellow);

	try {
		const response = await fetch(`${API_CONFIG.apiUrl}/Availability`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: API_CONFIG.authHeader,
				TOKEN: token, // Token must be in header as "TOKEN" (all caps)
			},
			body: JSON.stringify(requestBody),
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

		const responseText = await response.text();
		const preview =
			responseText.length > 1000
				? responseText.substring(0, 1000) + "..."
				: responseText;
		log("📦", "Raw Response Preview (first 1000 chars):", colors.blue);
		console.log(preview);

		const data = JSON.parse(responseText);

		// Check Status
		if (!data.Status) {
			log("❌", "No Status object in response", colors.red);
			return false;
		}

		log(
			"📊",
			`Status ResultCode: ${data.Status.ResultCode} | SequenceID: ${data.Status.SequenceID}`,
			colors.blue
		);

		if (data.Status.ResultCode !== "1") {
			log(
				"❌",
				`Availability Failed - ResultCode: ${data.Status.ResultCode}`,
				colors.red
			);
			log("❌", `Error Message: ${data.Status.Error}`, colors.red);
			return false;
		}

		log("✅", "Availability Request Successful!", colors.green);

		// Analyze flight results
		if (!data.ItineraryFlightList || data.ItineraryFlightList.length === 0) {
			log("⚠️", "No flights found for the search criteria", colors.yellow);
			log("📊", "Trackid: " + (data.Trackid || "N/A"), colors.yellow);
			return true; // Still successful, just no flights
		}

		log("🎫", "Trackid: " + data.Trackid, colors.green);
		log(
			"✈️",
			`Found ${data.ItineraryFlightList.length} itinerary group(s)`,
			colors.green
		);

		// Count total flights
		let totalFlights = 0;
		data.ItineraryFlightList.forEach((itinerary) => {
			if (itinerary.Items) {
				totalFlights += itinerary.Items.length;
			}
		});

		log("✈️", `Total flight options: ${totalFlights}`, colors.green);

		// Display first few flights
		if (data.ItineraryFlightList[0]?.Items?.length > 0) {
			log("\n📋", "Sample Flights (first 3):", colors.cyan);

			const sampleFlights = data.ItineraryFlightList[0].Items.slice(0, 3);
			sampleFlights.forEach((item, index) => {
				if (item.FlightDetails && item.FlightDetails.length > 0) {
					const flight = item.FlightDetails[0];
					console.log(
						`\n  ${index + 1}. ${flight.AirlineDescription} ${
							flight.FlightNumber
						}`
					);
					console.log(`     ${flight.Origin} → ${flight.Destination}`);
					console.log(
						`     Depart: ${flight.DepartureDateTime} | Arrive: ${flight.ArrivalDateTime}`
					);
					console.log(`     Class: ${flight.Class} | Stops: ${flight.Stops}`);

					if (item.Fares && item.Fares.length > 0) {
						const fare = item.Fares[0];
						if (fare.Faredescription && fare.Faredescription.length > 0) {
							const fareDetail = fare.Faredescription[0];
							console.log(
								`     Price: ${fare.Currency} ${fareDetail.NetAmount} (${fareDetail.Paxtype})`
							);
						}
					}
				}
			});
		}

		return true;
	} catch (error) {
		log("❌", "Availability Request Failed:", colors.red);
		console.error(error);
		return false;
	}
}

/**
 * Main test execution
 */
async function runTests() {
	console.log("\n");
	log("🚀", "AIRiQ API Complete Integration Test", colors.bright + colors.cyan);
	log("📅", `Test Date: ${new Date().toISOString()}`, colors.blue);
	console.log("\n");

	// Test 1: Login
	const token = await testLogin();

	if (!token) {
		logSection("TEST SUMMARY");
		log("❌", "Tests FAILED - Login unsuccessful", colors.red);
		process.exit(1);
	}

	// Add delay between requests
	log(
		"\n⏱️",
		"Waiting 2 seconds before Availability request...",
		colors.yellow
	);
	await new Promise((resolve) => setTimeout(resolve, 2000));

	// Test 2: Availability
	const availabilitySuccess = await testAvailability(token);

	// Summary
	logSection("TEST SUMMARY");
	log("✅", "Login: SUCCESS", colors.green);
	log(
		availabilitySuccess ? "✅" : "❌",
		`Availability: ${availabilitySuccess ? "SUCCESS" : "FAILED"}`,
		availabilitySuccess ? colors.green : colors.red
	);

	if (!availabilitySuccess) {
		log(
			"\n💡",
			"Note: If Availability failed with a token error, the token might be invalid.",
			colors.yellow
		);
		log(
			"💡",
			"Check the API documentation for token requirements.",
			colors.yellow
		);
	}

	console.log("\n" + "=".repeat(80) + "\n");
	process.exit(availabilitySuccess ? 0 : 1);
}

// Run the tests
runTests().catch((error) => {
	console.error("\n❌ Unexpected error:", error);
	process.exit(1);
});
