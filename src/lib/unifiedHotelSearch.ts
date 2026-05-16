import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { searchHotels } from "@/lib/tboHotelClient";
import {
	DELHI_NCR_META_CITY_CODE,
	DELHI_NCR_TBO_CITY_CODES,
	getTripjackCityCode,
	tripjackInventoryCountryCodes,
} from "@/lib/tripjackCityMap";
import { getTripjackHotelListing } from "@/lib/tripjackClient";
import { dedupeHotelResultsByNameAndCity } from "@/lib/unifiedHotelDedupe";
import {
	rankTripjackHotelsForListing,
	tripjackListingCandidateCap,
	type TripjackRankRow,
} from "@/lib/unifiedHotelRanking";
import {
	resolveCityInventory,
	resolveDestinationToTboCityCode,
	isTripjackHotelRowActive,
	type ResolvedCityInventory,
} from "@/lib/resolveCityInventory";
import type { HotelResult } from "@/types/hotelApi";
import type {
	TripjackHotelListingResponse,
	TripjackHotelResult,
} from "@/types/tripjack";
import type {
	UnifiedHotelSearchRequest,
	UnifiedHotelSearchResponse,
	UnifiedSupplierError,
} from "@/types/unifiedHotel";

const TBO_HOTEL_SEARCH_CAP = 60;
const TRIPJACK_LISTING_CHUNK_SIZE = 90;
const TRIPJACK_LISTING_BATCH_CAP = 2;
const TRIPJACK_LISTING_PROVIDER_TIMEOUT_MS = 120_000;

type TboCatalogHotelRow = {
	hotelCode: string;
	hotelName: string;
	cityName: string;
	countryName: string;
	hotelRating?: string | null;
	images?: string[];
};

function chunkArray<T>(arr: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		out.push(arr.slice(i, i + size));
	}
	return out;
}

function normalizeImageUrl(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	if (trimmed.startsWith("//")) return `https:${trimmed}`;
	if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
		return trimmed;
	}
	if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
		return trimmed;
	}
	return undefined;
}

function pickImageFromUnknown(value: unknown): string | undefined {
	const normalizedDirect = normalizeImageUrl(value);
	if (normalizedDirect) return normalizedDirect;
	if (!value || typeof value !== "object") return undefined;

	const record = value as Record<string, unknown>;
	for (const key of ["href", "url", "link", "image", "img", "thumbnail"]) {
		const normalized = normalizeImageUrl(record[key]);
		if (normalized) return normalized;
	}

	const links = record.links;
	if (links && typeof links === "object" && !Array.isArray(links)) {
		const linkValues = Object.values(links as Record<string, unknown>);
		for (const item of linkValues) {
			const fromLink = pickImageFromUnknown(item);
			if (fromLink) return fromLink;
		}
	}

	for (const key of ["images", "photos", "imageUrls"]) {
		const list = record[key];
		if (!Array.isArray(list)) continue;
		for (const item of list) {
			const fromItem = pickImageFromUnknown(item);
			if (fromItem) return fromItem;
		}
	}

	return undefined;
}

function mergeTboCatalogMetadata(
	results: HotelResult[],
	catalogHotels: TboCatalogHotelRow[],
): HotelResult[] {
	const byCode = new Map(catalogHotels.map((h) => [String(h.hotelCode), h]));
	return results.map((hr) => {
		const meta = byCode.get(String(hr.HotelCode));
		const firstImage = meta?.images?.find(
			(u) => typeof u === "string" && u.trim().length > 0,
		);
		return {
			...hr,
			source: "TBO" as const,
			HotelName: hr.HotelName || meta?.hotelName,
			CityName: hr.CityName || meta?.cityName,
			CountryName: hr.CountryName || meta?.countryName,
			StarRating: hr.StarRating ?? meta?.hotelRating ?? undefined,
			HotelImage: hr.HotelImage || firstImage,
		};
	});
}

function normalizeTripjackListingResults(
	response: TripjackHotelListingResponse,
): HotelResult[] {
	return response.hotels.map((hotel: TripjackHotelResult) => ({
		HotelCode: hotel.tjHotelId || hotel.hotelId || "",
		Currency: response.currency,
		HotelName: hotel.name || undefined,
		HotelImage: pickImageFromUnknown(hotel),
		source: "TRIPJACK" as const,
		Rooms: hotel.options.map((option) => ({
			Name: option.roomInfo.map((r) => r.name),
			BookingCode: option.optionId,
			Inclusion: option.inclusions.join(", "),
			DayRates: [],
			TotalFare: option.pricing.basePrice,
			TotalTax: option.pricing.taxes + option.pricing.mf + option.pricing.mft,
			RoomID: option.roomInfo.map((r) => r.id),
			RoomPromotion: [],
			CancelPolicies: [],
			MealType: option.mealBasis.replace(/ /g, "_"),
			IsRefundable: option.cancellation.isRefundable,
			Supplements: [],
			WithTransfers: false,
		})),
	}));
}

