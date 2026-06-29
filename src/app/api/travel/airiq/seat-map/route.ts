import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getSeatMap } from "@/lib/airiqClient";
import type { AiriqPricingResponse, AiriqSeatMapResponse } from "@/types/airiq";
import { normalizePriceItenaryInfo } from "@/lib/airiqBookingHelpers";
import {
	buildCombinedRoundTripSeatMapPayload,
	buildSeatMapPayloadForPriceInfo,
	detectReturnModeFromPricing,
	shouldSplitCombinedReturnPriceInfos,
	shouldUseCombinedRoundTripSeatMap,
	splitCombinedReturnPriceInfos,
} from "@/lib/airiqBookPayload";
import { resolveAiriqTripBookContext } from "@/lib/airiqTripContext";
import type { FlightResult } from "@/types/tbo";
import type { PassengerDetail } from "@/types/tbo";

/**
 * POST /api/travel/airiq/seat-map
 * Get seat map for AIRiQ flight booking (UAT-aligned: combined domestic RT or per-leg).
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			traceId,
			resultIndex,
			flight,
			returnFlight,
			passengers,
			pricingData,
			tripType: incomingTripType,
			searchJourneyType,
		} = body as {
			traceId?: string;
			resultIndex?: string;
			flight?: FlightResult;
			returnFlight?: FlightResult | null;
			passengers?: PassengerDetail[];
			pricingData?: AiriqPricingResponse;
			tripType?: string;
			searchJourneyType?: string;
		};

		if (!traceId || !resultIndex || !flight || !passengers) {
			return brandedFlightJson(
				{ error: "Missing required parameters" },
				{ status: 400 }
			);
		}

		const agentId = process.env.AIRIQ_AGENT_ID;
		const userName = process.env.AIRIQ_USERNAME;

		if (!agentId || !userName) {
			return brandedFlightJson(
				{ error: "Missing AIRiQ credentials" },
				{ status: 500 }
			);
		}

		if (
			!pricingData?.PriceItenaryInfo ||
			!normalizePriceItenaryInfo(pricingData).length
		) {
			return brandedFlightJson(
				{
					FlightSeat: null,
					ResponseStatus: {
						ResultCode: "0",
						Error:
							"Pricing data is required for seat map. Please ensure pricing API call succeeds first.",
						SequenceID: "",
					},
					message:
						"Seat map requires pricing data. Please retry the booking or contact support if pricing fails.",
					requiresPricing: true,
				},
				{ status: 200 }
			);
		}

		const tripCtx = resolveAiriqTripBookContext({
			flight,
			returnFlight,
			searchJourneyType,
		});
		const tripType = incomingTripType || tripCtx.tripType;
		let priceInfos = normalizePriceItenaryInfo(pricingData);
		const returnMode = detectReturnModeFromPricing(
			pricingData,
			tripType,
			Boolean(returnFlight)
		);
		const bookPayloadCtx = {
			tripType,
			returnMode,
			isInternational: tripCtx.isInternational,
		};
		if (shouldSplitCombinedReturnPriceInfos(bookPayloadCtx, priceInfos)) {
			priceInfos = splitCombinedReturnPriceInfos(priceInfos);
		}

		const ctx = {
			tripType,
			returnMode,
			isInternational: tripCtx.isInternational,
		};

		const apiPaxDetails = passengers.map(
			(
				p: {
					Title: string;
					FirstName: string;
					LastName: string;
					PaxType: number;
				},
				index: number
			) => {
				const paxTypeMap: Record<number, string> = {
					1: "ADT",
					2: "CHD",
					3: "INF",
				};
				return {
					PaxRefNumber: String(index + 1),
					Title: p.Title || "Mr",
					PaxType: paxTypeMap[p.PaxType] || "ADT",
					FirstName: (p.FirstName || `PASSENGER${index + 1}`).trim(),
					LastName: (p.LastName || "TEST").trim(),
				};
			}
		);

		const agentInfo = {
			AgentId: agentId,
			UserName: userName,
			AppType: "API",
			Version: 2.0,
		};

		const origin =
			priceInfos[0]?.AvailabilityResponse?.[0]?.Flights?.[0]?.Origin ||
			priceInfos[0]?.FlightDetails?.[0]?.Origin ||
			"";

		const payloads = shouldUseCombinedRoundTripSeatMap(ctx, priceInfos)
			? [buildCombinedRoundTripSeatMapPayload(priceInfos, origin)]
			: priceInfos.map((pi) =>
					buildSeatMapPayloadForPriceInfo(pi, {
						tripType,
						origin,
						destination: undefined,
					})
				);

		const mergedFlightSeat: NonNullable<AiriqSeatMapResponse["FlightSeat"]> =
			[];
		let lastStatus: AiriqSeatMapResponse["ResponseStatus"] | undefined;

		for (const payload of payloads) {
			const seatMapRequest = {
				AgentInfo: agentInfo,
				...payload,
				APIPaxDetails: apiPaxDetails,
			};

			const seatMapResponse = await getSeatMap(seatMapRequest);
			lastStatus = seatMapResponse.ResponseStatus;

			if (seatMapResponse.ResponseStatus?.ResultCode !== "1") {
				const errorMsg =
					seatMapResponse.ResponseStatus?.Error || "Seat map request failed";
				if (
					errorMsg.includes("Unable to retrieve the FlightDetails") ||
					errorMsg.includes("IP address")
				) {
					return brandedFlightJson(
						{
							FlightSeat: null,
							ResponseStatus: seatMapResponse.ResponseStatus,
							message: errorMsg.includes("IP address")
								? "Seat map unavailable due to IP validation. Please contact support."
								: "Seat map not available for this flight",
						},
						{ status: 200 }
					);
				}
				throw new Error(errorMsg);
			}

			if (seatMapResponse.FlightSeat?.length) {
				mergedFlightSeat.push(...seatMapResponse.FlightSeat);
			}
		}

		return brandedFlightJson({
			FlightSeat: mergedFlightSeat.length ? mergedFlightSeat : null,
			ResponseStatus: lastStatus ?? {
				ResultCode: mergedFlightSeat.length ? "1" : "0",
				Error: mergedFlightSeat.length ? "" : "No seats returned",
				SequenceID: "",
			},
		});
	} catch (error) {
		console.error("AIRiQ Seat Map API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return brandedFlightJson({ error: errorMessage }, { status: 500 });
	}
}
