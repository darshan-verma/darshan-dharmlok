/**
 * Types for TBO Hotel API - GetHotelResult Request
 * This method is used to request room availability
 */

export interface HotelSearchRequest {
	/** Check-In date of the stay. Format: YYYY-MM-DD */
	CheckIn: string;

	/** Check-Out date of the stay. Format: YYYY-MM-DD */
	CheckOut: string;

	/**
	 * List of TBO codes of the requested hotels (comma separated list)
	 * Recommended Value: 100 hotel codes
	 */
	HotelCodes: string;

	/**
	 * Lead guest nationality (in ISO 3166-1 alpha-2 letter country codes)
	 * E.g., United Arab Emirates – AE, Turkey – TR
	 * If Guest is resident of UAE and searching for UAE hotels, guest can send nationality as AE
	 */
	GuestNationality: string;

	/** Number of rooms being searched for */
	NoOfRooms: number;

	/** Contains an array of occupancy for each room */
	PaxRooms: PaxRoom[];

	/** Expected response time (seconds) */
	ResponseTime?: number;

	/**
	 * To get additional details in the search response like the day-wise break-up
	 * and detailed cancel policies. Default Value: False
	 */
	IsDetailedResponse?: boolean;

	/** Refine the search response */
	Filters?: HotelFilters;
}

export interface PaxRoom {
	/** Number of Adult guests (1-8) per room */
	Adults: number;

	/** Number of Child guests (1-4) per room */
	Children: number;

	/**
	 * List of children ages (0-18 years).
	 * The length of array is equal to the number of children in the room.
	 * E.g.: [2, 8] if request contains 2 children.
	 * Can be null if no children
	 */
	ChildrenAges: number[] | null;
}

export interface HotelFilters {
	/**
	 * Set it True in case only Refundable rooms are required.
	 * Default Value: False
	 */
	Refundable?: boolean;

	/**
	 * Number of rooms to return. 0 to get all available rooms
	 */
	NoOfRooms?: number;

	/**
	 * Filter response based on available meals.
	 * Possible Values: All, WithMeal, RoomOnly
	 */
	MealType?: string;

	/**
	 * Filter by star rating
	 */
	StarRating?: number[];
}

/**
 * Helper type for converting frontend room configuration to API format
 */
export interface FrontendRoomConfig {
	adults: number;
	children: number;
	childrenAges: number[];
}

/**
 * Convert frontend room configuration to API PaxRooms format
 */
export function convertToPaxRooms(rooms: FrontendRoomConfig[]): PaxRoom[] {
	return rooms.map((room) => ({
		Adults: room.adults,
		Children: room.children,
		ChildrenAges: room.childrenAges,
	}));
}

/**
 * Build a complete hotel search request from frontend form data
 */
export function buildHotelSearchRequest(params: {
	checkIn: Date;
	checkOut: Date;
	hotelCodes: string[];
	guestNationality: string;
	rooms: FrontendRoomConfig[];
	isDetailedResponse?: boolean;
	filters?: HotelFilters;
}): HotelSearchRequest {
	const formatDate = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	return {
		CheckIn: formatDate(params.checkIn),
		CheckOut: formatDate(params.checkOut),
		HotelCodes: params.hotelCodes.join(","),
		GuestNationality: params.guestNationality,
		NoOfRooms: params.rooms.length,
		PaxRooms: convertToPaxRooms(params.rooms),
		IsDetailedResponse: params.isDetailedResponse ?? false,
		Filters: params.filters,
	};
}

// ============================================
// Hotel Search Response Types
// ============================================

export interface HotelSearchResponse {
	Status: {
		Code: number;
		Description: string;
	};
	HotelResult: HotelResult[];
}

export interface HotelResult {
	HotelCode: string;
	Currency: string;
	Rooms: Room[];
}

export interface Room {
	/** Room names for each room in the booking (array of names) */
	Name: string[];

	/** Unique booking code for this room combination */
	BookingCode: string;

	/** Included amenities or services */
	Inclusion: string;

	/** Day-wise rate breakdown for each room */
	DayRates: DayRate[][];

	/** Total fare for all rooms without TDS/TCS */
	TotalFare: number;

	/** Total tax for all rooms without TDS/TCS */
	TotalTax: number;

	/** Room IDs - Used to map room details with Hotel Details method */
	RoomID: string[];

	/** Extra Guest charges of the bookable unit (if applicable) */
	ExtraGuestCharges?: number;

	/** The minimum selling rate for the requested booking */
	RecommendedSellingRate?: string;

	/** Promotional offers for each room */
	RoomPromotion: string[];

	/** Cancellation policy details */
	CancelPolicies: CancelPolicy[];

	/** Meal type included (e.g., "Room_Only", "Breakfast_For_2", "All_Inclusive_All_Meal") */
	MealType: string;

	/** Whether the room is refundable */
	IsRefundable: boolean;

	/** Additional supplements or fees */
	Supplements: Supplement[][];

	/** Whether transfers are included */
	WithTransfers: boolean;
}

export interface DayRate {
	/** Base price for the day */
	BasePrice: number;
}

export interface CancelPolicy {
	/** Policy index - Denotes the room index for which cancellation policies is applicable. If missing, policies are applicable for entire booking */
	Index: string;

	/** Date from which this policy applies */
	FromDate: string;

	/** Type of charge (Percentage or Amount) - Charge type for cancellation policies e.g., fixed amount, percentage value etc. */
	ChargeType: "Percentage" | "Amount";

	/** Cancellation charge amount or percentage applicable on bookable unit */
	CancellationCharge: number;
}

export interface Supplement {
	/** Supplement index - Denotes the room index for which supplement is applicable */
	Index: number;

	/** Supplement charge type. Possible Values: Included (price included in total), AtProperty (charges need to be paid at the hotel) */
	Type: "Included" | "AtProperty" | string;

	/** Supplement details/description */
	Description: string;

	/** Supplement charges */
	Price: number;

	/** The applicable currency for the supplement charges */
	Currency: string;
}

// ============================================
// Hotel Details API Types
// ============================================

export interface HotelDetailsRequest {
	/** Unique TBO Hotel code */
	"Hotel Code": number;
	/** Code of preferred language to retrieve response (EN for English) */
	Language: string;
	/** If Room wise details are required */
	IsRoomDetailRequired: string;
}

export interface HotelDetailsResponse {
	Status: {
		Code: number;
		Description: string;
	};
	HotelDetails: {
		/** Unique TBOH hotel codes */
		HotelCode: number;
		/** Hotel name against TBOH hotel code */
		HotelName: string;
		/** A short description about the requested hotel */
		Description: string;
		/** Display all available hotel facilities */
		HotelFacilities: string;
		/** It shows the nearby locations, and the attractions point */
		Attractions: string;
		/** All Hotel images link */
		Images: string;
		/** Address first line of the hotel booked */
		Address: string;
		/** Pin code of hotel city */
		PinCode: number;
		/** Code of the city */
		CityId: number;
		/** Name of the Country */
		CountryName: string;
		/** Phone number of the Hotel booked */
		PhoneNumber: string;
		/** Fax number of the hotel */
		FaxNumber: number;
		/** Star Rating of the hotel booked */
		HotelRating: string;
		/** Contains latitude, longitude information */
		Map: string;
		/** Name of City */
		CityName: string;
		/** Code of the country */
		CountryCode: number;
		/** Check-In time of the stay */
		CheckInTime: string;
		/** Check-Out time of the stay */
		CheckOutTime: string;
	};
}
