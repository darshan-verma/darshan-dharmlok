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
	meetAndGreet?:
		| string[]
		| {
				type?: string;
				description?: string;
		  };
}

export interface TripjackFareBreakup {
	onwardFare?: number;
	backwardFare?: number;
	totalFare: number;
	onwardTax?: number;
	backwardTax?: number;
	totalTax: number;
	/** When present on quote response, forward into booking `pricingInfo.tjManagementFee`. */
	tjManagementFee?: number;
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
	/** TripJack cabs `/cabs/v2/booking` — required by provider (BigDecimal); inferred server-side if omitted. */
	tjTaxAmount?: string;
	/** TripJack management fee; default `"0.00"` when omitted. */
	tjManagementFee?: string;
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

export interface TripjackCabBookingPassenger {
	id?: number;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	fullName?: string;
}

export interface TripjackCabBookingVehicle {
	id?: number;
	clazz?: string;
	maxCapacity?: string;
	luggageCapacity?: string;
	similarTypes?: string;
	images?: string;
}

export interface TripjackCabJourneyFlightDetails {
	number?: string;
}

export interface TripjackCabBookingJourney {
	id?: number;
	journeyType?: string;
	source?: string;
	destination?: string;
	pickupDate?: string;
	tripEndDate?: string;
	returnDate?: string | null;
	duration?: number;
	distance?: string;
	flightDetails?: TripjackCabJourneyFlightDetails | null;
	journeyLeg?: string;
	routeDetail?: TripjackRouteDetails;
	timezone?: string;
	domesticJourney?: boolean;
}

export interface TripjackCabPriceBreakup {
	id?: number;
	bookingId?: string;
	paymentMedium?: string | null;
	tjManagementFee?: number;
	tjTaxAmount?: number;
	agentPrice?: number | null;
	agentMarkupPrice?: number;
	agentNetPayable?: number;
	grossAmount?: number;
	paymentFee?: number;
	tjTotalMarkup?: number;
}

/** Full `data` object from TripJack POST `/cabs/v2/booking` success response */
export interface TripjackCabBookingSnapshot {
	id: string;
	invoiceId?: string | null;
	agentId?: string;
	quoteId?: string;
	childQuoteId?: string;
	partnerBookingId?: string | null;
	comments?: string | null;
	passengerCount?: number;
	luggageCount?: number;
	status: string;
	totalPrice: number;
	currency: string;
	paymentRefId?: string | null;
	paymentStatus?: string | null;
	paymentTime?: string | null;
	linkedBookingId?: string | null;
	passenger?: TripjackCabBookingPassenger;
	bookingVehicle?: TripjackCabBookingVehicle;
	journey?: TripjackCabBookingJourney;
	priceBreakup?: TripjackCabPriceBreakup;
	addons?: unknown;
	vendorId?: number;
	amendmentAllowed?: boolean;
	channelType?: string;
	tripType?: string;
	rideStatus?: string;
	trackingLink?: string;
	consent?: string;
	serviceRequest?: string;
	agentEmail?: string;
	agentMobile?: string;
	isPushedToErp?: boolean;
	loggedInUserId?: string;
	funnelType?: string;
	panCardNumber?: string | null;
	additionalInfo?: unknown;
}

export type TripjackBookingResponseData = TripjackCabBookingSnapshot;

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

// ─── TripJack Hotel Types ────────────────────────────────────────────────────

export interface TripjackHotelRoomRequest {
	adults: number;
	children?: number;
	childAge?: number[];
}

export interface TripjackHotelListingRequest {
	checkIn: string;
	checkOut: string;
	rooms: TripjackHotelRoomRequest[];
	currency: string;
	cityCode?: string;
	hids?: (number | string)[];
	correlationId?: string;
	nationality?: string;
	timeoutMs?: number;
}

export interface TripjackHotelCancellationPenalty {
	from: string;
	to: string;
	amount: number;
}

export interface TripjackHotelCancellation {
	isRefundable: boolean;
	penalties: TripjackHotelCancellationPenalty[];
}

export interface TripjackHotelPricing {
	totalPrice: number;
	basePrice: number;
	discount: number;
	taxes: number;
	mf: number;
	mft: number;
	currency: string;
	strikethrough?: number;
}

export interface TripjackHotelCommercial {
	type: "NET" | "COMMISSIONABLE";
	commission: number;
}

export interface TripjackHotelCompliance {
	gstType: "NA" | "PASSTHROUGH" | "RESELLER";
	panRequired: boolean;
	passportRequired: boolean;
}

export interface TripjackHotelRoomInfo {
	id: string;
	name: string;
}

export interface TripjackHotelOption {
	optionId: string;
	optionType: "SRSM" | "SRCM" | "CRSM" | "CRCM";
	roomInfo: TripjackHotelRoomInfo[];
	inclusions: string[];
	mealBasis: string;
	pricing: TripjackHotelPricing;
	commercial: TripjackHotelCommercial;
	compliance: TripjackHotelCompliance;
	cancellation: TripjackHotelCancellation;
}

export interface TripjackHotelResult {
	/** Preferred field in v3 docs */
	tjHotelId?: string;
	/** Backward-compat field seen in some integrations */
	hotelId?: string;
	name: string;
	options: TripjackHotelOption[];
}

export interface TripjackHotelListingResponse {
	correlationId?: string;
	nationality?: string;
	currency: string;
	totalResults: number;
	hotels: TripjackHotelResult[];
	status: { success: boolean };
}

// ─── Dynamic Detail (Pricing) ────────────────────────────────────────────────

export interface TripjackHotelPricingRoomRequest {
	adults: number;
	children?: number;
	childAge?: number[];
}

export interface TripjackHotelPricingRequest {
	hid: string;
	checkIn: string;
	checkOut: string;
	rooms: TripjackHotelPricingRoomRequest[];
	currency: string;
	nationality: string;
	correlationId?: string;
	timeoutMs?: number;
}

export interface TripjackHotelPricingOption extends TripjackHotelOption {
	bookingNotes?: string;
}

export interface TripjackHotelPricingResponse {
	tjHotelId: string;
	hotelName: string;
	nationality: string;
	options: TripjackHotelPricingOption[];
	reviewHash: string;
	correlationId?: string;
	status: { success: boolean };
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface TripjackHotelReviewRequest {
	correlationId: string;
	optionId: string;
	reviewHash: string;
	hid: string;
}

export interface TripjackHotelReviewResponse {
	correlationId: string;
	tjHotelId: string;
	hotelName: string;
	bookingId: string;
	option: TripjackHotelPricingOption;
	ddt?: string; // deadlineDatetime — hold booking expiry (ISO 8601)
	status: { success: boolean };
}

// ─── Static Detail ───────────────────────────────────────────────────────────

export interface TripjackHotelStaticDetailRequest {
	hid: string;
}

export interface TripjackHotelBedConfig {
	bed_count?: number;
	bedroom_count?: number;
	description?: string;
	configuration?: Record<
		string,
		{ type: string; size: string; quantity: number }
	>;
}

export interface TripjackHotelRoomType {
	id: string;
	name: string;
	room_count?: number;
	living_room_count?: number;
	room_inventory?: string;
	descriptions?: { overview?: string };
	amenities?: Record<string, { id: string; name: string }>;
	images?: Array<{
		hero_image?: boolean;
		caption?: string;
		links: Record<string, { href: string }>;
	}>;
	bed_config?: TripjackHotelBedConfig;
	area?: { square_meters?: number; square_feet?: number };
	views?: Record<string, { id: string; name: string }>;
	occupancy?: {
		max_allowed?: { total?: number; adults?: number; children?: number };
	};
}

export interface TripjackHotelStaticDetail {
	tjHotelId: string;
	unicaId?: string;
	name: string;
	is_active: boolean;
	star_rating?: string;
	property_type?: { id: string; name: string };
	chain?: {
		id?: number;
		name?: string;
		brand?: { id?: number; name?: string };
	};
	locale?: {
		address?: {
			fulladdr?: string;
			line_1?: string;
			line_2?: string;
			region?: string;
			city?: string;
			citycode?: string;
			statename?: string;
			regioncode?: string;
			countryname?: string;
			countrycode?: string;
			postal_code?: string;
		};
		coordinates?: { lat: number; long: number };
		phone?: string[];
		fax?: string[];
		email?: string[];
	};
	policies?: {
		checkInCheckOut?: {
			checkin_from?: string;
			checkin_till?: string;
			checkout_from?: string;
			checkout_till?: string;
			checkin_min_age?: string;
		};
		instructions?: string;
		special_instructions?: string;
		know_before_you_go?: string;
		mandatory_fees?: string;
		optional_fees?: string;
		houseRules?: Record<string, string>;
	};
	amenities?: Record<string, { id: string; name: string }>;
	images?: Array<{
		caption?: string;
		is_hero_image?: boolean;
		category?: number;
		links: Record<string, { href: string }>;
	}>;
	descriptions?: Record<string, string>;
	rooms?: Record<string, TripjackHotelRoomType>;
	status?: { success: boolean };
}

export interface TripjackHotelStaticDetailResponse extends TripjackHotelStaticDetail {
	status: { success: boolean };
}

// ─── Hotel Booking Types ─────────────────────────────────────────────────────

export type TripjackHotelBookingStatus =
	| "IN_PROGRESS"
	| "PAYMENT_SUCCESS"
	| "PAYMENT_PENDING"
	| "PENDING"
	| "SUCCESS"
	| "ON_HOLD"
	| "ABORTED"
	| "FAILED"
	| "CANCELLATION_PENDING"
	| "CANCELLED";

export interface TripjackHotelTravellerInfo {
	ti: "Mr" | "Mrs" | "Ms" | "Miss" | "Master";
	pt: "ADULT" | "CHILD";
	fN: string;
	lN: string;
	pan?: string;
	pNum?: string;
}

export interface TripjackHotelRoomTravellerInfo {
	travellerInfo: TripjackHotelTravellerInfo[];
}

export interface TripjackHotelDeliveryInfo {
	emails: string[];
	contacts: string[];
	code: string[];
}

export interface TripjackHotelBookRequest {
	bookingId: string;
	roomTravellerInfo: TripjackHotelRoomTravellerInfo[];
	deliveryInfo: TripjackHotelDeliveryInfo;
	paymentInfos?: { amount: number }[];
	type: "HOTEL";
}

export interface TripjackHotelBookResponse {
	bookingId: string;
	status: { success: boolean };
	metaInfo?: Record<string, unknown>;
}

export interface TripjackHotelConfirmBookRequest {
	bookingId: string;
	paymentInfos: { amount: number }[];
}

export interface TripjackHotelConfirmBookResponse {
	bookingId: string;
	status: { success: boolean };
	metaInfo?: Record<string, unknown>;
}

// ─── Booking Details ─────────────────────────────────────────────────────────

export interface TripjackHotelBookingDetailsRequest {
	bookingId: string;
}

export interface TripjackHotelBookingOrderInfo {
	bookingId: string;
	amount: number;
	markup: number;
	deliveryInfo: TripjackHotelDeliveryInfo;
	status: TripjackHotelBookingStatus;
	createdOn: string;
}

export interface TripjackHotelBookingRoomInfo {
	rc: string;
	mb: string;
	tp: number;
	ti: TripjackHotelTravellerInfo[];
	rexb?: Record<string, Array<{ values: string[] }>>;
}

export interface TripjackHotelBookingOption {
	tp: number;
	cnp?: {
		id: string;
		ifra: boolean;
		inra: boolean;
		pd: Array<{ fdt: string; tdt: string; am: number; pp: number }>;
	};
	ris: TripjackHotelBookingRoomInfo[];
}

export interface TripjackHotelBookingHotelInfo {
	name: string;
	rt: number;
	ad: { adr: string; ctn: string; cn: string };
	ops: TripjackHotelBookingOption[];
}

export interface TripjackHotelBookingDetailsResponse {
	order: TripjackHotelBookingOrderInfo;
	itemInfos: {
		HOTEL: {
			hInfo: TripjackHotelBookingHotelInfo;
		};
	};
	gstInfo: Record<string, unknown>;
	status: { success: boolean };
}

// ─── Cancel ──────────────────────────────────────────────────────────────────

export interface TripjackHotelCancelResponse {
	status: { success: boolean };
}

// ─── Nationalities ───────────────────────────────────────────────────────────

export interface TripjackNationalityInfo {
	countryName: string;
	name: string;
	dialCode: string;
	countryId: string;
	code: string;
	isoCode: string;
}

export interface TripjackNationalityResponse {
	nationalityInfos: TripjackNationalityInfo[];
	nationalityCount: number;
	status: { success: boolean };
}

// ─── Static Hotels (Fetch & Deleted) ─────────────────────────────────────────

export interface TripjackStaticHotelsRequest {
	lastUpdateTime?: string;
	next?: string;
}

export interface TripjackStaticHotelInfo {
	tjHotelId: string;
	unicaId: string;
	name: string;
	description?: string;
	rating: number;
	isDeleted: boolean;
	geolocation?: { ln: string; lt: string };
	address?: {
		adr?: string;
		postalCode?: string;
		city?: { code: string; name: string };
		state?: { code: string; name: string };
		country?: { code: string; name: string };
	};
	cityName?: string;
	countryName?: string;
	propertyType?: string;
	images?: Array<{ url: string; sz: string }>;
	facilities?: Array<{ type?: string; name: string }>;
	contact?: { ph?: string; em?: string; fax?: string; wb?: string };
}

export interface TripjackStaticHotelsResponse {
	hotelOpInfos: TripjackStaticHotelInfo[];
	next?: string;
	status: { success: boolean };
}

export interface TripjackDeletedHotelsRequest {
	lastUpdateTime: string;
	next?: string;
}

export interface TripjackDeletedHotelsResponse {
	hotelOpInfos: Array<{ tjHotelId: string }>;
	next?: string;
	status: { success: boolean };
	metaInfo?: Record<string, unknown>;
}

// ─── TripJack HMS v3 Static Content (`/hms/v3/content/*`) ───────────────────

export interface TripjackContentStatus {
	success: boolean;
	httpStatus?: number;
}

export interface TripjackHotelMappingPageable {
	pageNumber: number;
	pageSize: number;
	offset?: number;
	totalElements: number;
	totalPages: number;
	size: number;
}

export interface TripjackFetchHotelMappingRequest {
	countryName?: string;
	regionIds?: string[];
	page: number;
	size: number;
}

export interface TripjackFetchHotelMappingHotel {
	tjHotelId: string;
	unicaId: string;
}

export interface TripjackFetchHotelMappingResponse {
	status: TripjackContentStatus;
	hotels: TripjackFetchHotelMappingHotel[];
	pageable: TripjackHotelMappingPageable;
}

export interface TripjackFetchHotelContentRequest {
	hotelIds: string[];
}

/** Raw batch static hotel node (overlaps structurally with static-detail). */
export type TripjackFetchHotelContentHotel = Record<string, unknown>;

export interface TripjackFetchHotelContentResponse {
	status: TripjackContentStatus;
	hotels: TripjackFetchHotelContentHotel[];
}

export interface TripjackFetchHotelCountriesResponse {
	status: TripjackContentStatus;
	hotelCountries: string[];
}

export interface TripjackHotelCityRegionRow {
	cityName: string;
	cityRegionId: number;
	regionName: string;
	countryName: string;
	regionType: string;
	fullRegionName: string;
}

export interface TripjackFetchCityRegionIdsResponse {
	status: TripjackContentStatus;
	hotelCityRegionIds: TripjackHotelCityRegionRow[];
	nextCursor?: string;
	hasMore?: boolean;
}

export type TripjackHotelMappingSyncType = "NEW" | "UPDATE";

export interface TripjackFetchHotelMappingSyncRequest {
	type: TripjackHotelMappingSyncType;
	lastUpdateTime: string;
	cursor?: string;
}

export interface TripjackFetchHotelMappingSyncResponse {
	status: TripjackContentStatus;
	hotels: Array<{ tjHotelId: string }>;
	pageable?: TripjackHotelMappingPageable;
	nextCursor?: string | null;
}

export interface TripjackFetchDeletedHotelMappingRequest {
	type: "DELETE";
	lastUpdateTime: string;
	cursor?: string;
}

export interface TripjackFetchDeletedHotelMappingResponse {
	status: TripjackContentStatus;
	hotels: Array<{ tjHotelId: string }>;
	pageable?: TripjackHotelMappingPageable;
	nextCursor?: string | null;
}
