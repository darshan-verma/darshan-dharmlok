import { NextRequest } from "next/server";
import type { ProkeralaInnerDreamNumberResponse } from "@/types/prokerala";
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

	const query = { ...names.query };
	if (additionalVowel.value !== null) {
		query.additional_vowel = additionalVowel.value;
	}

	return numerologyProxyGet<ProkeralaInnerDreamNumberResponse>(
		"inner-dream-number",
		query
	);
}
