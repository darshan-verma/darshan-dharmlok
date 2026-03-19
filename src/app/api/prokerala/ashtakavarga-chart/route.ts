import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetchChart } from "@/lib/prokeralaClient";
import {
	isValidCoordinates,
	isValidDateTime,
	normalizeDateTime,
	validateAshtakavargaChartType,
	validateAshtakavargaPlanet,
	validateAyanamsa,
	validateChartStyle,
} from "@/app/api/prokerala/_validation";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const ayanamsaRaw = searchParams.get("ayanamsa");
	const coordinates = searchParams.get("coordinates");
	const datetimeRaw = searchParams.get("datetime");
	const planetRaw = searchParams.get("planet");
	const chartStyleRaw = searchParams.get("chart_style");
	const typeRaw = searchParams.get("type");

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

	const planetValidation = validateAshtakavargaPlanet(planetRaw);
	if (!planetValidation.ok) {
		return NextResponse.json(
			{
				error: planetValidation.error,
				allowed: planetValidation.allowed,
			},
			{ status: 400 }
		);
	}

	const chartStyleValidation = validateChartStyle(chartStyleRaw);
	if (!chartStyleValidation.ok) {
		return NextResponse.json(
			{
				error: chartStyleValidation.error,
				allowed: chartStyleValidation.allowed,
			},
			{ status: 400 }
		);
	}

	const typeValidation = validateAshtakavargaChartType(typeRaw);
	if (!typeValidation.ok) {
		return NextResponse.json(
			{
				error: typeValidation.error,
				allowed: typeValidation.allowed,
			},
			{ status: 400 }
		);
	}

	const query: Record<string, string> = {
		ayanamsa: String(ayanamsaValidation.value),
		coordinates,
		datetime,
		planet: planetValidation.value,
		chart_style: chartStyleValidation.value,
		type: typeValidation.value,
	};

	try {
		const svg = await prokeralaFetchChart("astrology/ashtakavarga-chart", {
			query,
		});
		return new Response(svg, {
			status: 200,
			headers: {
				"Content-Type": "image/svg+xml",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala ashtakavarga-chart API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Ashtakavarga chart request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}
