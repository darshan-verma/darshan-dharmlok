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

	/** Filter for the maximum number of rooms the client wants to receive in the response */
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
	 */
	ChildrenAges: number[];
}

export interface HotelFilters {
	/**
	 * Set it True in case only Refundable rooms are required.
	 * Default Value: False
	 */
	Refundable?: boolean;

	/**
	 * Filter response based on available meals.
	 * Possible Values: All, WithMeal, RoomOnly
	 */
	MealType?: "All" | "WithMeal" | "RoomOnly";
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