function tboHotelResultSuccess(data: {
	Status?: { Code?: number; Description?: string };
	HotelResult?: unknown[];
}): boolean {
	if (data?.Status) {
		const statusCode = data.Status.Code;
		const description = (data.Status.Description || "").toLowerCase();
		return (
			statusCode === 1 ||
			statusCode === 0 ||
			(statusCode === 200 &&
				(description.includes("success") || description === "successful"))
		);
	}
	return true;
}

async function loadTripjackRankRows(
	inv: ResolvedCityInventory,
): Promise<TripjackRankRow[]> {
	const isNcr = inv.cityCode === DELHI_NCR_META_CITY_CODE;
	const codes = isNcr ? [...DELHI_NCR_TBO_CITY_CODES] : [inv.cityCode];
	const countries = tripjackInventoryCountryCodes(inv.countryCode);
	const rows = await prisma.tripjackHotel.findMany({
		where: {
			cityCode: { in: codes },
			...(countries.length > 0
				? { countryCode: { in: countries } }
				: { countryCode: inv.countryCode }),
		},
		select: { tjHotelId: true, hotelRating: true, hotelName: true, isActive: true },
	});
	return rows
		.filter((r) => isTripjackHotelRowActive(r.isActive))
		.map(({ tjHotelId, hotelRating, hotelName }) => ({
			tjHotelId,
			hotelRating,
			hotelName,
		}));
}

async function searchTboHotels(
	inv: ResolvedCityInventory,
	checkIn: string,
	checkOut: string,
	rooms: UnifiedHotelSearchRequest["rooms"],
	guestNationality: string,
): Promise<{ hotels: HotelResult[]; error?: UnifiedSupplierError }> {
	try {
		const catalog = inv.hotels.slice(0, TBO_HOTEL_SEARCH_CAP) as TboCatalogHotelRow[];
		if (catalog.length === 0) {
			return { hotels: [] };
		}
		const hotelCodes = catalog.map((h) => h.hotelCode).join(",");
		const raw = await searchHotels({
			checkIn,
			checkOut,
			hotelCodes,
			guestNationality,
			rooms: rooms.map((room) => ({
				adults: room.adults,
				children: room.children ?? 0,
				childrenAges: room.childAge ?? [],
			})),
			isDetailedResponse: true,
			filters: {},
		});

		const payload = raw as {
			Status?: { Code?: number; Description?: string };
			HotelResult?: HotelResult[];
		};

		if (!tboHotelResultSuccess(payload)) {
			return { hotels: [] };
		}

		if (payload.HotelResult && Array.isArray(payload.HotelResult)) {
			return {
				hotels: mergeTboCatalogMetadata(payload.HotelResult, catalog),
			};
		}
		return { hotels: [] };
	} catch (e) {
		const message = e instanceof Error ? e.message : "TBO search failed";
		return {
			hotels: [],
			error: { code: "TBO_SEARCH", message },
		};
	}
}

async function searchTripjackListings(
	inv: ResolvedCityInventory,
	cityCodeForTripjackMap: string,
	checkIn: string,
	checkOut: string,
	rooms: UnifiedHotelSearchRequest["rooms"],
	nationality: string,
): Promise<{
	hotels: HotelResult[];
	correlationId?: string;
	error?: UnifiedSupplierError;
}> {
	try {
		const rankRows = await loadTripjackRankRows(inv);
		const cap = tripjackListingCandidateCap();
		const ranked = rankTripjackHotelsForListing(rankRows, cap);
		const hids = ranked.map((r) => r.tjHotelId);
		if (hids.length === 0) {
			return { hotels: [] };
		}

		const tjRooms = rooms.map((room) => ({
			adults: room.adults,
			...(room.children &&
				room.children > 0 && {
					children: room.children,
					childAge: room.childAge,
				}),
		}));

		const batches = chunkArray(hids, TRIPJACK_LISTING_CHUNK_SIZE).slice(
			0,
			TRIPJACK_LISTING_BATCH_CAP,
		);

		const tripjackListingCityCode = getTripjackCityCode(cityCodeForTripjackMap);
		const listingCorrelationSeed = randomUUID();

		const batchResults = await Promise.all(
			batches.map(async (batchHids) => {
				const listing = await getTripjackHotelListing({
					checkIn,
					checkOut,
					rooms: tjRooms,
					currency: "INR",
					hids: batchHids,
					...(tripjackListingCityCode && { cityCode: tripjackListingCityCode }),
					correlationId: listingCorrelationSeed,
					nationality,
					timeoutMs: TRIPJACK_LISTING_PROVIDER_TIMEOUT_MS,
				});

				const ok =
					listing?.status?.success === true &&
					Array.isArray(listing.hotels) &&
					listing.hotels.length > 0;
				if (!ok) {
					return {
						hotels: [] as HotelResult[],
						correlationId: listing.correlationId,
					};
				}
				return {
					hotels: normalizeTripjackListingResults(listing),
					correlationId: listing.correlationId,
				};
			}),
		);

		const hotels = batchResults.flatMap((b) => b.hotels);
		const correlationId =
			batchResults.find((b) => b.correlationId)?.correlationId ??
			listingCorrelationSeed;

		return {
			hotels,
			correlationId: hotels.length > 0 ? correlationId : undefined,
		};
	} catch (e) {
		const message = e instanceof Error ? e.message : "TripJack listing failed";
		return {
			hotels: [],
			error: { code: "TRIPJACK_LISTING", message },
		};
	}
}

