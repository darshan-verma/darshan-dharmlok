import { NextRequest } from "next/server";
import {
	getSearchParams,
	parseTransitParams,
	westernProxyChart,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseTransitParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyChart(
		"astrology/transit-chart",
		parsed.query,
		"Transit chart"
	);
}
