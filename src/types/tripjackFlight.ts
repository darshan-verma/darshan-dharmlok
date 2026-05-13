/**
 * TripJack FMS flight search (`/fms/v1/air-search-all`) — minimal types from API samples.
 */

export type TripjackCabinClass =
	| "ECONOMY"
	| "PREMIUM_ECONOMY"
	| "BUSINESS"
	| "FIRST";

export type TripjackPft = "REGULAR" | "STUDENT" | "SENIOR_CITIZEN";

export interface TripjackAirportRef {
	code: string;
	name?: string;
	cityCode?: string;
	city?: string;
	country?: string;
	countryCode?: string;
	terminal?: string;
}

export interface TripjackFlightDesignator {
	aI: {
		code: string;
		name: string;
		isLcc?: boolean;
	};
	fN: string;
	eT?: string;
}

/** SSR catalog item on a segment (`ssrInfo` from review) — baggage, meal, or misc seat-related codes. */
export interface TripjackSsrCatalogItem {
	code: string;
	amount: number;
	desc: string;
}

export interface TripjackSsrInfo {
	BAGGAGE?: TripjackSsrCatalogItem[];
	MEAL?: TripjackSsrCatalogItem[];
	/** Misc seat-related ancillaries (e.g. extra seat); not the interactive seat map. */
	SEAT?: TripjackSsrCatalogItem[];
}

export interface TripjackSegmentInfo {
	fD: TripjackFlightDesignator;
	stops?: number;
	duration?: number;
	da: TripjackAirportRef;
	aa: TripjackAirportRef;
	dt: string;
	at: string;
	iand?: boolean;
	isRs?: boolean;
	sN?: number;
	so?: TripjackAirportRef[];
	/** Connecting time / layover in minutes */
	cT?: number;
	id?: string;
	ssrInfo?: TripjackSsrInfo;
}

export interface TripjackFareComponent {
	NCM?: number;
	TF?: number;
	TAF?: number;
	BF?: number;
	NF?: number;
}

export interface TripjackPaxFareDetail {
	fC: TripjackFareComponent;
	afC?: Record<string, Record<string, number>>;
	sR?: number;
	bI?: { iB?: string; cB?: string };
	isHB?: boolean;
	rT?: number;
	cc?: string;
	cB?: string;
	fB?: string;
	mI?: boolean;
}

export interface TripjackPriceListEntry {
	fd: Record<string, TripjackPaxFareDetail>;
	fareIdentifier?: string;
	id: string;
	code?: string;
	msri?: unknown[];
	sri?: string;
	messages?: unknown[];
}

export interface TripjackTripInfo {
	sI: TripjackSegmentInfo[];
	totalPriceList?: TripjackPriceListEntry[];
}

export interface TripjackTripInfos {
	ONWARD?: TripjackTripInfo[];
	RETURN?: TripjackTripInfo[];
	COMBO?: TripjackTripInfo[];
}

export interface TripjackAirSearchResult {
	tripInfos?: TripjackTripInfos;
}

/** Root JSON from `air-search-all` (samples use `searchResult`). */
export interface TripjackAirSearchResponse {
	searchResult?: TripjackAirSearchResult;
}

export interface TripjackAirSearchRequest {
	searchQuery: {
		cabinClass?: TripjackCabinClass;
		paxInfo: {
			ADULT: string;
			CHILD?: string;
			INFANT?: string;
		};
		routeInfos: Array<{
			fromCityOrAirport: { code: string };
			toCityOrAirport: { code: string };
			travelDate: string;
		}>;
		searchModifiers?: {
			isDirectFlight?: boolean;
			isConnectingFlight?: boolean;
			pft?: TripjackPft;
		};
		preferredAirline?: Array<{ code: string }>;
	};
}

/** Fare rule (`POST /fms/v2/farerule`) — flow per TripJack doc. */
export type TripjackFareRuleFlowType =
	| "SEARCH"
	| "REVIEW"
	| "BOOKING_DETAIL";

export interface TripjackFareRuleRequest {
	id: string;
	flowType: TripjackFareRuleFlowType;
}

/** Mini-rule policy period or time window (supplier sends string or number in samples). */
export type TripjackFareRulePolicyPeriod =
	| "BEFORE_DEPARTURE"
	| "AFTER_DEPARTURE"
	| "DEFAULT"
	| string;

/** Per-line fee component breakdown (ACF, CCF, ARF, …). */
export type TripjackFareRuleFcs = Record<string, number>;

export interface TripjackFareRulePolicy {
	policyInfo?: string;
	amount?: number;
	additionalFee?: number;
	fcs?: TripjackFareRuleFcs;
	/** Hours before departure — supplier may send string */
	st?: string | number;
	et?: string | number;
	pp?: TripjackFareRulePolicyPeriod;
}

export type TripjackFareRuleTfrCategory =
	| "NO_SHOW"
	| "DATECHANGE"
	| "CANCELLATION"
	| "SEAT_CHARGEABLE";

