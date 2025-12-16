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
	JourneyType: string; // API expects string: "1", "2", "3"
	PreferredAirlines?: string[] | null;
	Segments: FlightSegment[];
	Sources?: string[] | null;
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
	Airline: {
		AirlineCode: string;
		AirlineName: string;
		FlightNumber: string;
		FareClass: string;
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
}

export interface Fare {
	Currency: string;
	BaseFare: number;
	Tax: number;
	TaxBreakup: Array<{
		key: string;
		value: number;
	}>;
	YQTax: number;
	AdditionalTxnFeeOfrd: number;
	AdditionalTxnFeePub: number;
	PGCharge: number;
	OtherCharges: number;
	ChargeBU: Array<{
		key: string;
		value: number;
	}>;
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
	AirlineRemark: string;
	Fare?: Fare;
	FareBreakdown: Array<{
		PassengerType: number;
		PassengerCount: number;
		BaseFare: number;
		Tax: number;
	}>;
	Segments: Array<FlightSegmentDetail[]>;
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
export interface PassengerDetail {
	Title: string;
	FirstName: string;
	LastName: string;
	PaxType: 1 | 2 | 3; // 1:Adult, 2:Child, 3:Infant
	DateOfBirth: string;
	Gender: 1 | 2; // 1:Male, 2:Female
	PassportNo?: string;
	PassportExpiry?: string;
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
}

export interface BookingRequest {
	EndUserIp: string;
	TokenId?: string;
	TraceId: string;
	ResultIndex: string;
	Passengers: PassengerDetail[];
	IsBasicFareOnly?: boolean;
	IsGSTMandatory?: boolean;
	GSTCompanyAddress?: string;
	GSTCompanyContactNumber?: string;
	GSTNumber?: string;
	GSTCompanyEmail?: string;
	GSTCompanyName?: string;
}

export interface BookingResponse {
	Response: {
		TraceId: string;
		BookingId: number;
		PNR: string;
		BookingRefNo: string;
		SSRDenied: boolean;
		SSRMessage: string | null;
		Status: number;
		IsPriceChanged: boolean;
		IsTimeChanged: boolean;
		FlightItinerary: {
			Origin: string;
			Destination: string;
			AirlineCode: string;
			Fare: Fare;
			Segments: Array<FlightSegmentDetail[]>;
			Passenger: PassengerDetail[];
			BookingId: number;
			PNR: string;
			TicketStatus: string;
			InvoiceCreatedOn: string;
			InvoiceAmount: number;
			IssueDate: string;
		};
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
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
		IsTimeChanged: boolean;
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}

// Fare Rule Types
export interface FareRuleRequest {
	EndUserIp: string;
	TokenId?: string;
	TraceId: string;
	ResultIndex: string;
}

export interface FareRuleResponse {
	Response: {
		TraceId: string;
		FareRules: Array<{
			Origin: string;
			Destination: string;
			Airline: string;
			FareBasisCode: string;
			FareRuleDetail: string;
		}>;
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}

// SSR Types
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
		Results: FlightResult;
	};
	Error?: {
		ErrorCode: number;
		ErrorMessage: string;
	};
}
