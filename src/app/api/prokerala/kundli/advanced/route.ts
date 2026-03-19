import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaKundliAdvancedResponse } from "@/types/prokerala";
import {
	isValidCoordinates,
	isValidDateTime,
	normalizeDateTime,
	validateAyanamsa,
	validateLanguage,
} from "@/app/api/prokerala/_validation";

const KUNDLI_LANGUAGE_CODES = ["en", "ta", "ml", "hi"] as const;
type KundliLanguageCode = (typeof KUNDLI_LANGUAGE_CODES)[number];

/** year_length: 1 = 365.25 days/year, 0 = 360 days/year. Default 1. */
const YEAR_LENGTH_VALUES = ["0", "1"] as const;

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const ayanamsaRaw = searchParams.get("ayanamsa");
	const coordinates = searchParams.get("coordinates");
	const datetimeRaw = searchParams.get("datetime");
	const laRaw = searchParams.get("la");
	const yearLengthRaw = searchParams.get("year_length");

	const ayanamsaValidation = validateAyanamsa(ayanamsaRaw);
	if (!ayanamsaValidation.ok) {
		return NextResponse.json(
			{ error: ayanamsaValidation.error, allowed: ayanamsaValidation.allowed },
			{ status: 400 }
		);
	}

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

	const laValidation = validateLanguage<KundliLanguageCode>(
		laRaw,
		KUNDLI_LANGUAGE_CODES
	);
	if (!laValidation.ok) {
		return NextResponse.json(
			{ error: laValidation.error, allowed: laValidation.allowed },
			{ status: 400 }
		);
	}

	if (
		yearLengthRaw != null &&
		yearLengthRaw !== "" &&
		!YEAR_LENGTH_VALUES.includes(yearLengthRaw as (typeof YEAR_LENGTH_VALUES)[number])
	) {
		return NextResponse.json(
			{
				error:
					"Invalid year_length: use 1 for 365.25 days per year or 0 for 360 days per year",
				allowed: [...YEAR_LENGTH_VALUES],
			},
			{ status: 400 }
		);
	}

	const query: Record<string, string> = {
		ayanamsa: String(ayanamsaValidation.value),
		coordinates,
		datetime,
		la: laValidation.value ?? "en",
	};
	if (yearLengthRaw != null && yearLengthRaw !== "") {
		query.year_length = yearLengthRaw;
	}

	try {
		const response = await prokeralaFetch<ProkeralaKundliAdvancedResponse>(
			"astrology/kundli/advanced",
			{ query }
		);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala kundli/advanced API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Detailed kundli request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}