export type TripjackFareRuleTfr = Partial<
	Record<TripjackFareRuleTfrCategory, TripjackFareRulePolicy[]>
>;

export interface TripjackFareRuleLegEntry {
	tfr?: TripjackFareRuleTfr;
	miscInfo?: string[];
	/** Present in some Cat-16 samples */
	fareRuleInfo?: Record<string, unknown>;
}

export interface TripjackFareRuleResponse {
	fareRule?: Record<string, TripjackFareRuleLegEntry>;
	status?: {
		success?: boolean;
		httpStatus?: number;
		message?: string;
	};
}

export interface TripjackReviewRequest {
	priceIds: string[];
}

export interface TripjackReviewConditions {
	/** Session time in seconds — reviewed price validity window */
	st?: number;
	/** Session created time */
	sct?: number | string;
	/** Blocking (hold) allowed */
	isBA?: boolean;
	/** Seat map applicable */
	isa?: boolean;
	/** Frequent flier airlines */
	ffas?: string[];
	/** GST conditions */
	gst?: { igm?: boolean; gstappl?: boolean } | boolean;
	/** Date-of-birth conditions */
	dob?: { adobr?: boolean; cdobr?: boolean; idobr?: boolean } | boolean;
	/** Passport conditions (international) */
	pcs?: { pped?: boolean; pid?: boolean; pm?: boolean; dobe?: boolean } | boolean;
	/** Document conditions (student/senior citizen fare) */
	dc?: { ida?: boolean; idm?: boolean } | boolean;
	/** Emergency contact required */
	iecr?: boolean;
	/** PAN applicable */
	ipa?: boolean;
}

export interface TripjackFareAlert {
	type?: string;
	oldFare?: number;
	newFare?: number;
	message?: string;
}

export interface TripjackReviewResponse {
	bookingId?: string;
	/** Review API: array of legs (onward, return, …). Search uses keyed TripjackTripInfos. */
	tripInfos?: TripjackTripInfos | TripjackTripInfo[];
	totalPriceInfo?: {
		totalFareDetail?: {
			fc?: TripjackFareComponent;
		};
	};
	conditions?: TripjackReviewConditions;
	errors?: Array<{ code?: string; message?: string }>;
	alerts?: TripjackFareAlert[];
	status?: {
		success?: boolean;
		httpStatus?: number;
		message?: string;
	};
}

export interface TripjackSeatMapRequest {
	bookingId: string;
}

export interface TripjackSeatPosition {
	row: number;
	column: number;
}

export interface TripjackSeatMapSeatInfo {
	seatNo?: string;
	seatPosition?: TripjackSeatPosition;
	isBooked?: boolean;
	isLegroom?: boolean;
	isAisle?: boolean;
	code?: string;
	amount?: number;
}

export interface TripjackSeatMapSegmentBlock {
	sData?: TripjackSeatPosition;
	sInfo?: TripjackSeatMapSeatInfo[];
}

export interface TripjackSeatMapResponse {
	tripSeatMap?: {
		tripSeat?: Record<string, TripjackSeatMapSegmentBlock>;
	};
	status?: {
		success?: boolean;
		httpStatus?: number;
		message?: string;
	};
	errors?: Array<{ code?: string; message?: string }>;
}

export interface TripjackFareValidateRequest {
	bookingId: string;
}

export type TripjackFareValidateResponse = TripjackReviewResponse;

export interface TripjackTravellerSsrEntry {
	/** Segment id from review (`sI[].id`). */
	key: string;
	code: string;
}

export interface TripjackTravellerInfo {
	ti: string;
	fN: string;
	lN?: string;
	pt: "ADULT" | "CHILD" | "INFANT";
	gd: "MALE" | "FEMALE";
	dob?: string;
	pNat?: string;
	pNum?: string;
	eD?: string;
	/** Passport issue date `YYYY-MM-DD` — TripJack field name is `pid`. */
	pid?: string;
	/** PAN card number */
	pan?: string;
	/** Document ID (student / senior citizen) */
	di?: string;
	ssrBaggageInfos?: TripjackTravellerSsrEntry[];
	ssrMealInfos?: TripjackTravellerSsrEntry[];
	ssrSeatInfos?: TripjackTravellerSsrEntry[];
	ssrExtraServiceInfos?: TripjackTravellerSsrEntry[];
}

/** Emergency contact — TripJack book doc uses `emails` / `contacts` arrays + `ecn`, not flat email/mobile. */
export interface TripjackContactInfo {
	emails?: string[];
	contacts?: string[];
	ecn?: string;
	email?: string;
	mobile?: string;
	countryCode?: string;
}

export interface TripjackGstInfo {
	/** API field name per TripJack flight book doc */
	gstNum?: string;
	registeredName?: string;
	email?: string;
	mobile?: string;
	address?: string;
	gstNumber?: string;
}

