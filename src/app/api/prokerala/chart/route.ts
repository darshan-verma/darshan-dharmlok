import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetchChart } from "@/lib/prokeralaClient";
import {
	DAILY_PANCHANG_LANGUAGE_CODES,
	isValidCoordinates,
	isValidDateTime,
	normalizeDateTime,
	validateAyanamsa,
	validateChartFormat,
	validateChartStyle,
	validateChartType,
	validateLanguage,
	validateUpagrahaPosition,
} from "@/app/api/prokerala/_validation";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const ayanamsaRaw = searchParams.get("ayanamsa");
	const coordinates = searchParams.get("coordinates");
	const datetimeRaw = searchParams.get("datetime");
	const chartTypeRaw = searchParams.get("chart_type");
	const chartStyleRaw = searchParams.get("chart_style");
	const formatRaw = searchParams.get("format");
	const laRaw = searchParams.get("la");
	const upagrahaPositionRaw = searchParams.get("upagraha_position");

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

	const chartTypeValidation = validateChartType(chartTypeRaw);
	if (!chartTypeValidation.ok) {
		return NextResponse.json(
			{
				error: chartTypeValidation.error,
				allowed: chartTypeValidation.allowed,
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

	const formatValidation = validateChartFormat(formatRaw);
	if (!formatValidation.ok) {
		return NextResponse.json(
			{
				error: formatValidation.error,
				allowed: formatValidation.allowed,
			},
			{ status: 400 }
		);
	}

	const laValidation = validateLanguage(laRaw, DAILY_PANCHANG_LANGUAGE_CODES);
	if (!laValidation.ok) {
		return NextResponse.json(
			{ error: laValidation.error, allowed: laValidation.allowed },
			{ status: 400 }
		);
	}

	const upagrahaValidation = validateUpagrahaPosition(upagrahaPositionRaw);
	if (!upagrahaValidation.ok) {
		return NextResponse.json(
			{
				error: upagrahaValidation.error,
				allowed: upagrahaValidation.allowed,
			},
			{ status: 400 }
		);
	}

	const query: Record<string, string> = {
		ayanamsa: String(ayanamsaValidation.value),
		coordinates,
		datetime,
		chart_type: chartTypeValidation.value,
		chart_style: chartStyleValidation.value,
		format: formatValidation.value,
	};
	if (laValidation.value) {
		query.la = laValidation.value;
	}
	if (chartTypeValidation.value === "upagraha") {
		query.upagraha_position =
			upagrahaValidation.value ?? "middle";
	}

	try {
		const svg = await prokeralaFetchChart("astrology/chart", { query });
		return new Response(svg, {
			status: 200,
			headers: {
				"Content-Type": "image/svg+xml",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala chart API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Chart request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}
