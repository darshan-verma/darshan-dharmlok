/**
 * Lists TripjackHotel rows whose countryCode does not match the TboCity master
 * for the same cityCode (common cause: foreign hids tagged with an Indian TBO city).
 *
 * Run from repo root (requires DATABASE_URL):
 *   npx tsx scripts/audit-tripjack-hotel-country-mismatch.ts
 */

import prisma from "../src/lib/prisma";

async function main() {
	const hotels = await prisma.tripjackHotel.findMany({
		select: {
			tjHotelId: true,
			hotelName: true,
			cityCode: true,
			cityName: true,
			countryCode: true,
		},
	});

	const numericCityCodes = [
		...new Set(
			hotels.map((h) => h.cityCode).filter((c) => /^\d+$/.test(c)),
		),
	];

	const cities =
		numericCityCodes.length > 0
			? await prisma.tboCity.findMany({
					where: { cityCode: { in: numericCityCodes } },
					select: { cityCode: true, countryCode: true, cityName: true },
				})
			: [];

	const cityByCode = new Map(cities.map((c) => [c.cityCode, c]));

	const mismatches: Array<{
		tjHotelId: string;
		hotelName: string;
		cityCode: string;
		rowCountry: string;
		expectedCountry: string;
		tboCityName: string;
	}> = [];

	const unknownTboCity: Array<{
		tjHotelId: string;
		hotelName: string;
		cityCode: string;
		countryCode: string;
	}> = [];

	for (const h of hotels) {
		if (!/^\d+$/.test(h.cityCode)) {
			continue;
		}
		const tbo = cityByCode.get(h.cityCode);
		if (!tbo) {
			unknownTboCity.push({
				tjHotelId: h.tjHotelId,
				hotelName: h.hotelName,
				cityCode: h.cityCode,
				countryCode: h.countryCode,
			});
			continue;
		}
		if (h.countryCode.toUpperCase() !== tbo.countryCode.toUpperCase()) {
			mismatches.push({
				tjHotelId: h.tjHotelId,
				hotelName: h.hotelName,
				cityCode: h.cityCode,
				rowCountry: h.countryCode,
				expectedCountry: tbo.countryCode,
				tboCityName: tbo.cityName,
			});
		}
	}

	console.log(
		`TripjackHotel total: ${hotels.length} — country mismatches vs TboCity: ${mismatches.length} — numeric cityCode not in TboCity: ${unknownTboCity.length}`,
	);
	if (mismatches.length > 0) {
		console.log("\n--- Country mismatches (review / delete / re-tag) ---\n");
		console.log(JSON.stringify(mismatches.slice(0, 200), null, 2));
		if (mismatches.length > 200) {
			console.log(`\n... and ${mismatches.length - 200} more`);
		}
	}
	if (unknownTboCity.length > 0) {
		console.log("\n--- Unknown TBO cityCode on TripjackHotel ---\n");
		console.log(JSON.stringify(unknownTboCity.slice(0, 100), null, 2));
	}

	await prisma.$disconnect();
}

main().catch((e) => {
	console.error(e);
	void prisma.$disconnect();
	process.exit(1);
});
