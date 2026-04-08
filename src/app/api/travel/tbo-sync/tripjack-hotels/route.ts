/**
 * POST /api/travel/tbo-sync/tripjack-hotels
 *
 * Upserts TripJack hotel records into the TripjackHotel collection.
 * Call this from an admin job or during onboarding to populate the
 * hotel index so that city-based searches can look up TripJack hids.
 *
 * Body:
 * {
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
} from "@/lib/tripjackClient";

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

export async function POST(req: NextRequest) {
	let body: { hotels?: unknown };
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
		const count = await prisma.tripjackHotel.count({ where: { cityCode } });
		const sample = await prisma.tripjackHotel.findMany({
			where: { cityCode },
			take: 5,
			select: { tjHotelId: true, hotelName: true },
		});
		return NextResponse.json({ cityCode, count, sample });
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
 * Also removes deleted hotels.
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
					result.hotelOpInfos.map((h) =>
						prisma.tripjackHotel.upsert({
							where: { tjHotelId: h.tjHotelId },
							update: {
								hotelName: h.name,
								...(h.address?.city?.name && { cityName: h.address.city.name }),
								...(h.address?.city?.code && { cityCode: h.address.city.code }),
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
							},
							create: {
								tjHotelId: h.tjHotelId,
								hotelName: h.name,
								cityCode: h.address?.city?.code || "",
								cityName: h.cityName || h.address?.city?.name || "",
								countryCode: h.address?.country?.code || "",
								countryName: h.countryName || h.address?.country?.name || "",
								latitude: h.geolocation?.lt,
								longitude: h.geolocation?.ln,
								hotelRating:
									h.rating !== undefined ? String(h.rating) : undefined,
								address: h.address?.adr,
							},
						}),
					),
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
					const deleteResult = await prisma.tripjackHotel.deleteMany({
						where: { tjHotelId: { in: ids } },
					});
					totalDeleted += deleteResult.count;
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
