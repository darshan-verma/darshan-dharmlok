import { NextRequest } from "next/server";
import type { ProkeralaPeriodCycleNumberResponse } from "@/types/prokerala";
import {
	getSearchParams,
	numerologyProxyGet,
	parseDateTimeParam,
} from "@/app/api/prokerala/numerology/_shared";

export async function GET(request: NextRequest) {
	const searchParams = getSearchParams(request);
	const datetime = parseDateTimeParam(searchParams);
	if (!datetime.ok) return datetime.response;

	return numerologyProxyGet<ProkeralaPeriodCycleNumberResponse>(
		"period-cycle-number",
		{
			datetime: datetime.value,
		}
	);
}
