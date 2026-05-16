import type { HotelBooking, TravelBooking, Destination } from "@prisma/client";

export type MyTripBookingRow = {
	id: string;
	destination: { name: string; location?: string } | null;
	date: string;
	travelDate?: string;
	returnDate?: string | null;
	status: string;
	source?: string | null;
	transportType?: string | null;
	tboBookingId?: number | null;
	tboPnr?: string | null;
	leadFirstName?: string | null;
	leadLastName?: string | null;
	airIqPnr?: string | null;
	airlinePnr?: string | null;
	tripjackBookingId?: string | null;
	tripjackAirlinePnr?: string | null;
	fromLocation?: string | null;
	bookingSnapshot?: unknown;
	hotelName?: string;
	checkIn?: string;
	checkOut?: string;
};

type TravelWithDestination = TravelBooking & {
	destination: Destination | null;
};

export function mapTravelBookingToMyTrip(
	booking: TravelWithDestination,
): MyTripBookingRow {
	return {
		id: booking.id,
		destination: booking.destination
			? {
					name: booking.destination.name,
					location: booking.destination.location ?? undefined,
				}
			: booking.fromLocation
				? { name: booking.name, location: booking.fromLocation }
				: { name: booking.name },
		date: booking.date.toISOString(),
		travelDate: booking.travelDate.toISOString(),
		returnDate: booking.returnDate?.toISOString() ?? null,
		status: booking.status,
		source: booking.source,
		transportType: booking.transportType,
		tboBookingId: booking.tboBookingId,
		tboPnr: booking.tboPnr,
		leadFirstName: booking.leadFirstName,
		leadLastName: booking.leadLastName,
		airIqPnr: booking.airIqPnr,
		airlinePnr: booking.airlinePnr,
		tripjackBookingId: booking.tripjackBookingId,
		tripjackAirlinePnr: booking.tripjackAirlinePnr,
		fromLocation: booking.fromLocation,
		bookingSnapshot: booking.bookingSnapshot ?? undefined,
	};
}

export function mapHotelBookingToMyTrip(
	booking: HotelBooking,
): MyTripBookingRow {
	const checkInIso = booking.checkIn.toISOString();
	const checkOutIso = booking.checkOut.toISOString();
	const location =
		booking.source === "TBO"
			? "TBO hotel"
			: booking.source === "TRIPJACK"
				? "TripJack hotel"
				: "Hotel";

	return {
		id: booking.id,
		destination: {
			name: booking.hotelName,
			location,
		},
		date: booking.createdAt.toISOString(),
		travelDate: checkInIso,
		returnDate: checkOutIso,
		status: booking.status,
		source: booking.source,
		transportType: "hotel",
		tripjackBookingId: booking.tripjackBookingId,
		hotelName: booking.hotelName,
		checkIn: checkInIso,
		checkOut: checkOutIso,
	};
}

export function mergeMyTripBookings(
	travel: TravelWithDestination[],
	hotels: HotelBooking[],
): MyTripBookingRow[] {
	const rows = [
		...travel.map(mapTravelBookingToMyTrip),
		...hotels.map(mapHotelBookingToMyTrip),
	];
	rows.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);
	return rows;
}
