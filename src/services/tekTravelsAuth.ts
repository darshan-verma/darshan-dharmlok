/**
 * TekTravels Authentication Service
 * Handles authentication with TekTravels API and token management
 * Token is valid for 24 hours and automatically refreshed when expired
 */

interface AuthResponse {
	Status: number;
	TokenId: string;
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
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
	const clientId = process.env.TEKTRAVELS_CLIENT_ID;
	const userId = process.env.TEKTRAVELS_USER_ID;
	const password = process.env.TEKTRAVELS_PASSWORD;
	const apiUrl = process.env.TEKTRAVELS_API_URL;

	if (!clientId || !userId || !password || !apiUrl) {
		throw new Error(
			"Missing TekTravels API credentials. Please check environment variables."
		);
	}

	return { clientId, userId, password, apiUrl };
}

/**
 * Check if cached token is still valid
 */
function isTokenValid(): boolean {
	if (!tokenCache) return false;

	// Check if token expires in less than 5 minutes (buffer time)
	const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
	return Date.now() < tokenCache.expiresAt - bufferTime;
}

/**
 * Authenticate with TekTravels API and get a new token
 */
async function authenticateAPI(): Promise<string> {
	const { clientId, userId, password, apiUrl } = getAuthCredentials();

	const requestBody = {
		ClientId: clientId,
		UserName: userId,
		Password: password,
		EndUserIp: "192.168.11.58", // You may want to make this dynamic
	};

	try {
		const response = await fetch(`${apiUrl}/Authenticate`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			throw new Error(
				`Authentication failed: ${response.status} ${response.statusText}`
			);
		}

		const data: AuthResponse = await response.json();

		if (data.Status !== 1 || !data.TokenId) {
			const errorMsg = data.Error?.ErrorMessage || "Authentication failed";
			throw new Error(`TekTravels API Error: ${errorMsg}`);
		}

		// Cache token for 24 hours (minus 5 minutes buffer)
		const expiresAt = Date.now() + 24 * 60 * 60 * 1000 - 5 * 60 * 1000;
		tokenCache = {
			token: data.TokenId,
			expiresAt,
		};

		console.log("✓ TekTravels authentication successful. Token cached.");
		return data.TokenId;
	} catch (error) {
		console.error("TekTravels authentication error:", error);
		throw error;
	}
}

/**
 * Get valid authentication token (from cache or by authenticating)
 * This is the main function to be used throughout the application
 */
export async function getTekTravelsToken(): Promise<string> {
	if (isTokenValid() && tokenCache) {
		console.log("✓ Using cached TekTravels token");
		return tokenCache.token;
	}

	console.log("⟳ Fetching new TekTravels token...");
	return await authenticateAPI();
}

/**
 * Clear cached token (useful for testing or manual refresh)
 */
export function clearTokenCache(): void {
	tokenCache = null;
	console.log("✓ Token cache cleared");
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
