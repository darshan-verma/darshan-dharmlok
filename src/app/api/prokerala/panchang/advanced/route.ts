import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import {
	PROKERALA_LANGUAGE_CODES,
	PROKERALA_AYANAMSA_VALUES,
	type ProkeralaPanchangAdvancedResponse,
} from "@/types/prokerala";

const ISO_DATETIME_WITH_OFFSET_REGEX =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+ -]\d{2}:\d{2})$/;

const COORDINATES_REGEX =
	/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

function isValidCoordinates(value: string): boolean {
	const match = value.match(COORDINATES_REGEX);
	if (!match) return false;
	const lat = Number(match[1]);
	const lng = Number(match[2]);
	if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
	return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function normalizeDateTime(raw: string): string {
	if (raw.includes(" ") && !raw.includes("+")) {
		return raw.replace(" ", "+");
	}
	return raw;
}

function isValidDateTime(value: string): boolean {
	if (!ISO_DATETIME_WITH_OFFSET_REGEX.test(value)) return false;
	const d = new Date(value);
	return !Number.isNaN(d.getTime());
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const ayanamsaRaw = searchParams.get("ayanamsa");
	const coordinates = searchParams.get("coordinates");
	const datetimeRaw = searchParams.get("datetime");
	const la = searchParams.get("la");

	// ayanamsa
	if (ayanamsaRaw == null || ayanamsaRaw === "") {
		return NextResponse.json(
			{
				error:
					"Missing required query parameter: ayanamsa (1 for Lahiri, 3 for Raman, 5 for KP)",
			},
			{ status: 400 }
		);
	}
	const ayanamsaNum = Number(ayanamsaRaw);
	if (
		Number.isNaN(ayanamsaNum) ||
		!PROKERALA_AYANAMSA_VALUES.includes(
			ayanamsaNum as (typeof PROKERALA_AYANAMSA_VALUES)[number]
		)
	) {
		return NextResponse.json(
			{
				error: "Invalid ayanamsa",
				allowed: PROKERALA_AYANAMSA_VALUES,
			},
			{ status: 400 }
		);
	}

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

	// language (optional)
	if (la != null && la !== "") {
		if (
			!PROKERALA_LANGUAGE_CODES.includes(
				la as (typeof PROKERALA_LANGUAGE_CODES)[number]
			)
		) {
			return NextResponse.json(
				{
					error: "Invalid language code (la)",
					allowed: PROKERALA_LANGUAGE_CODES,
				},
				{ status: 400 }
			);
		}
	}

	const query: Record<string, string> = {
		ayanamsa: String(ayanamsaNum),
		coordinates,
		datetime,
	};
	if (la && la.trim() !== "") {
		query.la = la.trim();
	}

	try {
		const response =
			await prokeralaFetch<ProkeralaPanchangAdvancedResponse>(
				"astrology/panchang/advanced",
				{ query }
			);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala advanced panchang API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Advanced panchang request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}

