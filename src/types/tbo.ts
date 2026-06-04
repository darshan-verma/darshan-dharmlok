/**
 * TypeScript type definitions for TBO API
 */

// Authentication Types
export interface TboAuthRequest {
	ClientId: string;
	UserName: string;
	Password: string;
	EndUserIp: string;
}

export interface TboAuthResponse {
	Status: number;
	TokenId: string;
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}

// Flight Search Types
export interface FlightSegment {
	Origin: string;
	Destination: string;
	FlightCabinClass: string; // API expects string: "1", "2", "3", etc.
	PreferredDepartureTime: string;
	PreferredArrivalTime?: string;
}

export interface FlightSearchRequest {
	EndUserIp: string;
	TokenId?: string;
	AdultCount: string; // API expects string: "1", "2", etc.
	ChildCount: string; // API expects string: "0", "1", etc.
	InfantCount: string; // API expects string: "0", "1", etc.
	DirectFlight: string; // API expects string: "true", "false"
	OneStopFlight: string; // API expects string: "true", "false"
	JourneyType: string; // API expects string: "1", "2", "3", "4", "5"
	PreferredAirlines?: string[] | null;
	Segments: FlightSegment[];
	Sources?: string[] | null;
	MaxResults?: number; // Maximum number of results to return
}

export interface Airport {
	AirportCode: string;
	AirportName: string;
	Terminal: string;
	CityCode: string;
	CityName: string;
	CountryCode: string;
	CountryName: string;
	DepTime?: string; // Departure time from this airport
	ArrTime?: string; // Arrival time at this airport
}

export interface FlightSegmentDetail {
	TripIndicator?: number;
	SegmentIndicator?: number;
	Airline: {
		AirlineCode: string;
		AirlineName: string;
		FlightNumber: string;
		FareClass: string;
		OperatingCarrier?: string;
	};
	Origin: {
		Airport: Airport;
		DepTime: string;
	};
	Destination: {
		Airport: Airport;
		ArrTime: string;
	};
	Duration: number;
	GroundTime: number;
	Mile: number;
	StopOver: boolean;
	DepartureTime?: string;
	ArrivalTime?: string;
	FlightStatus: string;
	StopPoint: string;
	StopPointArrivalTime: string;
	StopPointDepartureTime: string;
	Craft: string;
	Remark: string | null;
	IsETicketEligible: boolean;
	FlightInfoIndex: string;
	AirlineRemark: string;
	Baggage?: string;
	CabinBaggage?: string;
	Status?: string;
	CabinClass?: number;
	SupplierFareClass?: string | null;
	FareClassification?: { Type: string };
}

export interface Fare {
	Currency: string;
	BaseFare: number;
	Tax: number;
	TaxBreakup: Array<{ key: string; value: number }>;
	YQTax: number;
	AdditionalTxnFeeOfrd: number;
	AdditionalTxnFeePub: number;
	PGCharge: number;
	OtherCharges: number;
	ChargeBU: Array<{ key: string; value: number }>;
	Discount: number;
	PublishedFare: number;
	CommissionEarned: number;
	PLBEarned: number;
	IncentiveEarned: number;
	OfferedFare: number;
	TdsOnCommission: number;
	TdsOnPLB: number;
	TdsOnIncentive: number;
	ServiceFee: number;
	TotalBaggageCharges: number;
	TotalMealCharges: number;
	TotalSeatCharges: number;
	TotalSpecialServiceCharges: number;
	// Missing GST components
	IGSTAmount?: number;
	CGSTAmount?: number;
	SGSTAmount?: number;
	CessAmount?: number;
	AirlineTransFee?: number;
	// Calculated field for Net Payable
	NetPayable?: number;
}