async function resolveRequestCityCode(
	body: UnifiedHotelSearchRequest,
): Promise<{ cityCode: string | null; error?: UnifiedSupplierError }> {
	if (body.cityCode?.trim()) {
		return { cityCode: body.cityCode.trim() };
	}
	if (body.destination?.trim()) {
		const mapped = await resolveDestinationToTboCityCode(body.destination.trim());
		if (mapped) return { cityCode: mapped };
		return {
			cityCode: null,
			error: {
				code: "DESTINATION_UNRESOLVED",
				message: `Unknown destination: ${body.destination}`,
			},
		};
	}
	return {
		cityCode: null,
		error: {
			code: "MISSING_CITY",
			message: "cityCode or destination is required",
		},
	};
}

/**
 * Server-side multi-supplier hotel search (TBO + TripJack) with partial failure isolation.
 */
export async function runUnifiedHotelSearch(
	body: UnifiedHotelSearchRequest,
): Promise<UnifiedHotelSearchResponse> {
	const mode = body.mode ?? "all";
	const errors: UnifiedHotelSearchResponse["errors"] = {};

	const resolvedCity = await resolveRequestCityCode(body);
	if (!resolvedCity.cityCode || resolvedCity.error) {
		if (resolvedCity.error) errors.tbo = resolvedCity.error;
		return {
			success: false,
			mode,
			hotels: [],
			errors,
		};
	}

	const cityCode = resolvedCity.cityCode;
	const inv = await resolveCityInventory(cityCode);
	if (!inv) {
		errors.tbo = {
			code: "CITY_NOT_FOUND",
			message: `City not found: ${cityCode}`,
		};
		return { success: false, mode, hotels: [], errors, cityCode };
	}

	const guestNat = (body.guestNationality ?? "IN").toUpperCase();
	const nationality = body.nationality ?? "94";

	const tboOnly = mode === "tbo";
	const tjOnly = mode === "tripjack";

	let tboHotels: HotelResult[] = [];
	let tjHotels: HotelResult[] = [];
	let tripjackCorrelationId: string | undefined;

	if (!tjOnly) {
		const tbo = await searchTboHotels(
			inv,
			body.checkIn,
			body.checkOut,
			body.rooms,
			guestNat,
		);
		tboHotels = tbo.hotels;
		if (tbo.error) errors.tbo = tbo.error;
	}

	if (!tboOnly) {
		const tripjackCityCodeArg =
			cityCode === DELHI_NCR_META_CITY_CODE ? "130443" : cityCode;
		const tj = await searchTripjackListings(
			inv,
			tripjackCityCodeArg,
			body.checkIn,
			body.checkOut,
			body.rooms,
			nationality,
		);
		tjHotels = tj.hotels;
		tripjackCorrelationId = tj.correlationId;
		if (tj.error) errors.tripjack = tj.error;
	}

	let merged = [...tboHotels, ...tjHotels];
	const shouldDedupe =
		body.dedupe === true ||
		(body.dedupe !== false && (body.mode ?? "all") === "all");
	if (shouldDedupe) {
		merged = dedupeHotelResultsByNameAndCity(merged);
	}

	return {
		success: merged.length > 0,
		mode,
		hotels: merged,
		errors,
		...(tripjackCorrelationId ? { tripjackCorrelationId } : {}),
		cityCode,
	};
}
