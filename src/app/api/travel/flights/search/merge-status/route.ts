import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getFlightSearchMergeStatus } from "@/lib/flightSearchSessionCache";

/**
 * GET /api/travel/flights/search/merge-status
 * Poll until background multi-provider merge has populated the search session.
 */
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const sessionId = searchParams.get("searchSessionId")?.trim();
	if (!sessionId) {
		return brandedFlightJson(
			{ success: false, error: "searchSessionId is required" },
			{ status: 400 },
		);
	}

	const status = getFlightSearchMergeStatus(sessionId);
	if (!status) {
		return brandedFlightJson(
			{
				success: false,
				error: "Search session expired or invalid. Run a new search.",
			},
			{ status: 404 },
		);
	}

	return brandedFlightJson({
		success: true,
		ready: status.ready,
		searchSessionId: sessionId,
		total: status.total,
		traceId: status.traceId,
	});
}
