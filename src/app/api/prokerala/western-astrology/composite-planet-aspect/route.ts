import { NextRequest } from "next/server";
import type { ProkeralaCompositePlanetAspectResponse } from "@/types/prokerala";
import {
	getSearchParams,
	parseCompositeParams,
	westernProxyGet,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseCompositeParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyGet<ProkeralaCompositePlanetAspectResponse>(
		"astrology/composite-planet-aspect",
		parsed.query,
		"Composite planet aspect"
	);
}
