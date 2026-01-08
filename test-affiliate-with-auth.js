const axios = require("axios");

async function testAffiliateWithToken() {
	console.log("🔐 Testing TBO Affiliate API with Token Authentication...\n");

	// Step 1: Get Authentication Token
	const authEndpoint =
		"http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate";
	const authData = {
		ClientId: "ApiIntegrationNew",
		UserName: "Dharmlok",
		Password: "Dharmlok@123",
		EndUserIp: "192.168.11.120",
	};

	console.log("⏳ Getting authentication token...");
	const authResponse = await axios.post(authEndpoint, authData, {
		headers: { "Content-Type": "application/json" },
	});

	const token = authResponse.data.TokenId;
	console.log(`✅ Token received: ${token}\n`);

	// Step 2: Test with exact format from user's example
	const searchEndpoint = "https://affiliate.tektravels.com/HotelAPI/Search";

	const searchRequest = {
		CheckIn: "2026-01-10",
		CheckOut: "2026-01-12",
		HotelCodes: "1279415", // Using the example code from user's format
		GuestNationality: "IN",
		PaxRooms: [
			{
				Adults: 1,
				Children: 0,
				ChildrenAges: null,
			},
		],
		ResponseTime: 23.0,
		IsDetailedResponse: true,
		Filters: {
			Refundable: false,
			NoOfRooms: 0,
			MealType: null,
			StarRating: null,
		},
		TokenId: token,
	};

	console.log("🏨 Testing Affiliate Hotel Search with single room...");
	console.log("Endpoint:", searchEndpoint);
	console.log("Request:", JSON.stringify(searchRequest, null, 2));
	console.log("\n⏳ Sending search request...\n");

	try {
		const searchResponse = await axios.post(searchEndpoint, searchRequest, {
			headers: {
				"Content-Type": "application/json",
			},
		});

		console.log("Status:", searchResponse.status, "OK\n");
		console.log("✅ Search Response:");
		console.log(JSON.stringify(searchResponse.data, null, 2));
	} catch (error) {
		console.log("Status:", error.response?.status || "Error");
		console.log("❌ Error Response:");
		console.log(JSON.stringify(error.response?.data || error.message, null, 2));

		// If 401, try with Authorization header
		if (error.response?.status === 401) {
			console.log("\n🔄 Retrying with Authorization header...\n");
			try {
				const retryResponse = await axios.post(searchEndpoint, searchRequest, {
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				});
				console.log("✅ Success with Bearer token!");
				console.log(JSON.stringify(retryResponse.data, null, 2));
			} catch (retryError) {
				console.log("❌ Still failed with Bearer token");
				console.log(
					JSON.stringify(
						retryError.response?.data || retryError.message,
						null,
						2
					)
				);
			}
		}
	}

	console.log("\n✨ Test completed!");
}

testAffiliateWithToken();
