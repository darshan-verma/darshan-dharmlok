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

		// Check if we have original AIRiQ data
		type FlightDetail = {
			FlightID: string;
			Origin?: string;
			Destination?: string;
			AirlineDescription?: string;
			FareBasisCode?: string;
		};
		const originalData = (flight as { _airiqOriginal?: { Trackid?: string; FlightDetails?: FlightDetail[] } })?._airiqOriginal;

		if (!originalData || !originalData.FlightDetails) {
			console.error("❌ Missing original AIRiQ data in flight object");
			return NextResponse.json(
				{ error: "Missing original AIRiQ flight data. Please search again." },
				{ status: 400 }
			);
		}

		// Use AirIQ Trackid from stored data, fallback to traceId if not available
		const airiqTrackid = originalData.Trackid || traceId;
		console.log("🔑 Using AirIQ Trackid for Fare Rules:", airiqTrackid);

		// Extract FlightIDs from original AIRiQ FlightDetails
		// FlightID should be the numeric ID from FlightDetails, not ReferenceToken
		const flightsInfo: Array<{ FlightID: string }> = [];
		const flightDetails = originalData.FlightDetails || [];

		for (const segment of flightDetails) {
			// Use the numeric FlightID from AirIQ response
			const flightId = segment.FlightID;
			if (flightId) {
				// Avoid duplicates
				if (!flightsInfo.find((f) => f.FlightID === flightId)) {
					flightsInfo.push({ FlightID: flightId });
				}
			}
		}

		// If no FlightIDs found, log error
		if (flightsInfo.length === 0) {
			console.error("❌ No FlightIDs found in original AirIQ data");
			return NextResponse.json(
				{ error: "Unable to extract FlightIDs from flight data" },
				{ status: 400 }
			);
		}

		console.log("📋 Extracted FlightIDs for Fare Rules:", flightsInfo);

		// Construct fare rules request
		const fareRulesRequest = {
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: 2.0,
			},
			FlightsInfo: flightsInfo,
			Trackid: airiqTrackid, // Use AirIQ Trackid, not the generic traceId
		};

		console.log(
			"AIRiQ Fare Rules Request:",
			JSON.stringify(fareRulesRequest, null, 2)
		);

		// Call AIRiQ Fare Rules API
		let fareRulesResponse;
		try {
			fareRulesResponse = await getFareRules(fareRulesRequest);
		} catch (error) {
			// Handle IP validation errors gracefully
			const errorMsg = error instanceof Error ? error.message : String(error);
			if (errorMsg.includes("IP address is Invalid") || errorMsg.includes("IP address")) {
				console.warn("⚠️ AIRiQ Fare Rules: IP validation error - returning empty fare rules");
				// Return empty fare rules instead of throwing error
				return NextResponse.json({
					Response: {
						Error: {
							ErrorCode: 0,
							ErrorMessage: "Fare rules unavailable due to IP validation",
						},
						ResponseStatus: 1,
						TraceId: airiqTrackid,
						FareRules: [],
					},
				});
			}
			// Re-throw if it's not an IP validation error
			throw error;
		}

		console.log(
			"AIRiQ Fare Rules Response:",
			JSON.stringify(fareRulesResponse, null, 2)
		);

		// Check for errors in response
		if (fareRulesResponse.Status?.ResultCode !== "1") {
			const errorMsg = fareRulesResponse.Status?.Error || "Fare rules request failed";
			
			// Handle IP validation errors gracefully
			if (errorMsg.includes("IP address is Invalid") || errorMsg.includes("IP address")) {
				console.warn("⚠️ AIRiQ Fare Rules: IP validation error - returning empty fare rules");
				// Return empty fare rules instead of throwing error
				return NextResponse.json({
					Response: {
						Error: {
							ErrorCode: 0,
							ErrorMessage: "Fare rules unavailable due to IP validation",
						},
						ResponseStatus: 1,
						TraceId: airiqTrackid,
						FareRules: [],
					},
				});
			}
			
			throw new Error(errorMsg);
		}

		// Convert AirIQ response format to TBO-compatible format for UI
		// AirIQ actual response: { FareRuleInfo: { FareRuleText: "...", FareRuleStock: "..." }, Status: {...} }
		// UI expects: { Response: { FareRules: [{ FareRuleDetail: "..." }] } }
		
		// Handle both possible response formats:
		// 1. Array format (from type definition)
		// 2. Object format (actual API response with FareRuleText)
		let fareRuleText = "";
		
		type FareRuleInfo = 
			| Array<{ FareRuleDetail?: string }>
			| { FareRuleText?: string };
		
		const fareRuleInfo = (fareRulesResponse as { FareRuleInfo?: FareRuleInfo }).FareRuleInfo;
		
		if (Array.isArray(fareRuleInfo)) {
			// Array format - get FareRuleDetail from first item
			if (fareRuleInfo.length > 0) {
				fareRuleText = fareRuleInfo[0].FareRuleDetail || "";
			}
		} else if (fareRuleInfo && typeof fareRuleInfo === "object" && "FareRuleText" in fareRuleInfo) {
			// Object format - get FareRuleText
			fareRuleText = fareRuleInfo.FareRuleText || "";
		}

		// Extract flight information from the first and last segments
		const firstSegment = flightDetails[0];
		const lastSegment = flightDetails[flightDetails.length - 1];
		
		const convertedResponse = {
			Response: {
				Error: {
					ErrorCode: 0,
					ErrorMessage: "",
				},
				ResponseStatus: 1,
				TraceId: airiqTrackid,
				FareRules: [
					{
						Origin: firstSegment?.Origin || "",
						Destination: lastSegment?.Destination || "",
						Airline: firstSegment?.AirlineDescription || "",
						FareBasisCode: firstSegment?.FareBasisCode || "",
						FareRuleDetail: fareRuleText,
						FareRestriction: "",
						FareFamilyCode: "",
						FareRuleIndex: "",
					},
				],
			},
		};

		console.log("✅ Converted AirIQ fare rules to TBO format");
		console.log("📋 Fare rule text length:", fareRuleText.length);

		return NextResponse.json(convertedResponse);
	} catch (error) {
		console.error("AIRiQ Fare Rules API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
