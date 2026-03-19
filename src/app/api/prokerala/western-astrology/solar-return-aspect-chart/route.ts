import { NextRequest } from "next/server";
import {
	getSearchParams,
	parseSolarReturnParams,
	westernProxyChart,
} from "@/app/api/prokerala/western-astrology/_shared";

export async function GET(request: NextRequest) {
	const parsed = parseSolarReturnParams(getSearchParams(request));
	if (!parsed.ok) return parsed.response;
	return westernProxyChart(
		"astrology/solar-return-aspect-chart",
		parsed.query,
		"Solar return aspect chart"
	);
}
