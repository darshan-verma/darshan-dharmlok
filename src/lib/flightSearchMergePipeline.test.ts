import { describe, expect, it } from "vitest";
import {
	airiqRawHasFlights,
	tboResponseHasFlights,
	tripjackRawHasFlights,
} from "./flightSearchMergePipeline";
import type { FlightSearchResponse } from "@/types/tbo";

describe("flightSearchMergePipeline provider checks", () => {
	it("tboResponseHasFlights requires both legs for normal round trip", () => {
		const partial: FlightSearchResponse = {
			Response: {
				TraceId: "t1",
				Results: [[{ ResultIndex: "o1" } as never], []],
				Origin: "",
				Destination: "",
				FlightCabinClass: 1,
			},
		};
		const full: FlightSearchResponse = {
			Response: {
				TraceId: "t2",
				Results: [[{ ResultIndex: "o1" } as never], [{ ResultIndex: "r1" } as never]],
				Origin: "",
				Destination: "",
				FlightCabinClass: 1,
			},
		};
		expect(tboResponseHasFlights(partial, "2")).toBe(false);
		expect(tboResponseHasFlights(full, "2")).toBe(true);
		expect(tboResponseHasFlights(full, "1")).toBe(true);
	});

	it("tripjackRawHasFlights accepts combo-only round trip", () => {
		expect(
			tripjackRawHasFlights(
				{
					searchResult: {
						tripInfos: {
							ONWARD: [],
							RETURN: [],
							COMBO: [{ sI: [] }],
						},
					},
				},
				"2",
			),
		).toBe(true);
		expect(
			tripjackRawHasFlights(
				{
					searchResult: {
						tripInfos: {
							ONWARD: [{ sI: [] }],
							RETURN: [],
						},
					},
				},
				"2",
			),
		).toBe(false);
	});

	it("airiqRawHasFlights requires both itineraries for round trip", () => {
		expect(
			airiqRawHasFlights(
				{
					Trackid: "a1",
					ItineraryFlightList: [{ Items: [{ FlightDetails: [] }] }],
				},
				"2",
			),
		).toBe(false);
		expect(
			airiqRawHasFlights(
				{
					Trackid: "a2",
					ItineraryFlightList: [
						{ Items: [{ FlightDetails: [] }] },
						{ Items: [{ FlightDetails: [] }] },
					],
				},
				"2",
			),
		).toBe(true);
	});
});
