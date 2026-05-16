/**
 * Sets TripjackHotel.isActive = true for all rows missing the field or after adding the column.
 * Run once after deploy:
 *   npx tsx scripts/backfill-tripjack-hotel-isactive.ts
 */

import prisma from "../src/lib/prisma";

async function main() {
	const result = await prisma.tripjackHotel.updateMany({
		data: { isActive: true },
	});
	console.log(`Set isActive=true on ${result.count} TripjackHotel rows`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
