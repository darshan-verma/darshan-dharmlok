const axios = require("axios");

async function testAffiliateWithBasicAuth() {
	console.log("🏨 Testing TBO Affiliate with Basic Auth...\n");

	const searchEndpoint = "https://affiliate.tektravels.com/HotelAPI/Search";

	// Create Basic Auth header with agency credentials
	const username = "Dharmlok";
	const password = "Dharmlok@1234";
	const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");

	const searchRequest = {
		CheckIn: "2026-01-10",
		CheckOut: "2026-01-12",
		HotelCodes: "1279415",
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
	};

	console.log("Test 1: Basic Auth with agency credentials");
	console.log("Authorization: Basic", basicAuth);
	console.log("Request:", JSON.stringify(searchRequest, null, 2));
	console.log("\n⏳ Sending request...\n");

	try {
		const response = await axios.post(searchEndpoint, searchRequest, {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Basic ${basicAuth}`,
			},
		});

		console.log("✅ SUCCESS with Basic Auth!");
		console.log(JSON.stringify(response.data, null, 2));
	} catch (error) {
		console.log("❌ Failed with agency Basic Auth");
		console.log("Status:", error.response?.status);
		console.log(JSON.stringify(error.response?.data || error.message, null, 2));
	}

	// Test 2: Try with static API credentials
	console.log("\n\n" + "=".repeat(60));
	console.log("Test 2: Basic Auth with static API credentials");
	const staticUsername = "TBOStaticAPITest";
	const staticPassword = "Tbo@11530818";
	const staticBasicAuth = Buffer.from(
		`${staticUsername}:${staticPassword}`
	).toString("base64");

	console.log("Authorization: Basic", staticBasicAuth);
	console.log("\n⏳ Sending request...\n");

	try {
		const response2 = await axios.post(searchEndpoint, searchRequest, {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Basic ${staticBasicAuth}`,
			},
		});

		console.log("✅ SUCCESS with Static API Basic Auth!");
		console.log(JSON.stringify(response2.data, null, 2));
	} catch (error) {
		console.log("❌ Failed with static API Basic Auth");
		console.log("Status:", error.response?.status);
		console.log(JSON.stringify(error.response?.data || error.message, null, 2));
	}

	console.log("\n✨ Test completed!");
}

testAffiliateWithBasicAuth();
