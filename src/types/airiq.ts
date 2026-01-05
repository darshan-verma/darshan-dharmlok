/**
 * TypeScript type definitions for AIRiQ API
 * Note: These types are preliminary and should be adjusted based on actual AIRiQ API documentation
 */

// Authentication Types
export interface AiriqAuthRequest {
	AgentId: string;
	Username: string;
	Password: string;
}

export interface AiriqAuthResponse {
	AgentID: string;
	Status: {
		Error: string;
		ResultCode: string;
		SequenceID: string;
	};
	TerminalID: string;
	Token: string;
	UserName: string;
}

// Flight Search Types
export interface AiriqAvailInfo {
	DepartureStation: string;
	ArrivalStation: string;
	FlightDate: string; // Format: YYYYMMDD
	FarecabinOption: string; // E=Economy, B=Business, F=First
	FareType: string; // N=Normal
	OnlyDirectFlight: boolean;
}

export interface AiriqFlightSearchRequest {
	Token?: string; // Added by airiqRequest function
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	TripType: string; // O=OneWay, R=Return, M=MultiCity
	AirlineID: string;
	AvailInfo: AiriqAvailInfo[];
	PassengersInfo: {
		AdultCount: string;
		ChildCount: string;
		InfantCount: string;
	};
}

export interface AiriqAirport {
	AirportCode: string;
	AirportName: string;
	Terminal?: string;
	CityCode: string;
	CityName: string;
	CountryCode: string;
	CountryName: string;
	DepTime?: string;
	ArrTime?: string;
}

export interface AiriqFlightSegmentDetail {
	Airline: {
		AirlineCode: string;
		AirlineName: string;
		FlightNumber: string;
		FareClass: string;
	};
	Origin: {
		Airport: AiriqAirport;
		DepTime: string;
	};
	Destination: {
		Airport: AiriqAirport;
		ArrTime: string;
	};
	Duration: number;
	GroundTime?: number;
	Mile?: number;
	StopOver?: boolean;
	DepartureTime?: string;
	ArrivalTime?: string;
	FlightStatus?: string;
	StopPoint?: string;
	StopPointArrivalTime?: string;
	StopPointDepartureTime?: string;
	Craft?: string;
	Remark?: string | null;
	IsETicketEligible?: boolean;
	FlightInfoIndex?: string;
	AirlineRemark?: string;
	Baggage?: string;
	CabinBaggage?: string;
}

export interface AiriqFare {
	Currency: string;
	BaseFare: number;
	Tax: number;
	TaxBreakup?: Array<{
		key: string;
		value: number;
	}>;
	YQTax?: number;
	AdditionalTxnFeeOfrd?: number;
	AdditionalTxnFeePub?: number;
	PGCharge?: number;
	OtherCharges?: number;
	ChargeBU?: Array<{
		key: string;
		value: number;
	}>;
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
	TotalBaggageCharges?: number;
	TotalMealCharges?: number;
	TotalSeatCharges?: number;
	TotalSpecialServiceCharges?: number;
	NetPayable?: number;
}

export interface AiriqFareBreakdown {
	Currency: string;
	PassengerType: number; // 1: Adult, 2: Child, 3: Infant
	PassengerCount: number;
	BaseFare: number;
	Tax: number;
	YQTax: number;
	AdditionalTxnFeeOfrd: number;
	AdditionalTxnFeePub: number;
	PGCharge: number;
	TaxBreakup?: Array<{
		key: string;
		value: number;
	}>;
}

export interface AiriqFlightResult {
	ResultIndex: string;
	Source: number;
	IsLCC: boolean;
	IsRefundable: boolean;
	IsUpsellAllowed?: boolean;
	AirlineCode: string;
	AirlineName?: string;
	Segments: AiriqFlightSegmentDetail[][];
	Fare: AiriqFare;
	FareBreakdown?: AiriqFareBreakdown[];
	LastTicketDate?: string;
	TicketAdvisory?: string;
	FareRules?: string;
	AirlineRemark?: string;
	IsPassportRequiredAtTicket?: boolean;
	IsPassportRequiredAtBook?: boolean;
	PreferredAirlines?: string;
	ValidatingAirline?: string;
}

