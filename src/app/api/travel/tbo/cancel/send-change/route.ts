import { NextRequest, NextResponse } from "next/server";
import { sendChangeRequest } from "@/lib/tboClient";
import type { SendChangeRequestSector } from "@/types/tbo";

/**
 * POST /api/travel/tbo/cancel/send-change
 * TBO Send Change Request – full or partial cancellation of ticketed booking. Doc: tbo-cancel-doc.md SendChangeRequest.
 * TokenId is injected server-side.
 * Body: EndUserIp, BookingId, RequestType, CancellationType, Remarks; for partial (RequestType=2): Sectors[], TicketId (number or number[]) are mandatory.
 * Doc also states "All TicketId's must be sent in case of full booking cancellation" – optional TicketId (or TicketId[]) is forwarded when provided for RequestType=1.
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

		const BookingId =
			typeof body.BookingId === "number"
				? body.BookingId
				: parseInt(String(body.BookingId ?? ""), 10);
		if (Number.isNaN(BookingId) || BookingId <= 0) {
			return NextResponse.json(
				{ error: "Missing or invalid BookingId" },
				{ status: 400 }
			);
		}

		const RequestType =
			typeof body.RequestType === "number"
				? body.RequestType
				: parseInt(String(body.RequestType ?? ""), 10);
		if (Number.isNaN(RequestType) || RequestType < 0 || RequestType > 3) {
			return NextResponse.json(
				{ error: "Missing or invalid RequestType (0–3)" },
				{ status: 400 }
			);
		}

		const CancellationType =
			typeof body.CancellationType === "number"
				? body.CancellationType
				: parseInt(String(body.CancellationType ?? ""), 10);
		if (
			Number.isNaN(CancellationType) ||
			CancellationType < 0 ||
			CancellationType > 3
		) {
			return NextResponse.json(
				{ error: "Missing or invalid CancellationType (0–3)" },
				{ status: 400 }
			);
		}

		const Remarks =
			typeof body.Remarks === "string" ? body.Remarks.trim() : "";
		if (!Remarks) {
			return NextResponse.json(
				{ error: "Missing required field: Remarks" },
				{ status: 400 }
			);
		}

		if (RequestType === 2) {
			if (!Array.isArray(body.Sectors) || body.Sectors.length === 0) {
				return NextResponse.json(
					{ error: "Partial cancellation requires Sectors array" },
					{ status: 400 }
				);
			}
			if (body.TicketId === undefined) {
				return NextResponse.json(
					{ error: "Partial cancellation requires TicketId" },
					{ status: 400 }
				);
			}
		}

		const Sectors = Array.isArray(body.Sectors)
			? (body.Sectors as SendChangeRequestSector[])
			: undefined;
		const TicketId = body.TicketId;
		const ticketIdNormalized =
			TicketId === undefined
				? undefined
				: Array.isArray(TicketId)
					? TicketId
					: typeof TicketId === "number"
						? TicketId
						: [parseInt(String(TicketId), 10)].filter(
								(n) => !Number.isNaN(n)
							);

		const result = await sendChangeRequest({
			EndUserIp,
			BookingId,
			RequestType: RequestType as 0 | 1 | 2 | 3,
			CancellationType: CancellationType as 0 | 1 | 2 | 3,
			Remarks,
			...(Sectors && Sectors.length > 0 ? { Sectors } : {}),
			...(ticketIdNormalized !== undefined &&
			(Array.isArray(ticketIdNormalized)
				? ticketIdNormalized.length > 0
				: true)
				? { TicketId: ticketIdNormalized }
				: {}),
		});

		if (result.ResponseStatus !== undefined && result.ResponseStatus !== 1) {
			const msg =
				result.Error?.ErrorMessage ||
				"Send change request failed";
			return NextResponse.json(
				{
					error: msg,
					responseStatus: result.ResponseStatus,
					traceId: result.TraceId,
				},
				{ status: 400 }
			);
		}

		const ticketCRInfo = result.TicketCRInfo;
		const infoList = Array.isArray(ticketCRInfo)
			? ticketCRInfo
			: ticketCRInfo
				? [ticketCRInfo]
				: [];

		return NextResponse.json({
			responseStatus: result.ResponseStatus ?? 1,
			traceId: result.TraceId,
			ticketCRInfo: infoList,
			refundedAmount: infoList[0]?.RefundedAmount,
			cancellationCharge: infoList[0]?.CancellationCharge,
			remarks: infoList[0]?.Remarks ?? result.Error?.ErrorMessage,
		});
	} catch (error) {
		console.error("TBO Send Change Request API error:", error);
		const message =
			error instanceof Error
				? error.message
				: "Send change request failed";
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
