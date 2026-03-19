import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaDivisionalPlanetPositionResponse } from "@/types/prokerala";
import {
	DAILY_PANCHANG_LANGUAGE_CODES,
	isValidCoordinates,
	isValidDateTime,
	normalizeDateTime,
	validateAyanamsa,
	validateDivisionalChartType,
	validateLanguage,
} from "@/app/api/prokerala/_validation";

type DivisionalPlanetPositionLanguageCode =
	(typeof DAILY_PANCHANG_LANGUAGE_CODES)[number];

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const ayanamsaRaw = searchParams.get("ayanamsa");
	const coordinates = searchParams.get("coordinates");
	const datetimeRaw = searchParams.get("datetime");
	const chartTypeRaw = searchParams.get("chart_type");
	const laRaw = searchParams.get("la");

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

	const chartTypeValidation = validateDivisionalChartType(chartTypeRaw);
	if (!chartTypeValidation.ok) {
		return NextResponse.json(
			{
				error: chartTypeValidation.error,
				allowed: chartTypeValidation.allowed,
			},
			{ status: 400 }
		);
	}

	const laValidation = validateLanguage<DivisionalPlanetPositionLanguageCode>(
		laRaw,
		DAILY_PANCHANG_LANGUAGE_CODES
	);
	if (!laValidation.ok) {
		return NextResponse.json(
			{ error: laValidation.error, allowed: laValidation.allowed },
			{ status: 400 }
		);
	}

	const query: Record<string, string> = {
		ayanamsa: String(ayanamsaValidation.value),
		coordinates,
		datetime,
		chart_type: chartTypeValidation.value,
		la: laValidation.value ?? "en",
	};

	try {
		const response = await prokeralaFetch<ProkeralaDivisionalPlanetPositionResponse>(
			"astrology/divisional-planet-position",
			{ query }
		);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala divisional-planet-position API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Divisional planet position request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}

