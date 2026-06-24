import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getFareQuote } from "@/lib/tboClient";
import type { FareQuoteResponse } from "@/types/tbo";

/**
 * POST /api/travel/fare-quote
 * Proxy to TBO FareQuote endpoint (server-side).
 * Returns detailed pricing and fare breakdown for a selected flight result.
 * Use from client/Flutter or server; same contract as TBO FareQuote doc.
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { TraceId, ResultIndex, EndUserIp } = body;

		if (!TraceId || !ResultIndex) {
			return brandedFlightJson(
				{ error: "Missing required parameters: TraceId and ResultIndex" },
				{ status: 400 }
			);
		}

		const result = await getFareQuote({
			TraceId,
			ResultIndex,
			EndUserIp: EndUserIp || "192.168.1.1",
		});

		const response = (result as FareQuoteResponse)?.Response;
		const responseError = response?.Error;
		const responseStatus = response?.ResponseStatus;

		if (responseError && responseError.ErrorCode !== 0) {
			const errorMessage = responseError.ErrorMessage || "Fare quote failed";
			console.error("TBO FareQuote API error:", {
				ErrorCode: responseError.ErrorCode,
				ErrorMessage: errorMessage,
				TraceId,
				ResultIndex,
			});
			return brandedFlightJson(
				{
					error: errorMessage,
					errorCode: responseError.ErrorCode,
					data: result,
				},
				{ status: 400 }
			);
		}

		if (responseStatus !== undefined && responseStatus !== 1) {
			const statusMessages: Record<number, string> = {
				0: "Fare quote could not be processed.",
				2: "Fare quote failed.",
				3: "Invalid request.",
				4: "Invalid session.",
				5: "Invalid credentials.",
			};
			const errorMessage = statusMessages[responseStatus] ?? "Fare quote unavailable";
			return brandedFlightJson(
				{ error: errorMessage, errorCode: responseStatus, data: result },
				{ status: 400 }
			);
		}

		return brandedFlightJson(result);
	} catch (error) {
		console.error("Fare quote API error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Failed to fetch fare quote";
		return brandedFlightJson({ error: errorMessage }, { status: 500 });
	}
}
