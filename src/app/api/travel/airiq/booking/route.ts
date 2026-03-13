import { NextRequest, NextResponse } from "next/server";
import { getBookingDetails } from "@/lib/airiqClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/travel/airiq/booking
 * Retrieve booking details (AirIQ RetrieveBooking). Doc 10: confirm ticket for already blocked itinerary.
 * Query params: airIqPNR | airlinePNR | crsPNR (at least one required)
 */
export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const airIqPNR = searchParams.get("airIqPNR") ?? undefined;
		const airlinePNR = searchParams.get("airlinePNR") ?? undefined;
		const crsPNR = searchParams.get("crsPNR") ?? undefined;

		if (!airIqPNR && !airlinePNR && !crsPNR) {
			return NextResponse.json(
				{ error: "Missing identifier: provide airIqPNR, airlinePNR, or crsPNR" },
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

		const item: Array<{ AirIqPNR?: string; AirlinePNR?: string; CRSPNR?: string }> = [{}];
		if (airIqPNR) item[0].AirIqPNR = airIqPNR;
		if (airlinePNR) item[0].AirlinePNR = airlinePNR;
		if (crsPNR) item[0].CRSPNR = crsPNR;

		const response = await getBookingDetails({
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: 2.0,
			},
			Item: item,
		});

		const resultCode = response.Status?.ResultCode ?? "";
		if (resultCode === "1") {
			return NextResponse.json({
				retrieveresponse: response.Retrieveresponse,
				status: response.Status,
			});
		}

		const errorMessage = response.Status?.Error ?? "Retrieve booking failed";
		const status = resultCode === "0" ? 400 : resultCode === "-1" ? 422 : 400;
		return NextResponse.json(
			{
				error: errorMessage,
				resultCode: response.Status?.ResultCode,
				sequenceID: response.Status?.SequenceID,
			},
			{ status }
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Get booking failed";
		console.error("Get booking error:", err);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
