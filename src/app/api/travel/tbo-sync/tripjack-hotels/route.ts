/**
 * POST /api/travel/tbo-sync/tripjack-hotels
 *
 * Upserts TripJack hotel records into the TripjackHotel collection.
 * Call this from an admin job or during onboarding to populate the
 * hotel index so that city-based searches can look up TripJack hids.
 *
 * Body:
 * {
 *   validateSupplier?: boolean, // when true, each tjHotelId is checked via static-detail country vs payload (slower)
 *   hotels: [{
 *     tjHotelId: string,
 *     hotelName: string,
 *     cityCode: string,      // TBO-compatible TBO city code for cross-referencing
 *     cityName: string,
 *     countryCode: string,
 *     countryName: string,
 *     latitude?: string,
 *     longitude?: string,
 *     hotelRating?: string,
 *     address?: string,
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
	fetchTripjackStaticHotels,
	fetchTripjackDeletedHotels,
	getTripjackHotelStaticDetail,
} from "@/lib/tripjackClient";
import { getCanonicalTboCityCodeForTripjackCityCode } from "@/lib/tripjackCityMap";
import { isTripjackHotelRowActive } from "@/lib/resolveCityInventory";
import type { TripjackStaticHotelInfo } from "@/types/tripjack";

interface TripjackHotelInput {
	tjHotelId: string;
	hotelName: string;
	cityCode: string;
	cityName: string;
	countryCode: string;
	countryName: string;
	latitude?: string;
	longitude?: string;
	hotelRating?: string;
	address?: string;
}

function resolveTboCityCodeFromStaticHotel(h: TripjackStaticHotelInfo): string {
	const raw = (h.address?.city?.code ?? "").trim();
	if (/^\d+$/.test(raw)) return raw;
	return getCanonicalTboCityCodeForTripjackCityCode(raw) ?? raw;
}

export async function POST(req: NextRequest) {
	let body: { hotels?: unknown; validateSupplier?: boolean };
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	if (!Array.isArray(body.hotels) || body.hotels.length === 0) {
		return NextResponse.json(
			{ error: "hotels array is required and must not be empty" },
			{ status: 400 },
		);
	}

	const hotels = body.hotels as TripjackHotelInput[];

	// Validate each entry has required fields
	for (const h of hotels) {
		if (
			!h.tjHotelId ||
			!h.hotelName ||
			!h.cityCode ||
			!h.cityName ||
			!h.countryCode ||
			!h.countryName
		) {
			return NextResponse.json(
				{
					error:
						"Each hotel requires: tjHotelId, hotelName, cityCode, cityName, countryCode, countryName",
				},
				{ status: 400 },
			);
		}
	}

	const distinctCityCodes = [...new Set(hotels.map((h) => h.cityCode))];
	const tboCities = await prisma.tboCity.findMany({
		where: { cityCode: { in: distinctCityCodes } },
	});
	const cityByCode = new Map(tboCities.map((c) => [c.cityCode, c]));
	const unknownCityCodes = distinctCityCodes.filter((cc) => !cityByCode.has(cc));
	if (unknownCityCodes.length > 0) {
		return NextResponse.json(
			{
				error:
					"Each hotel cityCode must exist in TboCity (sync TBO cities first)",
				unknownCityCodes,
			},
			{ status: 400 },
		);
	}

	const countryMismatches = hotels
		.map((h) => {
			const c = cityByCode.get(h.cityCode)!;
			if (h.countryCode.toUpperCase() !== c.countryCode.toUpperCase()) {
				return {
					tjHotelId: h.tjHotelId,
					cityCode: h.cityCode,
					payloadCountry: h.countryCode,
					expectedCountry: c.countryCode,
				};
			}
			return null;
		})
		.filter(Boolean) as Array<{
		tjHotelId: string;
		cityCode: string;
		payloadCountry: string;
		expectedCountry: string;
	}>;

	if (countryMismatches.length > 0) {
		return NextResponse.json(
			{
				error:
					"countryCode on each hotel must match TboCity.countryCode for that cityCode",
				mismatches: countryMismatches.slice(0, 25),
			},
			{ status: 400 },
		);
	}

	if (body.validateSupplier === true) {
		const chunkSize = 5;
		const supplierMismatches: { tjHotelId: string; reason: string }[] = [];
		for (let i = 0; i < hotels.length; i += chunkSize) {
			const chunk = hotels.slice(i, i + chunkSize);
			const chunkResults = await Promise.all(
				chunk.map(async (h) => {
					try {
						const d = await getTripjackHotelStaticDetail(h.tjHotelId);
						const sc = d.data.locale?.address?.countrycode
							?.trim()
							.toUpperCase();
						if (
							sc &&
							sc.length === 2 &&
							sc !== h.countryCode.toUpperCase()
						) {
							return {
								tjHotelId: h.tjHotelId,
								reason: `static-detail country ${sc} vs payload ${h.countryCode}`,
							};
						}
						return null;
					} catch (e) {
						return {
							tjHotelId: h.tjHotelId,
							reason:
								e instanceof Error ? e.message : "static-detail request failed",
						};
					}
				}),
			);
			for (const r of chunkResults) {
				if (r) supplierMismatches.push(r);
			}
		}
		if (supplierMismatches.length > 0) {
			return NextResponse.json(
				{
					error: "Supplier static-detail validation failed",
					supplierMismatches,
				},
				{ status: 400 },
			);
		}
	}

	// Upsert all hotels
	const results = await Promise.allSettled(
		hotels.map((h) =>
			prisma.tripjackHotel.upsert({
				where: { tjHotelId: h.tjHotelId },
				update: {
					hotelName: h.hotelName,
					cityCode: h.cityCode,
					cityName: h.cityName,
					countryCode: h.countryCode,
					countryName: h.countryName,
					isActive: true,
					...(h.latitude !== undefined && { latitude: h.latitude }),
					...(h.longitude !== undefined && { longitude: h.longitude }),
					...(h.hotelRating !== undefined && { hotelRating: h.hotelRating }),
					...(h.address !== undefined && { address: h.address }),
				},
				create: {
					tjHotelId: h.tjHotelId,
					hotelName: h.hotelName,
					cityCode: h.cityCode,
					cityName: h.cityName,
					countryCode: h.countryCode,
					countryName: h.countryName,
					latitude: h.latitude,
					longitude: h.longitude,
					hotelRating: h.hotelRating,
					address: h.address,
					isActive: true,
				},
			}),
		),
	);

	const succeeded = results.filter((r) => r.status === "fulfilled").length;
	const failed = results
		.filter((r) => r.status === "rejected")
		.map((r) => (r as PromiseRejectedResult).reason?.message ?? "Unknown");

	return NextResponse.json({
		success: true,
		upserted: succeeded,
		failed: failed.length,
		errors: failed.length > 0 ? failed.slice(0, 10) : undefined,
	});
}

/**
 * GET /api/travel/tbo-sync/tripjack-hotels?cityCode=130443
 * Returns the count of TripJack hotels for a city (for diagnostics).
 */
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const cityCode = searchParams.get("cityCode");

	if (cityCode) {
		const [count, tjRows] = await Promise.all([
			prisma.tripjackHotel.count({ where: { cityCode } }),
			prisma.tripjackHotel.findMany({
				where: { cityCode },
				select: { tjHotelId: true, hotelName: true, isActive: true },
			}),
		]);
		const countActive = tjRows.filter((r) => isTripjackHotelRowActive(r.isActive))
			.length;
		const sample = tjRows.slice(0, 5);
		return NextResponse.json({
			cityCode,
			/** All rows for this TBO cityCode (includes inactive). */
			count,
			/** Rows counted as active for unified search (explicit false only = inactive). */
			countActive,
			sample,
		});
	}

	const total = await prisma.tripjackHotel.count();
	const byCityRaw = await prisma.tripjackHotel.groupBy({
		by: ["cityCode", "cityName"],
		_count: { tjHotelId: true },
		orderBy: { _count: { tjHotelId: "desc" } },
		take: 20,
	});

	return NextResponse.json({
		total,
		topCities: byCityRaw.map((r) => ({
			cityCode: r.cityCode,
			cityName: r.cityName,
			count: r._count.tjHotelId,
		})),
	});
}

