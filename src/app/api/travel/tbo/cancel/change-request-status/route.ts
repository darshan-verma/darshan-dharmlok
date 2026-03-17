import { NextRequest, NextResponse } from "next/server";
import { getChangeRequestStatus } from "@/lib/tboClient";

/**
 * POST /api/travel/tbo/cancel/change-request-status
 * TBO Get Change Request Status – cancellation status and refund/charges by ChangeRequestId. Doc: tbo-cancel-doc.md GetChangeRequestStatus.
 * TokenId is injected server-side.
 * Body: EndUserIp, ChangeRequestId.
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		if (!body || typeof body !== "object") {
			return NextResponse.json(
				{ error: "Request body must be a JSON object" },
				{ status: 400 }
			);
		}

		const EndUserIp =
			typeof body.EndUserIp === "string" ? body.EndUserIp.trim() : "";
		if (!EndUserIp) {
			return NextResponse.json(
				{ error: "Missing required field: EndUserIp" },
				{ status: 400 }
			);
		}

		const ChangeRequestId =
			typeof body.ChangeRequestId === "number"
				? body.ChangeRequestId
				: parseInt(String(body.ChangeRequestId ?? ""), 10);
		if (Number.isNaN(ChangeRequestId) || ChangeRequestId <= 0) {
			return NextResponse.json(
				{ error: "Missing or invalid ChangeRequestId" },
				{ status: 400 }
			);
		}

		const result = await getChangeRequestStatus({
			EndUserIp,
			ChangeRequestId,
		});

		if (result.ResponseStatus !== undefined && result.ResponseStatus !== 1) {
			const msg =
				result.Error?.ErrorMessage ||
				"Get change request status failed";
			return NextResponse.json(
				{
					error: msg,
					responseStatus: result.ResponseStatus,
					traceId: result.TraceId,
				},
				{ status: 400 }
			);
		}

		return NextResponse.json({
			responseStatus: result.ResponseStatus ?? 1,
			changeRequestId: result.ChangeRequestId,
			refundedAmount: result.RefundedAmount,
			cancellationCharge: result.CancellationCharge,
			serviceTaxOnRAF: result.ServiceTaxOnRAF,
			changeRequestStatus: result.ChangeRequestStatus,
			traceId: result.TraceId,
		});
	} catch (error) {
		console.error("TBO Get Change Request Status API error:", error);
		const message =
			error instanceof Error
				? error.message
				: "Get change request status failed";
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
