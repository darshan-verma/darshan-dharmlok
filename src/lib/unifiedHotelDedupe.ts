import type { HotelResult } from "@/types/hotelApi";

export function normalizeHotelDedupeKey(name: string, city: string): string {
	const n = (name || "")
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	const c = (city || "")
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	return `${n}|${c}`;
}

export function minRoomPriceForHotel(hotel: HotelResult): number {
	return hotel.Rooms.reduce(
		(min, room) => Math.min(min, room.TotalFare + room.TotalTax),
		Infinity,
	);
}

/**
 * Merge listings that share normalized name + city; keep cheapest as primary and
 * attach parallelSuppliers for alternate supplier listings (doc §Deduplication MVP).
 */
export function dedupeHotelResultsByNameAndCity(
	hotels: HotelResult[],
): HotelResult[] {
	const byKey = new Map<string, HotelResult[]>();
	for (const h of hotels) {
		const city = h.CityName ?? "";
		const name = h.HotelName ?? "";
		const key = normalizeHotelDedupeKey(name, city);
		if (!byKey.has(key)) byKey.set(key, []);
		byKey.get(key)!.push(h);
	}

	const out: HotelResult[] = [];
	for (const group of byKey.values()) {
		if (group.length === 1) {
			out.push(group[0]);
			continue;
		}
		const sorted = [...group].sort((a, b) => {
			const pa = minRoomPriceForHotel(a);
			const pb = minRoomPriceForHotel(b);
			if (pa !== pb) return pa - pb;
			// Same price: prefer TripJack as the visible card (UI does not surface parallelSuppliers yet).
			const rank = (h: HotelResult) => (h.source === "TRIPJACK" ? 0 : 1);
			return rank(a) - rank(b);
		});
		const primary = sorted[0];
		const others = sorted.slice(1);
		out.push({
			...primary,
			parallelSuppliers: others.map((o) => ({
				source: o.source ?? "TBO",
				hotelCode: String(o.HotelCode),
			})),
		});
	}
	return out;
}
