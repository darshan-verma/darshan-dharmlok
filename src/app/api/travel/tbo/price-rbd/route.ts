import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getPriceRBD } from "@/lib/tboClient";
import type { FlightResult, PriceRBDRequest } from "@/types/tbo";

/**
 * POST /api/travel/tbo/price-rbd
 * TBO PriceRBD for JourneyType 4 (Advance Search Return).
 * Combines selected outbound + inbound flights with chosen RBD classes before FareQuote.
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			EndUserIp,
			TraceId,
			AdultCount,
			ChildCount,
			InfantCount,
			AirSearchResult,
		} = body as Partial<PriceRBDRequest>;

		if (!EndUserIp || !TraceId) {
			return brandedFlightJson(
				{ error: "Missing required fields: EndUserIp, TraceId" },
				{ status: 400 },
			);
		}

		if (!Array.isArray(AirSearchResult) || AirSearchResult.length < 2) {
			return brandedFlightJson(
				{
					error:
						"AirSearchResult must include selected outbound and inbound flights",
				},
				{ status: 400 },
			);
		}

		for (let i = 0; i < 2; i++) {
			const flight = AirSearchResult[i] as FlightResult;
			const fareClass = flight?.Segments?.[0]?.[0]?.Airline?.FareClass?.trim();
			if (!flight?.ResultIndex || !fareClass) {
				return brandedFlightJson(
					{
						error: `Flight ${i === 0 ? "outbound" : "inbound"}: ResultIndex and FareClass are required`,
					},
					{ status: 400 },
				);
			}
		}

		const result = await getPriceRBD({
			EndUserIp,
			TraceId,
			AdultCount: String(AdultCount ?? "1"),
			ChildCount: String(ChildCount ?? "0"),
			InfantCount: String(InfantCount ?? "0"),
			AirSearchResult: AirSearchResult as PriceRBDRequest["AirSearchResult"],
		});

		const responseError = result?.Error;
		const statusError = result?.Response?.Error;
		const error = responseError?.ErrorCode
			? responseError
			: statusError?.ErrorCode
				? statusError
				: null;

		if (error && error.ErrorCode !== 0) {
			return brandedFlightJson(
				{
					error: error.ErrorMessage || "TBO PriceRBD failed",
					errorCode: error.ErrorCode,
					data: result,
				},
				{ status: 400 },
			);
		}

		if (result?.Response?.ResponseStatus === 2) {
			return brandedFlightJson(
				{ error: "PriceRBD failed", data: result },
				{ status: 400 },
			);
		}

		return brandedFlightJson(result);
	} catch (error) {
		console.error("TBO PriceRBD API error:", error);
		const message =
			error instanceof Error ? error.message : "Failed to price selected flights";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}
