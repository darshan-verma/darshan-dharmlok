import { NextRequest, NextResponse } from "next/server";
import { getTripjackFareRule, TripjackApiError } from "@/lib/tripjackClient";
import { convertTripjackFareRuleToTboResponse } from "@/lib/tripjackFareRuleNormalize";
import { isTripjackConfigured } from "@/lib/tripjackFlightSearch";
import type { TripjackFareRuleFlowType } from "@/types/tripjackFlight";

const ALLOWED_FLOW: Set<TripjackFareRuleFlowType> = new Set([
	"SEARCH",
	"REVIEW",
	"BOOKING_DETAIL",
]);

/**
 * POST /api/travel/tripjack-flight/fare-rules
 * Proxy to TripJack `POST /fms/v2/farerule`; returns TBO-shaped FareRuleResponse for FareRulesView.
 *
 * Body: { id: string, flowType: "SEARCH"|"REVIEW"|"BOOKING_DETAIL", traceId?: string }
 */
export async function POST(request: NextRequest) {
	try {
		if (!isTripjackConfigured()) {
			return NextResponse.json(
				{
					error:
						"TripJack flight API is not configured (need TRIPJACK_API_KEY and FMS base URL)",
				},
				{ status: 503 },
			);
		}

		const body = await request.json();
		const id = typeof body?.id === "string" ? body.id.trim() : "";
		const flowType = body?.flowType as TripjackFareRuleFlowType | undefined;
		const traceId = typeof body?.traceId === "string" ? body.traceId : "";

		if (!id) {
			return NextResponse.json(
				{ error: "Missing or empty required field: id" },
				{ status: 400 },
			);
		}

		if (!flowType || !ALLOWED_FLOW.has(flowType)) {
			return NextResponse.json(
				{
					error:
						"Invalid or missing flowType; expected SEARCH, REVIEW, or BOOKING_DETAIL",
				},
				{ status: 400 },
			);
		}

		const raw = await getTripjackFareRule({ id, flowType });
		const normalized = convertTripjackFareRuleToTboResponse(raw, traceId);

		if (normalized.Response.Error.ErrorCode !== 0) {
			return NextResponse.json(normalized, { status: 400 });
		}

		return NextResponse.json(normalized);
	} catch (error) {
		if (error instanceof TripjackApiError) {
			console.error("TripJack fare rule API error:", {
				status: error.status,
				message: error.message,
				endpoint: error.endpoint,
			});
			return NextResponse.json(
				{
					error: error.message,
					status: error.status,
					providerPayload: error.providerPayload,
				},
				{ status: error.status >= 400 && error.status < 600 ? error.status : 400 },
			);
		}

		console.error("TripJack fare rules route error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Failed to fetch fare rules";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
