import { createHmac, timingSafeEqual } from "crypto";
import type { TripjackHotelStaticDetail } from "@/types/tripjack";

function proxySecret(): string {
	return (
		process.env.TRIPJACK_IMAGE_PROXY_SECRET?.trim() ||
		process.env.TRIPJACK_API_KEY?.trim() ||
		""
	);
}

export function isTripjackImageHostAllowed(hostname: string): boolean {
	const h = hostname.toLowerCase();
	if (h === "i.travelapi.com" || h === "static-images.webbeds.com") return true;
	if (h.endsWith(".travelapi.com")) return true;
	if (h.endsWith(".webbeds.com")) return true;
	return false;
}

export function signTripjackImageProxyUrl(url: string): string {
	return createHmac("sha256", proxySecret()).update(url, "utf8").digest("base64url");
}

export function verifyTripjackImageProxySignature(
	url: string,
	sig: string,
): boolean {
	const secret = proxySecret();
	if (!secret || !sig) return false;
	const expected = signTripjackImageProxyUrl(url);
	if (expected.length !== sig.length) return false;
	try {
		return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
	} catch {
		return false;
	}
}

/**
 * Same-origin path for GET /api/travel/tripjack-hotel/image (signed).
 * Returns null if URL is not https, host not allowlisted, or signing secret missing.
 */
export function buildTripjackImageProxyPath(originalUrl: string): string | null {
	const secret = proxySecret();
	if (!secret) return null;
	let parsed: URL;
	try {
		parsed = new URL(originalUrl);
	} catch {
		return null;
	}
	if (parsed.protocol !== "https:") return null;
	if (!isTripjackImageHostAllowed(parsed.hostname)) return null;
	const sig = signTripjackImageProxyUrl(originalUrl);
	return `/api/travel/tripjack-hotel/image?u=${encodeURIComponent(originalUrl)}&sig=${encodeURIComponent(sig)}`;
}

/** Mutates TripJack static detail in place: HTTPS supplier image hrefs → signed proxy paths. */
export function rewriteTripjackStaticDetailProxyImages(
	detail: TripjackHotelStaticDetail,
): void {
	const rewriteHref = (href: string | undefined): string | undefined => {
		if (!href || typeof href !== "string") return href;
		const trimmed = href.trim();
		if (!trimmed.startsWith("https://")) return href;
		return buildTripjackImageProxyPath(trimmed) ?? href;
	};

	if (Array.isArray(detail.images)) {
		for (const img of detail.images) {
			if (!img?.links || typeof img.links !== "object") continue;
			for (const key of Object.keys(img.links)) {
				const entry = img.links[key as keyof typeof img.links];
				if (entry && typeof entry.href === "string") {
					const next = rewriteHref(entry.href);
					if (next) (entry as { href: string }).href = next;
				}
			}
		}
	}

	const rooms = detail.rooms;
	if (!rooms || typeof rooms !== "object") return;
	for (const room of Object.values(rooms)) {
		if (!room?.images || !Array.isArray(room.images)) continue;
		for (const img of room.images) {
			if (!img?.links || typeof img.links !== "object") continue;
			for (const key of Object.keys(img.links)) {
				const entry = img.links[key as keyof typeof img.links];
				if (entry && typeof entry.href === "string") {
					const next = rewriteHref(entry.href);
					if (next) (entry as { href: string }).href = next;
				}
			}
		}
	}
}
