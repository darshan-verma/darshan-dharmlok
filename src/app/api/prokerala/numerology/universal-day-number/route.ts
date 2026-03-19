import { NextRequest } from "next/server";
import type { ProkeralaUniversalDayNumberResponse } from "@/types/prokerala";
import {
	getSearchParams,
	numerologyProxyGet,
	parseDateTimeParam,
} from "@/app/api/prokerala/numerology/_shared";

export async function GET(request: NextRequest) {
	const searchParams = getSearchParams(request);
	const datetime = parseDateTimeParam(searchParams);
	if (!datetime.ok) return datetime.response;

	return numerologyProxyGet<ProkeralaUniversalDayNumberResponse>(
		"universal-day-number",
		{
			datetime: datetime.value,
		}
	);
}
