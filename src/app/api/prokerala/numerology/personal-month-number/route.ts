import { NextRequest } from "next/server";
import type { ProkeralaPersonalMonthNumberResponse } from "@/types/prokerala";
import {
	getSearchParams,
	numerologyProxyGet,
	parseDateTimeParam,
	parseReferenceYearParam,
} from "@/app/api/prokerala/numerology/_shared";

export async function GET(request: NextRequest) {
	const searchParams = getSearchParams(request);
	const datetime = parseDateTimeParam(searchParams);
	if (!datetime.ok) return datetime.response;

	const referenceYear = parseReferenceYearParam(searchParams);
	if (!referenceYear.ok) return referenceYear.response;

	return numerologyProxyGet<ProkeralaPersonalMonthNumberResponse>(
		"personal-month-number",
		{
			datetime: datetime.value,
			reference_year: referenceYear.value,
		}
	);
}
