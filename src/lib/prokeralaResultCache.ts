import { createHash } from "crypto";
import IORedis from "ioredis";

const PROKERALA_CACHE_PREFIX = "prokerala:result";
const PROKERALA_CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const PROKERALA_CACHE_VERSION = "v1";

type ProkeralaCachedKind = "json" | "text";

interface ProkeralaCacheEnvelope {
	version: string;
	kind: ProkeralaCachedKind;
	value: string;
	createdAt: number;
}

let redisClient: IORedis | null = null;
let redisUnavailableLogged = false;
let redisErrorLogged = false;

function getRedisClient(): IORedis | null {
	const redisUrl = process.env.REDIS_URL;
	if (!redisUrl) {
		if (!redisUnavailableLogged) {
			console.warn(
				"[prokerala-cache] REDIS_URL is not configured; cache is disabled.",
			);
			redisUnavailableLogged = true;
		}
		return null;
	}

	if (!redisClient) {
		redisClient = new IORedis(redisUrl, {
			maxRetriesPerRequest: null,
			enableReadyCheck: true,
		});
	}

	return redisClient;
}

function sha256(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}

function stableValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => stableValue(item));
	}

	if (value && typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>).sort(
			([a], [b]) => a.localeCompare(b),
		);
		return entries.reduce<Record<string, unknown>>((acc, [key, item]) => {
			acc[key] = stableValue(item);
			return acc;
		}, {});
	}

	return value;
}

function stableStringify(value: unknown): string {
	return JSON.stringify(stableValue(value));
}

function normalizeQuery(query: Record<string, string> | undefined): string {
	if (!query) return "";
	return Object.entries(query)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
		.join("&");
}

function buildCacheKey(method: "GET" | "POST", path: string, fingerprint: string): string {
	const pathNormalized = path.startsWith("/") ? path.slice(1) : path;
	return `${PROKERALA_CACHE_PREFIX}:${PROKERALA_CACHE_VERSION}:${method}:${pathNormalized}:${fingerprint}`;
}

async function getCacheEnvelope(
	cacheKey: string,
): Promise<ProkeralaCacheEnvelope | null> {
	const redis = getRedisClient();
	if (!redis) return null;

	try {
		const raw = await redis.get(cacheKey);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as ProkeralaCacheEnvelope;
		if (!parsed || parsed.version !== PROKERALA_CACHE_VERSION) {
			return null;
		}
		return parsed;
	} catch (error) {
		if (!redisErrorLogged) {
			console.warn("[prokerala-cache] Failed to read cache entry.", error);
			redisErrorLogged = true;
		}
		return null;
	}
}

async function setCacheEnvelope(
	cacheKey: string,
	envelope: ProkeralaCacheEnvelope,
): Promise<void> {
	const redis = getRedisClient();
	if (!redis) return;

	try {
		await redis.set(
			cacheKey,
			JSON.stringify(envelope),
			"EX",
			PROKERALA_CACHE_TTL_SECONDS,
		);
	} catch (error) {
		if (!redisErrorLogged) {
			console.warn("[prokerala-cache] Failed to write cache entry.", error);
			redisErrorLogged = true;
		}
	}
}

export async function getCachedProkeralaJson<T>(
	path: string,
	query: Record<string, string> | undefined,
): Promise<T | null> {
	const queryFingerprint = sha256(normalizeQuery(query));
	const cacheKey = buildCacheKey("GET", path, queryFingerprint);
	const envelope = await getCacheEnvelope(cacheKey);
	if (!envelope || envelope.kind !== "json") return null;
	return JSON.parse(envelope.value) as T;
}

export async function setCachedProkeralaJson(
	path: string,
	query: Record<string, string> | undefined,
	value: unknown,
): Promise<void> {
	const queryFingerprint = sha256(normalizeQuery(query));
	const cacheKey = buildCacheKey("GET", path, queryFingerprint);
	await setCacheEnvelope(cacheKey, {
		version: PROKERALA_CACHE_VERSION,
		kind: "json",
		value: stableStringify(value),
		createdAt: Date.now(),
	});
}

export async function getCachedProkeralaPostJson<T>(
	path: string,
	body: unknown,
): Promise<T | null> {
	const bodyFingerprint = sha256(stableStringify(body));
	const cacheKey = buildCacheKey("POST", path, bodyFingerprint);
	const envelope = await getCacheEnvelope(cacheKey);
	if (!envelope || envelope.kind !== "json") return null;
	return JSON.parse(envelope.value) as T;
}

export async function setCachedProkeralaPostJson(
	path: string,
	body: unknown,
	value: unknown,
): Promise<void> {
	const bodyFingerprint = sha256(stableStringify(body));
	const cacheKey = buildCacheKey("POST", path, bodyFingerprint);
	await setCacheEnvelope(cacheKey, {
		version: PROKERALA_CACHE_VERSION,
		kind: "json",
		value: stableStringify(value),
		createdAt: Date.now(),
	});
}

export async function getCachedProkeralaText(
	path: string,
	query: Record<string, string> | undefined,
): Promise<string | null> {
	const queryFingerprint = sha256(normalizeQuery(query));
	const cacheKey = buildCacheKey("GET", path, queryFingerprint);
	const envelope = await getCacheEnvelope(cacheKey);
	if (!envelope || envelope.kind !== "text") return null;
	return envelope.value;
}

export async function setCachedProkeralaText(
	path: string,
	query: Record<string, string> | undefined,
	value: string,
): Promise<void> {
	const queryFingerprint = sha256(normalizeQuery(query));
	const cacheKey = buildCacheKey("GET", path, queryFingerprint);
	await setCacheEnvelope(cacheKey, {
		version: PROKERALA_CACHE_VERSION,
		kind: "text",
		value,
		createdAt: Date.now(),
	});
}
