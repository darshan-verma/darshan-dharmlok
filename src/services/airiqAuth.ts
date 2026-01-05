/**
 * AIRiQ Authentication Service
 * Handles authentication with AIRiQ API and token management
 *
 * Token Behavior (per AIRiQ documentation):
 * - Tokens are valid through the end of the day (until midnight)
 * - Maximum 5 active logins allowed per user account
 * - When token expires, login must be called again
 */

interface AiriqAuthResponse {
	AgentID: string;
	Status: {
		Error: string;
		ResultCode: string;
		SequenceID: string;
	};
	TerminalID: string;
	Token: string;
	UserName: string;
}

interface TokenCache {
	token: string;
	expiresAt: number;
}

// In-memory token cache
let tokenCache: TokenCache | null = null;

/**
 * Get authentication credentials from environment variables
 */
function getAuthCredentials() {
	const agentId = process.env.AIRIQ_AGENT_ID;
	const username = process.env.AIRIQ_USERNAME;
	const password = process.env.AIRIQ_PASSWORD;
	const apiUrl = process.env.AIRIQ_API_URL;
	const authHeader = process.env.AIRIQ_AUTH_HEADER;

	if (!agentId || !username || !password || !apiUrl || !authHeader) {
		throw new Error(
			"Missing AIRiQ API credentials. Please check environment variables."
		);
	}

	return { agentId, username, password, apiUrl, authHeader };
}

/**
 * Check if cached token is still valid
 */
function isTokenValid(): boolean {
	if (!tokenCache) return false;

	// Check if token expires in less than 5 minutes (buffer time)
	// This ensures we refresh the token before midnight to avoid edge cases
	const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
	return Date.now() < tokenCache.expiresAt - bufferTime;
}

/**
 * Authenticate with AIRiQ API and get a new token
 */
async function authenticateAPI(): Promise<string> {
	const { agentId, username, password, apiUrl, authHeader } =
		getAuthCredentials();

	// Per API doc: Use exact field names as specified
	const requestBody = {
		AgentId: agentId,
		Username: username,
		Password: password,
	};

	try {
		console.log("🔐 AIRiQ Authentication Request:", {
			url: `${apiUrl}/Login`,
			body: requestBody,
			hasAuthHeader: !!authHeader,
			authHeaderValue: authHeader,
		});

		const response = await fetch(`${apiUrl}/Login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: authHeader,
			},
			body: JSON.stringify(requestBody),
		});

		console.log(
			"📡 AIRiQ Login Response Status:",
			response.status,
			response.statusText
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("❌ AIRiQ Login Response Error:", errorText);
			throw new Error(
				`AIRiQ Authentication failed: ${response.status} ${response.statusText} - ${errorText}`
			);
		}

		const responseText = await response.text();
		console.log("📦 AIRiQ Login Raw Response:", responseText);

		const data: AiriqAuthResponse = JSON.parse(responseText);
		console.log(
			"📦 AIRiQ Login Parsed Response:",
			JSON.stringify(data, null, 2)
		);

		// Check if authentication was successful
		// Per API doc: ResultCode "1" means success, "0" means failure, "-1" means exception
		if (!data.Status || data.Status.ResultCode !== "1") {
			const errorMsg =
				data.Status?.Error || "Authentication failed - No status returned";
			const resultCode = data.Status?.ResultCode || "unknown";
			console.error(
				"❌ AIRiQ Auth Failed - ResultCode:",
				resultCode,
				"Error:",
				errorMsg
			);
			console.error("❌ Full Response:", data);
			throw new Error(
				`AIRiQ Authentication Error (Code ${resultCode}): ${errorMsg}`
			);
		}

		if (!data.Token) {
			console.error("❌ AIRiQ Auth Failed - No Token in response:", data);
			throw new Error(
				"AIRiQ Authentication Error: No Token returned in response"
			);
		}

		const token = data.Token;

		// Cache token until end of day (midnight)
		// AIRiQ tokens are valid "through the end of the day" according to their documentation
		const now = new Date();
		const endOfDay = new Date(now);
		endOfDay.setHours(23, 59, 59, 999); // Set to 11:59:59.999 PM today

		const expiresAt = endOfDay.getTime();
		tokenCache = {
			token,
			expiresAt,
		};

		const hoursUntilExpiry =
			Math.round(((expiresAt - Date.now()) / (1000 * 60 * 60)) * 10) / 10;
		console.log(
			`✓ AIRiQ authentication successful. Token cached until end of day (expires in ${hoursUntilExpiry} hours).`
		);
		return token;
	} catch (error) {
		console.error("AIRiQ authentication error:", error);
		throw error;
	}
}

/**
 * Get valid authentication token (from cache or by authenticating)
 * This is the main function to be used throughout the application
 */
export async function getAiriqToken(): Promise<string> {
	if (isTokenValid() && tokenCache) {
		console.log("✓ Using cached AIRiQ token");
		return tokenCache.token;
	}

	console.log("⟳ Fetching new AIRiQ token...");
	return await authenticateAPI();
}

/**
 * Clear cached token (useful for testing or manual refresh)
 */
export function clearTokenCache(): void {
	tokenCache = null;
	console.log("✓ AIRiQ token cache cleared");
}

/**
 * Get token expiration time (for debugging/monitoring)
 */
export function getTokenExpiration(): Date | null {
	if (!tokenCache) return null;
	return new Date(tokenCache.expiresAt);
}

/**
 * Check if a token is currently cached
 */
export function hasValidToken(): boolean {
	return isTokenValid();
}