// Actual AIRiQ Response Structure
export interface AiriqFlightSearchResponse {
	Trackid: string;
	ItineraryFlightList: Array<{
		Items: Array<{
			FlightDetails: Array<{
				FlightID: string;
				AirlineDescription: string;
				FlightNumber: string;
				Origin: string;
				Destination: string;
				DepartureTerminal: string;
				ArrivalTerminal: string;
				DepartureDateTime: string;
				ArrivalDateTime: string;
				Class: string;
				JourneyTime: string;
				ReferenceToken: string;
				SegRef: string;
				ItinRef: string;
				ConnectionFlag: string;
				FareId: string;
				Cabin: string;
				FareBasisCode: string;
				Stops: string;
				Via: string;
				AirlineCategory: string;
				CNX: string;
				PlatingCarrier: string;
				OperatingCarrier: string;
				SegmentDetails: string;
				FlyingTime: string;
				OfflineIndicator: boolean;
				MultiClass: string;
				AllowFQT: boolean;
				AvailSeat: string;
				PromoCode: string;
				PromoCodeDesc: string;
				FareTypeDescription: string;
				FareDescription: string;
				FareRuleInfo: string;
				Refundable: string;
				Baggage: string;
				CabinBaggage: string;
			}>;
			Fares: Array<{
				Currency: string;
				FareType: string;
				Faredescription: Array<{
					Paxtype: string;
					BaseAmount: string;
					TotalTaxAmount: string;
					GrossAmount: string;
					NetAmount: string;
					Incentive: string;
					Servicecharge: string;
					TDS: string;
					Discount: string;
					PLBAmount: string;
					SF: string;
					SFGST: string;
					Taxes: Array<{
						Amount: string;
						Code: string;
					}>;
				}>;
				FlightId: string;
			}>;
		}>;
	}>;
	Status?: {
		Error: string;
		ResultCode: string;
		SequenceID: string;
	};
}

// Additional types for other AIRiQ operations (similar to TBO)
export interface AiriqFareRuleRequest {
	Token?: string;
	TokenId?: string;
	EndUserIp: string;
	ResultIndex: string;
	TraceId: string;
}

export interface AiriqFareRuleResponse {
	Response: {
		FareRules: Array<{
			Origin: string;
			Destination: string;
			Airline: string;
			FareRuleDetail: string;
		}>;
		TraceId: string;
		Error?: {
			ErrorCode: number;
			ErrorMessage: string;
		};
	};
}

export interface AiriqFareQuoteRequest {
	Token?: string;
	TokenId?: string;
	EndUserIp: string;
	ResultIndex: string;
	TraceId: string;
}

export interface AiriqFareQuoteResponse {
	Response: {
		Results: AiriqFlightResult;
		TraceId: string;
		Error?: {
			ErrorCode: number;
			ErrorMessage: string;
		};
	};
}

export interface AiriqBookingRequest {
	Token?: string;
	TokenId?: string;
	ResultIndex: string;
	TraceId: string;
	Passengers: Array<{
		Title: string;
		FirstName: string;
		LastName: string;
		DateOfBirth: string;
		Gender: number;
		PassportNo?: string;
		PassportExpiry?: string;
		AddressLine1?: string;
		City?: string;
		CountryCode?: string;
		CountryName?: string;
		Nationality?: string;
		ContactNo?: string;
		Email?: string;
		IsLeadPax?: boolean;
		FFAirlineCode?: string;
		FFNumber?: string;
		GSTCompanyAddress?: string;
		GSTCompanyContactNumber?: string;
		GSTCompanyName?: string;
		GSTNumber?: string;
		GSTCompanyEmail?: string;
	}>;
	EndUserIp: string;
}

export interface AiriqBookingResponse {
	Response: {
		BookingId: string;
		PNR: string;
		Status: number;
		TraceId: string;
		Error?: {
			ErrorCode: number;
			ErrorMessage: string;
		};
	};
}

export interface AiriqSSRRequest {
	Token?: string;
	TokenId?: string;
	ResultIndex: string;
	TraceId: string;
	EndUserIp: string;
}

export interface AiriqSSRResponse {
	Response: {
		Meal?: Array<{
			Code: string;
			Description: string;
			AirlineDescription: string;
			Quantity: number;
			Price: number;
			Origin: string;
			Destination: string;
		}>;
		Baggage?: Array<{
			Code: string;
			Description: string;
			Weight: number;
			Price: number;
			Origin: string;
			Destination: string;
		}>;
		SeatDynamic?: Array<{
			SegmentIndex: number;
			Code: string;
			Description: string;
			Price: number;
			Currency: string;
			AvailablityType: number;
			Seat: Array<{
				SeatIndex: number;
				Code: string;
				RowNo: string;
				SeatNo: string;
				SeatType: number;
				SeatWayType: number;
				Compartment: number;
				Deck: number;
			}>;
		}>;
		TraceId: string;
		Error?: {
			ErrorCode: number;
			ErrorMessage: string;
		};
	};
}
