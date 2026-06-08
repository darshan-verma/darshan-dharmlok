import { NextRequest, NextResponse } from "next/server";
 
const DEFAULT_ALLOWED_HOSTS = [
	process.env.NEXT_PUBLIC_S3_HOSTNAME || "d18us13qqo82ck.cloudfront.net",
	"images.unsplash.com",
	"lh3.googleusercontent.com",
] as const;
 
const MAX_TIMEOUT_MS = 10_000;
const PUBLIC_CACHE_HEADER =
	"public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400";
 
function getAllowedHosts(): Set<string> {
	const fromEnv = (process.env.IMAGE_PROXY_ALLOWED_HOSTS ?? "")
		.split(",")
		.map((host) => host.trim().toLowerCase())
		.filter(Boolean);
 
	return new Set<string>([...DEFAULT_ALLOWED_HOSTS, ...fromEnv]);
}
 
function isAllowedImageUrl(input: string, allowedHosts: Set<string>): boolean {
	try {
		const parsed = new URL(input);
		if (parsed.protocol !== "https:") {
			return false;
		}
 
		const hostname = parsed.hostname.toLowerCase();
		return allowedHosts.has(hostname);
	} catch {
		return false;
	}
}
 
export async function GET(req: NextRequest) {
	const rawUrl = req.nextUrl.searchParams.get("url");
 
	if (!rawUrl) {
		return NextResponse.json(
			{ error: "Missing required query param: url" },
			{ status: 400 }
		);
	}
 
	const allowedHosts = getAllowedHosts();
	if (!isAllowedImageUrl(rawUrl, allowedHosts)) {
		return NextResponse.json(
			{ error: "Image host is not allowed" },
			{ status: 403 }
		);
	}
 
	try {
		const upstream = await fetch(rawUrl, {
			signal: AbortSignal.timeout(MAX_TIMEOUT_MS),
			cache: "force-cache",
			next: { revalidate: 86400 },
			headers: {
				Accept: "image/*,*/*;q=0.8",
			},
		});
 
		if (!upstream.ok || !upstream.body) {
			return NextResponse.json(
				{ error: "Failed to fetch source image" },
				{ status: 502 }
			);
		}
 
		const contentType = upstream.headers.get("content-type") || "";
		if (!contentType.toLowerCase().startsWith("image/")) {
			return NextResponse.json(
				{ error: "Source response is not an image" },
				{ status: 415 }
			);
		}
 
		const headers = new Headers();
		headers.set("Content-Type", contentType);
		headers.set("Cache-Control", PUBLIC_CACHE_HEADER);
		headers.set("X-Content-Type-Options", "nosniff");
 
		const etag = upstream.headers.get("etag");
		if (etag) headers.set("ETag", etag);
 
		const contentLength = upstream.headers.get("content-length");
		if (contentLength) headers.set("Content-Length", contentLength);
 
		return new NextResponse(upstream.body, {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error("Image proxy error:", error);
		return NextResponse.json(
			{ error: "Image proxy request failed" },
			{ status: 500 }
		);
	}
}
