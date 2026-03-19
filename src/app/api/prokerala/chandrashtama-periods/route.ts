import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaChandrashtamaPeriodsResponse } from "@/types/prokerala";
import {
	DAILY_PANCHANG_LANGUAGE_CODES,
	isValidCoordinates,
	isValidDateTime,
	normalizeDateTime,
	validateAyanamsa,
	validateChandrashtamaRasiId,
	validateChandrashtamaYear,
	validateIanaTimeZone,
	validateLanguage,
} from "@/app/api/prokerala/_validation";

type ChandrashtamaLanguageCode = (typeof DAILY_PANCHANG_LANGUAGE_CODES)[number];

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const ayanamsaRaw = searchParams.get("ayanamsa");
	const coordinates = searchParams.get("coordinates");
	const yearRaw = searchParams.get("year");
	const datetimeRaw = searchParams.get("datetime");
	const rasiRaw = searchParams.get("rasi");
	const outputTimezoneRaw = searchParams.get("output_timezone");
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

	const yearValidation = validateChandrashtamaYear(yearRaw);
	if (!yearValidation.ok) {
		return NextResponse.json({ error: yearValidation.error }, { status: 400 });
	}

	// Conditional: at least one of datetime or rasi must be provided.
	const hasDatetime = datetimeRaw != null && datetimeRaw.trim() !== "";
	const hasRasi = rasiRaw != null && rasiRaw.trim() !== "";
	if (!hasDatetime && !hasRasi) {
		return NextResponse.json(
			{
				error:
					"Missing required query parameter: provide at least one of datetime or rasi",
			},
			{ status: 400 }
		);
	}

	let datetime: string | null = null;
	if (hasDatetime) {
		datetime = normalizeDateTime(datetimeRaw as string);
		if (!isValidDateTime(datetime)) {
			return NextResponse.json(
				{
					error:
						"Invalid datetime: must be ISO-8601 with timezone offset (YYYY-MM-DDTHH:MM:SS±HH:MM or ...Z)",
				},
				{ status: 400 }
			);
		}
	}

	const rasiValidation = validateChandrashtamaRasiId(rasiRaw);
	if (!rasiValidation.ok) {
		return NextResponse.json(
			{ error: rasiValidation.error, allowed: rasiValidation.allowed },
			{ status: 400 }
		);
	}

	const outputTzValidation = validateIanaTimeZone(outputTimezoneRaw);
	if (!outputTzValidation.ok) {
		return NextResponse.json({ error: outputTzValidation.error }, { status: 400 });
	}

	const laValidation = validateLanguage<ChandrashtamaLanguageCode>(
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
		year: yearValidation.value,
		la: laValidation.value ?? "en",
	};
	if (datetime) {
		query.datetime = datetime;
	}
	if (rasiValidation.value != null) {
		query.rasi = rasiValidation.value;
	}
	if (outputTzValidation.value != null) {
		query.output_timezone = outputTzValidation.value;
	}

	try {
		const response = await prokeralaFetch<ProkeralaChandrashtamaPeriodsResponse>(
			"astrology/chandrashtama-periods",
			{ query }
		);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala chandrashtama-periods API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Chandrashtama periods request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}

