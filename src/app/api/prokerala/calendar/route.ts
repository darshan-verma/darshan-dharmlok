/**
 * Prokerala Calendar API proxy.
 * GET /api/prokerala/calendar?date=YYYY-MM-DD&calendar=<type>&la=<lang>
 *
 * Forwards to Prokerala GET /v2/calendar with OAuth2. Query params:
 * - date (required): ISO date YYYY-MM-DD
 * - calendar (required): tamil | malayalam | amanta | purnimanta | shaka-samvat | vikram-samvat | hijri | gujarati | bengali | lunar
 * - la (optional): en | ta | te | ml | gu | bn
 */

import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import type { ProkeralaCalendarResponse } from "@/types/prokerala";
import {
	PROKERALA_CALENDAR_VALUES,
	PROKERALA_LANGUAGE_CODES,
} from "@/types/prokerala";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(dateStr: string): boolean {
	if (!ISO_DATE_REGEX.test(dateStr)) return false;
	const d = new Date(dateStr);
	return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const date = searchParams.get("date");
	const calendar = searchParams.get("calendar");
	const la = searchParams.get("la");

	if (!date || typeof date !== "string") {
		return NextResponse.json(
			{ error: "Missing required query parameter: date (YYYY-MM-DD)" },
			{ status: 400 }
		);
	}
	if (!isValidDate(date)) {
		return NextResponse.json(
			{ error: "Invalid date: must be YYYY-MM-DD and a valid calendar date" },
			{ status: 400 }
		);
	}

	if (!calendar || typeof calendar !== "string") {
		return NextResponse.json(
			{ error: "Missing required query parameter: calendar" },
			{ status: 400 }
		);
	}
	if (!PROKERALA_CALENDAR_VALUES.includes(calendar as (typeof PROKERALA_CALENDAR_VALUES)[number])) {
		return NextResponse.json(
			{
				error: "Invalid calendar",
				allowed: PROKERALA_CALENDAR_VALUES,
			},
			{ status: 400 }
		);
	}

	if (la != null && la !== "") {
		if (!PROKERALA_LANGUAGE_CODES.includes(la as (typeof PROKERALA_LANGUAGE_CODES)[number])) {
			return NextResponse.json(
				{
					error: "Invalid language code (la)",
					allowed: PROKERALA_LANGUAGE_CODES,
				},
				{ status: 400 }
			);
		}
	}

	const query: Record<string, string> = { date, calendar };
	if (la && la.trim() !== "") {
		query.la = la.trim();
	}

	try {
		const response = await prokeralaFetch<ProkeralaCalendarResponse>(
			"calendar",
			{ query }
		);
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Prokerala calendar API error:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Calendar request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}
