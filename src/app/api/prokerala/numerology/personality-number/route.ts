import { NextRequest } from "next/server";
import type { ProkeralaPersonalityNumberResponse } from "@/types/prokerala";
import {
	getSearchParams,
	numerologyProxyGet,
	parseAdditionalVowelParam,
	parseNameParams,
} from "@/app/api/prokerala/numerology/_shared";

export async function GET(request: NextRequest) {
	const searchParams = getSearchParams(request);
	const names = parseNameParams(searchParams);
	if (!names.ok) return names.response;

	const additionalVowel = parseAdditionalVowelParam(searchParams);
	if (!additionalVowel.ok) return additionalVowel.response;

	return numerologyProxyGet<ProkeralaPersonalityNumberResponse>(
		"personality-number",
		{
			...names.query,
			...(additionalVowel.value ? { additional_vowel: additionalVowel.value } : {}),
		}
	);
}
