import { NextRequest, NextResponse } from "next/server";
import { issueTicket, getBookingDetails } from "@/lib/tboClient";
import type {
	TicketRequestNonLCC,
	TicketRequestLCC,
	TboBookPassenger,
	TboTicketPassportItem,
} from "@/types/tbo";

function isNonLCCTicketBody(body: Record<string, unknown>): boolean {
	return (
		typeof body.EndUserIp === "string" &&
		typeof body.TraceId === "string" &&
		typeof body.PNR === "string" &&
		(body.BookingId !== undefined &&
			(typeof body.BookingId === "number" ||
				(typeof body.BookingId === "string" &&
					body.BookingId.trim() !== ""))) &&
		body.PNR.trim() !== "" &&
		!body.ResultIndex
	);
}

function isLCCTicketBody(body: Record<string, unknown>): boolean {
	return (
		typeof body.EndUserIp === "string" &&
		typeof body.TraceId === "string" &&
		typeof body.ResultIndex === "string" &&
		Array.isArray(body.Passengers) &&
		body.Passengers.length > 0 &&
		body.ResultIndex.trim() !== ""
	);
}

/**
 * POST /api/travel/tbo/ticket
 * TBO Ticket API (doc: tbo-ticket-doc.md).
 * Service URL: .../rest/Ticket (BookingEngineService_Air).
 * Generates ticket for already booked/hold itinerary (LCC and Non-LCC).
 * - Non-LCC: EndUserIp, TraceId, PNR, BookingId; optional Passport[] (each with DateOfBirth mandatory), IsPriceChangeAccepted.
 * - LCC: EndUserIp, TraceId, ResultIndex, Passengers[]; optional IsPriceChangeAccepted.
 * TokenId is injected server-side.
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
		const TraceId =
			typeof body.TraceId === "string" ? body.TraceId.trim() : "";

		if (!EndUserIp || !TraceId) {
			return NextResponse.json(
				{ error: "Missing required fields: EndUserIp, TraceId" },
				{ status: 400 }
			);
		}

		let payload: TicketRequestNonLCC | TicketRequestLCC;

		if (isNonLCCTicketBody(body)) {
			const PNR = (body.PNR as string).trim();
			const BookingId =
				typeof body.BookingId === "number"
					? body.BookingId
					: parseInt(String(body.BookingId), 10);
			if (!PNR || Number.isNaN(BookingId) || BookingId <= 0) {
				return NextResponse.json(
					{ error: "Non-LCC ticket requires valid PNR and BookingId" },
					{ status: 400 }
				);
			}
			payload = {
				EndUserIp,
				TraceId,
				PNR,
				BookingId,
			};
			if (Array.isArray(body.Passport) && body.Passport.length > 0) {
				// Doc: each Passport item must have DateOfBirth (mandatory)
				const passportList = body.Passport as TboTicketPassportItem[];
				const valid = passportList.filter((p) => p?.DateOfBirth != null && String(p.DateOfBirth).trim() !== "");
				if (valid.length > 0) payload.Passport = valid;
			}
			if (typeof body.IsPriceChangeAccepted === "boolean") {
				payload.IsPriceChangeAccepted = body.IsPriceChangeAccepted;
			}
		} else if (isLCCTicketBody(body)) {
			const ResultIndex = body.ResultIndex.trim();
			const Passengers = body.Passengers as TboBookPassenger[];
			payload = {
				EndUserIp,
				TraceId,
				ResultIndex,
				Passengers,
			};
			if (typeof body.IsPriceChangeAccepted === "boolean") {
				payload.IsPriceChangeAccepted = body.IsPriceChangeAccepted;
			}
		} else {
			return NextResponse.json(
				{
					error:
						"Provide either (PNR, BookingId) for Non-LCC or (ResultIndex, Passengers) for LCC",
				},
				{ status: 400 }
			);
		}

		let result;
		try {
			result = await issueTicket(payload);
		} catch (ticketError) {
			// Per TBO docs: if Ticket times out (300s), poll GetBookingDetails
			if (ticketError instanceof Error && ticketError.name === "AbortError") {
				console.warn("Ticket request timed out (300s). Polling GetBookingDetails...");
				try {
					const bookingDetailsResult = await getBookingDetails({
						EndUserIp,
						TraceId,
					});
					return NextResponse.json({
						...bookingDetailsResult,
						_timeoutRecovered: true,
					});
				} catch (pollError) {
					console.error("GetBookingDetails after ticket timeout failed:", pollError);
					return NextResponse.json(
						{ error: "Ticket issuance timed out. Please check booking status manually.", _timeout: true },
						{ status: 504 }
					);
				}
			}
			throw ticketError;
		}

		return NextResponse.json({
			...result,
			IsPriceChanged: result?.IsPriceChanged ?? false,
			IsTimeChanged: result?.IsTimeChanged ?? false,
		});
	} catch (error) {
		console.error("TBO Ticket API error:", error);
		const message =
			error instanceof Error ? error.message : "Failed to issue ticket";
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
