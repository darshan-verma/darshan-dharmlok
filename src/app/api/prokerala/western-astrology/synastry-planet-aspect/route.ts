import { NextRequest } from "next/server";
import type { ProkeralaSynastryPlanetAspectResponse } from "@/types/prokerala";
import {
	getSearchParams,
	parseSynastryParams,
	westernProxyGet,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseSynastryParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyGet<ProkeralaSynastryPlanetAspectResponse>(
		"astrology/synastry-planet-aspect",
		parsed.query,
		"Synastry planet aspect"
	);
}
