import { describe, expect, it } from "vitest";
import {
	buildItineraryFlightsInfoFromPricing,
	buildPricingItineraryInfo,
	detectPricingReturnMode,
	splitCombinedReturnPriceInfos,
	sumFareRowsFromSearchFares,
	sumBookPaymentFromItinerary,
} from "./airiqBookPayload";
import type { AiriqPricingResponse } from "@/types/airiq";

describe("sumFareRowsFromSearchFares", () => {
	it("multiplies ADT/CHD/INF rows by passenger counts", () => {
		const result = sumFareRowsFromSearchFares(
			[
				{
					Faredescription: [
						{ Paxtype: "ADT", BaseAmount: "3000", GrossAmount: "3500" },
						{ Paxtype: "CHD", BaseAmount: "2500", GrossAmount: "3000" },
						{ Paxtype: "INF", BaseAmount: "500", GrossAmount: "800" },
					],
				},
			],
			{ adults: 1, children: 1, infants: 1 }
		);
		expect(result.baseAmount).toBe(6000);
		expect(result.grossAmount).toBe(7300);
	});
});

describe("splitCombinedReturnPriceInfos", () => {
	it("splits single pricing leg with ItinRef 0/1 into two book legs", () => {
		const pricing = {
			ResponseStatus: { ResultCode: "1", Error: "", SequenceID: "" },
			PriceItenaryInfo: [
				{
					Trackid: "T1",
					AvailabilityResponse: [
						{
							Token: "tok",
							Flights: [
								{
									FlightID: "1",
									FlightNumber: "6E 100",
									Origin: "DEL",
									Destination: "BOM",
									DepartureDateTime: "01 Jan 2026 10:00",
									ArrivalDateTime: "01 Jan 2026 12:00",
									ItinRef: "0",
								},
								{
									FlightID: "2",
									FlightNumber: "6E 200",
									Origin: "BOM",
									Destination: "DEL",
									DepartureDateTime: "08 Jan 2026 10:00",
									ArrivalDateTime: "08 Jan 2026 12:00",
									ItinRef: "1",
								},
							],
						},
					],
				},
			],
		};
		const split = splitCombinedReturnPriceInfos(
			pricing.PriceItenaryInfo as NonNullable<
				AiriqPricingResponse["PriceItenaryInfo"]
			>
		);
		expect(split).toHaveLength(2);
		expect(split[0].AvailabilityResponse?.[0].Flights).toHaveLength(1);
		expect(split[1].AvailabilityResponse?.[0].Flights).toHaveLength(1);
	});
});

describe("buildItineraryFlightsInfoFromPricing", () => {
	it("assigns zero payment to IB leg after domestic combined split", () => {
		const pricing = {
			ResponseStatus: { ResultCode: "1", Error: "", SequenceID: "" },
			PriceItenaryInfo: [
				{
					Trackid: "T1",
					GrossAmount: 7000,
					AvailabilityResponse: [
						{
							Token: "tok",
							Flights: [
								{
									FlightID: "1",
									FlightNumber: "6E 100",
									Origin: "DEL",
									Destination: "BOM",
									DepartureDateTime: "01 Jan 2026 10:00",
									ArrivalDateTime: "01 Jan 2026 12:00",
									ItinRef: "0",
								},
								{
									FlightID: "2",
									FlightNumber: "6E 200",
									Origin: "BOM",
									Destination: "DEL",
									DepartureDateTime: "08 Jan 2026 10:00",
									ArrivalDateTime: "08 Jan 2026 12:00",
									ItinRef: "1",
								},
							],
						},
					],
				},
			],
		};

		const legs = buildItineraryFlightsInfoFromPricing(pricing as AiriqPricingResponse, undefined, {
			tripType: "R",
			returnMode: "combined",
			isInternational: false,
		});

		expect(legs).toHaveLength(2);
		expect(legs[0].PaymentInfo?.[0].TotalAmount).toBe("7000");
		expect(legs[1].PaymentInfo?.[0].TotalAmount).toBe("0");
	});
});

describe("sumBookPaymentFromItinerary", () => {
	it("sums payment across all legs", () => {
		const total = sumBookPaymentFromItinerary([
			{ PaymentInfo: [{ TotalAmount: "3500" }] },
			{ PaymentInfo: [{ TotalAmount: "2800" }] },
		] as never);
		expect(total).toBe("6300");
	});
});

describe("detectPricingReturnMode", () => {
	it("detects combined RT from ItinRef groups", () => {
		expect(
			detectPricingReturnMode("R", false, [
				{ ItinRef: "0" },
				{ ItinRef: "1" },
			])
		).toBe("combined");
		expect(detectPricingReturnMode("R", true, [])).toBe("paired");
	});
});

describe("buildPricingItineraryInfo special return", () => {
	it("builds paired special return as single combined itinerary", () => {
		const itins = buildPricingItineraryInfo(
			{
				onward: {
					flightDetails: [
						{
							FlightID: "1",
							FlightNumber: "6E 1",
							Origin: "DEL",
							Destination: "BOM",
							DepartureDateTime: "d",
							ArrivalDateTime: "a",
						},
					],
					fares: [
						{
							Faredescription: [
								{ Paxtype: "ADT", BaseAmount: "3000", GrossAmount: "3500" },
							],
						},
					],
				},
				return: {
					flightDetails: [
						{
							FlightID: "2",
							FlightNumber: "6E 2",
							Origin: "BOM",
							Destination: "DEL",
							DepartureDateTime: "d",
							ArrivalDateTime: "a",
						},
					],
					fares: [
						{
							Faredescription: [
								{ Paxtype: "ADT", BaseAmount: "2800", GrossAmount: "3200" },
							],
						},
					],
				},
			},
			{ adults: 1, children: 0, infants: 0 },
			{ tripType: "Y", returnMode: "paired" }
		);
		expect(itins).toHaveLength(1);
		expect(itins[0].FlightDetails).toHaveLength(2);
		expect(itins[0].GrossAmount).toBe("6700");
	});
});

describe("buildPricingItineraryInfo", () => {
	it("builds paired RT with separate itineraries", () => {
		const itins = buildPricingItineraryInfo(
			{
				onward: {
					flightDetails: [
						{
							FlightID: "1",
							FlightNumber: "6E 1",
							Origin: "DEL",
							Destination: "BOM",
							DepartureDateTime: "d",
							ArrivalDateTime: "a",
						},
					],
					fares: [
						{
							Faredescription: [
								{ Paxtype: "ADT", BaseAmount: "3000", GrossAmount: "3500" },
							],
						},
					],
				},
				return: {
					flightDetails: [
						{
							FlightID: "2",
							FlightNumber: "6E 2",
							Origin: "BOM",
							Destination: "DEL",
							DepartureDateTime: "d",
							ArrivalDateTime: "a",
						},
					],
					fares: [
						{
							Faredescription: [
								{ Paxtype: "ADT", BaseAmount: "2800", GrossAmount: "3200" },
							],
						},
					],
				},
			},
			{ adults: 1, children: 0, infants: 0 },
			{ tripType: "R", returnMode: "paired" }
		);
		expect(itins).toHaveLength(2);
		expect(itins[0].GrossAmount).toBe("3500");
		expect(itins[1].GrossAmount).toBe("3200");
	});
});
