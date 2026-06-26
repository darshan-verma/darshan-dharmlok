import { describe, it, expect, vi } from "vitest";
import type { FlightResult } from "@/types/tbo";
import {
	getNetPayable,
	takeTopByNetPayable,
	mergeAndCapRoundTrip,
	pairRoundTripLegs,
} from "./flightSearchMerge";

vi.mock("@/lib/tripjackFlightSearch", () => ({
	tripjackRoundTripFaresPairable: () => true,
}));

function minimalLeg(): FlightResult["Segments"][0] {
	return [
		{
			Airline: {
				AirlineCode: "AI",
				AirlineName: "Air India",
				FlightNumber: "101",
				FareClass: "E",
			},
			Origin: {
				Airport: {
					AirportCode: "DEL",
					AirportName: "Delhi",
					Terminal: "3",
					CityCode: "DEL",
					CityName: "Delhi",
					CountryCode: "IN",
					CountryName: "India",
					DepTime: "2026-05-01T10:00:00",
				},
				DepTime: "2026-05-01T10:00:00",
			},
			Destination: {
				Airport: {
					AirportCode: "BLR",
					AirportName: "Bengaluru",
					Terminal: "1",
					CityCode: "BLR",
					CityName: "Bengaluru",
					CountryCode: "IN",
					CountryName: "India",
					ArrTime: "2026-05-01T13:00:00",
				},
				ArrTime: "2026-05-01T13:00:00",
			},
			Duration: 180,
			GroundTime: 0,
			Mile: 0,
			StopOver: false,
			FlightStatus: "",
			StopPoint: "",
			StopPointArrivalTime: "",
			StopPointDepartureTime: "",
			Craft: "",
			Remark: null,
			IsETicketEligible: true,
			FlightInfoIndex: "",
			AirlineRemark: "",
		},
	];
}

function stubFlight(
	partial: Pick<FlightResult, "ResultIndex" | "ApiSource"> & {
		net: number;
	},
): FlightResult {
	const n = partial.net;
	return {
		ResultIndex: partial.ResultIndex,
		Source: 1,
		IsLCC: true,
		IsRefundable: true,
		AirlineCode: "AI",
		ValidatingAirlineCode: "AI",
		AirlineRemark: "",
		ApiSource: partial.ApiSource,
		Fare: {
			Currency: "INR",
			BaseFare: n,
			Tax: 0,
			TaxBreakup: [],
			YQTax: 0,
			AdditionalTxnFeeOfrd: 0,
			AdditionalTxnFeePub: 0,
			PGCharge: 0,
			OtherCharges: 0,
			ChargeBU: [],
			Discount: 0,
			PublishedFare: n,
			CommissionEarned: 0,
			PLBEarned: 0,
			IncentiveEarned: 0,
			OfferedFare: n,
			TdsOnCommission: 0,
			TdsOnPLB: 0,
			TdsOnIncentive: 0,
			ServiceFee: 0,
			TotalBaggageCharges: 0,
			TotalMealCharges: 0,
			TotalSeatCharges: 0,
			TotalSpecialServiceCharges: 0,
			NetPayable: n,
		},
		FareBreakdown: [],
		Segments: [minimalLeg()],
	} as FlightResult;
}

describe("flightSearchMerge", () => {
	it("getNetPayable prefers NetPayable then OfferedFare", () => {
		const f = stubFlight({ ResultIndex: "a", ApiSource: "TBO", net: 5000 });
		expect(getNetPayable(f)).toBe(5000);
		const g = { ...f, Fare: { ...f.Fare!, NetPayable: undefined } };
		expect(getNetPayable(g)).toBe(5000);
	});

	it("takeTopByNetPayable keeps cheapest k", () => {
		const flights = [
			stubFlight({ ResultIndex: "1", ApiSource: "TBO", net: 300 }),
			stubFlight({ ResultIndex: "2", ApiSource: "TBO", net: 100 }),
			stubFlight({ ResultIndex: "3", ApiSource: "TBO", net: 200 }),
		];
		const top = takeTopByNetPayable(flights, 2);
		expect(top.map((x) => x.ResultIndex)).toEqual(["2", "3"]);
	});

	it("pairRoundTripLegs combines fare and ReturnResultIndex", () => {
		const o = stubFlight({ ResultIndex: "o1", ApiSource: "TBO", net: 1000 });
		const r = stubFlight({ ResultIndex: "r1", ApiSource: "TBO", net: 800 });
		const paired = pairRoundTripLegs([o], [r]);
		expect(paired).toHaveLength(1);
		expect(paired[0].ReturnResultIndex).toBe("r1");
		expect(paired[0].Fare?.OfferedFare).toBe(1800);
		expect(paired[0].Segments).toHaveLength(2);
	});

	it("mergeAndCapRoundTrip returns bundled fares when only one leg is present", () => {
		const bundled = stubFlight({ ResultIndex: "combo", ApiSource: "TRIPJACK", net: 3000 });
		bundled.Segments = [minimalLeg(), minimalLeg()];
		const merged = mergeAndCapRoundTrip([[bundled], []]);
		expect(merged).toHaveLength(1);
		expect(merged[0].ResultIndex).toBe("combo");
	});

	it("mergeAndCapRoundTrip pairs per source and caps total", () => {
		const outTbo = stubFlight({ ResultIndex: "to", ApiSource: "TBO", net: 100 });
		const retTbo = stubFlight({ ResultIndex: "tr", ApiSource: "TBO", net: 50 });
		const outAi = stubFlight({ ResultIndex: "ao", ApiSource: "AIRiQ", net: 200 });
		const retAi = stubFlight({ ResultIndex: "ar", ApiSource: "AIRiQ", net: 50 });
		const merged = mergeAndCapRoundTrip(
			[
				[outTbo, outAi],
				[retTbo, retAi],
			],
			50,
			100,
		);
		expect(merged.length).toBeLessThanOrEqual(100);
		expect(merged.length).toBe(2);
		const prices = merged.map((m) => m.Fare?.OfferedFare ?? 0).sort((a, b) => a - b);
		expect(prices[0]).toBe(150);
		expect(prices[1]).toBe(250);
	});
});
