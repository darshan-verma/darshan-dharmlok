import { NextRequest, NextResponse } from "next/server";
import {
	isTripjackImageHostAllowed,
	verifyTripjackImageProxySignature,
} from "@/lib/tripjackHotelImageProxy";

export const runtime = "nodejs";

const DEFAULT_UA = "DharmlokTravel/1.0 (hotel-image-proxy)";

export async function GET(req: NextRequest) {
	const u = req.nextUrl.searchParams.get("u");
	const sig = req.nextUrl.searchParams.get("sig");
	if (!u || !sig) {
		return NextResponse.json({ error: "Missing u or sig" }, { status: 400 });
	}

	let imageUrl: string;
	try {
		imageUrl = decodeURIComponent(u);
	} catch {
		return NextResponse.json({ error: "Invalid u" }, { status: 400 });
	}

	if (!/^https:\/\//i.test(imageUrl)) {
		return NextResponse.json({ error: "Only https URLs allowed" }, { status: 400 });
	}

	let parsed: URL;
	try {
		parsed = new URL(imageUrl);
	} catch {
		return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
	}

	if (!isTripjackImageHostAllowed(parsed.hostname)) {
		return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
	}

	if (!verifyTripjackImageProxySignature(imageUrl, sig)) {
		return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
	}

	const referer = process.env.TRIPJACK_IMAGE_REFERER?.trim();
	const userAgent =
		process.env.TRIPJACK_IMAGE_USER_AGENT?.trim() || DEFAULT_UA;

	let upstream: Response;
	try {
		upstream = await fetch(imageUrl, {
			headers: {
				"User-Agent": userAgent,
				...(referer ? { Referer: referer } : {}),
				Accept: "image/*,*/*;q=0.8",
			},
			redirect: "follow",
		});
	} catch {
		return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
	}

	if (!upstream.ok) {
		return new NextResponse(null, {
			status: upstream.status === 403 ? 404 : upstream.status,
		});
	}

	const buf = await upstream.arrayBuffer();
	const contentType =
		upstream.headers.get("content-type")?.split(";")[0]?.trim() ||
		"image/jpeg";

	return new NextResponse(buf, {
		status: 200,
		headers: {
			"Content-Type": contentType,
			"Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
		},
	});
}
