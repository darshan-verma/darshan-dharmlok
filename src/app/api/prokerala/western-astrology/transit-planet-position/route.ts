import { NextRequest } from "next/server";
import type { ProkeralaTransitPlanetPositionResponse } from "@/types/prokerala";
import {
	getSearchParams,
	parseTransitParams,
	westernProxyGet,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseTransitParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyGet<ProkeralaTransitPlanetPositionResponse>(
		"astrology/transit-planet-position",
		parsed.query,
		"Transit planet position"
	);
}
