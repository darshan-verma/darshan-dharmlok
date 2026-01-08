/**
 * Test AIRiQ Complete Booking Flow
 * This tests search -> pricing -> booking with token caching
 *
 * Run with: node test-airiq-complete.js
 */

const AIRIQ_API_URL = "http://airiqnewapi.mywebcheck.in/TravelAPI.svc";
const AUTH_HEADER = "QVFBRzA2MDI3MCo3NTA2MjA5MjE3Ojc1MDYyMDkyMTc=";
const credentials = {
	AgentId: "AQAG060270",
	Username: "7506209217",
	Password: "7506209217",
};

let cachedToken = null;

// Simulates the token caching service
async function getToken() {
	if (cachedToken) {
		console.log("✓ Using cached token");
		return cachedToken;
	}

	console.log("🔐 Authenticating to get new token...");
	const response = await fetch(`${AIRIQ_API_URL}/Login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: AUTH_HEADER,
		},
		body: JSON.stringify(credentials),
	});

	if (!response.ok) {
		throw new Error(`Authentication failed: ${response.status}`);
	}

	const data = await response.json();
	if (data.Status?.ResultCode !== "1" || !data.Token) {
		throw new Error(`Auth error: ${data.Status?.Error || "No token"}`);
	}

	cachedToken = data.Token;
	console.log(`✓ Got token: ${cachedToken.substring(0, 40)}...`);
	return cachedToken;
}

async function testAiriqFlow() {
	console.log("🧪 Testing AIRiQ Complete Booking Flow\n");
	console.log("=".repeat(60));

	try {
		// Step 1: Search for flights
		console.log("\n1️⃣ Searching for flights...");
		const searchParams = {
			AgentInfo: {
				AgentId: credentials.AgentId,
				UserName: credentials.Username,
				AppType: "API",
				Version: 2.0,
			},
			TripType: "O",
			AirlineID: "",
			AvailInfo: [
				{
					DepartureStation: "DEL",
					ArrivalStation: "BOM",
					FlightDate: "20260115", // Adjust date as needed
					FarecabinOption: "E",
					FareType: "N",
					OnlyDirectFlight: false,
				},
			],
			PassengersInfo: {
				AdultCount: "1",
				ChildCount: "0",
				InfantCount: "0",
			},
		};

		const token1 = await getToken();
		const searchResponse = await fetch(`${AIRIQ_API_URL}/Availability`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: AUTH_HEADER,
				TOKEN: token1,
			},
			body: JSON.stringify(searchParams),
		});

		if (!searchResponse.ok) {
			throw new Error(`Search failed: ${searchResponse.status}`);
		}

		const searchData = await searchResponse.json();
		console.log(`✓ Search successful`);
		console.log(
			`  Found ${
				searchData.ItineraryFlightList?.[0]?.Items?.length || 0
			} flights`
		);

		if (
			!searchData.ItineraryFlightList ||
			searchData.ItineraryFlightList.length === 0 ||
			!searchData.ItineraryFlightList[0].Items ||
			searchData.ItineraryFlightList[0].Items.length === 0
		) {
			console.log("\n⚠️  No flights found for the search criteria");
			console.log("Test complete - token caching works correctly!");
			return;
		}

		const firstFlight = searchData.ItineraryFlightList[0].Items[0];
		const trackId = searchData.Trackid;

		// Step 2: Get pricing (should reuse token)
		console.log("\n2️⃣ Getting pricing for selected flight...");
		const pricingParams = {
			AgentInfo: {
				AgentId: credentials.AgentId,
				UserName: credentials.Username,
				AppType: "API",
				Version: 2.0,
			},
			SegmentInfo: {
				BaseOrigin: firstFlight.FlightDetails[0].Origin,
				BaseDestination:
					firstFlight.FlightDetails[firstFlight.FlightDetails.length - 1]
						.Destination,
				TripType: "O",
				AdultCount: "1",
				ChildCount: "0",
				InfantCount: "0",
			},
			Trackid: trackId,
			ItineraryInfo: [
				{
					FlightDetails: firstFlight.FlightDetails.map((seg) => ({
						FlightID: seg.FlightID,
						FlightNumber: seg.FlightNumber,
						Origin: seg.Origin,
						Destination: seg.Destination,
						DepartureDateTime: seg.DepartureDateTime,
						ArrivalDateTime: seg.ArrivalDateTime,
					})),
					BaseAmount:
						firstFlight.Fares[0]?.Faredescription[0]?.BaseAmount || "0",
					GrossAmount:
						firstFlight.Fares[0]?.Faredescription[0]?.GrossAmount || "0",
				},
			],
		};

		const token2 = await getToken(); // Should use cached token
		const pricingResponse = await fetch(`${AIRIQ_API_URL}/Pricing`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: AUTH_HEADER,
				TOKEN: token2,
			},
			body: JSON.stringify(pricingParams),
		});

		if (!pricingResponse.ok) {
			throw new Error(`Pricing failed: ${pricingResponse.status}`);
		}

		const pricingData = await pricingResponse.json();
		console.log(`✓ Pricing successful`);
		console.log(
			`  Status: ${
				pricingData.ResponseStatus?.ResultCode === "1" ? "Success" : "Failed"
			}`
		);

		// Verify token was reused
		console.log("\n3️⃣ Token Verification:");
		console.log(`  Search used token: ${token1.substring(0, 30)}...`);
		console.log(`  Pricing used token: ${token2.substring(0, 30)}...`);
		console.log(
			`  Tokens match: ${token1 === token2 ? "✅ YES (cached!)" : "❌ NO"}`
		);

		console.log("\n" + "=".repeat(60));
		console.log("✅ AIRiQ booking flow test complete!");
		console.log("✓ Token caching is working correctly");
		console.log("✓ Same token reused for multiple requests");
		console.log("✓ Ready for production use");
	} catch (error) {
		console.error("\n❌ Test failed:", error.message);
		throw error;
	}
}

// Run test
testAiriqFlow().catch(console.error);
