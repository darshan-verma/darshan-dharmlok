/**
 * AIRiQ Authentication Service
 * Handles authentication with AIRiQ API and token management
 *
 * Token Behavior (per AIRiQ documentation):
 * - Tokens are valid through the end of the day (until midnight)
 * - Maximum 5 active logins allowed per user account
 * - When token expires, login must be called again
 */

import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

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
	createdAt: number;
}

// File-based token cache (persists across server restarts)
const TOKEN_CACHE_DIR = path.join(process.cwd(), ".cache");
const TOKEN_CACHE_FILE = path.join(TOKEN_CACHE_DIR, "airiq-token.json");

// In-memory cache for faster access (but not the source of truth)
let memoryCache: TokenCache | null = null;

// Prevent concurrent authentication attempts (race condition protection)
let authenticationPromise: Promise<string> | null = null;

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
 * Ensure cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
	try {
		await mkdir(TOKEN_CACHE_DIR, { recursive: true });
	} catch (error) {
		// Ignore if directory already exists
		const nodeError = error as { code?: string };
		if (nodeError.code !== "EEXIST") {
			console.error("Error creating cache directory:", error);
		}
	}
}

/**
 * Read token from file cache
 */
async function readTokenFromFile(): Promise<TokenCache | null> {
	try {
		const data = await readFile(TOKEN_CACHE_FILE, "utf-8");
		const cache: TokenCache = JSON.parse(data);
		return cache;
	} catch (error) {
		// File doesn't exist or is invalid
		const nodeError = error as { code?: string };
		if (nodeError.code !== "ENOENT") {
			console.warn("Error reading token cache file:", error);
		}
		return null;
	}
}

/**
 * Write token to file cache
 */
async function writeTokenToFile(cache: TokenCache): Promise<void> {
	try {
		await ensureCacheDir();
		await writeFile(TOKEN_CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
		console.log("✓ Token saved to persistent cache");
	} catch (error) {
		console.error("Error writing token cache file:", error);
	}
}

/**
 * Delete token cache file
 */
async function deleteTokenFile(): Promise<void> {
	try {
		await unlink(TOKEN_CACHE_FILE);
		console.log("✓ Token cache file deleted");
	} catch (error) {
		const nodeError = error as { code?: string };
		if (nodeError.code !== "ENOENT") {
			console.warn("Error deleting token cache file:", error);
		}
	}
}

/**
 * Check if cached token is still valid
 */
function isTokenValid(cache: TokenCache | null): boolean {
	if (!cache) return false;

	// Check if token expires in less than 5 minutes (buffer time)
	// This ensures we refresh the token before midnight to avoid edge cases
	const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
	return Date.now() < cache.expiresAt - bufferTime;
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
		const cache: TokenCache = {
			token,
			expiresAt,
			createdAt: Date.now(),
		};

		// Store in both memory and file for persistence
		memoryCache = cache;
		await writeTokenToFile(cache);

		const hoursUntilExpiry =
			Math.round(((expiresAt - Date.now()) / (1000 * 60 * 60)) * 10) / 10;
		console.log(
			`✓ AIRiQ authentication successful. Token cached persistently until end of day (expires in ${hoursUntilExpiry} hours).`
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
	// Check memory cache first (fastest)
	if (isTokenValid(memoryCache)) {
		console.log("✓ Using cached AIRiQ token (from memory)");
		return memoryCache!.token;
	}

	// Check file cache (persists across server restarts)
	const fileCache = await readTokenFromFile();
	if (isTokenValid(fileCache)) {
		console.log("✓ Using cached AIRiQ token (from file)");
		memoryCache = fileCache; // Update memory cache
		return fileCache!.token;
	}

	// If authentication is already in progress, wait for it (prevents race conditions)
	if (authenticationPromise) {
		console.log("⏳ Authentication in progress, waiting...");
		return await authenticationPromise;
	}

	// Start new authentication and store the promise
	console.log("⟳ Fetching new AIRiQ token (cache expired or not found)...");
	authenticationPromise = authenticateAPI()
		.then((token) => {
			authenticationPromise = null; // Clear after completion
			return token;
		})
		.catch((error) => {
			authenticationPromise = null; // Clear on error
			throw error;
		});

	return await authenticationPromise;
}

/**
 * Clear cached token (useful for testing or manual refresh)
 */
export async function clearTokenCache(): Promise<void> {
	memoryCache = null;
	await deleteTokenFile();
	console.log("✓ AIRiQ token cache cleared (memory and file)");
}

/**
 * Get token expiration time (for debugging/monitoring)
 */
export async function getTokenExpiration(): Promise<Date | null> {
	// Check memory first
	if (memoryCache) return new Date(memoryCache.expiresAt);

	// Check file
	const fileCache = await readTokenFromFile();
	if (fileCache) return new Date(fileCache.expiresAt);

	return null;
}

/**
 * Check if a token is currently cached
 */
export async function hasValidToken(): Promise<boolean> {
	if (isTokenValid(memoryCache)) return true;
	const fileCache = await readTokenFromFile();
	return isTokenValid(fileCache);
}
