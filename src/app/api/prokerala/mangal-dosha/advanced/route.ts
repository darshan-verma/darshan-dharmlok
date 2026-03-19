import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaMangalDoshaAdvancedResponse } from "@/types/prokerala";
import {
	isValidCoordinates,
	isValidDateTime,
	normalizeDateTime,
	validateAyanamsa,
	validateLanguage,
} from "@/app/api/prokerala/_validation";

const DOSHA_LANGUAGE_CODES = ["en", "ta", "ml", "hi"] as const;
type DoshaLanguageCode = (typeof DOSHA_LANGUAGE_CODES)[number];

/** Normalize description that may be object by language or string. */
function stringOrByLang(value: unknown, lang: string): string {
	if (typeof value === "string") return value;
	if (value && typeof value === "object" && !Array.isArray(value)) {
		const obj = value as Record<string, unknown>;
		const byLang = obj[lang] ?? obj.en;
		if (typeof byLang === "string") return byLang;
		const first = Object.values(obj).find((v) => typeof v === "string");
		if (typeof first === "string") return first;
	}
	return "";
}

function normalizeStringArray(arr: unknown, lang: string): string[] {
	if (!Array.isArray(arr)) return [];
	// If already array of strings, pass through (API often returns this when la is set)
	if (arr.length > 0 && arr.every((item) => typeof item === "string")) {
		return arr as string[];
	}
	return arr.map((item) => stringOrByLang(item, lang));
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

	const lang = laValidation.value ?? "en";
	const query: Record<string, string> = {
		ayanamsa: String(ayanamsaValidation.value),
		coordinates,
		datetime,
		la: lang,
	};

	try {
		const response = await prokeralaFetch<ProkeralaMangalDoshaAdvancedResponse>(
			"astrology/mangal-dosha/advanced",
			{ query }
		);
		if (response?.data) {
			const raw = response.data;
			const description =
				stringOrByLang(raw.description, lang) ||
				(typeof raw.description === "string" ? raw.description : "");
			const exceptions = normalizeStringArray(raw.exceptions, lang);
			const remedies = normalizeStringArray(raw.remedies, lang);
			response.data = {
				...raw,
				description,
				exceptions: exceptions.length > 0 ? exceptions : (Array.isArray(raw.exceptions) ? (raw.exceptions as string[]) : []),
				remedies: remedies.length > 0 ? remedies : (Array.isArray(raw.remedies) ? (raw.remedies as string[]) : []),
			};
		}
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala mangal-dosha/advanced API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Detailed mangal dosha request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}
