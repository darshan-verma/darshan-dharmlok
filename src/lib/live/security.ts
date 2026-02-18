import crypto from "node:crypto";
import { getSignedCookies, getSignedUrl } from "@aws-sdk/cloudfront-signer";
import {
	getCloudFrontCookieDomain,
	getCloudFrontKeyPairId,
	getCloudFrontPrivateKey,
	getLivePlaybackBaseUrl,
	getLivePlaybackPrefix,
	getLiveTokenTtlSeconds,
} from "@/lib/live/config";

export function generateStreamKey(): string {
	return crypto.randomBytes(24).toString("hex");
}

export function hashStreamKey(streamKey: string): string {
	return crypto.createHash("sha256").update(streamKey).digest("hex");
}

function toDirectoryWildcard(urlString: string): string {
	const url = new URL(urlString);
	const basePath = url.pathname.substring(0, url.pathname.lastIndexOf("/") + 1);
	url.pathname = `${basePath}*`;
	url.search = "";
	url.hash = "";
	return url.toString();
}

export function getLiveManifestPath(broadcastId: string): string {
	return `${getLivePlaybackPrefix()}/${broadcastId}/master.m3u8`;
}

export function createLivePlaybackGrant(manifestPath: string) {
	const keyPairId = getCloudFrontKeyPairId();
	const privateKey = getCloudFrontPrivateKey();
	const expiresInSeconds = getLiveTokenTtlSeconds();
	const expiresAtEpochMs = Date.now() + expiresInSeconds * 1000;
	const dateLessThan = new Date(expiresAtEpochMs).toISOString();
	const url = `${getLivePlaybackBaseUrl()}/${manifestPath.replace(/^\/+/, "")}`;

	const signedManifestUrl = getSignedUrl({
		url,
		dateLessThan,
		keyPairId,
		privateKey,
	});
	const policy = JSON.stringify({
		Statement: [
			{
				Resource: toDirectoryWildcard(url),
				Condition: {
					DateLessThan: {
						"AWS:EpochTime": Math.floor(expiresAtEpochMs / 1000),
					},
				},
			},
		],
	});
	const cookies = getSignedCookies({
		policy,
		keyPairId,
		privateKey,
	});
	return {
		manifestUrl: signedManifestUrl,
		expiresInSeconds,
		expiresAt: new Date(expiresAtEpochMs).toISOString(),
		cookies: Object.fromEntries(
			Object.entries(cookies).map(([k, v]) => [k, String(v)])
		) as Record<string, string>,
	};
}

export function getCookieDomainForHost(host: string): string | undefined {
	const configured = getCloudFrontCookieDomain();
	if (!configured) {
		return undefined;
	}
	const normalized = configured.replace(/^\./, "").toLowerCase();
	const loweredHost = host.toLowerCase();
	if (loweredHost === normalized || loweredHost.endsWith(`.${normalized}`)) {
		return `.${normalized}`;
	}
	return undefined;
}
