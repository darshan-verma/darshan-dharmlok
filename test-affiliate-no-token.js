const axios = require("axios");

async function testAffiliateNoToken() {
	console.log("🏨 Testing TBO Affiliate Hotel Search WITHOUT Token...\n");

	const searchEndpoint = "https://affiliate.tektravels.com/HotelAPI/Search";

	// Test WITHOUT TokenId as per documentation
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
		// NO TokenId field
	};

	console.log("Endpoint:", searchEndpoint);
	console.log("Request:", JSON.stringify(searchRequest, null, 2));
	console.log("\n⏳ Sending search request without token...\n");

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
	}

	console.log("\n✨ Test completed!");
}

testAffiliateNoToken();