/**
 * PUT /api/travel/tbo-sync/tripjack-hotels
 *
 * Syncs hotels directly from TripJack's static hotels API.
 * Supports full sync and incremental sync (via lastUpdateTime).
 * Deleted hotels from TripJack are **soft-deactivated** (`isActive: false`) so they drop out of search.
 *
 * Recommended cadence (per supplier guidance): run full/incremental static sync on a schedule
 * (e.g. weekly cron) and pass `lastUpdateTime` for incremental updates between full runs.
 *
 * Body:
 * {
 *   lastUpdateTime?: string,   // ISO 8601 — for incremental sync
 *   maxPages?: number,         // Max pages to fetch (default: unlimited)
 *   syncDeleted?: boolean,     // Also sync deleted hotels (default: true)
 * }
 */
export async function PUT(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		body = {};
	}

	const lastUpdateTime = body.lastUpdateTime as string | undefined;
	const maxPages = (body.maxPages as number) || Infinity;
	const syncDeleted = body.syncDeleted !== false;

	let totalUpserted = 0;
	let totalDeleted = 0;
	let pagesProcessed = 0;
	let nextToken: string | undefined;

	try {
		// Fetch new/updated hotels with pagination
		do {
			const payload: Record<string, unknown> = {};
			if (lastUpdateTime) payload.lastUpdateTime = lastUpdateTime;
			if (nextToken) payload.next = nextToken;

			const result = await fetchTripjackStaticHotels(payload);

			if (result.hotelOpInfos && result.hotelOpInfos.length > 0) {
				const ops = await Promise.allSettled(
					result.hotelOpInfos.map((h) => {
						const cityCode = resolveTboCityCodeFromStaticHotel(h);
						return prisma.tripjackHotel.upsert({
							where: { tjHotelId: h.tjHotelId },
							update: {
								hotelName: h.name,
								cityCode,
								cityName: h.cityName || h.address?.city?.name || "",
								...(h.address?.country?.code && {
									countryCode: h.address.country.code,
								}),
								...(h.countryName && { countryName: h.countryName }),
								...(h.geolocation?.lt && { latitude: h.geolocation.lt }),
								...(h.geolocation?.ln && { longitude: h.geolocation.ln }),
								...(h.rating !== undefined && {
									hotelRating: String(h.rating),
								}),
								...(h.address?.adr && { address: h.address.adr }),
								isActive: true,
							},
							create: {
								tjHotelId: h.tjHotelId,
								hotelName: h.name,
								cityCode,
								cityName: h.cityName || h.address?.city?.name || "",
								countryCode: h.address?.country?.code || "",
								countryName: h.countryName || h.address?.country?.name || "",
								latitude: h.geolocation?.lt,
								longitude: h.geolocation?.ln,
								hotelRating:
									h.rating !== undefined ? String(h.rating) : undefined,
								address: h.address?.adr,
								isActive: true,
							},
						});
					}),
				);
				totalUpserted += ops.filter((r) => r.status === "fulfilled").length;
			}

			nextToken = result.next;
			pagesProcessed++;
		} while (nextToken && pagesProcessed < maxPages);

		// Sync deleted hotels
		if (syncDeleted && lastUpdateTime) {
			let delNext: string | undefined;
			do {
				const delPayload: { lastUpdateTime: string; next?: string } = {
					lastUpdateTime,
				};
				if (delNext) delPayload.next = delNext;

				const delResult = await fetchTripjackDeletedHotels(delPayload);

				if (delResult.hotelOpInfos && delResult.hotelOpInfos.length > 0) {
					const ids = delResult.hotelOpInfos.map((h) => h.tjHotelId);
					const updateResult = await prisma.tripjackHotel.updateMany({
						where: { tjHotelId: { in: ids } },
						data: { isActive: false },
					});
					totalDeleted += updateResult.count;
				}

				delNext = delResult.next;
			} while (delNext);
		}

		return NextResponse.json({
			success: true,
			upserted: totalUpserted,
			deleted: totalDeleted,
			pagesProcessed,
			incremental: !!lastUpdateTime,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Sync failed";
		return NextResponse.json(
			{
				error: message,
				upserted: totalUpserted,
				deleted: totalDeleted,
				pagesProcessed,
			},
			{ status: 500 },
		);
	}
}
