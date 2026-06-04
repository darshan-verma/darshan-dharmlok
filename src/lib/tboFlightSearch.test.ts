import { describe, expect, it } from "vitest";
import {
	fareQuoteResultIndexes,
	normalizeTboCabinClass,
	pairTboSpecialReturnFlights,
	tboSeparateReturnResultIndex,
	TBO_CABIN_CLASS,
	validateTboPassengerCounts,
} from "./tboFlightSearch";
import type { FlightResult } from "@/types/tbo";

describe("tboFlightSearch", () => {
	it("maps UI Economy to TBO cabin class 2", () => {
		expect(normalizeTboCabinClass("Economy")).toBe(TBO_CABIN_CLASS.ECONOMY);
	});

	it("rejects more than 9 passengers", () => {
		expect(validateTboPassengerCounts(5, 3, 2)).toMatch(/Maximum 9/);
	});

	it("pairs special return OB+IB on same airline", () => {
		const ob = {
			ResultIndex: "OB1",
			IsLCC: true,
			Segments: [[{ TripIndicator: 1, Airline: { AirlineCode: "6E" } }]],
		} as unknown as FlightResult;
		const ib = {
			ResultIndex: "IB1",
			IsLCC: true,
			Segments: [[{ TripIndicator: 2, Airline: { AirlineCode: "6E" } }]],
		} as unknown as FlightResult;
		const paired = pairTboSpecialReturnFlights([ob, ib]);
		expect(paired[0].ResultIndex).toBe("OB1,IB1");
	});

	it("uses single FareQuote for special return", () => {
		expect(
			fareQuoteResultIndexes("OB1,IB1", "IB1", "5"),
		).toEqual({ primary: "OB1,IB1" });
		expect(
			fareQuoteResultIndexes("OB1", "IB1", "2"),
		).toEqual({ primary: "OB1", secondary: "IB1" });
	});

	it("omits separate ReturnResultIndex for paired special return", () => {
		expect(tboSeparateReturnResultIndex("OB1,IB1", "IB1", "5")).toBeUndefined();
		expect(tboSeparateReturnResultIndex("OB1", "IB1", "2")).toBe("IB1");
	});
});
