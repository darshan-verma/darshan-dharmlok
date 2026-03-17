import { NextRequest, NextResponse } from "next/server";
import { getFareRules } from "@/lib/tboClient";
import type { FareRuleResponse } from "@/types/tbo";

/**
 * POST /api/travel/fare-rules
 * Proxy to TBO FareRule endpoint (server-side).
 * Returns fare rules and conditions for a specific flight option (fare basis, restrictions, penalties).
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { TraceId, ResultIndex, EndUserIp } = body;

		if (!TraceId || !ResultIndex) {
			return NextResponse.json(
				{ error: "Missing required parameters: TraceId and ResultIndex" },
				{ status: 400 }
			);
		}

		const result = await getFareRules({
			TraceId,
			ResultIndex,
			EndUserIp: EndUserIp || "192.168.1.1",
		});

		// Handle TBO Response.Error (ErrorCode !== 0)
		const responseError = (result as FareRuleResponse)?.Response?.Error;
		if (responseError && responseError.ErrorCode !== 0) {
			const errorMessage = responseError.ErrorMessage || "Unknown error";
			console.error("TBO FareRule API error:", {
				ErrorCode: responseError.ErrorCode,
				ErrorMessage: errorMessage,
				TraceId,
				ResultIndex,
			});
			return NextResponse.json(
				{
					error: errorMessage,
					errorCode: responseError.ErrorCode,
					data: result,
				},
				{ status: 400 }
			);
		}

		// Success: return full TBO response (FareRulesView expects Response.FareRules or Response.Results.FareRules)
		return NextResponse.json(result);
	} catch (error) {
		console.error("Fare rules API error:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to fetch fare rules";
		return NextResponse.json(
			{ error: errorMessage },
			{ status: 500 }
		);
	}
}
