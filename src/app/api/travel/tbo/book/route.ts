import { NextRequest, NextResponse } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { bookFlight, getBookingDetails } from "@/lib/tboClient";
import {
	fingerprintDuplicateCriteria,
	formatTboDuplicateBookingError,
	isDuplicateGuardPayload,
	isTboDuplicateBookingError,
	parseDuplicateBookingPnrFromError,
} from "@/lib/tboDuplicateBooking";
import {
	findRecentTboDuplicateBooking,
	recordTboNonLccDuplicateBooking,
} from "@/lib/tboDuplicateBookingStore";
import { validateTboBookPassengers } from "@/lib/tboBookPassengerValidation";
import type { BookingRequest, TboBookPassenger } from "@/types/tbo";

function duplicateBookingResponse(
	errorMessage: string,
	existingPnr: string,
	existingBookingId: number | null,
) {
	return brandedFlightJson(
		{
			error: errorMessage,
			duplicateBooking: true,
			existingPnr,
			existingBookingId,
		},
		{ status: 409 },
	);
}

function extractTboErrorMessage(result: unknown): string {
	const r = result as {
		Error?: { ErrorMessage?: string };
		Response?: { Error?: { ErrorMessage?: string } };
	};
	return (
		r?.Response?.Error?.ErrorMessage ||
		r?.Error?.ErrorMessage ||
		""
	);
}

async function guardAgainstDuplicateBooking(
	duplicateGuard: unknown,
): Promise<NextResponse | null> {
	if (!isDuplicateGuardPayload(duplicateGuard)) {
		return brandedFlightJson(
			{
				error:
					"Missing or invalid duplicateGuard (sector, journey dates, airline, flight number, passengers required for Non-LCC booking)",
			},
			{ status: 400 },
		);
	}

	const fingerprint = fingerprintDuplicateCriteria(duplicateGuard);
	const existing = await findRecentTboDuplicateBooking(fingerprint);
	if (!existing) return null;

	return duplicateBookingResponse(
		formatTboDuplicateBookingError(existing.pnr),
		existing.pnr,
		existing.bookingId,
	);
}

async function recordSuccessfulNonLccBook(
	duplicateGuard: unknown,
	pnr: string,
	bookingId: number | null,
) {
	if (!isDuplicateGuardPayload(duplicateGuard)) return;
	try {
		await recordTboNonLccDuplicateBooking({
			criteria: duplicateGuard,
			pnr,
			bookingId,
		});
	} catch (err) {
		console.error("Failed to record TBO duplicate booking guard:", err);
	}
}

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
		const {
			EndUserIp,
			TraceId,
			ResultIndex,
			Passengers,
			duplicateGuard,
			isLCC,
			isGSTMandatory,
		} = body as Partial<BookingRequest> & {
			duplicateGuard?: unknown;
			isLCC?: boolean;
			isGSTMandatory?: boolean;
		};

		if (isLCC === true) {
			return brandedFlightJson(
				{
					error:
						"LCC flights must be ticketed via /api/travel/tbo/ticket with ResultIndex and Passengers (Book is for Non-LCC only)",
				},
				{ status: 400 },
			);
		}

		if (!EndUserIp || !TraceId || !ResultIndex) {
			return brandedFlightJson(
				{ error: "Missing required fields: EndUserIp, TraceId, ResultIndex" },
				{ status: 400 },
			);
		}

		const passengerValidation = validateTboBookPassengers(Passengers, {
			requireGstMandatory: isGSTMandatory === true,
			requireFare: true,
		});
		if (passengerValidation) {
			return brandedFlightJson(
				{ error: passengerValidation.error },
				{ status: passengerValidation.status },
			);
		}

		const duplicateBlock = await guardAgainstDuplicateBooking(duplicateGuard);
		if (duplicateBlock) return duplicateBlock;

		// Strip TokenId if client sent it; server injects token
		const payload: Omit<BookingRequest, "TokenId"> = {
			EndUserIp,
			TraceId,
			ResultIndex,
			Passengers: Passengers as TboBookPassenger[],
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
					const itinerary = (bookingDetailsResult as { Response?: { FlightItinerary?: { PNR?: string; BookingId?: number } } })?.Response?.FlightItinerary;
					if (itinerary?.PNR) {
						await recordSuccessfulNonLccBook(
							duplicateGuard,
							itinerary.PNR,
							itinerary.BookingId ?? null,
						);
					}
					return brandedFlightJson({
						...bookingDetailsResult,
						_timeoutRecovered: true,
					});
				} catch (pollError) {
					console.error("GetBookingDetails after timeout also failed:", pollError);
					return brandedFlightJson(
						{ error: "Booking timed out. Please check booking status manually.", _timeout: true },
						{ status: 504 },
					);
				}
			}
			throw bookError;
		}

		const response = result?.Response;
		const topError = result?.Error;
		const errorMessage = extractTboErrorMessage(result);

		if (isTboDuplicateBookingError(errorMessage)) {
			const existingPnr =
				parseDuplicateBookingPnrFromError(errorMessage) || "UNKNOWN";
			if (isDuplicateGuardPayload(duplicateGuard)) {
				await recordTboNonLccDuplicateBooking({
					criteria: duplicateGuard,
					pnr: existingPnr,
				});
			}
			return duplicateBookingResponse(
				errorMessage || formatTboDuplicateBookingError(existingPnr),
				existingPnr,
				null,
			);
		}

		if (topError && topError.ErrorCode !== 0) {
			return brandedFlightJson(
				{
					error: topError.ErrorMessage || "TBO Book failed",
					errorCode: topError.ErrorCode,
					data: result,
				},
				{ status: 400 },
			);
		}

		if (response?.Error && response.Error.ErrorCode !== 0) {
			const innerMessage = response.Error.ErrorMessage || "";
			if (isTboDuplicateBookingError(innerMessage)) {
				const existingPnr =
					parseDuplicateBookingPnrFromError(innerMessage) || "UNKNOWN";
				if (isDuplicateGuardPayload(duplicateGuard)) {
					await recordTboNonLccDuplicateBooking({
						criteria: duplicateGuard,
						pnr: existingPnr,
					});
				}
				return duplicateBookingResponse(
					innerMessage || formatTboDuplicateBookingError(existingPnr),
					existingPnr,
					null,
				);
			}
		}

		// Status: 1=Successful, 2=Failed, 3=OtherFare, 4=OtherClass, 5=BookedOther, 6=NotConfirmed
		if (response?.Status === 2 || response?.Status === 6) {
			return brandedFlightJson(
				{
					error: response.Status === 2 ? "Booking failed" : "Booking not confirmed",
					status: response.Status,
					data: result,
				},
				{ status: 400 },
			);
		}

		if (response?.PNR) {
			await recordSuccessfulNonLccBook(
				duplicateGuard,
				response.PNR,
				response.BookingId ?? null,
			);
		}

		return brandedFlightJson(result);
	} catch (error) {
		console.error("TBO Book API error:", error);
		const message = error instanceof Error ? error.message : "Failed to process booking";
		return brandedFlightJson(
			{ error: message },
			{ status: 500 },
		);
	}
}
