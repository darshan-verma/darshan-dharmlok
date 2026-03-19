import { NextRequest } from "next/server";
import type { ProkeralaNatalPlanetPositionResponse } from "@/types/prokerala";
import {
	getSearchParams,
	parseNatalParams,
	westernProxyGet,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseNatalParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyGet<ProkeralaNatalPlanetPositionResponse>(
		"astrology/natal-planet-position",
		parsed.query,
		"Natal planet position"
	);
}
