import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getBookingDetails } from "@/lib/tboClient";
import type { GetBookingDetailsRequest, GetBookingDetailsResponse } from "@/types/tbo";

/**
 * POST /api/travel/tbo/booking-details
 * TBO GetBookingDetails API. TokenId is injected server-side.
 * Body must include EndUserIp and exactly one of:
 * - BookingId
 * - BookingId + PNR
 * - PNR + FirstName
 * - PNR + LastName
 * - PNR + FirstName + LastName
 * - TraceId
 */
function validateGetBookingDetailsBody(
	body: Record<string, unknown>
): { valid: true; payload: GetBookingDetailsRequest } | { valid: false; error: string } {
	const EndUserIp = typeof body.EndUserIp === "string" ? body.EndUserIp.trim() : "";
	if (!EndUserIp) {
		return { valid: false, error: "Missing required field: EndUserIp" };
	}

	const hasBookingId =
		typeof body.BookingId === "number" || (typeof body.BookingId === "string" && body.BookingId !== "");
	const bookingId =
		typeof body.BookingId === "number"
			? body.BookingId
			: typeof body.BookingId === "string"
				? parseInt(body.BookingId, 10)
				: undefined;
	const pnr = typeof body.PNR === "string" ? body.PNR.trim() : "";
	const firstName = typeof body.FirstName === "string" ? body.FirstName.trim() : "";
	const lastName = typeof body.LastName === "string" ? body.LastName.trim() : "";
	const traceId = typeof body.TraceId === "string" ? body.TraceId.trim() : "";

	const variant1 = hasBookingId && bookingId !== undefined && !Number.isNaN(bookingId) && !pnr && !firstName && !lastName && !traceId;
	const variant2 = hasBookingId && bookingId !== undefined && !Number.isNaN(bookingId) && !!pnr && !firstName && !lastName && !traceId;
	const variant3 = !hasBookingId && !!pnr && !!firstName && !lastName && !traceId;
	const variant4 = !hasBookingId && !!pnr && !firstName && !!lastName && !traceId;
	const variant5 = !hasBookingId && !!pnr && !!firstName && !!lastName && !traceId;
	const variant6 = !hasBookingId && !pnr && !firstName && !lastName && !!traceId;

	if (variant1) {
		return { valid: true, payload: { EndUserIp, BookingId: bookingId! } };
	}
	if (variant2) {
		return { valid: true, payload: { EndUserIp, BookingId: bookingId!, PNR: pnr } };
	}
	if (variant3) {
		return { valid: true, payload: { EndUserIp, PNR: pnr, FirstName: firstName } };
	}
	if (variant4) {
		return { valid: true, payload: { EndUserIp, PNR: pnr, LastName: lastName } };
	}
	if (variant5) {
		return { valid: true, payload: { EndUserIp, PNR: pnr, FirstName: firstName, LastName: lastName } };
	}
	if (variant6) {
		return { valid: true, payload: { EndUserIp, TraceId: traceId } };
	}

	return {
		valid: false,
		error:
			"Provide exactly one of: BookingId, (BookingId + PNR), (PNR + FirstName), (PNR + LastName), (PNR + FirstName + LastName), or TraceId",
	};
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		if (!body || typeof body !== "object") {
			return brandedFlightJson(
				{ error: "Request body must be a JSON object" },
				{ status: 400 }
			);
		}

		const validated = validateGetBookingDetailsBody(body as Record<string, unknown>);
		if (!validated.valid) {
			return brandedFlightJson(
				{ error: validated.error },
				{ status: 400 }
			);
		}

		const result = (await getBookingDetails(validated.payload)) as GetBookingDetailsResponse;
		const topError = result?.Error;
		const responseError = result?.Response?.Error;

		if (topError && topError.ErrorCode !== 0) {
			return brandedFlightJson(
				{
					error: topError.ErrorMessage || "GetBookingDetails failed",
					errorCode: topError.ErrorCode,
					data: result,
				},
				{ status: 400 }
			);
		}

		if (responseError && responseError.ErrorCode !== 0) {
			return brandedFlightJson(
				{
					error: responseError.ErrorMessage || "GetBookingDetails failed",
					errorCode: responseError.ErrorCode,
					data: result,
				},
				{ status: 400 }
			);
		}

		return brandedFlightJson(result);
	} catch (error) {
		console.error("TBO GetBookingDetails API error:", error);
		const message = error instanceof Error ? error.message : "Failed to fetch booking details";
		return brandedFlightJson(
			{ error: message },
			{ status: 500 }
		);
	}
}
