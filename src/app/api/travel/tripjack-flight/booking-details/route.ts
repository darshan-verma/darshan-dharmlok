import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getTripjackFlightBookingDetails } from "@/lib/tripjackClient";
import {
	extractTripjackPnrFromBookingDetail,
	extractTripjackTicketNumbers,
} from "@/lib/tripjackFlightBooking";
import { tripjackBookingDetailToNormalized } from "@/lib/booking-details-mappers";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const bookingId =
			typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
		if (!bookingId) {
			return brandedFlightJson(
				{ error: "bookingId is required" },
				{ status: 400 },
			);
		}
		const requirePaxPricing = body?.requirePaxPricing === true;
		const data = await getTripjackFlightBookingDetails({
			bookingId,
			requirePaxPricing,
		});
		const normalized = tripjackBookingDetailToNormalized(data);
		const pnr = extractTripjackPnrFromBookingDetail(data);
		const ticketNumbers = extractTripjackTicketNumbers(data);
		return brandedFlightJson({
			success: true,
			data,
			normalized,
			pnr,
			ticketNumbers,
			statusMap: data.statusMap,
			gdsPnr: data.gdsPnr,
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "TripJack booking-details failed";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}

