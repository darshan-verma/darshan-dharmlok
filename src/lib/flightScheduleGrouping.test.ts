import { describe, expect, it } from "vitest";
import {
	getFlightScheduleKey,
	groupFlightsBySchedule,
	shouldGroupFlightResult,
} from "./flightScheduleGrouping";
import type { FlightResult } from "@/types/tbo";

function stubLegFlight(
	resultIndex: string,
	opts: {
		depTime: string;
		arrTime: string;
		origin?: string;
		destination?: string;
		price?: number;
		flightNumber?: string;
	},
): FlightResult {
	return {
		ResultIndex: resultIndex,
		AirlineCode: "SG",
		Fare: {
			OfferedFare: opts.price ?? 5000,
			PublishedFare: opts.price ?? 5000,
			Currency: "INR",
		} as FlightResult["Fare"],
		FareBreakdown: [],
		Segments: [
			[
				{
					Airline: {
						AirlineCode: "SG",
						AirlineName: "SpiceJet",
						FlightNumber: opts.flightNumber ?? "9450",
						FareClass: "X",
					},
					Origin: {
						Airport: {
							AirportCode: opts.origin ?? "BOM",
							AirportName: "Mumbai",
							Terminal: "1",
							CityCode: "BOM",
							CityName: "Mumbai",
							CountryCode: "IN",
							CountryName: "India",
						},
						DepTime: opts.depTime,
					},
					Destination: {
						Airport: {
							AirportCode: opts.destination ?? "DEL",
							AirportName: "Delhi",
							Terminal: "1",
							CityCode: "DEL",
							CityName: "Delhi",
							CountryCode: "IN",
							CountryName: "India",
						},
						ArrTime: opts.arrTime,
					},
					Duration: 150,
					GroundTime: 0,
					Mile: 0,
					StopOver: false,
					FlightStatus: "",
					StopPoint: "",
					StopPointArrivalTime: "",
					StopPointDepartureTime: "",
					Craft: "73J",
					Remark: null,
					IsETicketEligible: true,
					FlightInfoIndex: "",
					AirlineRemark: "",
				},
			],
		],
	} as unknown as FlightResult;
}

describe("flightScheduleGrouping", () => {
	it("groups flights with identical schedule", () => {
		const flights = [
			stubLegFlight("a", {
				depTime: "2026-06-26T22:30:00",
				arrTime: "2026-06-27T01:00:00",
				price: 7546,
				flightNumber: "9450",
			}),
			stubLegFlight("b", {
				depTime: "2026-06-26T22:30:00",
				arrTime: "2026-06-27T01:00:00",
				price: 7733,
				flightNumber: "9451",
			}),
			stubLegFlight("c", {
				depTime: "2026-06-26T06:00:00",
				arrTime: "2026-06-26T08:30:00",
				price: 6000,
			}),
		];

		const groups = groupFlightsBySchedule(flights);
		expect(groups).toHaveLength(2);
		expect(groups[0].flights).toHaveLength(1);
		expect(groups[1].flights).toHaveLength(2);
		expect(groups[1].representative.ResultIndex).toBe("a");
	});

	it("does not group round-trip paired results", () => {
		const paired = {
			...stubLegFlight("rt", {
				depTime: "2026-06-26T22:30:00",
				arrTime: "2026-06-27T01:00:00",
			}),
			Segments: [
				stubLegFlight("rt", {
					depTime: "2026-06-26T22:30:00",
					arrTime: "2026-06-27T01:00:00",
				}).Segments[0],
				stubLegFlight("rt", {
					depTime: "2026-07-05T10:00:00",
					arrTime: "2026-07-05T12:30:00",
					origin: "DEL",
					destination: "BOM",
				}).Segments[0],
			],
		} as FlightResult;

		expect(shouldGroupFlightResult(paired)).toBe(false);
	});

	it("builds stable schedule keys", () => {
		const f1 = stubLegFlight("x", {
			depTime: "2026-06-26T01:00:00",
			arrTime: "2026-06-26T02:30:00",
		});
		const f2 = stubLegFlight("y", {
			depTime: "2026-06-26T01:00:00.000",
			arrTime: "2026-06-26T02:30:00.000",
		});
		expect(getFlightScheduleKey(f1)).toBe(getFlightScheduleKey(f2));
	});
});
