import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaDailyPredictionResponse } from "@/types/prokerala";
import {
	isValidDateTime,
	normalizeDateTime,
	validateHoroscopeSign,
} from "@/app/api/prokerala/_validation";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const datetimeRaw = searchParams.get("datetime");
	const signRaw = searchParams.get("sign");

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

	// sign
	const signValidation = validateHoroscopeSign(signRaw, { allowAll: false });
	if (!signValidation.ok) {
		return NextResponse.json(
			{
				error: signValidation.error,
				allowed: signValidation.allowed,
			},
			{ status: 400 }
		);
	}

	const query: Record<string, string> = {
		datetime,
		sign: signValidation.value,
	};

	try {
		const response = await prokeralaFetch<ProkeralaDailyPredictionResponse>(
			"horoscope/daily",
			{ query }
		);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala daily prediction API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Daily prediction request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}

