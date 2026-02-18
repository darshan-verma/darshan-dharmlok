const DEFAULT_LIVE_TTL_SECONDS = 120;
const DEFAULT_LIVE_PLAYBACK_PREFIX = "live";

export function getRedisUrl(): string {
	const redisUrl = process.env.REDIS_URL;
	if (!redisUrl) {
		throw new Error("REDIS_URL is required");
	}
	return redisUrl;
}

export function getLiveIngestBaseUrl(): string {
	const baseUrl = process.env.LIVE_INGEST_BASE_URL;
	if (!baseUrl) {
		throw new Error("LIVE_INGEST_BASE_URL is required");
	}
	return baseUrl.replace(/\/+$/, "");
}

export function getLivePlaybackBaseUrl(): string {
	const baseUrl = process.env.LIVE_PLAYBACK_BASE_URL;
	if (!baseUrl) {
		throw new Error("LIVE_PLAYBACK_BASE_URL is required");
	}
	return baseUrl.replace(/\/+$/, "");
}

export function getLivePlaybackPrefix(): string {
	return (process.env.LIVE_PLAYBACK_PREFIX || DEFAULT_LIVE_PLAYBACK_PREFIX).replace(
		/^\/+|\/+$/g,
		""
	);
}

export function getLiveTokenTtlSeconds(): number {
	const raw = process.env.LIVE_PLAYBACK_TOKEN_TTL_SECONDS;
	if (!raw) {
		return DEFAULT_LIVE_TTL_SECONDS;
	}
	const parsed = Number.parseInt(raw, 10);
	return Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_LIVE_TTL_SECONDS : parsed;
}

export function getCloudFrontKeyPairId(): string {
	const value = process.env.CLOUDFRONT_KEY_PAIR_ID;
	if (!value) {
		throw new Error("CLOUDFRONT_KEY_PAIR_ID is required");
	}
	return value;
}

export function getCloudFrontPrivateKey(): string {
	const value = process.env.CLOUDFRONT_PRIVATE_KEY;
	if (!value) {
		throw new Error("CLOUDFRONT_PRIVATE_KEY is required");
	}
	return value.replace(/\\n/g, "\n");
}

export function getCloudFrontCookieDomain(): string | undefined {
	return process.env.CLOUDFRONT_COOKIE_DOMAIN;
}
