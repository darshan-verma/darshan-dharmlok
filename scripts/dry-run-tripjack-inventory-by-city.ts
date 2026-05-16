/**
 * Dry-run: resolveCityInventory (same TripJack HID resolution as unified search).
 * Requires DATABASE_URL. Run: npx tsx scripts/dry-run-tripjack-inventory-by-city.ts
 */

import prisma from "../src/lib/prisma";
import { resolveCityInventory } from "../src/lib/resolveCityInventory";
import { DELHI_NCR_META_CITY_CODE } from "../src/lib/tripjackCityMap";

const SAMPLE_CITIES = [
	{ label: "Delhi (TBO)", code: "130443" },
	{ label: "Delhi NCR meta", code: DELHI_NCR_META_CITY_CODE },
	{ label: "Mumbai (TBO)", code: "144306" },
	{ label: "Bengaluru (TBO)", code: "111124" },
] as const;

async function main() {
	for (const { label, code } of SAMPLE_CITIES) {
		const inv = await resolveCityInventory(code);
		if (!inv) {
			console.log(`\n## ${label} (${code})\n  resolveCityInventory: null (unknown TBO city)`);
			continue;
		}
		console.log(`\n## ${label} (${code})`);
		console.log(`  TBO hotels in inventory: ${inv.hotels.length}`);
		console.log(`  countryCode (TBO): ${inv.countryCode}`);
		console.log(`  tripjackHids (active rows, same as unified search): ${inv.tripjackHids.length}`);
		console.log(`  sample hids: ${inv.tripjackHids.slice(0, 5).join(", ") || "(none)"}`);
	}
	await prisma.$disconnect();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
