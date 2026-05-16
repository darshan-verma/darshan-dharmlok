/**
 * Platform-owned city inventory: TBO catalog rows + TripJack hotel IDs for listing.
 * Shared by POST /api/travel/hotel-search and unified hotel search.
 */

import prisma from "@/lib/prisma";
import {
	DELHI_NCR_META_CITY_CODE,
	DELHI_NCR_TBO_CITY_CODES,
	tripjackInventoryCountryCodes,
} from "@/lib/tripjackCityMap";
import type { TboCountry, TboHotel } from "@prisma/client";

export type ResolvedCityInventory = {
	cityCode: string;
	cityName: string;
	countryCode: string;
	countryName: string;
	country: TboCountry | null;
	hotels: TboHotel[];
	tripjackHids: string[];
};

function tripjackInventoryWhere(cityCodes: string[], countryCode: string) {
	const countries = tripjackInventoryCountryCodes(countryCode);
	return {
		cityCode: { in: cityCodes },
		...(countries.length > 0
			? { countryCode: { in: countries } }
			: { countryCode }),
	};
}

/** Treat missing isActive as active (Mongo may omit the field; Prisma applies schema default on read). */
export function isTripjackHotelRowActive(
	isActive: boolean | null | undefined,
): boolean {
	return isActive !== false;
}

/**
 * Resolve TBO city code (including Delhi NCR meta) to TBO hotels + TripJack hids.
 * Returns null when the city cannot be resolved.
 */
export async function resolveCityInventory(
	cityCode: string,
): Promise<ResolvedCityInventory | null> {
	if (cityCode === DELHI_NCR_META_CITY_CODE) {
		const ncrCityCodes = [...DELHI_NCR_TBO_CITY_CODES];
		const [hotels, city] = await Promise.all([
			prisma.tboHotel.findMany({
				where: { cityCode: { in: ncrCityCodes } },
				orderBy: { hotelName: "asc" },
			}),
			prisma.tboCity.findUnique({ where: { cityCode } }),
		]);

		const expectedCountry = city?.countryCode ?? "IN";

		const tjHotels = await prisma.tripjackHotel.findMany({
			where: tripjackInventoryWhere([...ncrCityCodes], expectedCountry),
			select: { tjHotelId: true, isActive: true },
		});

		const tripjackHids = tjHotels
			.filter((h) => isTripjackHotelRowActive(h.isActive))
			.map((h) => h.tjHotelId);

		if (city) {
			const country = await prisma.tboCountry.findUnique({
				where: { countryCode: city.countryCode },
			});
			return {
				cityCode,
				cityName: city.cityName,
				countryCode: city.countryCode,
				countryName: country?.countryName ?? "",
				country: country ?? null,
				hotels,
				tripjackHids,
			};
		}

		return {
			cityCode,
			cityName: "Delhi NCR",
			countryCode: "IN",
			countryName: "India",
			country: await prisma.tboCountry.findUnique({ where: { countryCode: "IN" } }),
			hotels,
			tripjackHids,
		};
	}

	const city = await prisma.tboCity.findUnique({
		where: { cityCode },
	});
	if (!city) return null;

	const [country, hotels, tjHotels] = await Promise.all([
		prisma.tboCountry.findUnique({
			where: { countryCode: city.countryCode },
		}),
		prisma.tboHotel.findMany({
			where: { cityCode },
			orderBy: { hotelName: "asc" },
		}),
		prisma.tripjackHotel.findMany({
			where: tripjackInventoryWhere([cityCode], city.countryCode),
			select: { tjHotelId: true, isActive: true },
		}),
	]);

	return {
		cityCode,
		cityName: city.cityName,
		countryCode: city.countryCode,
		countryName: country?.countryName ?? "",
		country,
		hotels,
		tripjackHids: tjHotels
			.filter((h) => isTripjackHotelRowActive(h.isActive))
			.map((h) => h.tjHotelId),
	};
}

/**
 * Match canonical HotelInventoryDestination + mapping (TBO) to obtain a TBO city code.
 * Returns null when no mapping exists (caller should use explicit cityCode).
 */
export async function resolveDestinationToTboCityCode(
	destination: string,
): Promise<string | null> {
	const needle = destination.toLowerCase().trim().replace(/\s+/g, " ");
	if (!needle) return null;

	const exact = await prisma.hotelInventoryDestination.findFirst({
		where: {
			OR: [
				{ normalizedName: needle },
				{ aliases: { has: needle } },
				{ name: { equals: destination.trim(), mode: "insensitive" } },
			],
		},
	});

	const destRow =
		exact ??
		(await prisma.hotelInventoryDestination.findFirst({
			where: {
				OR: [
					{ normalizedName: { contains: needle } },
					{ name: { contains: needle, mode: "insensitive" } },
				],
			},
		}));

	if (!destRow) return null;

	const tboMap = await prisma.hotelInventoryCityMapping.findFirst({
		where: {
			hotelInventoryDestinationId: destRow.id,
			supplier: "TBO",
		},
	});
	return tboMap?.supplierCode ?? null;
}
