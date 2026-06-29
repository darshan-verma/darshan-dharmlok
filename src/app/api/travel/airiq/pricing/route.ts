import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getPricing } from "@/lib/airiqClient";
import {
	buildPricingItineraryInfo,
	isInternationalRoute,
} from "@/lib/airiqBookPayload";
import {
	mapFlightDetailsForPricing,
	resolveAiriqTripBookContext,
} from "@/lib/airiqTripContext";
import type { FlightResult } from "@/types/tbo";

type AiriqOriginalData = {
	Trackid?: string;
	FlightDetails?: Array<{
		FlightID: string;
		FlightNumber: string;
		Origin: string;
		Destination: string;
		DepartureDateTime: string;
		ArrivalDateTime: string;
		ItinRef?: string | number;
		ReferenceToken?: string;
		FareId?: string;
		Class?: string;
		FareBasisCode?: string;
		Cabin?: string;
	}>;
	Fares?: Array<{
		Faredescription?: Array<{
			Paxtype?: string;
			BaseAmount?: string;
			GrossAmount?: string;
			NetAmount?: string;
		}>;
	}>;
};

function fareFallbackFromTbo(flight: {
	Fare?: { BaseFare?: number; PublishedFare?: number; OfferedFare?: number };
}) {
	const fare = flight.Fare;
	if (!fare) return undefined;
	const gross =
		fare.PublishedFare ?? fare.OfferedFare ?? fare.BaseFare ?? undefined;
	const base = fare.BaseFare ?? gross;
	if (gross == null || gross <= 0) return undefined;
	return { baseAmount: base, grossAmount: gross };
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			traceId,
			resultIndex,
			flight,
			returnFlight,
			adultCount,
			childCount,
			infantCount,
			searchJourneyType,
		} = body;

		if (!traceId || !resultIndex || !flight) {
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

		const flightResult = flight as FlightResult;
		const returnFlightResult = returnFlight as FlightResult | null | undefined;
		const originalData = flightResult._airiqOriginal as
			| AiriqOriginalData
			| undefined;

		if (!originalData?.FlightDetails?.length) {
			return brandedFlightJson(
				{ error: "Missing original AIRiQ flight data. Please search again." },
				{ status: 400 }
			);
		}

		const tripCtx = resolveAiriqTripBookContext({
			flight: flightResult,
			returnFlight: returnFlightResult,
			searchJourneyType:
				typeof searchJourneyType === "string" ? searchJourneyType : undefined,
		});

		const { tripType, returnMode } = tripCtx;
		const airiqTrackid = originalData.Trackid || traceId;
		const onwardDetails = mapFlightDetailsForPricing(originalData.FlightDetails);

		const returnOriginal = returnFlightResult?._airiqOriginal as
			| AiriqOriginalData
			| undefined;

		const paxCounts = {
			adults: adultCount || 1,
			children: childCount || 0,
			infants: infantCount || 0,
		};

		const itineraryInfo = buildPricingItineraryInfo(
			{
				onward: {
					flightDetails: onwardDetails,
					fares: originalData.Fares,
					fallback: fareFallbackFromTbo(flightResult),
				},
				return:
					returnMode === "paired" && returnOriginal?.FlightDetails
						? {
								flightDetails: mapFlightDetailsForPricing(
									returnOriginal.FlightDetails
								),
								fares: returnOriginal.Fares,
								fallback: returnFlightResult
									? fareFallbackFromTbo(returnFlightResult)
									: undefined,
							}
						: null,
			},
			paxCounts,
			{ tripType, returnMode }
		);

		const baseOrigin = onwardDetails[0]?.Origin || "";
		const onwardLast = onwardDetails[onwardDetails.length - 1];
		const returnLast =
			returnOriginal?.FlightDetails?.[
				returnOriginal.FlightDetails.length - 1
			];
		const baseDestination =
			returnMode === "combined" || tripType === "O" || tripType === "Y"
				? onwardLast?.Destination || ""
				: returnLast?.Destination || onwardLast?.Destination || "";

		const airportCodes = [
			baseOrigin,
			baseDestination,
			...onwardDetails.map((s) => s.Destination),
			...(returnOriginal?.FlightDetails || []).flatMap((s) => [
				s.Origin,
				s.Destination,
			]),
		].filter(Boolean);

		const pricingRequest = {
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: 2.0,
			},
			SegmentInfo: {
				BaseOrigin: baseOrigin,
				BaseDestination: baseDestination,
				TripType: tripType,
				AdultCount: String(paxCounts.adults),
				ChildCount: String(paxCounts.children),
				InfantCount: String(paxCounts.infants),
			},
			Trackid: airiqTrackid,
			ItineraryInfo: itineraryInfo,
		};

		console.log("🚀 AIRiQ Pricing Request:", {
			tripType,
			returnMode,
			isInternational: isInternationalRoute(airportCodes),
			itineraryCount: itineraryInfo.length,
			amounts: itineraryInfo.map((itin) => ({
				base: itin.BaseAmount,
				gross: itin.GrossAmount,
				segments: itin.FlightDetails.length,
			})),
		});

		const pricingResponse = await getPricing(pricingRequest);

		if (pricingResponse.ResponseStatus?.ResultCode !== "1") {
			throw new Error(
				pricingResponse.ResponseStatus?.Error || "Pricing request failed"
			);
		}

		return brandedFlightJson(pricingResponse);
	} catch (error) {
		console.error("AIRiQ Pricing API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return brandedFlightJson({ error: errorMessage }, { status: 500 });
	}
}
