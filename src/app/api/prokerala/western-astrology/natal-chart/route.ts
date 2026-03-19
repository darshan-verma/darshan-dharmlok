import { NextRequest } from "next/server";
import {
	getSearchParams,
	parseNatalParams,
	westernProxyChart,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseNatalParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyChart(
		"astrology/natal-chart",
		parsed.query,
		"Natal chart"
	);
}
