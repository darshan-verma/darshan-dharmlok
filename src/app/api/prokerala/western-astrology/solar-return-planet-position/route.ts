import { NextRequest } from "next/server";
import type { ProkeralaSolarReturnPlanetPositionResponse } from "@/types/prokerala";
import {
	getSearchParams,
	parseSolarReturnParams,
	westernProxyGet,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseSolarReturnParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyGet<ProkeralaSolarReturnPlanetPositionResponse>(
		"astrology/solar-return-planet-position",
		parsed.query,
		"Solar return planet position"
	);
}
