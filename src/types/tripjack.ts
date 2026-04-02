export interface TripjackAddress {
	subLocality?: string;
	city?: string;
	country?: string;
	postalCode?: string;
}

export interface TripjackLocationDto {
	type: "location" | string;
	displayAddress: string;
	lat: string;
	long: string;
	address: TripjackAddress;
}

export type TripjackTripType = "oneway" | "roundtrip" | "return";

export type TripjackJourneyType =
	| "airport_transfer"
	| "outstations"
	| "local"
	| "rental";

export interface TripjackQuoteFilter {
	paxCount?: number;
}

export interface TripjackQuoteRequest {
	origin: TripjackLocationDto;
	destination: TripjackLocationDto;
	tripType: TripjackTripType;
	journeyType: TripjackJourneyType;
	pickupDate: string;
	returnDate?: string;
	durationInMinutes?: number;
	distanceInKm?: number;
	passengers: number;
	quoteFilter?: TripjackQuoteFilter;
}

export interface TripjackJourneyInfo {
	journeyType: string;
	tripType: string;
	pickupDateTime: string;
	returnDateTime?: string;
	journeyLeg?: string;
	distance?: string;
	duration?: number;
	flightDetails?: {
		number?: string;
	};
}

export interface TripjackRouteDetails {
	isDomestic: boolean;
	origin: TripjackLocationDto;
	destination: TripjackLocationDto;
}

export interface TripjackCancellationPolicy {
	minHours: number;
	refundPercentage: number;
	description: string;
}

export interface TripjackPolicies {
	amendmentPolicy?: string;
	cancellationPolicy?: TripjackCancellationPolicy[];
	inclusions?: string[];
	exclusions?: string[];
	baggagePolicy?: string[];
	waitingTime?: string;
	termsAndPolicies?: string[];
	meetAndGreet?: string[];
}

export interface TripjackFareBreakup {
	onwardFare?: number;
	backwardFare?: number;
	totalFare: number;
	onwardTax?: number;
	backwardTax?: number;
	totalTax: number;
}

export interface TripjackQuoteItem {
	vendorId: number;
	vehicleCategoryId?: number;
	vehicleTypeId?: number;
	quotationId: string;
	quoteChildId: string;
	fareBreakup: TripjackFareBreakup;
	benefits?: string[];
	policies?: TripjackPolicies;
	sku?: string;
	paxCount?: number;
	luggageCount?: number;
	model?: string;
}

export interface TripjackQuotesGroup {
	vehicleType: string;
	vehicleCategory: string;
	label: string;
	modelName?: string | null;
	paxCapacity?: string;
	luggageCapacity?: string;
	vehicleImages?: string[];
	similarType?: string;
	quotes: TripjackQuoteItem[];
}

export interface TripjackQuoteResponseData {
	journeyInfo: TripjackJourneyInfo;
	routeDetails: TripjackRouteDetails;
	quotesInfo: TripjackQuotesGroup[];
}

export interface TripjackQuoteResponse {
	success: boolean;
	message: string;
	data: TripjackQuoteResponseData;
}

export interface TripjackLocationSearchRequest {
	input: string;
}

export interface TripjackPlace {
	id: string;
	displayLabel: string;
	name: string;
	value: string;
	order?: number;
}

export interface TripjackLocationSearchResponseData {
	places: TripjackPlace[];
}

export interface TripjackLocationSearchResponse {
	success: boolean;
	message: string;
	data: TripjackLocationSearchResponseData;
}

export interface TripjackLatLongRequest {
	placeId: string;
}

export interface TripjackLatLongResponseData {
	location: {
		lat: number;
		lng: number;
	};
	address?: {
		city?: string;
		country?: string;
		postalCode?: string;
	};
}

export interface TripjackLatLongResponse {
	success: boolean;
	message: string;
	data: TripjackLatLongResponseData;
}

export interface TripjackBookingQuotationInfo {
	vehicleType: string;
	vehicleCategory: string;
	quoteId: string;
	childQuoteId: string;
	paxCount: number;
	luggageCount: number;
	vendorId: number;
}

export interface TripjackAgentMarkupSplitup {
	onwardJourneyMarkup?: number;
	returnJourneyMarkup?: number;
}

export interface TripjackPricingInfo {
	netAmount: string;
	addonsPrice: string;
	agentMarkup: number;
	agentMarkupSplitup?: TripjackAgentMarkupSplitup;
	grossAmount: string;
}

export interface TripjackPassengerDetail {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	flightDetails?: {
		number?: string;
	};
}

export interface TripjackBookingRequest {
	journeyInfo: TripjackJourneyInfo;
	routeDetail: TripjackRouteDetails;
	addons?: unknown[];
	quotationInfo: TripjackBookingQuotationInfo;
	pricingInfo: TripjackPricingInfo;
	passengerDetail: TripjackPassengerDetail;
	serviceRequest?: string;
	consent: "yes" | "no";
	agentEmail: string;
	agentPhone: string;
	agentId: number | string;
	vendorId: number;
}

export interface TripjackBookingResponseData {
	id: string;
	invoiceId?: string | null;
	agentId?: string;
	quoteId?: string;
	childQuoteId?: string;
	status: string;
	totalPrice: number;
	currency: string;
	trackingLink?: string;
	tripType?: string;
	rideStatus?: string;
	paymentStatus?: string;
	serviceRequest?: string;
	agentEmail?: string;
	agentMobile?: string;
	[key: string]: unknown;
}

export interface TripjackBookingResponse {
	success: boolean;
	message: string;
	data: TripjackBookingResponseData;
}

export interface TripjackBookingDetailsResponse {
	success: boolean;
	message: string;
	data: unknown[];
}

export type TripjackAmendmentType = "CANCELLATION";

export interface TripjackGetAmendmentChargesResponse {
	success: boolean;
	message: string;
	data: {
		amendment: Record<string, unknown>;
	};
}

export interface TripjackAmendmentRequest {
	bookingId: string;
	amendmentType: TripjackAmendmentType;
}

export interface TripjackAmendmentResponse {
	success: boolean;
	message: string;
	data: Record<string, unknown>;
}

export interface TripjackPaymentRequest {
	amount: number;
	payUserId: string;
	paymentMedium: string;
	bookingId: string;
	opType: string;
	product: "CAB" | string;
	transactionType: string;
}

export interface TripjackPaymentResponse {
	success: boolean;
	message: string;
	data: Record<string, unknown>;
}

export interface TripjackEmbeddedBookingRequest {
	sourceBookingId: string;
	productType: string;
	bookingRequestList: TripjackBookingRequest[];
}

export interface TripjackEmbeddedBookingResponse {
	success: boolean;
	message: string;
	data: {
		pickupBookingId: string;
	};
}

export interface TripjackErrorPayload {
	status?: number;
	error?: string | { code?: string; message?: string };
	errorCode?: string;
	message?: string;
	success?: boolean;
}
