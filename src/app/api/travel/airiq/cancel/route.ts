import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cancelOrPenalty } from "@/lib/airiqClient";
import type {
	AiriqCancellationRequest,
	AiriqCancellationResponse,
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

		const { flag, airIqPNR, remarks } = body as {
			flag?: string;
			airIqPNR?: string;
			remarks?: string;
		};

		const normalizedFlag = (flag || "").toString().toUpperCase();
		if (normalizedFlag !== "PENALTY" && normalizedFlag !== "CANCEL") {
			return NextResponse.json(
				{ error: 'Invalid flag. Expected "PENALTY" or "CANCEL".' },
				{ status: 400 }
			);
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

		const cancelRequest: AiriqCancellationRequest = {
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: 2.0,
			},
			OnlineInfo: {
				Flag: normalizedFlag,
				AirIqPNR: airIqPNR.trim(),
				...(remarks && remarks.trim()
					? { Remarks: remarks.trim() }
					: {}),
			},
		};

		const response: AiriqCancellationResponse = await cancelOrPenalty(
			cancelRequest
		);

		const cancelStatus = (response.CancelStatus || "").toUpperCase();
		const resultCode = response.Status?.ResultCode;

		// Map AIRiQ cancellation outcomes to HTTP status codes
		if (cancelStatus === "FAILED" || resultCode === "0") {
			return NextResponse.json(
				{
					error:
						response.Status?.Error ||
						response.Remarks ||
						"Cancellation request failed",
					resultCode,
					sequenceID: response.Status?.SequenceID,
					cancelStatus: response.CancelStatus,
				},
				{ status: 400 }
			);
		}

		if (
			cancelStatus === "PENDING" ||
			resultCode === "-1" ||
			resultCode === "-2"
		) {
			return NextResponse.json(
				{
					cancelStatus: response.CancelStatus,
					remarks: response.Remarks,
					penalityAmount: response.PenalityAmount,
					totalBookingAmount: response.TotalBookingAmount,
					status: response.Status,
				},
				{ status: 202 }
			);
		}

		// Default: treat as success (SUCCESS / other non-error codes)
		return NextResponse.json(
			{
				cancelStatus: response.CancelStatus,
				remarks: response.Remarks,
				penalityAmount: response.PenalityAmount,
				totalBookingAmount: response.TotalBookingAmount,
				status: response.Status,
			},
			{ status: 200 }
		);
	} catch (err) {
		const message =
			err instanceof Error
				? err.message
				: "Cancellation request failed. Please try again.";
		console.error("AIRiQ Cancellation API Error:", err);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

