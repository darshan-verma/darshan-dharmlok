import { NextRequest, NextResponse } from "next/server";
import { getMultiClassFare } from "@/lib/airiqClient";

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
			return NextResponse.json(
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
			return NextResponse.json(
				{ error: "Missing or invalid classFare: [{ AirlineClass, SeatAvailFlag }]" },
				{ status: 400 }
			);
		}

		const agentId = process.env.AIRIQ_AGENT_ID;
		const userName = process.env.AIRIQ_USERNAME;
		if (!agentId || !userName) {
			return NextResponse.json(
				{ error: "Missing AIRiQ credentials" },
				{ status: 500 }
			);
		}

		const originalData = (flight as { _airiqOriginal?: AiriqOriginalData })?._airiqOriginal;
		if (!originalData?.FlightDetails?.length) {
			return NextResponse.json(
				{ error: "Missing original AIRiQ flight data. Please search again." },
				{ status: 400 }
			);
		}

		const airiqTrackid = originalData.Trackid || traceId;
		const { flightsInfo, tripType } = buildFlightsInfoAndTripType(
			flight as { _airiqOriginal?: AiriqOriginalData },
			returnFlight as { _airiqOriginal?: AiriqOriginalData } | undefined
		);

		if (flightsInfo.length === 0) {
			return NextResponse.json(
				{ error: "Unable to extract FlightIDs from flight data" },
				{ status: 400 }
			);
		}

		const response = await getMultiClassFare({
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: "2",
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
			return NextResponse.json(
				{
					error: response.Status?.Error || "GetMultiClassFare failed",
					resultCode: response.Status?.ResultCode,
					sequenceID: response.Status?.SequenceID,
				},
				{ status: 400 }
			);
		}

		return NextResponse.json({
			Trackid: response.Trackid ?? null,
			FlightDetails: response.FlightDetails ?? null,
			Fares: response.Fares ?? null,
			Status: response.Status,
		});
	} catch (error) {
		console.error("GetMultiClassFare API error:", error);
		const message = error instanceof Error ? error.message : "GetMultiClassFare failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
