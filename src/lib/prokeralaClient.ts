/**
 * Prokerala API client (server-only)
 *
 * Authenticated HTTP client for Prokerala v2 API. Uses cached access token
 * (valid 1 hour, reused until expiry). Do not import in client components.
 */

import { getProkeralaAccessToken } from "@/lib/prokeralaAuth";

const PROKERALA_API_BASE = "https://api.prokerala.com/v2";

export interface ProkeralaFetchOptions {
	query?: Record<string, string>;
}

export interface ProkeralaPostOptions<TBody = unknown> {
	body: TBody;
	headers?: Record<string, string>;
}

/**
 * Make an authenticated GET request to the Prokerala v2 API.
 *
 * @param path - Path under /v2/ (e.g. "astrology/kundli" -> https://api.prokerala.com/v2/astrology/kundli)
 * @param options - Optional query params
 * @returns Parsed JSON response
 */
export async function prokeralaFetch<T = unknown>(
	path: string,
	options?: ProkeralaFetchOptions
): Promise<T> {
	const token = await getProkeralaAccessToken();
	const pathNormalized = path.startsWith("/") ? path.slice(1) : path;
	const url = new URL(`${PROKERALA_API_BASE}/${pathNormalized}`);
	if (options?.query) {
		Object.entries(options.query).forEach(([k, v]) =>
			url.searchParams.set(k, v)
		);
	}

	const res = await fetch(url.toString(), {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/json",
		},
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(
			`Prokerala API error (${res.status}): ${text || res.statusText}`
		);
	}

	return res.json() as Promise<T>;
}

/**
 * Make an authenticated POST request to the Prokerala v2 API.
 *
 * @param path - Path under /v2/
 * @param options - JSON body and optional headers
 * @returns Parsed JSON response
 */
export async function prokeralaFetchPost<TResponse = unknown, TBody = unknown>(
	path: string,
	options: ProkeralaPostOptions<TBody>
): Promise<TResponse> {
	const token = await getProkeralaAccessToken();
	const pathNormalized = path.startsWith("/") ? path.slice(1) : path;
	const url = new URL(`${PROKERALA_API_BASE}/${pathNormalized}`);

	const res = await fetch(url.toString(), {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/json",
			"Content-Type": "application/json",
			...(options.headers ?? {}),
		},
		body: JSON.stringify(options.body),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(
			`Prokerala API error (${res.status}): ${text || res.statusText}`
		);
	}

	return res.json() as Promise<TResponse>;
}

/**
 * Make an authenticated GET request to the Prokerala v2 Chart API.
 * Returns SVG string (image/svg+xml); use for astrology/chart only.
 *
 * @param path - Path under /v2/ (e.g. "astrology/chart")
 * @param options - Optional query params
 * @returns SVG response body as string
 */
export async function prokeralaFetchChart(
	path: string,
	options?: ProkeralaFetchOptions
): Promise<string> {
	const token = await getProkeralaAccessToken();
	const pathNormalized = path.startsWith("/") ? path.slice(1) : path;
	const url = new URL(`${PROKERALA_API_BASE}/${pathNormalized}`);
	if (options?.query) {
		Object.entries(options.query).forEach(([k, v]) =>
			url.searchParams.set(k, v)
		);
	}

	const res = await fetch(url.toString(), {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "image/svg+xml",
		},
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(
			`Prokerala API error (${res.status}): ${text || res.statusText}`
		);
	}

	return res.text();
}
