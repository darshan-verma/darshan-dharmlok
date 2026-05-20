import { describe, expect, it } from "vitest";
import {
	getAirport,
	getAirline,
	searchAirports,
	validateAirportCode,
} from "./reference-data";

describe("reference-data", () => {
	it("resolves known airport and airline codes", () => {
		expect(getAirport("DEL")?.city).toBe("Delhi");
		expect(searchAirports("mum", 3).some((a) => a.code === "BOM")).toBe(true);
		expect(getAirline("6E")?.name).toMatch(/IndiGo/i);
		expect(validateAirportCode("XXX")).toBe(false);
	});
});
