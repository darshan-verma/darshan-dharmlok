import { NextRequest } from "next/server";
import type { ProkeralaEssenceNumberResponse } from "@/types/prokerala";
import {
	getSearchParams,
	numerologyProxyGet,
	parseDateTimeParam,
	parseNameParams,
	parseReferenceYearParam,
} from "@/app/api/prokerala/numerology/_shared";

export async function GET(request: NextRequest) {
	const searchParams = getSearchParams(request);
	const names = parseNameParams(searchParams);
	if (!names.ok) return names.response;

	const datetime = parseDateTimeParam(searchParams);
	if (!datetime.ok) return datetime.response;

	const referenceYear = parseReferenceYearParam(searchParams);
	if (!referenceYear.ok) return referenceYear.response;

	return numerologyProxyGet<ProkeralaEssenceNumberResponse>("essence-number", {
		...names.query,
		datetime: datetime.value,
		reference_year: referenceYear.value,
	});
}
