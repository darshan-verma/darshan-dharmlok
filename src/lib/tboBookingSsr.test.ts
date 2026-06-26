import { describe, expect, it } from "vitest";
import {
	isTboInternationalFlight,
	resolveSsrForPassenger,
	validateMandatorySsrForPassenger,
} from "./tboBookingSsr";
import type { FlightResult } from "@/types/tbo";

describe("tboBookingSsr", () => {
	it("resolves SSR by passenger-segment key", () => {
		const record = {
			"0-0": { Code: "BAG1", Price: 500 },
			"1-0": null,
		};
		expect(resolveSsrForPassenger(record, 0)?.Code).toBe("BAG1");
		expect(resolveSsrForPassenger(record, 1)).toBeNull();
	});

	it("detects international flights", () => {
		const intl = {
			Segments: [
				[
					{
						Origin: { Airport: { CountryCode: "IN" } },
						Destination: { Airport: { CountryCode: "AE" } },
					},
				],
			],
		} as FlightResult;
		expect(isTboInternationalFlight(intl)).toBe(true);
	});

	it("flags missing mandatory baggage on intl LCC", () => {
		const err = validateMandatorySsrForPassenger({
			paxType: 1,
			passengerIndex: 0,
			isMealMandatory: false,
			isSeatMandatory: false,
			requireBaggage: true,
			hasMeal: true,
			hasSeat: true,
			hasBaggage: false,
			freeMealAvailable: false,
			freeSeatAvailable: false,
			freeBaggageAvailable: false,
		});
		expect(err).toMatch(/baggage/i);
	});
});
