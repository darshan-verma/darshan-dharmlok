/**
 * TripSafe (TripJack Insurance API v5.1) — request/response shapes.
 * Provider may return extra fields; responses use passthrough where unspecified.
 */

/** POPULARREGION keys from spec */
export type TripsafePopularRegionKey = "SCH" | "EUR" | "MDE" | "USC" | "ASI";

export type TripsafeRegionType = "POPULARREGION" | "COUNTRY";

export interface TripsafeInsuranceRegionItem {
	rkey: string;
	rt: TripsafeRegionType;
}

export interface TripsafeInsuranceCoverage {
	iri: TripsafeInsuranceRegionItem[];
}

export interface TripsafeSearchTraveller {
	age: number;
}

/** Course duration days for student flow */
export type TripsafeStudentCourseDays = 180 | 365 | 730 | 1095;

export interface TripsafeSearchInsuranceQuery {
	sd: string;
	ed: string;
	isc: TripsafeInsuranceCoverage;
	iti: TripsafeSearchTraveller[];
	/** Provider expects empty object when unused (matches Postman / TripJack samples) */
	isp?: Record<string, unknown>;
	/** Student insurance type */
	ict?: "STUDENT";
	/** Course duration (days) — required with STUDENT */
	cd?: TripsafeStudentCourseDays;
}

export interface TripsafeSearchRequest {
	isq: TripsafeSearchInsuranceQuery;
}

export interface TripsafeReviewProductItem {
	pid: string;
}

export interface TripsafeReviewPlanItem {
	plid: string;
	pi: TripsafeReviewProductItem[];
}

export interface TripsafeReviewRequest {
	pli: TripsafeReviewPlanItem[];
}

export type TripsafeNomineeRelation =
	| "SPOUSE"
	| "CHILD"
	| "PARENT"
	| "SIBLING"
	| "FRIEND"
	| "GUARDIAN"
	| "OTHER";

export interface TripsafeNomineeInfo {
	/** Relation to traveller */
	relation?: TripsafeNomineeRelation;
	/** Nominee fields — provider-specific; spec marks ni as mandatory */
	[key: string]: unknown;
}

export interface TripsafeInsuranceTraveller {
	dob?: string;
	age?: number;
	fn: string;
	ln: string;
	eid?: string;
	pnum?: string;
	gen?: string;
	/** Nominee — mandatory per spec */
	ni: TripsafeNomineeInfo | Record<string, unknown>;
	[key: string]: unknown;
}

export interface TripsafePaymentInfo {
	/** Spec: WALLET only */
	method?: "WALLET" | string;
	amount?: number;
	[key: string]: unknown;
}

export interface TripsafeBookPlanProduct {
	pid: string;
	iti?: TripsafeInsuranceTraveller[];
	[key: string]: unknown;
}

export interface TripsafeBookPlanItem {
	plid: string;
	pi?: TripsafeBookPlanProduct[];
	[key: string]: unknown;
}

/** Student booking supplement */
export interface TripsafeStudentCourseInfo {
	cn?: string;
	cdm?: string;
	un?: string;
	uc?: string;
	sn?: string;
	sdob?: string;
	sr?: string;
	se?: string;
	[key: string]: unknown;
}

export interface TripsafeBookRequest {
	bookingId: string;
	paymentInfos: TripsafePaymentInfo[];
	pli: TripsafeBookPlanItem[];
	/** Present for student insurance */
	sc?: TripsafeStudentCourseInfo;
	ict?: "STUDENT";
	cd?: TripsafeStudentCourseDays;
	[key: string]: unknown;
}

export interface TripsafeBookingDetailsRequest {
	bookingId: string;
}

export interface TripsafeAmendmentRaiseRequest {
	bookingId: string;
	type: "CANCELLATION";
	travellerKeys: Record<string, Record<string, Array<{ id: number }>>>;
}

export interface TripsafeAmendmentConfirmRequest {
	amendmentId: string;
	bookingId: string;
}

/** Pricing field keys from spec §4 */
export type TripsafePricingFieldKey =
	| "BF"
	| "AP"
	| "IP"
	| "IPGST"
	| "APGST"
	| "SPGST"
	| "AC"
	| "SP"
	| "TF"
	| "IMU"
	| "ACTDS"
	| "NF";

/** Search/review responses — nested provider trees */
export interface TripsafeSearchResponse {
	isr?: unknown;
	status?: { success?: boolean; message?: string };
	errors?: Array<{ message?: string }>;
	[key: string]: unknown;
}

export interface TripsafeReviewResponse {
	bid?: string;
	bookingId?: string;
	status?: { success?: boolean; message?: string };
	errors?: Array<{ message?: string }>;
	[key: string]: unknown;
}

export interface TripsafeBookResponse {
	bookingId?: string;
	status?: { success?: boolean; message?: string };
	errors?: Array<{ message?: string }>;
	[key: string]: unknown;
}

export interface TripsafeBookingDetailsResponse {
	order?: unknown;
	itemInfos?: unknown;
	status?: { success?: boolean; message?: string };
	errors?: Array<{ message?: string }>;
	[key: string]: unknown;
}

export interface TripsafeAmendmentRaiseResponse {
	amendmentId?: string;
	refund?: unknown;
	status?: { success?: boolean; message?: string };
	errors?: Array<{ message?: string }>;
	[key: string]: unknown;
}

export interface TripsafeAmendmentConfirmResponse {
	status?: "SUCCESS" | "REJECTED" | string;
	refund?: unknown;
	tmr?: unknown;
	errors?: Array<{ message?: string }>;
	[key: string]: unknown;
}
