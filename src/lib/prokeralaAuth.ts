/**
 * Prokerala Authentication (server-only)
 *
 * Implements OAuth2 client_credentials flow per Prokerala API docs:
 * - Security: OAuth2
 * - Token URL: https://api.prokerala.com/token
 * - Grant: client_credentials (client_id + client_secret)
 * - Scopes: optional; set PROKERALA_SCOPES in env if the API requires scopes.
 *
 * Token is valid for 1 hour; we reuse it until expiry (do not request per call).
 *
 * Credentials: PROKERALA_CLIENT_ID, PROKERALA_CLIENT_SECRET in .env.local (or deployment env).
 * Do not expose these or this module to the client.
 */

const PROKERALA_TOKEN_URL = "https://api.prokerala.com/token";

interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
}

interface TokenCache {
	accessToken: string;
	expiresAt: number;
}

const TOKEN_BUFFER_MS = 60 * 1000; // Refresh 60 seconds before expiry

let tokenCache: TokenCache | null = null;

function getCredentials(): { clientId: string; clientSecret: string } {
	const clientId = process.env.PROKERALA_CLIENT_ID;
	const clientSecret = process.env.PROKERALA_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new Error(
			"Missing Prokerala credentials. Set PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET in .env.local (or deployment env)."
		);
	}
	return { clientId, clientSecret };
}

function isCachedTokenValid(): boolean {
	if (!tokenCache) return false;
	return Date.now() < tokenCache.expiresAt - TOKEN_BUFFER_MS;
}

/**
 * Request a new access token from Prokerala (POST /token, client_credentials grant).
 */
async function fetchNewToken(): Promise<TokenCache> {
	const { clientId, clientSecret } = getCredentials();

	const body = new URLSearchParams({
		grant_type: "client_credentials",
		client_id: clientId,
		client_secret: clientSecret,
	});
	const scopes = process.env.PROKERALA_SCOPES?.trim();
	if (scopes) {
		body.set("scope", scopes);
	}

	const res = await fetch(PROKERALA_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(
			`Prokerala token request failed (${res.status}): ${text || res.statusText}`
		);
	}

	const data = (await res.json()) as TokenResponse;
	if (!data.access_token || typeof data.expires_in !== "number") {
		throw new Error("Prokerala token response missing access_token or expires_in");
	}

	const expiresAt = Date.now() + data.expires_in * 1000;
	tokenCache = { accessToken: data.access_token, expiresAt };
	return tokenCache;
}

/**
 * Returns a valid access token, reusing the cached one until it expires (1 hour).
 * Call this from server-side only (API routes, server components, server actions).
 */
export async function getProkeralaAccessToken(): Promise<string> {
	if (isCachedTokenValid() && tokenCache) {
		return tokenCache.accessToken;
	}
	const cache = await fetchNewToken();
	return cache.accessToken;
}

/**
 * Clear cached token (e.g. for testing or manual refresh).
 */
export function clearProkeralaTokenCache(): void {
	tokenCache = null;
}
