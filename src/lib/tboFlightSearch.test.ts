import { describe, expect, it } from "vitest";
import {
	fareQuoteResultIndexes,
	normalizeTboCabinClass,
	pairTboSpecialReturnFlights,
	resolveTboSpecialReturnResultIndex,
	resolveTboSpecialReturnTicketResultIndex,
	tboSeparateReturnResultIndex,
	TBO_CABIN_CLASS,
	validateTboPassengerCounts,
} from "./tboFlightSearch";
import type { FareQuoteResponse } from "@/types/tbo";
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

	it("preserves combined LCC special return index after FareQuote OB-only response", () => {
		const combined = "OB2[TBO]outbound,IB2[TBO]inbound";
		const fareQuoteResponse = {
			Response: {
				Results: { ResultIndex: "OB2[TBO]outbound" },
			},
		} as FareQuoteResponse;

		expect(
			resolveTboSpecialReturnResultIndex(combined, fareQuoteResponse, {
				journeyType: "5",
				isLCC: true,
				fareQuoteRequestIndex: combined,
			}),
		).toBe(combined);
	});

	it("reconstructs combined index from FareQuote OB and paired IB", () => {
		const fareQuoteResponse = {
			Response: {
				Results: { ResultIndex: "OB2[TBO]outbound" },
			},
		} as FareQuoteResponse;

		expect(
			resolveTboSpecialReturnResultIndex("OB2[TBO]outbound", fareQuoteResponse, {
				journeyType: "5",
				isLCC: true,
				outboundResultIndex: "OB2[TBO]outbound",
				inboundResultIndex: "IB2[TBO]inbound",
			}),
		).toBe("OB2[TBO]outbound,IB2[TBO]inbound");
	});

	it("uses FareQuote OB index for LCC special return ticket after combined quote", () => {
		const combined = "OB2[TBO]outbound,IB2[TBO]inbound";
		const fareQuoteResponse = {
			Response: {
				Results: { ResultIndex: "OB2[TBO]quoted" },
			},
		} as FareQuoteResponse;

		expect(
			resolveTboSpecialReturnTicketResultIndex(combined, fareQuoteResponse, {
				journeyType: "5",
				isLCC: true,
			}),
		).toBe("OB2[TBO]quoted");
	});
});
