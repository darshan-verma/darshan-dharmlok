import { NextRequest, NextResponse } from "next/server";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

type NominatimHit = {
	lat: string;
	lon: string;
};

/**
 * GET /api/geocode?q=Delhi
 * Server-side proxy to Nominatim (fair-use: one request per user action).
 * Returns { lat: number, lng: number }.
 */
export async function GET(request: NextRequest) {
	const q = request.nextUrl.searchParams.get("q")?.trim();
	if (!q || q.length < 2) {
		return NextResponse.json(
			{ error: "Missing or too short query parameter: q" },
			{ status: 400 }
		);
	}

	const url = new URL(NOMINATIM);
	url.searchParams.set("q", q);
	url.searchParams.set("format", "json");
	url.searchParams.set("limit", "1");

	try {
		const res = await fetch(url.toString(), {
			headers: {
				// Nominatim usage policy: identify the application
				"User-Agent": "DharmlokHoroscope/1.0 (contact: web)",
				Accept: "application/json",
			},
			next: { revalidate: 0 },
		});

		if (!res.ok) {
			return NextResponse.json(
				{ error: "Geocoding service unavailable", status: res.status },
				{ status: 502 }
			);
		}

		const data = (await res.json()) as NominatimHit[];
		const hit = data[0];
		if (!hit?.lat || !hit?.lon) {
			return NextResponse.json(
				{ error: "No location found for that query" },
				{ status: 404 }
			);
		}

		const lat = Number(hit.lat);
		const lng = Number(hit.lon);
		if (Number.isNaN(lat) || Number.isNaN(lng)) {
			return NextResponse.json(
				{ error: "Invalid coordinates in geocoding response" },
				{ status: 502 }
			);
		}

		return NextResponse.json({ lat, lng });
	} catch (e) {
		const message = e instanceof Error ? e.message : "Unknown error";
		console.error("Geocode error:", e);
		return NextResponse.json(
			{ error: "Geocoding failed", details: message },
			{ status: 500 }
		);
	}
}
