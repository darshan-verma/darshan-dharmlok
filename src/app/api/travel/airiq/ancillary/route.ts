/**
 * /api/travel/airiq/ancillary
 * GET: PostAncillary Avail – fetch available ancillaries (baggage, meals, seats, other SSR) for a PNR.
 * POST: Add SSR – add selected ancillaries to the booking.
 * Requires PNRs from a completed Book (block PNR) step.
 */

import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPostBookingSSR, addPostBookingSSR } from "@/lib/airiqClient";
import type { AiriqAddPostBookingSSRRequest } from "@/types/airiq";

const agentInfo = () => {
	const agentId = process.env.AIRIQ_AGENT_ID;
	const userName = process.env.AIRIQ_USERNAME;
	if (!agentId || !userName) return null;
	return { AgentId: agentId, UserName: userName, AppType: "API" as const, Version: 2.0 };
};

/**
 * GET /api/travel/airiq/ancillary?airIqPNR=...&airlinePNR=...
 * Fetches available post-booking ancillaries for the given PNRs.
 */
export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return brandedFlightJson({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const airIqPNR = searchParams.get("airIqPNR") || searchParams.get("airiqPNR");
		const airlinePNR = searchParams.get("airlinePNR");

		if (!airIqPNR || !airlinePNR) {
			return brandedFlightJson(
				{ error: "Missing required query parameters: airIqPNR and airlinePNR" },
				{ status: 400 }
			);
		}

		const agent = agentInfo();
		if (!agent) {
			return brandedFlightJson({ error: "Missing AIRiQ credentials" }, { status: 500 });
		}

		const ssrResponse = await getPostBookingSSR({
			AgentInfo: agent,
			AirIqPNR: airIqPNR,
			AirlinePNR: airlinePNR,
		});

		if (ssrResponse.Status?.ResultCode !== "1") {
			return brandedFlightJson(
				{ error: ssrResponse.Status?.Error || "Failed to fetch ancillaries" },
				{ status: 400 }
			);
		}

		return brandedFlightJson({
			trackId: ssrResponse.TrackId,
			ssrDetails: ssrResponse.SsrDetails ?? {},
		});
	} catch (error) {
		console.error("AIRiQ Ancillary GET Error:", error);
		const message = error instanceof Error ? error.message : "Unknown error";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}

/**
 * POST /api/travel/airiq/ancillary
 * Body: { airIqPNR, airlinePNR, ancillaryTrackId, selections: { baggages?, meals?, seats?, otherSSR? }, totalAmount }
 * Adds selected ancillaries to the booking. Payment amount can be 0 if no paid add-ons.
 */
export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return brandedFlightJson({ error: "Unauthorized" }, { status: 401 });
		}

		const agent = agentInfo();
		if (!agent) {
			return brandedFlightJson({ error: "Missing AIRiQ credentials" }, { status: 500 });
		}

		const body = await req.json();
		const {
			airIqPNR,
			airlinePNR,
			ancillaryTrackId,
			selections = {},
			totalAmount = "0",
		} = body as {
			airIqPNR?: string;
			airlinePNR?: string;
			ancillaryTrackId?: string;
			selections?: {
				baggages?: Array<{ paxRefId: string; baggId: string }>;
				meals?: Array<{ paxRefId: string; segmentNo: string; mealId: string }>;
				seats?: Array<{ paxRefId: string; seatId: string }>;
				otherSSR?: Array<{ otherSSRId: string; paxRefId: string }>;
			};
			totalAmount?: string;
		};

		if (!airIqPNR || !airlinePNR || !ancillaryTrackId) {
			return brandedFlightJson(
				{ error: "Missing required fields: airIqPNR, airlinePNR, ancillaryTrackId" },
				{ status: 400 }
			);
		}

		const amount = String(totalAmount ?? "0");
		const addRequest: AiriqAddPostBookingSSRRequest = {
			AgentInfo: agent,
			TracKID: ancillaryTrackId,
			AirIqPNR: airIqPNR,
			AirlinePNR: airlinePNR,
			MealsSSR: selections.meals?.map((m) => ({
				PaxRefId: m.paxRefId,
				SegmentNo: m.segmentNo,
				MealId: m.mealId,
			})),
			BaggSSR: selections.baggages?.map((b) => ({
				PaxRefId: b.paxRefId,
				BaggId: b.baggId,
			})),
			SeatsSSR: selections.seats?.map((s) => ({
				PaxRefId: s.paxRefId,
				SeatId: s.seatId,
			})),
			OtherSSR: selections.otherSSR?.map((o) => ({
				OtherSSRId: o.otherSSRId,
				PaxRefId: o.paxRefId,
			})),
			Payment: [{ PaymentMode: "T", Amount: amount }],
		};

		// Omit empty arrays so API receives only defined selections
		if (!addRequest.MealsSSR?.length) delete addRequest.MealsSSR;
		if (!addRequest.BaggSSR?.length) delete addRequest.BaggSSR;
		if (!addRequest.SeatsSSR?.length) delete addRequest.SeatsSSR;
		if (!addRequest.OtherSSR?.length) delete addRequest.OtherSSR;

		const addResponse = await addPostBookingSSR(addRequest);

		if (addResponse.Status?.ResultCode !== "1") {
			return brandedFlightJson(
				{ error: addResponse.Status?.Error || "Add SSR failed" },
				{ status: 400 }
			);
		}

		return brandedFlightJson({
			success: true,
			retrieveresponse: addResponse.Retrieveresponse,
		});
	} catch (error) {
		console.error("AIRiQ Ancillary POST Error:", error);
		const message = error instanceof Error ? error.message : "Unknown error";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}