export interface FlightResult {
	ResultIndex: string;
	Source: number;
	IsLCC: boolean;
	IsRefundable: boolean;
	IsUpsellAllowed?: boolean;
	AirlineCode: string;
	ValidatingAirlineCode: string;
	ValidatingAirline?: string;
	AirlineRemark: string;
	Fare?: Fare;
	ReturnResultIndex?: string; // Normal return (JT=2): separate IB index; special return (JT=5): IB part of comma-separated ResultIndex
	/** Set when outbound+inbound paired for TBO JourneyType 5 */
	_tboSpecialReturn?: boolean;
	ApiSource?: "TBO" | "AIRiQ" | "TRIPJACK"; // API source identifier
	FareBreakdown: Array<{
		Currency?: string;
		PassengerType: number;
		PassengerCount: number;
		BaseFare: number;
		Tax: number;
		TaxBreakUp?: Array<{ key: string; value: number }>;
		YQTax?: number;
		AdditionalTxnFeeOfrd?: number;
		AdditionalTxnFeePub?: number;
		PGCharge?: number;
		SupplierReissueCharges?: number;
	}>;
	Segments: Array<FlightSegmentDetail[]>;
	FareClassification?: {
		Color: string;
		Type: string;
	};
	Error?: { ErrorCode: number; ErrorMessage: string };
	LastTicketDate?: string;
	TicketAdvisory?: string | null;
	FareRules?: FareRuleItem[];
	FirstNameFormat?: string;
	LastNameFormat?: string;
	IsBookableIfSeatNotAvailable?: boolean;
	IsHoldAllowedWithSSR?: boolean;
	IsPanRequiredAtBook?: boolean;
	IsPanRequiredAtTicket?: boolean;
	IsPassportRequiredAtBook?: boolean;
	IsPassportRequiredAtTicket?: boolean;
	GSTAllowed?: boolean;
	IsCouponAppilcable?: boolean;
	IsGSTMandatory?: boolean;
	IsHoldAllowed?: boolean;
	IsPassportFullDetailRequiredAtBook?: boolean;
	IsSeatMandatory?: boolean;
	IsMealMandatory?: boolean;
	ResultFareType?: string;
	MiniFareRules?: Array<
		Array<{
			JourneyPoints: string;
			Type: string;
			From: string;
			To: string;
			Unit: string;
			Details: string;
			OnlineReissueAllowed?: boolean;
			OnlineRefundAllowed?: boolean;
		}>
	>;
	/** AIRiQ search payload preserved for Pricing / GetMultiClass / seat-map APIs */
	_airiqOriginal?: {
		Trackid?: string;
		FlightDetails?: Array<{ FlightID: string; MultiClass?: string; [key: string]: unknown }>;
		Fares?: unknown;
	};
	_airiqSeatMapAvailable?: boolean;
	/** TripJack multicity: COMBO (intl) vs per-leg ONWARD (domestic) */
	_tripjackMulticityMode?: "COMBO" | "DOMESTIC_LEGS";
	/** Zero-based leg index for domestic multicity search results */
	_tripjackLegIndex?: number;
}

