import { NextRequest } from "next/server";
import {
	getSearchParams,
	parseProgressionParams,
	westernProxyChart,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseProgressionParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyChart(
		"astrology/progression-chart",
		parsed.query,
		"Progression chart"
	);
}
