import { NextRequest, NextResponse } from "next/server";
import { getMultiClass } from "@/lib/airiqClient";

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
	let requestPayloadForLog: {
		FlightsInfo: Array<{ FlightID: string }>;
		Trackid: string;
		TripType: string;
		adultCount: number;
		childCount: number;
		infantCount: number;
	} | null = null;
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
			pricingTrackid,
		} = body;

		if (!traceId || !resultIndex || !flight) {
			return NextResponse.json(
				{ error: "Missing required parameters: traceId, resultIndex, flight" },
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

		const airiqTrackid = pricingTrackid || originalData.Trackid || traceId;
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

		requestPayloadForLog = {
			FlightsInfo: flightsInfo,
			Trackid: airiqTrackid,
			TripType: tripType,
			adultCount: Number(adultCount) || 1,
			childCount: Number(childCount) || 0,
			infantCount: Number(infantCount) || 0,
		};

		const response = await getMultiClass({
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: "2",
			},
			FlightsInfo: flightsInfo,
			PassengersInfo: {
				AdultCount: Number(adultCount) || 1,
				ChildCount: Number(childCount) || 0,
				InfantCount: Number(infantCount) || 0,
			},
			TripType: tripType,
			Trackid: airiqTrackid,
		});

		if (response.Status?.ResultCode !== "1") {
			const hasRealError = response.Status?.Error && response.Status.Error.trim().length > 0;
			if (hasRealError) {
				return NextResponse.json(
					{
						error: response.Status?.Error,
						resultCode: response.Status?.ResultCode,
						sequenceID: response.Status?.SequenceID,
					},
					{ status: 400 }
				);
			}
			// ResultCode 0 with empty Error and empty AvailDetails → no other fare classes
			return NextResponse.json({
				AvailDetails: [],
				Status: response.Status,
			});
		}

		return NextResponse.json({
			AvailDetails: response.AvailDetails ?? null,
			Status: response.Status,
		});
	} catch (error) {
		console.error("GetMultiClass API error:", error);
		if (requestPayloadForLog) {
			console.error("GetMultiClass request payload (for verification):", requestPayloadForLog);
		}
		const message = error instanceof Error ? error.message : "GetMultiClass failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
