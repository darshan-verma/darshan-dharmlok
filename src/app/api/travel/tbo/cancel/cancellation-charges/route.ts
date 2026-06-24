import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getCancellationCharges } from "@/lib/tboClient";

/**
 * POST /api/travel/tbo/cancel/cancellation-charges
 * TBO Get Cancellation Charges – refund amount and cancellation charge before cancelling. Doc: tbo-cancel-doc.md GetCancellationCharges.
 * TokenId is injected server-side. RequestType is fixed to 1 (FullCancellation).
 * Body: EndUserIp, BookingId; optional BookingMode (default 5 for API).
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		if (!body || typeof body !== "object") {
			return brandedFlightJson(
				{ error: "Request body must be a JSON object" },
				{ status: 400 }
			);
		}

		const EndUserIp =
			typeof body.EndUserIp === "string" ? body.EndUserIp.trim() : "";
		if (!EndUserIp) {
			return brandedFlightJson(
				{ error: "Missing required field: EndUserIp" },
				{ status: 400 }
			);
		}

		const BookingId =
			typeof body.BookingId === "number"
				? body.BookingId
				: parseInt(String(body.BookingId ?? ""), 10);
		if (Number.isNaN(BookingId) || BookingId <= 0) {
			return brandedFlightJson(
				{ error: "Missing or invalid BookingId" },
				{ status: 400 }
			);
		}

		const BookingMode =
			typeof body.BookingMode === "number"
				? body.BookingMode
				: body.BookingMode !== undefined
					? parseInt(String(body.BookingMode), 10)
					: 5;

		const result = await getCancellationCharges({
			EndUserIp,
			RequestType: 1,
			BookingId,
			...(Number.isNaN(BookingMode) ? {} : { BookingMode }),
		});

		if (result.ResponseStatus !== undefined && result.ResponseStatus !== 1) {
			const msg =
				result.Error?.ErrorMessage ||
				"Get cancellation charges failed";
			return brandedFlightJson(
				{
					error: msg,
					responseStatus: result.ResponseStatus,
					traceId: result.TraceId,
				},
				{ status: 400 }
			);
		}

		return brandedFlightJson({
			responseStatus: result.ResponseStatus ?? 1,
			refundAmount: result.RefundAmount,
			cancellationCharge: result.CancellationCharge,
			remarks: result.Remarks,
			currency: result.Currency,
			traceId: result.TraceId,
		});
	} catch (error) {
		console.error("TBO Get Cancellation Charges API error:", error);
		const message =
			error instanceof Error
				? error.message
				: "Get cancellation charges failed";
		return brandedFlightJson(
			{ error: message },
			{ status: 500 }
		);
	}
}
