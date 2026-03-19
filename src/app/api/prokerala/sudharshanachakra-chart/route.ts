import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetchChart } from "@/lib/prokeralaClient";
import {
	SUDHARSANACHAKRA_CHART_LANGUAGE_CODES,
	isValidCoordinates,
	isValidDateTime,
	normalizeDateTime,
	validateAyanamsa,
	validateLanguage,
} from "@/app/api/prokerala/_validation";

type SudharshanachakraLanguageCode =
	(typeof SUDHARSANACHAKRA_CHART_LANGUAGE_CODES)[number];

const SUDHARSHANACHAKRA_PATH_CANDIDATES = [
	"astrology/sudharshanachakra-chart",
	"astrology/sudharshana-chakra-chart",
	"astrology/sudarshanachakra-chart",
	"astrology/sudarshana-chakra-chart",
	"astrology/sudharshanachakra",
	"astrology/sudharshana-chakra",
	"astrology/sudarshanachakra",
	"astrology/sudarshana-chakra",
] as const;

async function fetchSudharshanachakraChartSvg(
	query: Record<string, string>
): Promise<string> {
	let lastError: unknown = null;
	for (const path of SUDHARSHANACHAKRA_PATH_CANDIDATES) {
		try {
			return await prokeralaFetchChart(path, { query });
		} catch (error) {
			lastError = error;
			const message = error instanceof Error ? error.message : "";
			// Try alternate slugs only when route is missing upstream.
			if (!message.includes("No route found")) {
				throw error;
			}
		}
	}
	throw lastError ?? new Error("Unable to resolve Sudharshanachakra chart route");
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const ayanamsaRaw = searchParams.get("ayanamsa");
	const coordinates = searchParams.get("coordinates");
	const datetimeRaw = searchParams.get("datetime");
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

	// This endpoint supports en|ta|ml|hi per docs; we validate against that set.
	const laValidation = validateLanguage<SudharshanachakraLanguageCode>(
		laRaw,
		SUDHARSANACHAKRA_CHART_LANGUAGE_CODES
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
	};
	if (laValidation.value) {
		query.la = laValidation.value;
	}

	try {
		const svg = await fetchSudharshanachakraChartSvg(query);
		return new Response(svg, {
			status: 200,
			headers: {
				"Content-Type": "image/svg+xml",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala sudharshanachakra-chart API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Sudharshanachakra chart request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}

