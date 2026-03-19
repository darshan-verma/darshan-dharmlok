import { NextRequest } from "next/server";
import {
	getSearchParams,
	parseSynastryParams,
	westernProxyChart,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseSynastryParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyChart(
		"astrology/synastry-chart",
		parsed.query,
		"Synastry chart"
	);
}
