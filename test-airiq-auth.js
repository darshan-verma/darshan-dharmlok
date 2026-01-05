/**
 * Test script to debug AIRiQ authentication
 * Run with: node test-airiq-auth.js
 */

const credentials = {
	AgentId: "AQAG060270",
	Username: "7506209217",
	Password: "7506209217",
};

const authHeader = "QVFBRzA2MDI3MCo3NTA2MjA5MjE3Ojc1MDYyMDkyMTc=";
const apiUrl = "http://airiqnewapi.mywebcheck.in/TravelAPI.svc";

async function testAuth() {
	console.log("🧪 Testing AIRiQ Authentication...\n");
	console.log("📍 URL:", `${apiUrl}/Login`);
	console.log("📦 Request Body:", JSON.stringify(credentials, null, 2));
	console.log("🔑 Auth Header:", authHeader);
	console.log("\n⏳ Making request...\n");

	try {
		const response = await fetch(`${apiUrl}/Login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: authHeader,
			},
			body: JSON.stringify(credentials),
		});

		console.log("📡 Response Status:", response.status, response.statusText);
		console.log("📋 Response Headers:");
		response.headers.forEach((value, key) => {
			console.log(`  ${key}: ${value}`);
		});

		const responseText = await response.text();
		console.log("\n📦 Raw Response Body:");
		console.log(responseText);

		try {
			const data = JSON.parse(responseText);
			console.log("\n✅ Parsed JSON Response:");
			console.log(JSON.stringify(data, null, 2));

			// Check for token in different possible locations
			console.log("\n🔍 Token Analysis:");
			console.log("  data.Token:", data.Token);
			console.log("  data.TokenId:", data.TokenId);
			console.log("  data.Status:", data.Status);
			console.log("  data.Error:", data.Error);

			// Check all top-level keys
			console.log("\n📋 All Response Keys:", Object.keys(data));
		} catch (parseError) {
			console.error("\n❌ Failed to parse JSON:", parseError.message);
		}
	} catch (error) {
		console.error("\n❌ Request Failed:", error.message);
	}
}

// Run the test
testAuth();