export interface TripjackBookRequest {
	bookingId: string;
	travellerInfo: TripjackTravellerInfo[];
	contactInfo?: TripjackContactInfo;
	deliveryInfo?: {
		emails?: string[];
		contacts?: string[];
	};
	gstInfo?: TripjackGstInfo;
	paymentInfos?: Array<{ amount: number }>;
}

export interface TripjackBookResponse {
	bookingId?: string;
	status?: {
		success?: boolean;
		httpStatus?: number;
		message?: string;
	};
	errors?: Array<{ code?: string; message?: string }>;
}

export interface TripjackConfirmBookRequest {
	bookingId: string;
	paymentInfos: Array<{ amount: number }>;
}

export interface TripjackBookingDetailRequest {
	bookingId: string;
	requirePaxPricing?: boolean;
}

export interface TripjackBookingDetailTraveller {
	ti?: string;
	fN?: string;
	lN?: string;
	pt?: string;
	dob?: string;
	pnrDetails?: Record<string, string>;
	ticketNumberDetails?: Record<string, string>;
}

export interface TripjackBookingDetailResponse {
	order?: {
		bookingId?: string;
		status?: string;
		createdOn?: string;
		lastUpdatedOn?: string;
		/** Charged amount in TripJack (see booking-details doc) */
		amount?: number;
	};
	itemInfos?: {
		AIR?: {
			/** Search uses keyed legs; booking-details returns an array of tripInfo per API doc. */
			tripInfos?: TripjackTripInfos | TripjackTripInfo[];
			totalPriceInfo?: {
				totalFareDetail?: {
					fc?: TripjackFareComponent;
					afC?: Record<string, Record<string, number>>;
				};
			};
			travellerInfos?: TripjackBookingDetailTraveller[];
		};
	};
	/** Per-PNR status map (e.g. "ABC123": "CONFIRMED") */
	statusMap?: Record<string, string>;
	/** GDS PNR (may differ from airline PNR) */
	gdsPnr?: string;
	travellerInfos?: TripjackBookingDetailTraveller[];
	status?: {
		success?: boolean;
		httpStatus?: number;
		message?: string;
	};
	errors?: Array<{ code?: string; message?: string }>;
}

export interface TripjackReleasePnrRequest {
	bookingId: string;
	pnrs: string[];
}

// ── Amendment / Cancellation ──

export type TripjackAmendmentType = "CANCELLATION" | "DATECHANGE" | "SECTORCANCEL";

/** Trip segment reference for amendment charges / submit (TripJack `trips`). */
export interface TripjackAmendmentTripRef {
	src: string;
	dest: string;
	departureDate: string;
}

/** Traveller reference for partial amendments (TripJack `travellers`). */
export interface TripjackAmendmentTravellerRef {
	fn: string;
	ln?: string;
}

export interface TripjackAmendmentChargesRequest {
	bookingId: string;
	type: TripjackAmendmentType;
	/** Required by TripJack amendment APIs. */
	remarks: string;
	trips?: TripjackAmendmentTripRef[];
	travellers?: TripjackAmendmentTravellerRef[];
}

export interface TripjackAmendmentChargePax {
	firstName?: string;
	lastName?: string;
	paxType?: string;
	baseFare?: number;
	tax?: number;
	cancellationCharge?: number;
	refundAmount?: number;
	serviceCharge?: number;
	totalPenalty?: number;
}

export interface TripjackAmendmentChargesResponse {
	bookingId?: string;
	type?: TripjackAmendmentType;
	amendmentCharges?: TripjackAmendmentChargePax[];
	totalRefundAmount?: number;
	status?: {
		success?: boolean;
		httpStatus?: number;
		message?: string;
	};
	errors?: Array<{ code?: string; message?: string }>;
}

export interface TripjackSubmitAmendmentRequest {
	bookingId: string;
	type: TripjackAmendmentType;
	remarks: string;
	trips?: TripjackAmendmentTripRef[];
	travellers?: TripjackAmendmentTravellerRef[];
}

export interface TripjackSubmitAmendmentResponse {
	bookingId?: string;
	amendmentId?: string;
	status?: {
		success?: boolean;
		httpStatus?: number;
		message?: string;
	};
	errors?: Array<{ code?: string; message?: string }>;
}

export interface TripjackAmendmentDetailsRequest {
	/** From `submit-amendment` response (TripJack polls by amendment id). */
	amendmentId: string;
}

export interface TripjackAmendmentDetail {
	amendmentId?: string;
	type?: TripjackAmendmentType;
	status?: string;
	createdOn?: string;
	refundAmount?: number;
	cancellationCharges?: number;
}

export interface TripjackAmendmentDetailsResponse {
	bookingId?: string;
	amendments?: TripjackAmendmentDetail[];
	status?: {
		success?: boolean;
		httpStatus?: number;
		message?: string;
	};
	errors?: Array<{ code?: string; message?: string }>;
}
