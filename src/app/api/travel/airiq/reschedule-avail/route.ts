import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rescheduleAvail } from "@/lib/airiqClient";
import type {
	AiriqRescheduleAvailRequest,
	AiriqRescheduleAvailResponse,
} from "@/types/airiq";

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json().catch(() => null);
		if (!body || typeof body !== "object") {
			return NextResponse.json(
				{ error: "Invalid JSON body" },
				{ status: 400 }
			);
		}

		const {
			tripType,
			availInfo,
			airIqPNR,
			remarks,
		} = body as {
			tripType?: string;
			availInfo?: Array<{
				departureStation?: string;
				arrivalStation?: string;
				flightDate?: string;
			}>;
			airIqPNR?: string;
			remarks?: string;
		};

		if (!tripType || typeof tripType !== "string" || !tripType.trim()) {
			return NextResponse.json(
				{ error: "tripType is required" },
				{ status: 400 }
			);
		}

		if (!Array.isArray(availInfo) || availInfo.length === 0) {
			return NextResponse.json(
				{ error: "availInfo must be a non-empty array with departureStation, arrivalStation, flightDate (YYYYMMDD)" },
				{ status: 400 }
			);
		}

		for (let i = 0; i < availInfo.length; i++) {
			const a = availInfo[i];
			if (!a?.departureStation?.trim() || !a?.arrivalStation?.trim() || !a?.flightDate?.trim()) {
				return NextResponse.json(
					{ error: `availInfo[${i}] must include departureStation, arrivalStation, and flightDate (YYYYMMDD)` },
					{ status: 400 }
				);
			}
		}

		if (!airIqPNR || typeof airIqPNR !== "string" || !airIqPNR.trim()) {
			return NextResponse.json(
				{ error: "airIqPNR is required" },
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

		const requestBody: AiriqRescheduleAvailRequest = {
			TripType: tripType.trim(),
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: 2.0,
			},
			AvailInfo: availInfo.map((a) => ({
				DepartureStation: (a.departureStation ?? "").trim(),
				ArrivalStation: (a.arrivalStation ?? "").trim(),
				FlightDate: (a.flightDate ?? "").trim(),
			})),
			AirIqPNR: airIqPNR.trim(),
			...(remarks != null && String(remarks).trim()
				? { Remarks: String(remarks).trim() }
				: {}),
		};

		const response: AiriqRescheduleAvailResponse = await rescheduleAvail(
			requestBody
		);

		const resultCode = response.Status?.ResultCode ?? "";

		if (resultCode === "1") {
			return NextResponse.json({
				trackId: response.Trackid,
				itineraryFlightList: response.ItineraryFlightList,
				status: response.Status,
			});
		}

		const errorMessage =
			response.Status?.Error ?? "Unable to get reschedule availability.";

		if (resultCode === "0") {
			return NextResponse.json(
				{
					error: errorMessage,
					resultCode: response.Status?.ResultCode,
					sequenceID: response.Status?.SequenceID,
				},
				{ status: 400 }
			);
		}

		if (resultCode === "-1") {
			return NextResponse.json(
				{
					error: errorMessage,
					resultCode: response.Status?.ResultCode,
					sequenceID: response.Status?.SequenceID,
				},
				{ status: 422 }
			);
		}

		// resultCode "-2" = pending
		return NextResponse.json(
			{
				message: errorMessage,
				resultCode: response.Status?.ResultCode,
				sequenceID: response.Status?.SequenceID,
				trackId: null,
				itineraryFlightList: null,
				status: response.Status,
			},
			{ status: 202 }
		);
	} catch (err) {
		const message =
			err instanceof Error
				? err.message
				: "Reschedule availability request failed. Please try again.";
		console.error("AIRiQ RescheduleAvail API Error:", err);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
