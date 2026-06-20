import { describe, expect, it } from "vitest";
import {
	applyFareClassToFlight,
	extractPriceRbdResultIndex,
	getFlightRbdAvailability,
	isPricedTboResultIndex,
} from "./tboAdvanceSearch";
import type { FlightResult } from "@/types/tbo";

const stubFlight = (resultIndex: string): FlightResult =>
	({
		ResultIndex: resultIndex,
		Segments: [
			[
				{
					Airline: {
						AirlineCode: "BA",
						AirlineName: "British Airways",
						FlightNumber: "142",
						FareClass: "",
						OperatingCarrier: "",
					},
					Availability: [
						{ Class: "Y", Seats: "9" },
						{ Class: "K", Seats: "0" },
					],
				},
			],
		],
	}) as FlightResult;

describe("tboAdvanceSearch", () => {
	it("filters RBD availability with seats", () => {
		const options = getFlightRbdAvailability(stubFlight("OB1"));
		expect(options).toEqual([{ Class: "Y", Seats: "9" }]);
	});

	it("applies fare class to all segments", () => {
		const priced = applyFareClassToFlight(stubFlight("OB1"), "Y");
		expect(priced.Segments[0][0].Airline.FareClass).toBe("Y");
	});

	it("detects priced TBO result index", () => {
		expect(isPricedTboResultIndex("OB1[TBO]+P+abc")).toBe(true);
		expect(isPricedTboResultIndex("OB1[TBO]plain")).toBe(false);
	});

	it("extracts priced index from PriceRBD response", () => {
		const index = extractPriceRbdResultIndex({
			Response: {
				TraceId: "t1",
				Results: [[{ ResultIndex: "OB1[TBO]+P+xyz" } as FlightResult]],
			},
		});
		expect(index).toBe("OB1[TBO]+P+xyz");
	});
});
