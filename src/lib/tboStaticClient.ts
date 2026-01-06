/**
 * TBO Static Data API Client
 * Handles all static/master data API calls using static credentials
 * These APIs provide country, city, and hotel master data
 */

const STATIC_API_BASE_URL = "http://api.tbotechnology.in/TBOHolidays_HotelAPI";
const STATIC_API_USERNAME = "TBOStaticAPITest";
const STATIC_API_PASSWORD = "Tbo@11530818";

/**
 * Get Basic Auth header for static API calls
 */
function getStaticAuthHeader(): string {
	const credentials = Buffer.from(
		`${STATIC_API_USERNAME}:${STATIC_API_PASSWORD}`
	).toString("base64");
	return `Basic ${credentials}`;
}

/**
 * Make an authenticated request to TBO Static API
 */
async function makeStaticRequest<T>(
	endpoint: string,
	method: "GET" | "POST" = "GET",
	body?: any
): Promise<T> {
	const url = `${STATIC_API_BASE_URL}/${endpoint}`;

	try {
		const options: RequestInit = {
			method,
			headers: {
				Authorization: getStaticAuthHeader(),
				"Content-Type": "application/json",
			},
		};

		if (method === "POST" && body) {
			options.body = JSON.stringify(body);
		}

		const response = await fetch(url, options);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`TBO Static API request failed (${endpoint}): ${response.status} ${response.statusText} - ${errorText}`
			);
		}

		const data = await response.json();
		return data as T;
	} catch (error) {
		console.error(`TBO Static API error (${endpoint}):`, error);
		throw error;
	}
}

// ============= Type Definitions =============

export interface TboCountryResponse {
	Status: {
		Code: number;
		Description: string;
	};
	CountryList: Array<{
		Code: string;
		Name: string;
	}>;
}

export interface TboCityResponse {
	Status: {
		Code: number;
		Description: string;
	};
	CityList: Array<{
		Code: string;
		Name: string;
		CountryCode: string;
	}>;
}

export interface TboHotelCodeListResponse {
	Hotels: Array<{
		HotelCode: string;
		HotelName: string;
		Latitude: string;
		Longitude: string;
		HotelRating: string;
		Address: string;
		CountryName: string;
		CountryCode: string;
		CityName: string;
		CityCode?: string;
	}>;
}

export interface TboHotelDetailsResponse {
	HotelDetails: {
		HotelCode: string;
		HotelName: string;
		Description: string;
		StarRating: number;
		Address: string;
		PinCode: string;
		CityId: string;
		CityName: string;
		CountryCode: string;
		CountryName: string;
		Latitude: string;
		Longitude: string;
		HotelFacilities: Array<string>;
		Images: Array<string>;
		Attractions: Array<{
			Key: string;
			Value: string;
		}>;
		HotelRooms: Array<{
			RoomTypeName: string;
			RoomTypeCode: string;
			RoomDescription: string;
			Amenities: Array<string>;
		}>;
	};
}

// ============= API Functions =============

/**
 * Get list of all countries
 * Endpoint: GET /CountryList
 */
export async function getCountryList(): Promise<TboCountryResponse> {
	return await makeStaticRequest<TboCountryResponse>("CountryList", "GET");
}

/**
 * Get list of cities for a specific country
 * Endpoint: POST /CityList
 * @param countryCode - Country code from CountryList API
 */
export async function getCityList(
	countryCode: string
): Promise<TboCityResponse> {
	return await makeStaticRequest<TboCityResponse>("CityList", "POST", {
		CountryCode: countryCode,
	});
}

/**
 * Get list of hotel codes for a specific city
 * Endpoint: POST /TBOHotelCodeList
 * @param cityCode - City code from CityList API
 */
export async function getHotelCodeList(
	cityCode: string
): Promise<TboHotelCodeListResponse> {
	return await makeStaticRequest<TboHotelCodeListResponse>(
		"TBOHotelCodeList",
		"POST",
		{
			CityCode: cityCode,
		}
	);
}

/**
 * Get detailed information for a specific hotel
 * Endpoint: POST /HotelDetails
 * @param hotelCode - Hotel code from TBOHotelCodeList API
 * @param language - Language code (default: "EN")
 * @param isRoomDetailRequired - Whether to include room details (default: true)
 */
export async function getHotelDetails(
	hotelCode: string,
	language: string = "EN",
	isRoomDetailRequired: boolean = true
): Promise<TboHotelDetailsResponse> {
	return await makeStaticRequest<TboHotelDetailsResponse>(
		"HotelDetails",
		"POST",
		{
			Hotelcodes: hotelCode,
			Language: language,
			IsRoomDetailRequired: isRoomDetailRequired,
		}
	);
}

/**
 * Batch get hotel details for multiple hotels
 * @param hotelCodes - Array of hotel codes
 * @param batchSize - Number of hotels to fetch in parallel (default: 5)
 */
export async function batchGetHotelDetails(
	hotelCodes: string[],
	batchSize: number = 5
): Promise<TboHotelDetailsResponse[]> {
	const results: TboHotelDetailsResponse[] = [];

	for (let i = 0; i < hotelCodes.length; i += batchSize) {
		const batch = hotelCodes.slice(i, i + batchSize);
		const batchResults = await Promise.all(
			batch.map((code) =>
				getHotelDetails(code).catch((error) => {
					console.error(`Error fetching hotel ${code}:`, error);
					return null;
				})
			)
		);
		results.push(...batchResults.filter((r) => r !== null));
	}

	return results;
}
