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
}

export interface NormalizedBookingFare {
	currency?: string;
	amount?: number;
}

export interface NormalizedBookingDetails {
	pnr?: string;
	bookingId?: string;
	invoiceNo?: string;
	invoiceCreatedOn?: string;
	status?: string;
	segments?: NormalizedBookingSegment[];
	passengers?: NormalizedBookingPassenger[];
	fare?: NormalizedBookingFare;
}
