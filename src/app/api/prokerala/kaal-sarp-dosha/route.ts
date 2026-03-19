import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaKaalSarpDoshaResponse } from "@/types/prokerala";
import {
	isValidCoordinates,
	isValidDateTime,
	normalizeDateTime,
	validateAyanamsa,
	validateLanguage,
} from "@/app/api/prokerala/_validation";

const DOSHA_LANGUAGE_CODES = ["en", "ta", "ml", "hi"] as const;
type DoshaLanguageCode = (typeof DOSHA_LANGUAGE_CODES)[number];

/** Prokerala may return description as object (e.g. { en: "...", hi: "..." }) or string. Normalize to string. */
function descriptionToString(
	desc: unknown,
	lang: string
): string {
	if (typeof desc === "string") return desc;
	if (desc && typeof desc === "object" && !Array.isArray(desc)) {
		const obj = desc as Record<string, unknown>;
		const byLang = obj[lang] ?? obj.en;
		if (typeof byLang === "string") return byLang;
		const first = Object.values(obj).find((v) => typeof v === "string");
		if (typeof first === "string") return first;
	}
	return "";
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const ayanamsaRaw = searchParams.get("ayanamsa");
	const coordinates = searchParams.get("coordinates");
	const datetimeRaw = searchParams.get("datetime");
	const laRaw = searchParams.get("la");

	// ayanamsa
	const ayanamsaValidation = validateAyanamsa(ayanamsaRaw);
	if (!ayanamsaValidation.ok) {
		return NextResponse.json(
			{ error: ayanamsaValidation.error, allowed: ayanamsaValidation.allowed },
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
	const laValidation = validateLanguage<DoshaLanguageCode>(
		laRaw,
		DOSHA_LANGUAGE_CODES
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
		// Prokerala returns empty description when la is omitted; default to English
		la: laValidation.value ?? "en",
	};

	try {
		const response = await prokeralaFetch<ProkeralaKaalSarpDoshaResponse>(
			"astrology/kaal-sarp-dosha",
			{ query }
		);
		const lang = laValidation.value ?? "en";
		if (response?.data && "description" in response.data) {
			response.data = {
				...response.data,
				description: descriptionToString(response.data.description, lang),
			};
		}
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala kaal-sarp-dosha API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Kaal sarp dosha request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}

