import { NextRequest, NextResponse } from "next/server";
import { prokeralaFetch } from "@/lib/prokeralaClient";
import {
	isValidDateTime,
	normalizeDateTime,
	validateAdditionalVowel,
	validateOptionalMiddleName,
	validateReferenceYear,
	validateRequiredNameParam,
} from "@/app/api/prokerala/_validation";

type JsonObject = Record<string, unknown>;
type StringQuery = Record<string, string>;

export function parseDateTimeParam(
	searchParams: URLSearchParams
): { ok: true; value: string } | { ok: false; response: NextResponse } {
	const datetimeRaw = searchParams.get("datetime");
	if (!datetimeRaw || datetimeRaw.trim() === "") {
		return {
			ok: false,
			response: NextResponse.json(
				{
					error:
						"Missing required query parameter: datetime (ISO-8601 with offset, e.g. 2004-02-12T15:19:21+05:30)",
				},
				{ status: 400 }
			),
		};
	}

	const datetime = normalizeDateTime(datetimeRaw.trim());
	if (!isValidDateTime(datetime)) {
		return {
			ok: false,
			response: NextResponse.json(
				{
					error:
						"Invalid datetime: must be ISO-8601 with timezone offset (YYYY-MM-DDTHH:MM:SS±HH:MM or ...Z)",
				},
				{ status: 400 }
			),
		};
	}

	return { ok: true, value: datetime };
}

export function parseNameParams(
	searchParams: URLSearchParams
): { ok: true; query: StringQuery } | { ok: false; response: NextResponse } {
	const firstNameValidation = validateRequiredNameParam(
		searchParams.get("first_name"),
		"first_name"
	);
	if (!firstNameValidation.ok) {
		return {
			ok: false,
			response: NextResponse.json({ error: firstNameValidation.error }, { status: 400 }),
		};
	}

	const lastNameValidation = validateRequiredNameParam(
		searchParams.get("last_name"),
		"last_name"
	);
	if (!lastNameValidation.ok) {
		return {
			ok: false,
			response: NextResponse.json({ error: lastNameValidation.error }, { status: 400 }),
		};
	}

	const middleNameValidation = validateOptionalMiddleName(
		searchParams.get("middle_name")
	);

	const query: StringQuery = {
		first_name: firstNameValidation.value,
		last_name: lastNameValidation.value,
	};
	if (middleNameValidation.value) {
		query.middle_name = middleNameValidation.value;
	}

	return { ok: true, query };
}

export function parseReferenceYearParam(
	searchParams: URLSearchParams
): { ok: true; value: string } | { ok: false; response: NextResponse } {
	const referenceYearValidation = validateReferenceYear(
		searchParams.get("reference_year")
	);
	if (!referenceYearValidation.ok) {
		return {
			ok: false,
			response: NextResponse.json(
				{ error: referenceYearValidation.error },
				{ status: 400 }
			),
		};
	}

	return { ok: true, value: String(referenceYearValidation.value) };
}

export function parseAdditionalVowelParam(
	searchParams: URLSearchParams
): { ok: true; value: "true" | "false" | null } | {
	ok: false;
	response: NextResponse;
} {
	const additionalVowelValidation = validateAdditionalVowel(
		searchParams.get("additional_vowel")
	);
	if (!additionalVowelValidation.ok) {
		return {
			ok: false,
			response: NextResponse.json(
				{ error: additionalVowelValidation.error },
				{ status: 400 }
			),
		};
	}

	return { ok: true, value: additionalVowelValidation.value };
}

export async function numerologyProxyGet<TResponse>(
	slug: string,
	query: StringQuery
): Promise<NextResponse<TResponse | JsonObject>> {
	try {
		const response = await prokeralaFetch<TResponse>(`numerology/${slug}`, { query });
		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error(`Prokerala numerology ${slug} API error:`, error);
		return NextResponse.json(
			{
				ok: false,
				error: "Numerology request failed",
				details: message,
			},
			{ status: 500 }
		);
	}
}

export function getSearchParams(request: NextRequest): URLSearchParams {
	return new URL(request.url).searchParams;
}
