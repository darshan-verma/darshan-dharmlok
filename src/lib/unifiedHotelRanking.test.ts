import { describe, expect, it } from "vitest";
import { rankTripjackHotelsForListing } from "./unifiedHotelRanking";

describe("rankTripjackHotelsForListing", () => {
	it("sorts by rating desc then name then id", () => {
		const rows = [
			{ tjHotelId: "b", hotelRating: "3", hotelName: "Beta" },
			{ tjHotelId: "a", hotelRating: "5", hotelName: "Alpha" },
			{ tjHotelId: "c", hotelRating: "5", hotelName: "Alpha" },
		];
		const out = rankTripjackHotelsForListing(rows, 10);
		expect(out[0].tjHotelId).toBe("a");
		expect(out[1].tjHotelId).toBe("c");
		expect(out[2].tjHotelId).toBe("b");
	});

	it("respects cap", () => {
		const rows = Array.from({ length: 50 }, (_, i) => ({
			tjHotelId: String(i),
			hotelRating: "1",
			hotelName: `H${i}`,
		}));
		expect(rankTripjackHotelsForListing(rows, 10)).toHaveLength(10);
	});
});
