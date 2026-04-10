/**
 * Maps TBO and AiriQ booking-details API responses to a normalized shape
 * so the confirmation UI can render both providers identically.
 */

import type { TboGetBookingDetailsFlightItinerary } from "@/types/tbo";
import type { TripjackBookingDetailResponse } from "@/types/tripjackFlight";
import type {
	NormalizedBookingDetails,
	NormalizedBookingSegment,
	NormalizedBookingPassenger,
	NormalizedBookingFare,
} from "@/types/booking-details";

/** Map TBO GetBookingDetails FlightItinerary to normalized booking details. */
export function tboItineraryToNormalized(
	itinerary: TboGetBookingDetailsFlightItinerary | null | undefined
): NormalizedBookingDetails | null {
	if (!itinerary) return null;

	const segments: NormalizedBookingSegment[] = [];
	if (itinerary.Segments && Array.isArray(itinerary.Segments)) {
		for (const seg of itinerary.Segments) {
			const origin = seg.Origin && typeof seg.Origin === "object" && "Airport" in seg.Origin
				? (seg.Origin as { Airport?: { AirportCode?: string; CityName?: string } }).Airport
				: null;
			const dest = seg.Destination && typeof seg.Destination === "object" && "Airport" in seg.Destination
				? (seg.Destination as { Airport?: { AirportCode?: string; CityName?: string } }).Airport
				: null;
			const depTime = seg.Origin && typeof seg.Origin === "object" && "DepTime" in seg.Origin
				? (seg.Origin as { DepTime?: string }).DepTime
				: undefined;
			const arrTime = seg.Destination && typeof seg.Destination === "object" && "ArrTime" in seg.Destination
				? (seg.Destination as { ArrTime?: string }).ArrTime
				: undefined;
			segments.push({
				originCode: origin?.AirportCode ?? "",
				originCity: origin?.CityName,
				destCode: dest?.AirportCode ?? "",
				destCity: dest?.CityName,
				airlineName: seg.Airline?.AirlineName,
				airlineCode: seg.Airline?.AirlineCode,
				flightNumber: seg.Airline?.FlightNumber,
				depTime,
				arrTime,
			});
		}
	}

	const passengers: NormalizedBookingPassenger[] = [];
	if (itinerary.Passenger && Array.isArray(itinerary.Passenger)) {
		for (const p of itinerary.Passenger) {
			passengers.push({
				title: p.Title ?? undefined,
				firstName: p.FirstName ?? undefined,
				lastName: p.LastName ?? undefined,
			});
		}
	}

	let fare: NormalizedBookingFare | undefined;
	if (itinerary.Fare) {
		const amount = itinerary.Fare.OfferedFare ?? itinerary.Fare.PublishedFare;
		fare = {
			currency: itinerary.Fare.Currency,
			amount: amount != null ? Number(amount) : undefined,
		};
	}

	const status =
		itinerary.TicketStatus != null
			? String(itinerary.TicketStatus)
			: itinerary.Status != null
				? String(itinerary.Status)
				: undefined;

	return {
		pnr: itinerary.PNR ?? undefined,
		bookingId: itinerary.BookingId != null ? String(itinerary.BookingId) : undefined,
		invoiceNo: itinerary.InvoiceNo ?? undefined,
		invoiceCreatedOn:
			itinerary.InvoiceCreatedOn != null ? String(itinerary.InvoiceCreatedOn) : undefined,
		status,
		segments: segments.length > 0 ? segments : undefined,
		passengers: passengers.length > 0 ? passengers : undefined,
		fare,
	};
}

/**
 * Map AiriQ RetrieveBooking Retrieveresponse to normalized booking details.
 * Retrieveresponse shape is not fully typed; we extract whatever is present.
 */
