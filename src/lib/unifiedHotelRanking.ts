export type TripjackRankRow = {
	tjHotelId: string;
	hotelRating: string | null;
	hotelName: string;
};

/**
 * Deterministic local ranking before TripJack listing calls (doc: rank first, top N).
 */
export function rankTripjackHotelsForListing<T extends TripjackRankRow>(
	rows: T[],
	cap: number,
): T[] {
	const sorted = [...rows].sort((a, b) => {
		const ra = parseFloat(String(a.hotelRating ?? "").trim()) || 0;
		const rb = parseFloat(String(b.hotelRating ?? "").trim()) || 0;
		if (rb !== ra) return rb - ra;
		const n = a.hotelName.localeCompare(b.hotelName);
		if (n !== 0) return n;
		return a.tjHotelId.localeCompare(b.tjHotelId);
	});
	return sorted.slice(0, Math.max(0, cap));
}

export function tripjackListingCandidateCap(): number {
	const raw = process.env.TRIPJACK_LISTING_CANDIDATE_CAP;
	const n = raw ? parseInt(raw, 10) : 200;
	return Number.isFinite(n) && n > 0 ? Math.min(n, 2000) : 200;
}
