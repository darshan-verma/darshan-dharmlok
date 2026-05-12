import { NextRequest, NextResponse } from "next/server";
import { bookFlight, getBookingDetails } from "@/lib/tboClient";
import type { BookingRequest, TboBookPassenger } from "@/types/tbo";

/**
 * POST /api/travel/tbo/book
 * TBO Book API: hold booking for Non-LCC flights before ticketing.
 * Token is injected server-side; do not send TokenId from client.
 * On success returns PNR, BookingId, IsPriceChanged, IsTimeChanged, FlightItinerary.
 * If IsPriceChanged or IsTimeChanged is true, client should resend Book with updated fare/time then call Ticket.
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { EndUserIp, TraceId, ResultIndex, Passengers } = body as Partial<BookingRequest>;

		if (!EndUserIp || !TraceId || !ResultIndex) {
			return NextResponse.json(
				{ error: "Missing required fields: EndUserIp, TraceId, ResultIndex" },
				{ status: 400 }
			);
		}

		if (!Array.isArray(Passengers) || Passengers.length === 0) {
			return NextResponse.json(
				{ error: "Passengers must be a non-empty array" },
				{ status: 400 }
			);
		}

		// Validate each passenger has required fields and Fare
		for (let i = 0; i < Passengers.length; i++) {
			const p = Passengers[i] as TboBookPassenger;
			if (!p.Title || !p.FirstName || !p.LastName || p.PaxType == null || p.Gender == null) {
				return NextResponse.json(
					{ error: `Passenger ${i + 1}: Title, FirstName, LastName, PaxType, Gender are required` },
					{ status: 400 }
				);
			}
			if (
				!p.GSTCompanyAddress ||
				p.GSTCompanyContactNumber == null ||
				!p.GSTCompanyName ||
				p.GSTNumber == null ||
				p.GSTCompanyEmail == null
			) {
				return NextResponse.json(
					{ error: `Passenger ${i + 1}: GST fields (GSTCompanyAddress, GSTCompanyContactNumber, GSTCompanyName, GSTNumber, GSTCompanyEmail) are required (use empty string if not applicable)` },
					{ status: 400 }
				);
			}
			if (!p.Fare || typeof p.Fare !== "object") {
				return NextResponse.json(
					{ error: `Passenger ${i + 1}: Fare object is required` },
					{ status: 400 }
				);
			}
			const f = p.Fare;
			if (
				f.Currency == null ||
				f.BaseFare == null ||
				f.Tax == null ||
				f.TransactionFee == null ||
				f.YQTax == null ||
				f.AdditionalTxnFeeOfrd == null ||
				f.AdditionalTxnFeePub == null ||
				f.AirTransFee == null
			) {
				return NextResponse.json(
					{ error: `Passenger ${i + 1}: Fare must include Currency, BaseFare, Tax, TransactionFee, YQTax, AdditionalTxnFeeOfrd, AdditionalTxnFeePub, AirTransFee` },
					{ status: 400 }
				);
			}
			if (!p.AddressLine1 || !p.City || !p.CountryCode || !p.CountryName || !p.ContactNo || !p.Email) {
				return NextResponse.json(
					{ error: `Passenger ${i + 1}: AddressLine1, City, CountryCode, CountryName, ContactNo, Email are required` },
					{ status: 400 }
				);
			}
			if (p.Nationality == null || p.Nationality === "") {
				return NextResponse.json(
					{ error: `Passenger ${i + 1}: Nationality is required` },
					{ status: 400 }
				);
			}
			if (typeof p.IsLeadPax !== "boolean") {
				return NextResponse.json(
					{ error: `Passenger ${i + 1}: IsLeadPax must be boolean` },
					{ status: 400 }
				);
			}
		}

		// Strip TokenId if client sent it; server injects token
		const payload: Omit<BookingRequest, "TokenId"> = {
			EndUserIp,
			TraceId,
			ResultIndex,
			Passengers,
		};

		let result;
		try {
			result = await bookFlight(payload);
		} catch (bookError) {
			// Per TBO docs: if Book times out (300s), poll GetBookingDetails
			if (bookError instanceof Error && bookError.name === "AbortError") {
				console.warn("Book request timed out (300s). Polling GetBookingDetails...");
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
					console.error("GetBookingDetails after timeout also failed:", pollError);
					return NextResponse.json(
						{ error: "Booking timed out. Please check booking status manually.", _timeout: true },
						{ status: 504 }
					);
				}
			}
			throw bookError;
		}

		const response = result?.Response;
		const topError = result?.Error;

		if (topError && topError.ErrorCode !== 0) {
			return NextResponse.json(
				{
					error: topError.ErrorMessage || "TBO Book failed",
					errorCode: topError.ErrorCode,
					data: result,
				},
				{ status: 400 }
			);
		}

		// Status: 1=Successful, 2=Failed, 3=OtherFare, 4=OtherClass, 5=BookedOther, 6=NotConfirmed
		if (response?.Status === 2 || response?.Status === 6) {
			return NextResponse.json(
				{
					error: response.Status === 2 ? "Booking failed" : "Booking not confirmed",
					status: response.Status,
					data: result,
				},
				{ status: 400 }
			);
		}

		return NextResponse.json(result);
	} catch (error) {
		console.error("TBO Book API error:", error);
		const message = error instanceof Error ? error.message : "Failed to process booking";
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