export function airiqRetrieveResponseToNormalized(
	response: unknown
): NormalizedBookingDetails | null {
	if (response == null) return null;
	const r = response as Record<string, unknown>;

	const pnr =
		typeof r.PNR === "string"
			? r.PNR
			: typeof r.AirlinePNR === "string"
				? r.AirlinePNR
				: typeof r.AirIqPNR === "string"
					? r.AirIqPNR
					: undefined;

	const bookingId =
		typeof r.BookingId === "number"
			? String(r.BookingId)
			: typeof r.BookingId === "string"
				? r.BookingId
				: typeof r.AirIqPNR === "string"
					? r.AirIqPNR
					: undefined;

	const invoiceNo = typeof r.InvoiceNo === "string" ? r.InvoiceNo : undefined;
	const invoiceCreatedOn =
		r.InvoiceCreatedOn != null ? String(r.InvoiceCreatedOn) : undefined;
	const status = typeof r.Status === "string" ? r.Status : undefined;

	const segments: NormalizedBookingSegment[] = [];
	const segList = Array.isArray(r.Segments) ? r.Segments : r.ItineraryFlightList;
	if (Array.isArray(segList)) {
		for (const s of segList) {
			const seg = s as Record<string, unknown>;
			const origin = seg.Origin as Record<string, unknown> | undefined;
			const dest = seg.Destination as Record<string, unknown> | undefined;
			const getAirport = (o: Record<string, unknown> | undefined): { code?: string; city?: string } => {
				if (!o) return {};
				const ap = o.Airport as Record<string, unknown> | undefined;
				const obj = (ap && typeof ap === "object" ? ap : o) as Record<string, unknown>;
				return {
					code: typeof obj.AirportCode === "string" ? obj.AirportCode : undefined,
					city: typeof obj.CityName === "string" ? obj.CityName : undefined,
				};
			};
			const oAir = getAirport(origin);
			const dAir = getAirport(dest);
			const depTime = origin && typeof origin.DepTime === "string" ? origin.DepTime : undefined;
			const arrTime = dest && typeof dest.ArrTime === "string" ? dest.ArrTime : undefined;
			const air = seg.Airline as Record<string, unknown> | undefined;
			segments.push({
				originCode: oAir.code ?? (typeof seg.Origin === "string" ? seg.Origin : "") ?? "",
				originCity: oAir.city,
				destCode: dAir.code ?? (typeof seg.Destination === "string" ? seg.Destination : "") ?? "",
				destCity: dAir.city,
				airlineName: air && typeof air.AirlineName === "string" ? air.AirlineName : undefined,
				airlineCode: air && typeof air.AirlineCode === "string" ? air.AirlineCode : undefined,
				flightNumber: air && typeof air.FlightNumber === "string" ? air.FlightNumber : undefined,
				depTime,
				arrTime,
			});
		}
	}

	const passengers: NormalizedBookingPassenger[] = [];
	const paxList = Array.isArray(r.Passenger) ? r.Passenger : r.Passengers;
	if (Array.isArray(paxList)) {
		for (const p of paxList) {
			const px = p as Record<string, unknown>;
			passengers.push({
				title: typeof px.Title === "string" ? px.Title : undefined,
				firstName: typeof px.FirstName === "string" ? px.FirstName : undefined,
				lastName: typeof px.LastName === "string" ? px.LastName : undefined,
			});
		}
	}

	let fare: NormalizedBookingFare | undefined;
	const fareObj = r.Fare as Record<string, unknown> | undefined;
	if (fareObj && typeof fareObj === "object") {
		const amount =
			fareObj.OfferedFare ?? fareObj.PublishedFare ?? fareObj.GrossAmount ?? fareObj.TotalAmount;
		fare = {
			currency: typeof fareObj.Currency === "string" ? fareObj.Currency : undefined,
			amount: amount != null ? Number(amount) : undefined,
		};
	}

	// If we have at least PNR or bookingId, return normalized (even if minimal)
	if (pnr || bookingId || segments.length > 0 || passengers.length > 0 || fare) {
		return {
			pnr,
			bookingId,
			invoiceNo,
			invoiceCreatedOn,
			status,
			segments: segments.length > 0 ? segments : undefined,
			passengers: passengers.length > 0 ? passengers : undefined,
			fare,
		};
	}
	// Minimal success: just PNR/ref from request if API returned success but no body
	if (pnr || bookingId) return { pnr, bookingId, status };
	return null;
}

export function tripjackBookingDetailToNormalized(
	response: TripjackBookingDetailResponse | null | undefined,
): NormalizedBookingDetails | null {
	if (!response) return null;
	const air = response.itemInfos?.AIR;
	const onward = air?.tripInfos?.ONWARD?.[0];
	const segs = onward?.sI ?? [];
	const segments: NormalizedBookingSegment[] = segs.map((seg) => ({
		originCode: seg.da?.code || "",
		originCity: seg.da?.city,
		destCode: seg.aa?.code || "",
		destCity: seg.aa?.city,
		airlineName: seg.fD?.aI?.name,
		airlineCode: seg.fD?.aI?.code,
		flightNumber: seg.fD?.fN,
		depTime: seg.dt,
		arrTime: seg.at,
	}));

	const passengers: NormalizedBookingPassenger[] =
		response.travellerInfos?.map((t) => ({
			title: t.ti,
			firstName: t.fN,
			lastName: t.lN,
		})) ?? [];

	const firstTraveller = response.travellerInfos?.[0];
	const firstPnr = firstTraveller?.pnrDetails
		? Object.values(firstTraveller.pnrDetails).find(
				(v) => typeof v === "string" && v.trim(),
			)
		: undefined;

	const amount = air?.totalPriceInfo?.totalFareDetail?.fc?.TF;
	return {
		pnr: typeof firstPnr === "string" ? firstPnr : undefined,
		bookingId: response.order?.bookingId,
		status: response.order?.status,
		segments: segments.length ? segments : undefined,
		passengers: passengers.length ? passengers : undefined,
		fare:
			typeof amount === "number"
				? {
						currency: "INR",
						amount,
					}
				: undefined,
	};
}
