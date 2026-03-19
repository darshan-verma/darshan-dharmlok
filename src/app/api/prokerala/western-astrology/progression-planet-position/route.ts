import { NextRequest } from "next/server";
import type { ProkeralaProgressionPlanetPositionResponse } from "@/types/prokerala";
import {
	getSearchParams,
	parseProgressionParams,
	westernProxyGet,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseProgressionParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyGet<ProkeralaProgressionPlanetPositionResponse>(
		"astrology/progression-planet-position",
		parsed.query,
		"Progression planet position"
	);
}
