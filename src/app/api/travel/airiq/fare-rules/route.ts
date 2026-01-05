import { NextRequest, NextResponse } from "next/server";
import { getFareRules } from "@/lib/airiqClient";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { traceId, resultIndex, flight } = body;

		if (!traceId || !resultIndex || !flight) {
			return NextResponse.json(
				{ error: "Missing required parameters" },
				{ status: 400 }
			);
		}

		// Get agent credentials from environment
		const agentId = process.env.AIRIQ_AGENT_ID;
		const userName = process.env.AIRIQ_USERNAME;

		if (!agentId || !userName) {
			return NextResponse.json(
				{ error: "Missing AIRiQ credentials" },
				{ status: 500 }
			);
		}

		// Extract FlightIDs from segments
		const flightsInfo: Array<{ FlightID: string }> = [];
		const firstSegmentGroup = flight.Segments?.[0] || [];

		for (const segment of firstSegmentGroup) {
			const flightId = segment.FlightID || resultIndex;
			// Avoid duplicates
			if (!flightsInfo.find((f) => f.FlightID === flightId)) {
				flightsInfo.push({ FlightID: flightId });
			}
		}

		// If no FlightIDs found, use resultIndex
		if (flightsInfo.length === 0) {
			flightsInfo.push({ FlightID: resultIndex });
		}

		// Construct fare rules request
		const fareRulesRequest = {
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: 2.0,
			},
			FlightsInfo: flightsInfo,
			Trackid: traceId,
		};

		console.log(
			"AIRiQ Fare Rules Request:",
			JSON.stringify(fareRulesRequest, null, 2)
		);

		// Call AIRiQ Fare Rules API
		const fareRulesResponse = await getFareRules(fareRulesRequest);

		console.log(
			"AIRiQ Fare Rules Response:",
			JSON.stringify(fareRulesResponse, null, 2)
		);

		// Check for errors
		if (fareRulesResponse.Status?.ResultCode !== "1") {
			throw new Error(
				fareRulesResponse.Status?.Error || "Fare rules request failed"
			);
		}

		return NextResponse.json(fareRulesResponse);
	} catch (error) {
		console.error("AIRiQ Fare Rules API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