export interface FlightSearchResponse {
	Response: {
		TraceId: string;
		Origin: string;
		Destination: string;
		Results: Array<FlightResult[]>;
		FlightCabinClass: number;
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}

// Booking Types

/** Per-passenger fare in TBO Book request (doc 5.25). */
export interface TboBookPassengerFare {
	Currency: string;
	BaseFare: number;
	Tax: number;
	TransactionFee: number;
	YQTax: number;
	AdditionalTxnFeeOfrd: number;
	AdditionalTxnFeePub: number;
	AirTransFee: number;
	OtherCharges?: number;
	Discount?: number;
	PublishedFare?: number;
	OfferedFare?: number;
	TdsOnCommission?: number;
	TdsOnPLB?: number;
	TdsOnIncentive?: number;
	ServiceFee?: number;
	ChargeBU?: Array<{ TBOMarkUp: number; ConvenienceCharge: number; OtherCharge: number }>;
}

/** Meal option in Book request (doc 5.26). */
export interface TboBookMeal {
	Code?: string;
	Description?: string;
}

/** Seat option in Book request (doc 5.27). */
export interface TboBookSeat {
	Code?: string;
	Description?: string;
}

/**
 * Passenger payload for TBO Book request (doc level 5).
 * DateOfBirth optional at Book; required at Ticket if not provided here.
 * PassportNo/PassportExpiry/PassportIssueDate mandatory when FareQuote has
 * IsPassportRequiredAtBook or IsPassportFullDetailRequiredAtBook true.
 */
export interface TboBookPassenger {
	Title: string;
	FirstName: string;
	LastName: string;
	PaxType: number | string; // 1:Adult, 2:Child, 3:Infant; API may accept string
	DateOfBirth?: string;
	Gender: number | string; // 1:Male, 2:Female
	GSTCompanyAddress: string;
	GSTCompanyContactNumber: string;
	GSTCompanyName: string;
	GSTNumber: string;
	GSTCompanyEmail: string;
	PassportNo?: string;
	PassportExpiry?: string;
	PassportIssueDate?: string;
	PassportIssueCountryCode?: string;
	PAN?: string;
	AddressLine1: string;
	AddressLine2?: string;
	City: string;
	CountryCode: string;
	CountryName: string;
	ContactNo: string;
	Email: string;
	IsLeadPax: boolean;
	FFAirlineCode?: string | null;
	FFNumber?: string;
	Fare: TboBookPassengerFare;
	Meal?: TboBookMeal;
	Seat?: TboBookSeat;
	Baggage?: TboBookBaggage;
	Nationality: string;
	CellCountryCode?: string;
	/** Guardian details for Child/Infant when PAN/Passport is required per TBO docs */
	GuardianDetails?: {
		Title: string;
		FirstName: string;
		LastName: string;
		PAN?: string;
	};
}

/** Baggage option in Book/Ticket request for international LCC free baggage */
export interface TboBookBaggage {
	Code?: string;
	Description?: string;
	Weight?: number;
	Price?: number;
}

export interface PassengerDetail {
	Title: string;
	FirstName: string;
	LastName: string;
	PaxType: 1 | 2 | 3; // 1:Adult, 2:Child, 3:Infant
	DateOfBirth: string;
	Gender: 1 | 2; // 1:Male, 2:Female
	PassportNo?: string;
	PassportExpiry?: string;
	PassportIssueDate?: string;
	PassportIssueCountryCode?: string;
	PAN?: string;
	AddressLine1: string;
	AddressLine2?: string;
	City: string;
	CountryCode: string;
	CountryName: string;
	Nationality?: string;
	ContactNo: string;
	Email: string;
	IsLeadPax: boolean;
	FFAirlineCode?: string;
	FFNumber?: string;
	Meal?: string;
	Seat?: string;
	/** Guardian details for Child/Infant when PAN/Passport is required */
	GuardianDetails?: {
		Title: string;
		FirstName: string;
		LastName: string;
		PAN?: string;
	};
	/** Student / senior citizen document id (TripJack `di`) */
	DocumentId?: string;
	/** GST fields (lead passenger) — mapped to TripJack `gstInfo` at book */
	GSTNumber?: string;
	GSTCompanyName?: string;
	GSTCompanyAddress?: string;
	GSTCompanyContactNumber?: string;
	GSTCompanyEmail?: string;
	/** Emergency contact when review `iecr` is true */
	EmergencyEmail?: string;
	EmergencyContactName?: string;
	EmergencyContactPhone?: string;
}

/** TBO Book request. TokenId is injected server-side; do not send from client. */
export interface BookingRequest {
	EndUserIp: string;
	TokenId?: string;
	TraceId: string;
	ResultIndex: string;
	Passengers: TboBookPassenger[];
	IsBasicFareOnly?: boolean;
	IsGSTMandatory?: boolean;
}

/** Charge breakdown in Book response (doc 6.13.8). */
export interface TboBookChargeBU {
	TBOMarkUp: number;
	ConvenienceCharge: number;
	OtherCharge: number;
}

/** Fare in TBO Book response (doc 6.13). */
export interface TboBookResponseFare {
	Currency: string;
	BaseFare: number;
	Tax: number;
	YQTax: number;
	AdditionalTxnFeeOfrd: number;
	AdditionalTxnFeePub: number;
	OtherCharges: number;
	ChargeBU: TboBookChargeBU[];
	Discount: number;
	PublishedFare: number;
	CommissionEarned: number;
	PLBEarned: number;
	IncentiveEarned: number;
	OfferedFare: number;
	TdsOnCommission: number;
	TdsOnPLB: number;
	TdsOnIncentive: number;
	ServiceFee: number;
}

/** Passenger in TBO Book response (doc 6.14). */
export interface TboBookResponsePassenger {
	PaxID?: number;
	PaxId?: number;
	Title: string;
	FirstName: string;
	LastName: string;
	PaxType: number | string;
	DateOfBirth?: string;
	Gender: number | string;
	PassportNo?: string;
	PassportExpiry?: string;
	AddressLine1: string;
	AddressLine2?: string;
	City: string;
	CountryCode: string;
	CountryName: string;
	ContactNo: string;
	Email: string;
	IsLeadPax: boolean;
	FFAirlineCode?: string | null;
	FFNumber?: string;
	Fare: TboBookResponseFare;
	Meal?: TboBookMeal;
	Seat?: TboBookSeat;
	Nationality: string;
}

/** FareRule in Book response FlightItinerary (doc 6.18). */
export interface TboBookFareRule {
	Origin: string;
	Destination: string;
	Airline: string;
	FareBasisCode: string;
	FareRuleDetail: string | string[];
	FareRestriction: string;
	GSTCompanyAddress?: string;
	GSTCompanyContactNumber?: string;
	GSTCompanyName?: string;
	GSTNumber?: string;
	GSTCompanyEmail?: string;
}

/** FlightItinerary in TBO Book response (doc 6). */
export interface TboBookFlightItinerary {
	BookingId: number;
	PNR: string;
	IsDomestic?: boolean;
	Source?: number;
	Origin: string;
	Destination: string;
	AirlineCode: string;
	ValidatingAirlineCode?: string;
	AirlineRemarks?: string;
	IsLCC?: boolean;
	NonRefundable?: boolean;
	FareType?: string;
	Fare: TboBookResponseFare;
	Passenger: TboBookResponsePassenger[];
	Segments: Array<FlightSegmentDetail | Record<string, unknown>>;
	LastTicketDate: string;
	TicketAdvisory?: string | null;
	FareRules?: TboBookFareRule[];
}

/** TBO Book response (doc). Status: 1=Successful, 2=Failed, 3=OtherFare, 4=OtherClass, 5=BookedOther, 6=NotConfirmed. */
export interface BookingResponse {
	Response: {
		TraceId?: string;
		PNR: string;
		BookingId: number;
		IsPriceChanged: boolean;
		IsTimeChanged: boolean;
		SSRDenied: boolean;
		SSRMessage?: string | null;
		Status: number;
		FlightItinerary: TboBookFlightItinerary;
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}

// GetBookingDetails Types (doc: get-booking-details-doc.md)
/** Request variant 1: by BookingId. Variant 2: BookingId + PNR. Variant 3: PNR + FirstName. Variant 4: PNR + LastName. Variant 5: PNR + FirstName + LastName. Variant 6: by TraceId. TokenId injected server-side. */
export type GetBookingDetailsRequest =
	| { EndUserIp: string; BookingId: number }
	| { EndUserIp: string; BookingId: number; PNR: string }
	| { EndUserIp: string; PNR: string; FirstName: string }
	| { EndUserIp: string; PNR: string; LastName: string }
	| { EndUserIp: string; PNR: string; FirstName: string; LastName: string }
	| { EndUserIp: string; TraceId: string };

/** Baggage item in GetBookingDetails Passenger (LCC). */
export interface TboGetBookingDetailsBaggage {
	WayType?: number;
	Code?: string;
	Description?: string | number;
	Weight?: string | number;
	Currency?: string;
	Price?: number;
	Origin?: string;
	Destination?: string;
}

/** MealDynamic item in GetBookingDetails Passenger (LCC). */
export interface TboGetBookingDetailsMealDynamic {
	WayType?: number;
	Code?: string;
	Description?: string | number;
	AirlineDescription?: string;
	Quantity?: string | number;
	Price?: number;
	Currency?: string;
	Origin?: string;
	Destination?: string;
}

/** Ticket in GetBookingDetails Passenger. */
export interface TboGetBookingDetailsTicket {
	TicketId?: number;
	TicketNumber?: string;
	IssueDate?: string;
	ValidatingAirline?: string;
	Remarks?: string;
	ServiceFeeDisplayType?: string;
	Status?: string;
}

/** SegmentAdditionalInfo in GetBookingDetails Passenger. */
export interface TboGetBookingDetailsSegmentAdditionalInfo {
	FareBasis?: string;
	NVA?: string | null;
	NVB?: string | null;
	Baggage?: string;
	Meal?: string;
}

/** SeatPreference (NON-LCC). */
export interface TboGetBookingDetailsSeatPreference {
	Code?: string;
	Description?: string;
}

/** Meal (NON-LCC). */
export interface TboGetBookingDetailsMeal {
	Code?: string | null;
	Description?: string | null;
}

/** Fare in GetBookingDetails (root and per-passenger). ChargeBU can be array of { key, value }. */
export interface TboGetBookingDetailsFare {
	Currency?: string;
	BaseFare?: number;
	Tax?: number;
	YQTax?: number;
	AdditionalTxnFeeOfrd?: number;
	AdditionalTxnFeePub?: number;
	OtherCharges?: number;
	ChargeBU?: Array<{ key?: string; value?: number }>;
	Discount?: number;
	PublishedFare?: number;
	CommissionEarned?: number;
	PLBEarned?: number;
	IncentiveEarned?: number;
	OfferedFare?: number;
	TdsOnCommission?: number;
	TdsOnPLB?: number;
	TdsOnIncentive?: number;
	ServiceFee?: number;
}

/** Passenger in GetBookingDetails FlightItinerary (LCC and NON-LCC). */
export interface TboGetBookingDetailsPassenger {
	PaxID?: number;
	PaxId?: number;
	Title?: string;
	FirstName?: string;
	LastName?: string;
	PaxType?: number | string;
	DateOfBirth?: string;
	Gender?: number | string;
	PassportNo?: string | null;
	PassportExpiry?: string | null;
	AddressLine1?: string;
	AddressLine2?: string;
	City?: string;
	CountryCode?: string;
	CountryName?: string;
	Nationality?: string;
	ContactNo?: string;
	Email?: string;
	IsLeadPax?: boolean;
	FFAirlineCode?: string | null;
	FFNumber?: string | null;
	Fare?: TboGetBookingDetailsFare;
	Baggage?: TboGetBookingDetailsBaggage[];
	MealDynamic?: TboGetBookingDetailsMealDynamic[];
	Meal?: TboGetBookingDetailsMeal;
	SeatPreference?: TboGetBookingDetailsSeatPreference;
	Ticket?: TboGetBookingDetailsTicket;
	SegmentAdditionalInfo?: TboGetBookingDetailsSegmentAdditionalInfo[];
}

/** Segment in GetBookingDetails FlightItinerary. */
export interface TboGetBookingDetailsSegment {
	TripIndicator?: number;
	SegmentIndicator?: number;
	Airline?: {
		AirlineCode?: string;
		AirlineName?: string;
		FlightNumber?: string;
		FareClass?: string;
		OperatingCarrier?: string;
	};
	Origin?: {
		Airport?: Airport;
		DepTime?: string;
	};
	Destination?: {
		Airport?: Airport;
		ArrTime?: string;
	};
	AirlinePNR?: string;
	AccumulatedDuration?: number;
	Duration?: number;
	GroundTime?: number;
	Mile?: number;
	StopOver?: boolean;
	StopPoint?: string;
	StopPointArrivalTime?: string | null;
	StopPointDepartureTime?: string | null;
	Craft?: string;
	IsETicketEligible?: boolean;
	FlightStatus?: string;
	Status?: string;
}

/** FareRule in GetBookingDetails FlightItinerary. */
export interface TboGetBookingDetailsFareRule {
	Origin?: string;
	Destination?: string;
	Airline?: string;
	FareBasisCode?: string;
	FareRuleDetail?: string | string[];
	FareRestriction?: string;
}

/** FlightItinerary in GetBookingDetails response (LCC and NON-LCC). */
export interface TboGetBookingDetailsFlightItinerary {
	BookingId?: number;
	PNR?: string;
	IsDomestic?: boolean;
	Source?: number;
	Origin?: string;
	Destination?: string;
	AirlineCode?: string;
	ValidatingAirlineCode?: string;
	AirlineRemarks?: string;
	AirlineRemark?: string;
	AirlineTollFreeNo?: string;
	IsLCC?: boolean;
	NonRefundable?: boolean;
	FareType?: string;
	Fare?: TboGetBookingDetailsFare;
	Passenger?: TboGetBookingDetailsPassenger[];
	Segments?: TboGetBookingDetailsSegment[];
	FareRules?: TboGetBookingDetailsFareRule[];
	InvoiceNo?: string;
	InvoiceCreatedOn?: string;
	TicketStatus?: number;
	Status?: number;
	Message?: string;
	ResponseStatus?: number;
	TraceId?: string;
	Penalty?: {
		ReissueCharge?: number;
		CancellationCharge?: number;
	};
}

/** GetBookingDetails API response. */
export interface GetBookingDetailsResponse {
	Response?: {
		Error?: {
			ErrorCode: number;
			ErrorMessage: string;
		};
		FlightItinerary?: TboGetBookingDetailsFlightItinerary;
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}

// Ticket API Types (tbo-ticket-doc.md – Service: .../rest/Ticket)
/** Passport item for Ticket request (Non-LCC). Doc: PaxId optional, PassportNo/Expiry optional, DateOfBirth mandatory. */
export interface TboTicketPassportItem {
	PaxId?: number;
	PassportNo?: string;
	PassportExpiry?: string;
	DateOfBirth: string;
}

/** Ticket request for Non-LCC (already booked; generate ticket). */
export interface TicketRequestNonLCC {
	EndUserIp: string;
	TokenId?: string;
	TraceId: string;
	PNR: string;
	BookingId: number;
	Passport?: TboTicketPassportItem[];
	IsPriceChangeAccepted?: boolean;
}

/** Ticket request for LCC (ResultIndex + full Passengers). */
export interface TicketRequestLCC {
	EndUserIp: string;
	TokenId?: string;
	TraceId: string;
	ResultIndex: string;
	Passengers: TboBookPassenger[];
	IsPriceChangeAccepted?: boolean;
}

/** Discriminated union for Ticket API request. */
export type TicketRequest = TicketRequestNonLCC | TicketRequestLCC;

/** Ticket API response (inner payload; API wraps in Response.Response). Doc: TicketStatus enum Failed=0, Successful=1, NotSaved=2, NotCreated=3, NotAllowed=4, InProgress=5, TicketeAlreadyCreated=6, PriceChanged=8, OtherError=9. */
export interface TicketResponse {
	IsPriceChanged?: boolean;
	IsTimeChanged?: boolean;
	PNR?: string;
	BookingId?: number;
	SSRDenied?: boolean;
	SSRMessage?: string | null;
	FlightItinerary?: TboGetBookingDetailsFlightItinerary;
	TicketStatus?: number;
	Message?: string | null;
	Nationality?: string;
}

/** Top-level Ticket API response (TBO wrapper). */
export interface TicketApiResponse {
	Response?: {
		Error?: { ErrorCode: number; ErrorMessage: string };
		ResponseStatus?: number;
		TraceId?: string;
		Response?: TicketResponse;
	};
	Error?: { ErrorCode: number; ErrorMessage: string };
}

// ========== TBO Cancel / Release PNR / Change Request (tbo-cancel-doc.md) ==========

/** ResponseStatus enumeration: NotSet=0, Successfull=1, Failed=2, InValidRequest=3, InValidSession=4, InValidCredentials=5 */
export type TboResponseStatus = 0 | 1 | 2 | 3 | 4 | 5;

/** RequestType: NotSet=0, FullCancellation=1, PartialCancellation=2, Reissuance=3 */
export type RequestType = 0 | 1 | 2 | 3;

/** CancellationType: NotSet=0, NoShow=1, FlightCancelled=2, Others=3 */
export type CancellationType = 0 | 1 | 2 | 3;

/** ChangeRequestStatus: NotSet=0, Unassigned=1, Assigned=2, Acknowledged=3, Completed=4, Rejected=5, Closed=6, Pending=7, Other=8 */
export type ChangeRequestStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface TboError {
	ErrorCode: number;
	ErrorMessage: string;
}

/** Release PNR (release hold booking). Request. */
export interface ReleasePNRRequest {
	EndUserIp: string;
	TokenId?: string;
	BookingId: number;
	Source: string;
}

/** Release PNR response (API returns { Response: ReleasePNRResponse }). */
export interface ReleasePNRResponse {
	ResponseStatus: number;
	TraceId?: string;
	Error?: TboError;
}

/** Sector for partial cancellation. */
export interface SendChangeRequestSector {
	Origin: string;
	Destination: string;
}

/** Send Change Request body (full or partial cancellation of ticketed booking). */
export interface SendChangeRequestBody {
	EndUserIp: string;
	TokenId?: string;
	BookingId: number;
	RequestType: RequestType;
	CancellationType: CancellationType;
	Remarks: string;
	Sectors?: SendChangeRequestSector[];
	TicketId?: number | number[];
}

/** TicketCRInfo from Send Change Response. */
export interface TicketCRInfo {
	ChangeRequestId?: number;
	TicketId?: number;
	Status?: number;
	Remarks?: string;
	ChangeRequestStatus?: ChangeRequestStatus;
	CancellationCharge?: number;
	RefundedAmount?: number;
	ServiceTaxOnRAF?: number;
	SwachhBharatCess?: number;
	KrishiKalyanCess?: number;
	CreditNoteNo?: string;
	CreditNoteCreatedOn?: string;
}

/** Send Change Response (API returns { Response: SendChangeResponse }). */
export interface SendChangeResponse {
	TicketCRInfo?: TicketCRInfo | TicketCRInfo[];
	ResponseStatus?: number;
	TraceId?: string;
	B2B2BStatus?: boolean;
	Error?: TboError;
}

/** Get Change Request Status request. */
export interface GetChangeRequestStatusRequest {
	EndUserIp: string;
	TokenId?: string;
	ChangeRequestId: number;
}

/** Get Change Request Status response (may be top-level or under Response). */
export interface GetChangeRequestStatusResponse {
	ChangeRequestId?: number;
	RefundedAmount?: number;
	CancellationCharge?: number;
	ServiceTaxOnRAF?: number;
	ChangeRequestStatus?: ChangeRequestStatus;
	ResponseStatus?: number;
	TraceId?: string;
	Error?: TboError | null;
}

/** Get Cancellation Charges request. */
export interface GetCancellationChargesRequest {
	EndUserIp: string;
	TokenId?: string;
	RequestType: 1; // FullCancellation
	BookingId: number;
	BookingMode?: number;
}

/** Get Cancellation Charges response (API returns { Response: GetCancellationChargesResponse }). */
export interface GetCancellationChargesResponse {
	RefundAmount?: number;
	CancellationCharge?: number;
	Remarks?: string;
	Currency?: string;
	ResponseStatus?: number;
	TraceId?: string;
	Error?: TboError;
}

// Fare Quote Types
export interface FareQuoteRequest {
	EndUserIp: string;
	TokenId?: string;
	TraceId: string;
	ResultIndex: string;
}

export interface FareQuoteResponse {
	Response: {
		TraceId: string;
		Results: FlightResult;
		IsPriceChanged: boolean;
		IsTimeChanged?: boolean;
		ResponseStatus?: number;
		Error?: { ErrorCode: number; ErrorMessage: string };
		FlightDetailChangeInfo?: string;
		Penalty?: { ReissueCharge?: number; CancellationCharge?: number };
	};
	Error?: { ErrorCode: number; ErrorMessage: string };
}

// Fare Rule Types (aligned with TBO FareRule API doc)
export interface FareRuleItem {
	Airline: string;
	Origin: string;
	Destination: string;
	FareBasisCode: string;
	FareRuleDetail: string;
	FareRestriction?: string | null;
	DepartureTime?: string;
	ReturnDate?: string;
	FlightId?: number;
	FareInclusions?: unknown[];
	// Optional fields for backward compatibility with other TBO response shapes
	FareFamilyCode?: string;
	FareRuleIndex?: string;
}

export interface FareRuleRequest {
	EndUserIp: string;
	TokenId?: string;
	TraceId: string;
	ResultIndex: string;
}

export interface FareRuleResponse {
	Response: {
		Error: {
			ErrorCode: number;
			ErrorMessage: string;
		};
		ResponseStatus: number;
		TraceId: string;
		/** Primary shape from TBO FareRule API */
		FareRules?: FareRuleItem[];
		/** Optional; some TBO responses may include Results with nested FareRules / MiniFareRules */
		Results?: {
			FareInclusions: unknown[];
			FirstNameFormat: string;
			IsBookableIfSeatNotAvailable: boolean;
			IsExclusiveFare: boolean;
			IsFreeMealAvailable: boolean;
			IsHoldAllowedWithSSR: boolean;
			IsHoldMandatoryWithSSR: boolean;
			LastNameFormat: string;
			ResultIndex: string;
			Source: number;
			IsLCC: boolean;
			IsRefundable: boolean;
			IsPanRequiredAtBook: boolean;
			IsPanRequiredAtTicket: boolean;
			GSTAllowed: boolean;
			IsCouponAppilcable: boolean;
			IsGSTMandatory: boolean;
			IsHoldAllowed: boolean;
			AirlineRemark: string;
			IsPassportFullDetailRequiredAtBook: boolean;
			ResultFareType: string;
			Fare: Fare;
			FareBreakdown: Array<{
				Currency: string;
				PassengerType: number;
				PassengerCount: number;
				BaseFare: number;
				Tax: number;
				TaxBreakUp?: Array<{
					key: string;
					value: number;
				}>;
				YQTax: number;
				AdditionalTxnFeeOfrd: number;
				AdditionalTxnFeePub: number;
				PGCharge: number;
				SupplierReissueCharges: number;
			}>;
			Segments: Array<FlightSegmentDetail[]>;
			LastTicketDate: string;
			TicketAdvisory: string | null;
			FareRules: FareRuleItem[];
			MiniFareRules: Array<
				Array<{
					JourneyPoints: string;
					Type: string;
					From: string;
					To: string;
					Unit: string;
					Details: string;
					OnlineReissueAllowed: boolean;
					OnlineRefundAllowed: boolean;
				}>
			>;
			AirlineCode: string;
			ValidatingAirline: string;
			FareClassification: {
				Color: string;
				Type: string;
			};
		};
		MiniFareRules?: Array<
			Array<{
				JourneyPoints: string;
				Type: string;
				From: string;
				To: string;
				Unit: string;
				Details: string;
				OnlineReissueAllowed: boolean;
				OnlineRefundAllowed: boolean;
			}>
		>;
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}

// SSR Types
export interface SSRRequest {
	EndUserIp: string;
	TokenId?: string;
	TraceId: string;
	ResultIndex: string;
}

export interface SSRResponse {
	Response: {
		ResponseStatus: number;
		Error: {
			ErrorCode: number;
			ErrorMessage: string;
		};
		TraceId: string;
		// LCC Response fields
		Baggage?: Array<
			Array<{
				AirlineCode: string;
				FlightNumber: string;
				WayType: number;
				Code: string;
				Description: number;
				Weight: number;
				Currency: string;
				Price: number;
				Origin: string;
				Destination: string;
			}>
		>;
		MealDynamic?: Array<
			Array<{
				AirlineCode: string;
				FlightNumber: string;
				WayType: number;
				Code: string;
				Description: number;
				AirlineDescription: string;
				Quantity: number;
				Currency: string;
				Price: number;
				Origin: string;
				Destination: string;
			}>
		>;
		SeatDynamic?: Array<{
			SegmentSeat: Array<{
				RowSeats: Array<{
					Seats: Array<{
						AirlineCode: string;
						FlightNumber: string;
						CraftType: string;
						Origin: string;
						Destination: string;
						AvailablityType: number;
						Description: number;
						Code: string;
						RowNo: string;
						SeatNo: string | null;
						SeatType: number;
						SeatWayType: number;
						Compartment: number;
						Deck: number;
						Currency: string;
						Price: number;
					}>;
				}>;
			}>;
		}>;
		SpecialServices?: Array<{
			SegmentSpecialService: Array<{
				SSRService: Array<{
					Origin: string;
					Destination: string;
					DepartureTime: string;
					AirlineCode: string;
					FlightNumber: string;
					Code: string;
					ServiceType: number;
					Text: string;
					WayType: number;
					Currency: string;
					Price: number;
				}>;
			}>;
		}>;
		// NON-LCC Response fields
		Meal?: Array<{
			Code: string;
			Description: string;
		}>;
		SeatPreference?: Array<{
			Code: string;
			Description: string;
		}>;
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}

export interface SeatMapRequest {
	EndUserIp: string;
	TokenId?: string;
	TraceId: string;
	ResultIndex: string;
}

export interface Seat {
	RowNo: string;
	SeatNo: string;
	SeatType: number;
	SeatWayType: number;
	Compartment: number;
	Deck: number;
	Currency: string;
	Price: number;
	AvailablityType: number;
	Description: string;
	Code: string;
}

export interface SeatMapResponse {
	Response: {
		TraceId: string;
		SegmentSeat: Array<{
			SegmentIndex: number;
			Seats: Seat[];
		}>;
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}

// Common Types
export type CabinClass = 1 | 2 | 3 | 4 | 5 | 6;
export type JourneyType = 1 | 2 | 3;
export type PassengerType = 1 | 2 | 3;
export type Gender = 1 | 2;

// Fare Upsell Types
export interface FareUpsellRequest {
	EndUserIp: string;
	TokenId?: string;
	TraceId: string;
	ResultIndex: string;
	ReturnResultIndex?: string;
}

export interface FareUpsellResponse {
	Response: {
		TraceId: string;
		Results: FlightResult[];
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}

// Price RBD Types
export interface PriceRBDRequest {
	EndUserIp: string;
	TokenId?: string;
	TraceId: string;
	AdultCount: string;
	ChildCount: string;
	InfantCount: string;
	AirSearchResult: Array<{
		ResultIndex: string;
		Source: number;
		IsLCC: boolean;
		IsRefundable: boolean;
		AirlineRemark: string;
		Segments: Array<
			Array<{
				TripIndicator: number;
				SegmentIndicator: number;
				Airline: {
					AirlineCode: string;
					AirlineName: string;
					FlightNumber: string;
					FareClass: string;
					OperatingCarrier: string;
				};
			}>
		>;
	}>;
}

export interface PriceRBDResponse {
	Response: {
		TraceId: string;
		Results: FlightResult[][] | FlightResult; // Can be array of arrays or single result
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}
