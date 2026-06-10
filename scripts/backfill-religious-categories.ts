/**
 * Idempotent backfill: copy legacy religious category into religiousCategories.
 * Does NOT clear User.category or Event.category (Release 1 dual-write).
 *
 * Usage: npx tsx scripts/backfill-religious-categories.ts
 */
import { PrismaClient } from "@prisma/client";
import {
	legacyCategoryToReligiousCategories,
	normalizeReligiousCategory,
} from "../src/lib/religious-categories";

const prisma = new PrismaClient();

const USER_TYPES = ["Dharmguru", "kathavachak", "panditji"] as const;
const BAL_VIDHYA_RELIGIOUS = new Set([
	"Sanatan",
	"Jain",
	"Sikh",
	"Buddhism",
]);

async function backfillUsers() {
	let updated = 0;
	for (const userType of USER_TYPES) {
		const users = await prisma.user.findMany({
			where: { userType },
			select: { id: true, category: true, religiousCategories: true },
		});
		for (const user of users) {
			if (user.religiousCategories.length > 0) continue;
			if (!user.category) continue;
			const religiousCategories = legacyCategoryToReligiousCategories(
				user.category
			);
			if (religiousCategories.length === 0) continue;
			await prisma.user.update({
				where: { id: user.id },
				data: { religiousCategories },
			});
			updated++;
		}
	}
	console.log(`Users backfilled: ${updated}`);
}

async function backfillEvents() {
	const events = await prisma.event.findMany({
		select: { id: true, category: true, religiousCategories: true },
	});
	let updated = 0;
	for (const event of events) {
		if (event.religiousCategories.length > 0) continue;
		if (!event.category) continue;
		const religiousCategories = legacyCategoryToReligiousCategories(
			event.category
		);
		if (religiousCategories.length === 0) continue;
		await prisma.event.update({
			where: { id: event.id },
			data: { religiousCategories },
		});
		updated++;
	}
	console.log(`Events backfilled: ${updated}`);
}

async function backfillBalVidhya() {
	const items = await prisma.balVidhya.findMany({
		select: { id: true, category: true, religiousCategories: true },
	});
	let updated = 0;
	for (const item of items) {
		if (item.religiousCategories.length > 0) continue;
		if (!item.category || !BAL_VIDHYA_RELIGIOUS.has(item.category)) continue;
		const normalized = normalizeReligiousCategory(item.category);
		if (!normalized) continue;
		await prisma.balVidhya.update({
			where: { id: item.id },
			data: { religiousCategories: [normalized] },
		});
		updated++;
	}
	console.log(`BalVidhya backfilled: ${updated}`);
}

async function main() {
	await backfillUsers();
	await backfillEvents();
	await backfillBalVidhya();
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
