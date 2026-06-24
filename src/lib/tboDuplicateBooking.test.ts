import { describe, expect, it } from "vitest";
import {
	buildDuplicateCriteriaFromFlight,
	fingerprintDuplicateCriteria,
	formatTboDuplicateBookingError,
	isTboDuplicateBookingError,
	parseDuplicateBookingPnrFromError,
} from "./tboDuplicateBooking";
import type { FlightResult } from "@/types/tbo";

describe("tboDuplicateBooking", () => {
	const flight = {
		Segments: [
			[
				{
					Airline: { AirlineCode: "AI", FlightNumber: "332" },
					Origin: {
						Airport: { AirportCode: "DEL" },
						DepTime: "2023-01-22T06:00:00",
					},
					Destination: {
						Airport: { AirportCode: "BKK" },
						ArrTime: "2023-01-22T12:00:00",
					},
				},
			],
		],
	} as unknown as FlightResult;

	it("builds criteria from sector, date, airline, flight no, and passengers", () => {
		const criteria = buildDuplicateCriteriaFromFlight(flight, [
			{ Title: "Mr", FirstName: "Raj", LastName: "Kumar" },
		]);
		expect(criteria).toEqual({
			legs: [
				{
					origin: "DEL",
					destination: "BKK",
					departureDate: "2023-01-22",
					airlineCode: "AI",
					flightNumber: "332",
				},
			],
			passengers: [{ title: "MR", firstName: "RAJ", lastName: "KUMAR" }],
		});
	});

	it("uses stable fingerprint for same criteria", () => {
		const criteria = buildDuplicateCriteriaFromFlight(flight, [
			{ Title: "Mr", FirstName: "Raj", LastName: "Kumar" },
		]);
		expect(criteria).not.toBeNull();
		const a = fingerprintDuplicateCriteria(criteria!);
		const b = fingerprintDuplicateCriteria(criteria!);
		expect(a).toBe(b);
	});

	it("detects TBO duplicate booking error text", () => {
		const msg =
			"Booking is already done for the same criteria for PNR ABCDE";
		expect(isTboDuplicateBookingError(msg)).toBe(true);
		expect(parseDuplicateBookingPnrFromError(msg)).toBe("ABCDE");
		expect(formatTboDuplicateBookingError("abcde")).toBe(
			"Booking is already done for the same criteria for PNR ABCDE",
		);
	});
});
