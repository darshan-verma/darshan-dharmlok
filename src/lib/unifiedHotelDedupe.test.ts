import { describe, expect, it } from "vitest";
import type { HotelResult } from "@/types/hotelApi";
import {
	dedupeHotelResultsByNameAndCity,
	normalizeHotelDedupeKey,
} from "./unifiedHotelDedupe";

function room(fare: number, tax = 0): HotelResult["Rooms"][0] {
	return {
		Name: ["Std"],
		BookingCode: "x",
		Inclusion: "",
		DayRates: [],
		TotalFare: fare,
		TotalTax: tax,
		RoomID: ["1"],
		RoomPromotion: [],
		CancelPolicies: [],
		MealType: "Room_Only",
		IsRefundable: true,
		Supplements: [],
		WithTransfers: false,
	};
}

function hotel(
	partial: Partial<HotelResult> & Pick<HotelResult, "HotelCode">,
): HotelResult {
	const { HotelCode, ...rest } = partial;
	return {
		HotelCode,
		Currency: "INR",
		Rooms: partial.Rooms ?? [room(100)],
		...rest,
	};
}

describe("normalizeHotelDedupeKey", () => {
	it("normalizes punctuation and case", () => {
		expect(normalizeHotelDedupeKey("Pride Plaza!!!", "New Delhi")).toBe(
			"pride plaza|new delhi",
		);
	});
});

describe("dedupeHotelResultsByNameAndCity", () => {
	it("keeps cheaper listing as primary and records parallel suppliers", () => {
		const tbo = hotel({
			HotelCode: "T1",
			source: "TBO",
			HotelName: "Same Hotel",
			CityName: "Delhi",
			Rooms: [room(5000)],
		});
		const tj = hotel({
			HotelCode: "J1",
			source: "TRIPJACK",
			HotelName: "Same Hotel",
			CityName: "Delhi",
			Rooms: [room(4000)],
		});
		const out = dedupeHotelResultsByNameAndCity([tbo, tj]);
		expect(out).toHaveLength(1);
		expect(out[0].HotelCode).toBe("J1");
		expect(out[0].parallelSuppliers).toEqual([
			{ source: "TBO", hotelCode: "T1" },
		]);
	});

	it("same lowest price: prefers TripJack as primary for visible listing", () => {
		const tbo = hotel({
			HotelCode: "T1",
			source: "TBO",
			HotelName: "Same Hotel",
			CityName: "Delhi",
			Rooms: [room(5000)],
		});
		const tj = hotel({
			HotelCode: "J1",
			source: "TRIPJACK",
			HotelName: "Same Hotel",
			CityName: "Delhi",
			Rooms: [room(5000)],
		});
		const out = dedupeHotelResultsByNameAndCity([tbo, tj]);
		expect(out).toHaveLength(1);
		expect(out[0].HotelCode).toBe("J1");
		expect(out[0].parallelSuppliers?.[0]?.hotelCode).toBe("T1");
	});
});
