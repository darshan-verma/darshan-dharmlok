/**
 * Test script for TBO Hotel API Authentication
 * Run with: node test-tbo-hotel-auth.js
 */

const TEKTRAVELS_API_URL =
	"http://Sharedapi.tektravels.com/SharedData.svc/rest";

const authRequest = {
	ClientId: "ApiIntegrationNew",
	UserName: "Dharmlok",
	Password: "Dharmlok@1234",
	EndUserIp: "192.168.11.120",
};

async function testAuthentication() {
	console.log("🔐 Testing TBO Hotel API Authentication...\n");
	console.log("Endpoint:", `${TEKTRAVELS_API_URL}/Authenticate`);
	console.log("Request Data:", JSON.stringify(authRequest, null, 2));
	console.log("\n⏳ Sending authentication request...\n");

	try {
		const response = await fetch(`${TEKTRAVELS_API_URL}/Authenticate`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(authRequest),
		});

		console.log("Status:", response.status, response.statusText);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log("\n✅ Authentication Response:");
		console.log(JSON.stringify(data, null, 2));

		if (data.Status === 1 && data.TokenId) {
			console.log("\n🎉 SUCCESS! Token received:");
			console.log("Token ID:", data.TokenId);
			console.log("Token Length:", data.TokenId.length, "characters");
			console.log("\n📝 This token is valid for 24 hours");
			console.log("💾 Token will be cached and auto-refreshed when needed");
			return data.TokenId;
		} else {
			console.log("\n❌ Authentication failed");
			if (data.Error) {
				console.log("Error Code:", data.Error.ErrorCode);
				console.log("Error Message:", data.Error.ErrorMessage);
			}
			return null;
		}
	} catch (error) {
		console.error("\n❌ Authentication error:", error.message);
		return null;
	}
}

// Test hotel search (if authentication succeeds)
async function testHotelSearch(token) {
	console.log("\n\n🏨 Testing Hotel Search API...\n");

	const searchRequest = {
		CheckIn: "2026-01-15",
		CheckOut: "2026-01-17",
		HotelCodes: "215869,215870", // Example hotel codes
		GuestNationality: "IN",
		NoOfRooms: 1,
		PaxRooms: [
			{
				Adults: 2,
				Children: 0,
				ChildrenAges: [],
			},
		],
		IsDetailedResponse: false,
		TokenId: token,
	};

	console.log("Search Request:", JSON.stringify(searchRequest, null, 2));
	console.log("\n⏳ Sending search request...\n");

	try {
		const response = await fetch(
			"http://api.tektravels.com/BookingEngineService_Hotel/HotelService.svc/rest/GetHotelResult",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(searchRequest),
			}
		);

		console.log("Status:", response.status, response.statusText);

		const data = await response.json();
		console.log("\n📊 Search Response:");
		console.log(JSON.stringify(data, null, 2).substring(0, 500) + "...");

		if (data.HotelResult && data.HotelResult.length > 0) {
			console.log("\n✅ Found", data.HotelResult.length, "hotels");
		}
	} catch (error) {
		console.error("\n❌ Search error:", error.message);
	}
}

// Run tests
async function runTests() {
	const token = await testAuthentication();

	if (token) {
		// Uncomment to test hotel search
		// await testHotelSearch(token);
	}

	console.log("\n✨ Test completed!\n");
}

runTests();
