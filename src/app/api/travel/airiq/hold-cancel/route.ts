import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { holdCancel } from "@/lib/airiqClient";
import type {
	AiriqHoldCancelRequest,
	AiriqHoldCancelResponse,
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

		const { airIqPNR, airlinePNR } = body as {
			airIqPNR?: string;
			airlinePNR?: string;
		};

		const trimmedAirIqPNR =
			typeof airIqPNR === "string" ? airIqPNR.trim() : "";
		const trimmedAirlinePNR =
			typeof airlinePNR === "string" ? airlinePNR.trim() : "";

		if (!trimmedAirIqPNR) {
			return NextResponse.json(
				{ error: "airIqPNR is required" },
				{ status: 400 }
			);
		}
		if (!trimmedAirlinePNR) {
			return NextResponse.json(
				{ error: "airlinePNR is required" },
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

		const holdCancelRequest: AiriqHoldCancelRequest = {
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: 2.0,
			},
			AirIqPNR: trimmedAirIqPNR,
			AirlinePNR: trimmedAirlinePNR,
		};

		const response: AiriqHoldCancelResponse = await holdCancel(
			holdCancelRequest
		);

		const cancelStatus = (response.CancelStatus || "").toUpperCase();
		const resultCode = response.Status?.ResultCode ?? "";

		const payload = {
			cancelStatus: response.CancelStatus,
			remarks: response.Remarks,
			status: response.Status,
		};

		// Success: CancelStatus SUCCESS or ResultCode "1"
		if (cancelStatus === "SUCCESS" || resultCode === "1") {
			return NextResponse.json(payload, { status: 200 });
		}

		// Pending / failure: CancelStatus PENDING or ResultCode "0" – return 202 so UI can show message
		if (cancelStatus === "PENDING" || resultCode === "0") {
			return NextResponse.json(payload, { status: 202 });
		}

		// Other/error
		return NextResponse.json(
			{
				error:
					response.Status?.Error ||
					response.Remarks ||
					"Hold cancel request failed",
				...payload,
			},
			{ status: 400 }
		);
	} catch (err) {
		const message =
			err instanceof Error
				? err.message
				: "Hold cancel request failed. Please try again.";
		console.error("AIRiQ Hold Cancel API Error:", err);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
