import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getPostBookingSSR } from "@/lib/airiqClient";

/**
 * POST /api/travel/airiq/ssr
 * Get post-booking SSR (PostAncillary Avail) for AIRiQ booking
 * This endpoint requires PNRs from a completed booking
 * Includes: Meals, Baggage, Seats, Other services
 * Uses cached token automatically via getPostBookingSSR()
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { airiqPNR, airlinePNR } = body;

		if (!airiqPNR || !airlinePNR) {
			return brandedFlightJson(
				{ error: "Missing required parameters: airiqPNR and airlinePNR" },
				{ status: 400 }
			);
		}

		// Get agent credentials from environment
		const agentId = process.env.AIRIQ_AGENT_ID;
		const userName = process.env.AIRIQ_USERNAME;

		if (!agentId || !userName) {
			return brandedFlightJson(
				{ error: "Missing AIRiQ credentials" },
				{ status: 500 }
			);
		}

		// Construct post-booking SSR request
		const ssrRequest = {
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: 2.0,
			},
			AirIqPNR: airiqPNR,
			AirlinePNR: airlinePNR,
		};

		console.log("AIRiQ Post-Booking SSR Request:", JSON.stringify(ssrRequest, null, 2));

		// Call AIRiQ Post-Booking SSR API - uses cached token automatically
		console.log("🔑 Calling getPostBookingSSR() - will use cached token if available");
		const ssrResponse = await getPostBookingSSR(ssrRequest);

		console.log("AIRiQ Post-Booking SSR Response:", JSON.stringify(ssrResponse, null, 2));

		// Check for errors
		if (ssrResponse.Status?.ResultCode !== "1") {
			throw new Error(ssrResponse.Status?.Error || "SSR request failed");
		}

		return brandedFlightJson(ssrResponse);
	} catch (error) {
		console.error("AIRiQ Post-Booking SSR API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return brandedFlightJson({ error: errorMessage }, { status: 500 });
	}
}
