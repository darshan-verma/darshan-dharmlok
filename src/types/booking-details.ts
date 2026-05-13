/**
 * Normalized booking details shape for unified confirmation UI.
 * Used by both TBO and AiriQ; no provider field.
 */

export interface NormalizedBookingSegment {
	originCode: string;
	originCity?: string;
	destCode: string;
	destCity?: string;
	airlineName?: string;
	airlineCode?: string;
	flightNumber?: string;
	depTime?: string;
	arrTime?: string;
}

export interface NormalizedBookingPassenger {
	title?: string;
	firstName?: string;
	lastName?: string;
	paxType?: string;
	pnr?: string;
	ticketNumber?: string;
}

export interface NormalizedBookingFare {
	currency?: string;
	/** Total / published fare when supplier sends it */
	amount?: number;
	baseFare?: number;
	taxAndFees?: number;
}

export interface NormalizedBookingDetails {
	pnr?: string;
	gdsPnr?: string;
	bookingId?: string;
	/** TripJack order.createdOn (ISO) */
	bookingCreatedOn?: string;
	/** TripJack order.amount when present */
	orderAmount?: number;
	invoiceNo?: string;
	invoiceCreatedOn?: string;
	status?: string;
	/** Per-PNR status map (TripJack) */
	statusMap?: Record<string, string>;
	segments?: NormalizedBookingSegment[];
	passengers?: NormalizedBookingPassenger[];
	fare?: NormalizedBookingFare;
}
