import { NextRequest } from "next/server";
import {
	parseReportRequestBody,
	reportProxyPost,
} from "@/app/api/prokerala/report/_shared";

export async function POST(request: NextRequest) {
	const parsed = await parseReportRequestBody(request, "personal");
	if (!parsed.ok) return parsed.response;

	return reportProxyPost(
		"report/personal-reading/instant",
		parsed.body,
		"Personal reading report"
	);
}
