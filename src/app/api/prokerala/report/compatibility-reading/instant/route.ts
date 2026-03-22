import { NextRequest } from "next/server";
import { applyDharmlokReportBranding } from "@/app/api/prokerala/report/dharmlok-branding";
import {
	parseReportRequestBody,
	reportProxyPost,
} from "@/app/api/prokerala/report/_shared";

export async function POST(request: NextRequest) {
	const parsed = await parseReportRequestBody(request, "compatibility");
	if (!parsed.ok) return parsed.response;

	const body = applyDharmlokReportBranding(parsed.body);
	return reportProxyPost(
		"report/compatibility-reading/instant",
		body,
		"Compatibility reading report"
	);
}
