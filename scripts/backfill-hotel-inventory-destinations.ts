/**
 * Seeds HotelInventoryDestination + HotelInventoryCityMapping from TboCity / TboCountry.
 * Safe to re-run: upserts TBO mapping per canonical city (normalized name + country).
 *
 *   npx tsx scripts/backfill-hotel-inventory-destinations.ts
 */

import prisma from "../src/lib/prisma";

function normalizeName(name: string): string {
	return name.toLowerCase().trim().replace(/\s+/g, " ");
}

async function main() {
	const [cities, countries] = await Promise.all([
		prisma.tboCity.findMany(),
		prisma.tboCountry.findMany(),
	]);
	const countryNameByCode = new Map(
		countries.map((c) => [c.countryCode, c.countryName]),
	);

	let createdDest = 0;
	let upsertedMaps = 0;

	for (const city of cities) {
		const countryName =
			countryNameByCode.get(city.countryCode) ?? city.countryCode;
		const normalizedName = normalizeName(city.cityName);

		let dest = await prisma.hotelInventoryDestination.findFirst({
			where: {
				normalizedName,
				country: countryName,
			},
		});

		if (!dest) {
			dest = await prisma.hotelInventoryDestination.create({
				data: {
					name: city.cityName,
					country: countryName,
					normalizedName,
					aliases: [],
				},
			});
			createdDest++;
		}

		await prisma.hotelInventoryCityMapping.upsert({
			where: {
				hotelInventoryDestinationId_supplier: {
					hotelInventoryDestinationId: dest.id,
					supplier: "TBO",
				},
			},
			create: {
				hotelInventoryDestinationId: dest.id,
				supplier: "TBO",
				supplierCode: city.cityCode,
			},
			update: {
				supplierCode: city.cityCode,
			},
		});
		upsertedMaps++;
	}

	console.log(
		`Done. New destinations: ${createdDest}, TBO mappings upserted: ${upsertedMaps}`,
	);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
