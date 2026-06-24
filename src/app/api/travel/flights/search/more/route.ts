import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import {
	getFlightSearchSessionSlice,
	isFlightSearchSessionPending,
} from "@/lib/flightSearchSessionCache";

const MAX_MORE_LIMIT = 100;

/**
 * GET /api/travel/flights/search/more
 * Returns the next slice of a paginated flight search (same sort order as initial POST).
 * Query: searchSessionId (required), offset, limit (default 75, max 100)
 */
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const sessionId = searchParams.get("searchSessionId");
	const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
	const rawLimit = parseInt(searchParams.get("limit") || "75", 10) || 75;
	const limit = Math.min(Math.max(0, rawLimit), MAX_MORE_LIMIT);

	if (!sessionId?.trim()) {
		return brandedFlightJson(
			{ success: false, error: "searchSessionId is required" },
			{ status: 400 },
		);
	}

	const sid = sessionId.trim();
	if (isFlightSearchSessionPending(sid)) {
		return brandedFlightJson(
			{
				success: true,
				pending: true,
				message: "Full merge in progress; try again shortly.",
			},
			{ status: 202 },
		);
	}

	const slice = getFlightSearchSessionSlice(sid, offset, limit);
	if (!slice) {
		return brandedFlightJson(
			{
				success: false,
				error: "Search session expired or invalid. Run a new search.",
			},
			{ status: 404 },
		);
	}

	const loadedThrough = offset + slice.flights.length;
	const hasMore = loadedThrough < slice.total;

	return brandedFlightJson({
		success: true,
		data: {
			Response: {
				TraceId: slice.traceId,
				Results: [slice.flights],
			},
		},
		pagination: {
			total: slice.total,
			offset,
			returned: slice.flights.length,
			loaded: loadedThrough,
			hasMore,
		},
	});
}
