import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
	TBO_NON_LCC_DUPLICATE_WINDOW_MS,
	type TboDuplicateBookingCriteria,
	type TboDuplicateBookingHit,
	duplicateBookingExpiresAt,
	fingerprintDuplicateCriteria,
} from "@/lib/tboDuplicateBooking";

export async function findRecentTboDuplicateBooking(
	fingerprint: string,
	now = new Date(),
): Promise<TboDuplicateBookingHit | null> {
	const since = new Date(now.getTime() - TBO_NON_LCC_DUPLICATE_WINDOW_MS);
	const row = await prisma.tboNonLccDuplicateBooking.findFirst({
		where: {
			fingerprint,
			bookedAt: { gte: since },
			expiresAt: { gt: now },
		},
		orderBy: { bookedAt: "desc" },
	});
	if (!row) return null;
	return {
		fingerprint: row.fingerprint,
		pnr: row.pnr,
		bookingId: row.bookingId,
		bookedAt: row.bookedAt,
	};
}

export async function recordTboNonLccDuplicateBooking(params: {
	criteria: TboDuplicateBookingCriteria;
	pnr: string;
	bookingId?: number | null;
	bookedAt?: Date;
}): Promise<void> {
	const fingerprint = fingerprintDuplicateCriteria(params.criteria);
	const bookedAt = params.bookedAt ?? new Date();
	const expiresAt = duplicateBookingExpiresAt(bookedAt);
	const pnr = params.pnr.trim().toUpperCase();
	if (!pnr) return;

	const criteria = params.criteria as unknown as Prisma.InputJsonValue;

	await prisma.tboNonLccDuplicateBooking.upsert({
		where: { fingerprint },
		create: {
			fingerprint,
			pnr,
			bookingId: params.bookingId ?? null,
			bookedAt,
			expiresAt,
			criteria,
		},
		update: {
			pnr,
			bookingId: params.bookingId ?? null,
			bookedAt,
			expiresAt,
			criteria,
		},
	});
}
