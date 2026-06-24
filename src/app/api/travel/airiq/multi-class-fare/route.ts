import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getMultiClassFare } from "@/lib/airiqClient";
import {
	getAiriqAvailabilityTrackid,
	isAiriqMultiClassEnabled,
} from "@/lib/airiqBookingHelpers";

type AiriqOriginalData = {
	Trackid?: string;
	FlightDetails?: Array<{ FlightID: string }>;
};

function buildFlightsInfoAndTripType(
	flight: { _airiqOriginal?: AiriqOriginalData },
	returnFlight?: { _airiqOriginal?: AiriqOriginalData } | null
): { flightsInfo: Array<{ FlightID: string }>; tripType: string } {
	const out = (flight._airiqOriginal?.FlightDetails || []).map((s) => ({ FlightID: s.FlightID }));
	const seen = new Set(out.map((f) => f.FlightID));
	if (returnFlight?._airiqOriginal?.FlightDetails) {
		for (const s of returnFlight._airiqOriginal.FlightDetails) {
			if (s.FlightID && !seen.has(s.FlightID)) {
				seen.add(s.FlightID);
				out.push({ FlightID: s.FlightID });
			}
		}
	}
	const tripType = returnFlight?._airiqOriginal?.FlightDetails?.length ? "R" : "O";
	return { flightsInfo: out, tripType };
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			traceId,
			resultIndex,
			flight,
			returnFlight,
			adultCount = 1,
			childCount = 0,
			infantCount = 0,
			classFare,
		} = body;

		if (!traceId || !resultIndex || !flight) {
			return brandedFlightJson(
				{ error: "Missing required parameters: traceId, resultIndex, flight" },
				{ status: 400 }
			);
		}

		if (
			!classFare ||
			!Array.isArray(classFare) ||
			classFare.length === 0 ||
			!classFare.every(
				(c: { AirlineClass?: string; SeatAvailFlag?: string }) =>
					c && typeof c.AirlineClass === "string" && typeof c.SeatAvailFlag === "string"
			)
		) {
			return brandedFlightJson(
				{ error: "Missing or invalid classFare: [{ AirlineClass, SeatAvailFlag }]" },
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

		const flightWithOriginal = flight as { _airiqOriginal?: AiriqOriginalData };

		if (!isAiriqMultiClassEnabled(flightWithOriginal)) {
			return brandedFlightJson(
				{ error: "Multi-class fares are not available for this flight." },
				{ status: 400 }
			);
		}

		const originalData = flightWithOriginal._airiqOriginal;
		if (!originalData?.FlightDetails?.length) {
			return brandedFlightJson(
				{ error: "Missing original AIRiQ flight data. Please search again." },
				{ status: 400 }
			);
		}

		const airiqTrackid = getAiriqAvailabilityTrackid(flightWithOriginal, traceId);
		if (!airiqTrackid) {
			return brandedFlightJson(
				{ error: "Missing AIRiQ Availability Trackid. Please search again." },
				{ status: 400 }
			);
		}
		const { flightsInfo, tripType } = buildFlightsInfoAndTripType(
			flightWithOriginal,
			returnFlight as { _airiqOriginal?: AiriqOriginalData } | undefined
		);

		if (flightsInfo.length === 0) {
			return brandedFlightJson(
				{ error: "Unable to extract FlightIDs from flight data" },
				{ status: 400 }
			);
		}

		const response = await getMultiClassFare({
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: "2.0",
			},
			FlightsInfo: flightsInfo,
			ClassFare: classFare.map((c: { AirlineClass: string; SeatAvailFlag: string }) => ({
				AirlineClass: c.AirlineClass,
				SeatAvailFlag: c.SeatAvailFlag,
			})),
			PassengersInfo: {
				AdultCount: Number(adultCount) || 1,
				ChildCount: Number(childCount) || 0,
				InfantCount: Number(infantCount) || 0,
			},
			TripType: tripType,
			Trackid: airiqTrackid,
		});

		if (response.Status?.ResultCode !== "1") {
			return brandedFlightJson(
				{
					error: response.Status?.Error || "GetMultiClassFare failed",
					resultCode: response.Status?.ResultCode,
					sequenceID: response.Status?.SequenceID,
				},
				{ status: 400 }
			);
		}

		return brandedFlightJson({
			Trackid: response.Trackid ?? null,
			FlightDetails: response.FlightDetails ?? null,
			Fares: response.Fares ?? null,
			Status: response.Status,
		});
	} catch (error) {
		console.error("GetMultiClassFare API error:", error);
		const message = error instanceof Error ? error.message : "GetMultiClassFare failed";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}
