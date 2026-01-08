const axios = require("axios");

async function testAffiliateSearch() {
	console.log("🔐 Testing TBO Affiliate Hotel Search API...\n");

	// Step 1: Get Authentication Token
	const authEndpoint =
		"http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate";
	const authData = {
		ClientId: "ApiIntegrationNew",
		UserName: "Dharmlok",
		Password: "Dharmlok@1234",
		EndUserIp: "192.168.11.120",
	};

	console.log("⏳ Getting authentication token...");
	const authResponse = await axios.post(authEndpoint, authData, {
		headers: { "Content-Type": "application/json" },
	});

	const token = authResponse.data.TokenId;
	console.log(`✅ Token received: ${token}\n`);

	// Step 2: Search Hotels using Affiliate API
	const searchEndpoint = "https://affiliate.tektravels.com/HotelAPI/Search";

	// Test with database hotel codes from Agra
	const searchRequest = {
		CheckIn: "2026-01-10",
		CheckOut: "2026-01-12",
		HotelCodes: "5222209,6186967,1525589", // First 3 from your DB
		GuestNationality: "IN",
		PaxRooms: [
			{
				Adults: 2,
				Children: 0,
				ChildrenAges: null, // null, not empty array
			},
		],
		ResponseTime: 23.0,
		IsDetailedResponse: true,
		Filters: {
			Refundable: false,
			NoOfRooms: 0, // 0 to get all rooms available
			MealType: null,
			StarRating: null,
		},
		TokenId: token,
	};

	console.log("🏨 Testing Affiliate Hotel Search API...");
	console.log("Endpoint:", searchEndpoint);
	console.log("Request:", JSON.stringify(searchRequest, null, 2));
	console.log("\n⏳ Sending search request...\n");

	try {
		const searchResponse = await axios.post(searchEndpoint, searchRequest, {
			headers: { "Content-Type": "application/json" },
		});

		console.log("Status:", searchResponse.status, "OK\n");
		console.log("✅ Search Response:");
		console.log(JSON.stringify(searchResponse.data, null, 2));
	} catch (error) {
		console.log("Status:", error.response?.status || "Error");
		console.log("❌ Search error:", error.response?.data || error.message);
	}

	console.log("\n✨ Test completed!");
}

testAffiliateSearch();
