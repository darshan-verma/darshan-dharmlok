import { NextRequest } from "next/server";
import type { ProkeralaSubconsciousSelfNumberResponse } from "@/types/prokerala";
import {
	getSearchParams,
	numerologyProxyGet,
	parseNameParams,
} from "@/app/api/prokerala/numerology/_shared";

export async function GET(request: NextRequest) {
	const searchParams = getSearchParams(request);
	const names = parseNameParams(searchParams);
	if (!names.ok) return names.response;

	return numerologyProxyGet<ProkeralaSubconsciousSelfNumberResponse>(
		"subconscious-self-number",
		names.query
	);
}
