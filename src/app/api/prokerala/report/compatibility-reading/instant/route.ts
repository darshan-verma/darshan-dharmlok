import { NextRequest } from "next/server";
import {
	parseReportRequestBody,
	reportProxyPost,
} from "@/app/api/prokerala/report/_shared";

export async function POST(request: NextRequest) {
	const parsed = await parseReportRequestBody(request, "compatibility");
	if (!parsed.ok) return parsed.response;

	return reportProxyPost(
		"report/compatibility-reading/instant",
		parsed.body,
		"Compatibility reading report"
	);
}
