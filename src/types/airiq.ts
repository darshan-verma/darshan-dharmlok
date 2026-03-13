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
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	FlightsInfo: Array<{
		FlightID: string;
	}>;
	Trackid: string;
}

export interface AiriqFareRuleResponse {
	FareRuleInfo: Array<{
		FlightID: string;
		FareRuleDetail: string;
		Origin?: string;
		Destination?: string;
		Airline?: string;
	}> | null;
	Status: {
		Error: string;
		ResultCode: string; // "1" = success, "0" = failure, "-1" = exception
		SequenceID: string;
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

// Section 8 - Booking API Types (per Airiq Book API documentation)

export interface AiriqItineraryFlightInfo {
	FlightID: string;
	FlightNumber: string;
	Origin: string;
	Destination: string;
	DepartureDateTime: string; // "DD MMM YYYY HH:MM"
	ArrivalDateTime: string;
}

export interface AiriqItineraryFlightsInfo {
	Token: string; // Pricing reference value from PriceItenaryInfo[].AvailabilityResponse[].Token
	FlightsInfo: AiriqItineraryFlightInfo[];
	PaymentMode: string; // "T" = Agent Deposit
	SeatsSSRInfo?: Array<{
		SeatID: string;
		PaxRefNumber: number;
	}>;
	BaggSSRInfo?: Array<{
		BaggageID: string;
		PaxRefNumber: number;
	}>;
	MealsSSRInfo?: Array<{
		MealID: string;
		PaxRefNumber: number;
	}>;
	OtherSSRInfo?: Array<{
		OtherSSRID: string;
		PaxRefNumber: number;
	}>;
	PaymentInfo?: Array<{
		TotalAmount: string;
	}>;
}

export interface AiriqPaxDetailsInfo {
	PaxRefNumber: number;
	Title: string; // Mr, Mrs, Miss, Ms, Mstr, Dr
	FirstName: string;
	LastName: string;
	DOB: string; // DD/MM/YYYY
	Gender: string; // "Male" | "Female"
	PaxType: string; // "ADT" | "CHD" | "INF"
	PassportNo?: string;
	PassportExpiry?: string; // DD/MM/YYYY
	PassportIssuedDate?: string; // DD/MM/YYYY
	PassportCountryCode?: string; // e.g. "IN", "US"
	InfantRef?: string;
}

export interface AiriqAddressDetails {
	CountryCode: string; // Dialing code e.g. "91"
	ContactNumber: string;
	EmailID: string;
}

export interface AiriqGSTInfo {
	GSTNumber: string;
	GSTCompanyName: string;
	GSTAddress: string;
	GSTEmailID: string;
	GSTMobileNumber: string;
}

export interface AiriqFFNumberInfo {
	PaxRefNumber: number;
	SegRefNumber: number;
	AirlineCode: string;
	FlyerNumber: string;
	Itinref: number;
}

export interface AiriqBookingRequest {
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	AdultCount: number;
	ChildCount: number;
	InfantCount: number;
	ItineraryFlightsInfo: AiriqItineraryFlightsInfo[];
	PaxDetailsInfo: AiriqPaxDetailsInfo[];
	AddressDetails: AiriqAddressDetails;
	GSTInfo: AiriqGSTInfo;
	FFNumberInfo?: AiriqFFNumberInfo[];
	TripType: string; // "O" = One-way, "R" = Round-trip, "Y" = Round-trip Special
	BlockPNR: boolean;
	BaseOrigin: string;
	BaseDestination: string;
	TrackId: string; // From Pricing response PriceItenaryInfo[].Trackid
}

export interface AiriqBookingResponse {
	TrackId: string;
	Bookingresponse: {
		ItinearyDetails: unknown; // Exact success structure TBD from API sample
	};
	Status: {
		Error: string;
		ResultCode: string; // "1" = success, "2" = pending, "0" = failure, "-1" = exception
		SequenceID: string;
	};
}

/**
 * Section 9 - Ticketing (IssueTicket)
 * Request shape per doc 9.3 Data Format and 9.4 Request.
 * Confirm the ticket for an already blocked itinerary.
 */
export interface AiriqIssueTicketRequest {
	AgentInfo: {
		AgentId: string; // Doc: AgentID
		UserName: string; // Doc: Username
		AppType: string; // Doc: Default "API"
		Version: number; // Doc: API version (sample 2.0)
	};
	BookingTrackId: string; // Doc: Unique reference Id from Booking response
	AirIqPNR: string; // Doc: Airiq Booking reference number
	AirlinePNR: string; // Doc: Airline Booking reference number
	BookingAmount: string; // Doc: Total Booking Amount (decimal string e.g. "11262.00")
	PaymentMode: string; // Doc: "T" = Agent Deposit
}

/**
 * Section 9.5 - IssueTicket response (Success / Pending / Failure / Exception).
 * TrackId, Bookingresponse.ItinearyDetails, Status.Error | ResultCode | SequenceID.
 */
export interface AiriqIssueTicketResponse {
	TrackId: string;
	Bookingresponse: {
		ItinearyDetails: unknown; // doc spelling
	};
	Status: {
		Error: string;
		ResultCode: string; // "1" success, "2" pending, "0" failure, "-1" exception
		SequenceID: string;
	};
}

/**
 * Section 10 - Get Booking (RetrieveBooking)
 * Doc 10.3/10.4: Retrieve booking details by AirIqPNR, AirlinePNR, or CRSPNR.
 */
export interface AiriqRetrieveBookingItem {
	AirIqPNR?: string;
	AirlinePNR?: string;
	CRSPNR?: string;
}

export interface AiriqRetrieveBookingRequest {
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	Item: AiriqRetrieveBookingItem[];
}

/**
 * Section 10.5 - RetrieveBooking response. Success has Retrieveresponse set; failure/exception have Status.
 */
export interface AiriqRetrieveBookingResponse {
	Retrieveresponse: unknown | null; // Success payload; doc says "refer to sample JSON"
	Status: {
		Error: string;
		ResultCode: string; // "1" = success, "0" = failure, "-1" = exception
		SequenceID: string;
	};
}

/**
 * Section 13 - Cancellation Status
 * Doc 13.3 Request: AgentInfo + OnlineInfo (Flag, AirIqPNR, Remarks).
 */
export interface AiriqCancellationRequest {
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	OnlineInfo: {
		Flag: "PENALTY" | "CANCEL";
		AirIqPNR: string;
		Remarks?: string;
	};
}

/**
 * Section 13.4/13.5/13.6/13.7 - Cancellation response
 * CancelStatus: "SUCCESS" | "Failed" | "PENDING"
 */
export interface AiriqCancellationResponse {
	CancelStatus: string;
	Remarks: string;
	PenalityAmount?: string;
	TotalBookingAmount?: string;
	Status: {
		ResultCode: string; // "1" success, "0" failure, "-1" exception, "-2" pending
		Error: string;
		SequenceID: string;
	};
}

/**
 * Section 16 - Hold Cancel
 * Doc 16.2 Request: AgentInfo, AirIqPNR, AirlinePNR.
 * Doc 16.3/16.4 Response: CancelStatus, Remarks, Status.
 */
export interface AiriqHoldCancelRequest {
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	AirIqPNR: string;
	AirlinePNR: string;
}

export interface AiriqHoldCancelResponse {
	CancelStatus: string;
	Remarks: string;
	Status: {
		ResultCode: string;
		Error: string;
		SequenceID: string;
	};
}

/**
 * Section 14 - Reschedule Avail
 * Doc 14.3/14.4: Check availability for new date and revised fare.
 */
export interface AiriqRescheduleAvailRequest {
	TripType: string; // O = One-way, R = Round-trip, Y = Roundtrip Special
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	AvailInfo: Array<{
		DepartureStation: string;
		ArrivalStation: string;
		FlightDate: string; // YYYYMMDD
	}>;
	AirIqPNR: string;
	Remarks?: string;
}

/**
 * Section 14.5–14.8: Reschedule Avail response. Same ItineraryFlightList shape as flight search.
 */
export interface AiriqRescheduleAvailResponse {
	Trackid: string | null;
	ItineraryFlightList: AiriqFlightSearchResponse["ItineraryFlightList"] | null;
	Status: {
		Error: string;
		ResultCode: string; // "1" success, "0" failure, "-1" exception, "-2" pending
		SequenceID: string;
	};
}

/**
 * Section 14.9/14.10 - Reschedule (confirm). FlightDetails for selected itinerary.
 */
export interface AiriqRescheduleFlightDetail {
	FlightID: string;
	FlightNumber: string;
	Origin: string;
	Destination: string;
	DepartureDateTime: string;
	ArrivalDateTime: string;
}

export interface AiriqRescheduleItineraryInfo {
	FlightDetails: AiriqRescheduleFlightDetail[];
	BaseAmount: string;
	GrossAmount: string;
}

export interface AiriqRescheduleRequest {
	AgentInfo: {
		AgentId: string;
		TerminalId?: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	SegmentInfo: {
		BaseOrigin: string;
		BaseDestination: string;
		TripType: string;
	};
	Trackid: string;
	AirIqPNR: string;
	Remarks?: string;
	Flag: "CHECKFARE" | "CONFIRM";
	ContactNo: string;
	ItineraryInfo: AiriqRescheduleItineraryInfo[];
}

/**
 * Section 14.11–14.14: Reschedule response. On success, AirIqPNR in response is the NEW PNR.
 * Failure/exception/pending responses contain only Status.
 */
export interface AiriqRescheduleResponse {
	AgentInfo?: AiriqRescheduleRequest["AgentInfo"];
	SegmentInfo?: AiriqRescheduleRequest["SegmentInfo"];
	Trackid?: string;
	AirIqPNR?: string; // NEW PNR on success; absent on failure/exception/pending
	Remarks?: string;
	Flag?: string;
	ContactNo?: string;
	ItineraryInfo?: AiriqRescheduleItineraryInfo[];
	Status: {
		Error: string;
		ResultCode: string; // "1" success, "0" failure, "-1" exception, "-2" pending
		SequenceID: string;
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

// Post-booking SSR (PostAncillary Avail) - uses PNRs
export interface AiriqPostBookingSSRRequest {
	Token?: string;
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	AirIqPNR: string;
	AirlinePNR: string;
}

export interface AiriqPostBookingSSRResponse {
	TrackId: string;
	SsrDetails: {
		Baggages?: Array<{
			Id: string;
			Code: string;
			Description: string;
			Amount: string;
			Origin: string;
			Destination: string;
			ItinRef: string;
			SegRef: string;
		}>;
		Meals?: Array<{
			Id: string;
			Code: string;
			Description: string;
			Amount: string;
			Origin: string;
			Destination: string;
			ItinRef: string;
			SegRef: string;
		}>;
		Seats?: Array<{
			Id: string;
			SeatName: string;
			SeatAmount: string;
			SeatStatus: boolean;
			SeatType: string;
			Origin: string;
			Destination: string;
			ItinRef: string;
			SegRef: string;
			XAxis: string;
			YAxis: string;
		}>;
		OtherSSR?: Array<{
			Id: string;
			Code: string;
			Description: string;
			Amount: string;
			Origin: string;
			Destination: string;
			ItinRef: string;
			SegRef: string;
			category: string;
		}>;
	};
	Status: {
		Error: string;
		ResultCode: string;
		SequenceID: string;
	};
}

/**
 * Add post-booking SSR (Add SSR) - doc 15.6–15.9.
 * Request uses TracKID (from Get SSR TrackId), AirIqPNR, AirlinePNR, and selection arrays.
 */
export interface AiriqAddPostBookingSSRRequest {
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	Remarks?: string;
	TracKID: string; // doc spelling; from PostAncillary Avail TrackId
	AirIqPNR: string;
	AirlinePNR: string;
	MealsSSR?: Array<{
		PaxRefId: string;
		SegmentNo: string;
		MealId: string;
	}>;
	BaggSSR?: Array<{
		PaxRefId: string;
		BaggId: string;
	}>;
	SeatsSSR?: Array<{
		PaxRefId: string;
		SeatId: string;
	}>;
	OtherSSR?: Array<{
		OtherSSRId: string;
		PaxRefId: string;
	}>;
	Payment: Array<{
		PaymentMode: string; // "T" = Agent Deposit
		Amount: string;
	}>;
}

/**
 * Add SSR response - doc 15.8/15.9. Success has Retrieveresponse.ItinearyDetails; failure has Status only.
 */
export interface AiriqAddPostBookingSSRResponse {
	Retrieveresponse?: {
		ItinearyDetails?: unknown[];
	};
	Status: {
		Error: string;
		ResultCode: string; // "1" = success, "0" = failure, "-1" = exception
		SequenceID: string;
	};
}

// AIRiQ Pricing Request/Response Types (Based on section 6 of documentation)
export interface AiriqPricingRequest {
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	SegmentInfo: {
		BaseOrigin: string;
		BaseDestination: string;
		TripType: string; // "O" = One-way, "R" = Round-trip, "Y" = Round-trip Special
		AdultCount: string;
		ChildCount: string;
		InfantCount: string;
	};
	Trackid: string;
	ItineraryInfo: Array<{
		FlightDetails: Array<{
			FlightID: string;
			FlightNumber: string;
			Origin: string;
			Destination: string;
			DepartureDateTime: string; // Format: "DD MMM YYYY HH:MM"
			ArrivalDateTime: string; // Format: "DD MMM YYYY HH:MM"
		}>;
		BaseAmount: string;
		GrossAmount: string;
	}>;
}

export interface AiriqPricingResponse {
	// PriceItenaryInfo is an array in actual API response
	// Each element contains Trackid (different from the Trackid sent to Pricing)
	PriceItenaryInfo: Array<{
		Trackid: string; // NEW Trackid from Pricing response - MUST be used for seat map
		AdultCount?: number;
		ChildCount?: number;
		InfantCount?: number;
		TotalPax?: number;
		CabinClass?: string;
		BaseAmount?: number;
		TaxAmount?: number;
		GrossAmount?: number;
		// Raw API response structure
		AvailabilityResponse?: Array<{
			Token?: string;
			Flights?: Array<{
				FlightID: string; // NEW FlightID from Pricing response - MUST be used for seat map
				FlightNumber: string;
				Origin: string;
				Destination: string;
				DepartureDateTime: string;
				ArrivalDateTime: string;
				[key: string]: unknown;
			}>;
			Fares?: Array<{
				FlightId?: string; // This is the FareId (e.g., "6E_N_1"), different from FlightID
				[key: string]: unknown;
			}>;
			Meal?: Array<{
				MealID: string;
				Code: string;
				Description: string;
				Amount: string;
				Origin: string;
				Destination: string;
				SegRef: string;
				Itinref: string;
				IsBundleServiceMeal?: boolean;
				Url?: string;
			}>;
			Bagg?: Array<{
				BaggageID: string;
				Code: string;
				Description: string;
				Amount: string;
				Origin: string;
				Destination: string;
				SegRef: string;
				Itinref: string;
				BaggageText?: string;
			}>;
			OtherService?: Array<{
				OtherID: string;
				SSRCode: string;
				Description: string;
				Amount: string;
				SSRType: string;
				Origin: string;
				Destination: string;
				SegRef: string;
				Itinref: string;
				OtherSSRtext?: string | null;
				SSRRef?: string | null;
			}>;
			[key: string]: unknown;
		}>;
		// Transformed/flattened structure (if response is transformed)
		FlightDetails?: Array<{
			FlightID: string;
			FlightNumber: string;
			Origin: string;
			Destination: string;
			DepartureDateTime: string;
			ArrivalDateTime: string;
			Duration?: string;
			StopsCount?: number;
			Baggage?: string;
			CabinBaggage?: string;
		}>;
		SSR?: {
			Baggage?: Array<{
				Code: string;
				Description: string;
				Weight: number;
				Price: number;
				Origin: string;
				Destination: string;
			}>;
			Meal?: Array<{
				Code: string;
				Description: string;
				Price: number;
				Origin: string;
				Destination: string;
			}>;
		};
		MandatoryBookingDetails?: {
			PassportRequired?: boolean;
			DateOfBirthRequired?: boolean;
			FrequentFlyerRequired?: boolean;
		};
	}> | null;
	ResponseStatus: {
		Error: string;
		ResultCode: string; // "1" = success, "0" = failure, "-1" = exception
		SequenceID: string;
	};
}

// AIRiQ GetMultiClass (doc 17) - available fare classes per flight
export interface AiriqGetMultiClassRequest {
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: string;
	};
	FlightsInfo: Array<{ FlightID: string }>;
	PassengersInfo: {
		AdultCount: number;
		ChildCount: number;
		InfantCount: number;
	};
	TripType: string; // O=Oneway, R=Roundtrip, Y=Roundtrip Special
	Trackid: string;
}

export interface AiriqGetMultiClassClass {
	Cabin: string;
	Class: string;
	FareBasisCode: string;
	Seats: string;
}

export interface AiriqGetMultiClassAvailDetail {
	Origin: string;
	Destination: string;
	CarrierCode: string;
	FlightNumber: string;
	Classes: AiriqGetMultiClassClass[];
}

export interface AiriqGetMultiClassResponse {
	AvailDetails: AiriqGetMultiClassAvailDetail[] | null;
	Status: {
		Error: string;
		ResultCode: string;
		SequenceID: string;
	};
}

// AIRiQ GetMultiClassFare (doc 18) - fare for selected class
export interface AiriqGetMultiClassFareRequest {
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: string;
	};
	FlightsInfo: Array<{ FlightID: string }>;
	ClassFare: Array<{
		AirlineClass: string;
		SeatAvailFlag: string;
	}>;
	PassengersInfo: {
		AdultCount: number;
		ChildCount: number;
		InfantCount: number;
	};
	TripType: string;
	Trackid: string;
}

export interface AiriqGetMultiClassFareFlightDetail {
	FlightID: string;
	Stock?: string;
	FlightNumber: string;
	Origin: string;
	Destination: string;
	DepartureTerminal?: string;
	ArrivalTerminal?: string;
	DepartureDateTime: string;
	ArrivalDateTime: string;
	Class: string;
	ReferenceToken?: string;
	SegRef?: string;
	ItinRef?: string;
	FareId?: string;
	Cabin?: string;
	FareBasisCode?: string;
	Stops?: string;
	AirlineCategory?: string;
	CNX?: string;
	PlatingCarrier?: string;
	OperatingCarrier?: string;
	SegmentDetails?: string;
	FlyingTime?: string;
	AvailSeat?: string;
	FareTypeDescription?: string;
	FareDescription?: string;
	Baggage?: string;
	[key: string]: unknown;
}

export interface AiriqGetMultiClassFareTax {
	Amount: string;
	Code: string;
}

export interface AiriqGetMultiClassFareDescription {
	Paxtype: string;
	BaseAmount: string;
	TotalTaxAmount: string;
	GrossAmount: string;
	Commission?: string | null;
	Incentive?: string | null;
	Servicecharge?: string | null;
	TDS?: string;
	Discount?: string;
	PLBAmount?: string;
	SF?: string;
	SFGST?: string;
	Taxes?: AiriqGetMultiClassFareTax[];
}

export interface AiriqGetMultiClassFareFare {
	Faredescription: AiriqGetMultiClassFareDescription[];
	FlightId: string;
	FareType: string;
	Currency: string;
}

export interface AiriqGetMultiClassFareResponse {
	Trackid: string | null;
	FlightDetails: AiriqGetMultiClassFareFlightDetail[] | null;
	Fares: AiriqGetMultiClassFareFare[] | null;
	Status: {
		Error: string;
		ResultCode: string;
		SequenceID: string;
	};
}

// AIRiQ Seat Map Request/Response Types (Based on section 7 of documentation)
export interface AiriqSeatMapRequest {
	AgentInfo: {
		AgentId: string;
		UserName: string;
		AppType: string;
		Version: number;
	};
	SegmentInfo: {
		BaseOrigin: string;
		BaseDestination: string;
		TripType: string;
	};
	FlightsInfo: Array<{
		FlightID: string;
		FlightNumber: string;
		Origin: string;
		Destination: string;
		DepartureDateTime: string; // Format: "DD MMM YYYY HH:MM"
		ArrivalDateTime: string; // Format: "DD MMM YYYY HH:MM"
	}>;
	APIPaxDetails: Array<{
		PaxRefNumber: string;
		Title: string;
		PaxType: string; // "ADT" = Adult, "CHD" = Child, "INF" = Infant
		FirstName: string;
		LastName: string;
	}>;
	TrackId: string;
}

export interface AiriqSeatMapResponse {
	FlightSeat: Array<{
		SeatMap: Array<{
			Destination: string;
			ItinRef: string;
			MaxHeight: string;
			MaxWidth: string;
			Origin: string;
			SeatAmount: string;
			SeatAvailability: string; // "Available" | "Closed"
			SeatCategory: string;
			SeatCharacterstic: string;
			SeatGroup: string; // Premium seat indicator
			SeatID: string;
			SeatMessage: string;
			SeatName: string; // e.g., "1A", "12F"
			SeatPosition: string; // "Window", "Middle", "Aisle"
			SeatRef: string;
			SeatReferenceAPI: string;
			SeatStatus: string; // "true" = available, "false" = not available
			SeatType: string;
			Seatcharacteristics: string | null;
			SegRef: string;
			WingSeat: string;
			XAxis: string; // Horizontal position
			YAxis: string; // Vertical position (row)
		}>;
	}> | null;
	ResponseStatus: {
		Error: string;
		ResultCode: string; // "1" = success, "0" = failure, "-1" = exception
		SequenceID: string;
	};
}
