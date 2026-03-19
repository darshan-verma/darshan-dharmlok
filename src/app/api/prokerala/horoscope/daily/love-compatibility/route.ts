import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaDailyLoveCompatibilityResponse } from "@/types/prokerala";
import {
	isValidDateTime,
	normalizeDateTime,
	validateHoroscopeSign,
} from "@/app/api/prokerala/_validation";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const datetimeRaw = searchParams.get("datetime");
	const signOneRaw = searchParams.get("sign_one");
	const signTwoRaw = searchParams.get("sign_two");

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

	// sign_one (all | aries | ...)
	const signOneValidation = validateHoroscopeSign(signOneRaw, {
		allowAll: true,
	});
	if (!signOneValidation.ok) {
		return NextResponse.json(
			{
				error: "Invalid sign_one",
				details: signOneValidation.error,
				allowed: signOneValidation.allowed,
			},
			{ status: 400 }
		);
	}

	// sign_two (all | aries | ...)
	const signTwoValidation = validateHoroscopeSign(signTwoRaw, {
		allowAll: true,
	});
	if (!signTwoValidation.ok) {
		return NextResponse.json(
			{
				error: "Invalid sign_two",
				details: signTwoValidation.error,
				allowed: signTwoValidation.allowed,
			},
			{ status: 400 }
		);
	}

	const query: Record<string, string> = {
		datetime,
		sign_one: signOneValidation.value,
		sign_two: signTwoValidation.value,
	};

	try {
		const response =
			await prokeralaFetch<ProkeralaDailyLoveCompatibilityResponse>(
				"horoscope/daily/love-compatibility",
				{ query }
			);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error(
			"Prokerala daily love compatibility API error:",
			error
		);
		return NextResponse.json(
			{
				ok: false,
				error: "Daily love compatibility request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}
