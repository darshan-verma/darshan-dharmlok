import { NextRequest } from "next/server";
import {
	getSearchParams,
	parseCompositeParams,
	westernProxyChart,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseCompositeParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyChart(
		"astrology/composite-aspect-chart",
		parsed.query,
		"Composite aspect chart"
	);
}
