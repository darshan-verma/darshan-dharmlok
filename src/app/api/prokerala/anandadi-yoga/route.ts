import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaAnandadiYogaResponse } from "@/types/prokerala";
import {
	isValidCoordinates,
	isValidDateTime,
	normalizeDateTime,
	validateAyanamsa,
	validateLanguage,
} from "@/app/api/prokerala/_validation";

const ANANDADI_YOGA_LANGUAGE_CODES = ["en", "ta"] as const;

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const ayanamsaRaw = searchParams.get("ayanamsa");
	const coordinates = searchParams.get("coordinates");
	const datetimeRaw = searchParams.get("datetime");
	const laRaw = searchParams.get("la");

	// ayanamsa
	const ayanamsaResult = validateAyanamsa(ayanamsaRaw);
	if (!ayanamsaResult.ok) {
		return NextResponse.json(
			{
				error: ayanamsaResult.error,
				allowed: ayanamsaResult.allowed,
			},
			{ status: 400 }
		);
	}
	const ayanamsa = ayanamsaResult.value;

	// coordinates
	if (!coordinates || typeof coordinates !== "string") {
		return NextResponse.json(
			{
				error:
					"Missing required query parameter: coordinates (lat,lng, e.g. 10.214747,78.097626)",
			},
			{ status: 400 }
		);
	}
	if (!isValidCoordinates(coordinates)) {
		return NextResponse.json(
			{
				error:
					"Invalid coordinates: expected lat,lng within valid latitude/longitude ranges",
			},
			{ status: 400 }
		);
	}

	// datetime
	if (!datetimeRaw || typeof datetimeRaw !== "string") {
		return NextResponse.json(
			{
				error:
					"Missing required query parameter: datetime (ISO-8601 with offset, e.g. 2004-02-12T15:19:21+05:30)",
			},
			{ status: 400 }
		);
	}
	const datetime = normalizeDateTime(datetimeRaw);
	if (!isValidDateTime(datetime)) {
		return NextResponse.json(
			{
				error:
					"Invalid datetime: must be ISO-8601 with timezone offset (YYYY-MM-DDTHH:MM:SS±HH:MM or ...Z)",
			},
			{ status: 400 }
		);
	}

	// language (optional, per docs: en|ta)
	const languageResult = validateLanguage(laRaw, ANANDADI_YOGA_LANGUAGE_CODES);
	if (!languageResult.ok) {
		return NextResponse.json(
			{
				error: languageResult.error,
				allowed: languageResult.allowed,
			},
			{ status: 400 }
		);
	}

	const query: Record<string, string> = {
		ayanamsa: String(ayanamsa),
		coordinates,
		datetime,
	};
	if (languageResult.value) {
		query.la = languageResult.value;
	}

	try {
		const response = await prokeralaFetch<ProkeralaAnandadiYogaResponse>(
			"astrology/anandadi-yoga",
			{ query }
		);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala anandadi-yoga API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Anandadi Yoga request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}

