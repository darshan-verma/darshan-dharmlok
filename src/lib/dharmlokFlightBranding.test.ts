import { describe, expect, it } from "vitest";
import {
	DHARMLOK_FLIGHT_BRAND,
	sanitizeFlightClientResponse,
	sanitizeVendorDisplayText,
	restoreVendorRoutingString,
	resolveFlightApiSource,
} from "@/lib/dharmlokFlightBranding";

describe("sanitizeVendorDisplayText", () => {
	it("replaces vendor names in fare-rule copy", () => {
		expect(sanitizeVendorDisplayText("TBO pricing applies. AIRiQ fare rules.")).toBe(
			`${DHARMLOK_FLIGHT_BRAND} pricing applies. ${DHARMLOK_FLIGHT_BRAND} fare rules.`,
		);
		expect(sanitizeVendorDisplayText("TripJack fee: 200")).toBe(
			`${DHARMLOK_FLIGHT_BRAND} fee: 200`,
		);
	});
});

describe("sanitizeFlightClientResponse", () => {
	it("preserves ApiSource for routing but scrubs display strings", () => {
		const input = {
			Response: {
				Results: {
					FareRules: [
						{
							FareRuleDetail: "<p>TBO cancellation policy</p>",
							ApiSource: "TBO",
						},
					],
				},
			},
			error: "TripJack API request failed",
		};

		const out = sanitizeFlightClientResponse(input);
		expect(out.Response.Results.FareRules[0].FareRuleDetail).toContain(
			DHARMLOK_FLIGHT_BRAND,
		);
		expect(out.error).toContain(DHARMLOK_FLIGHT_BRAND);
		expect(out.error).not.toMatch(/tripjack/i);
		expect(out.Response.Results.FareRules[0].ApiSource).toBe("TBO");
	});

	it("preserves ResultIndex and ApiSource routing tokens", () => {
		const out = sanitizeFlightClientResponse({
			ApiSource: "TBO",
			ResultIndex: "OB16[TBO]abc123",
			ReturnResultIndex: "IB16[TBO]xyz",
		});

		expect(out.ApiSource).toBe("TBO");
		expect(out.ResultIndex).toBe("OB16[TBO]abc123");
		expect(out.ReturnResultIndex).toBe("IB16[TBO]xyz");
	});

	it("restores branded TBO routing tokens from stale URLs", () => {
		expect(restoreVendorRoutingString("OB16[Dharmlok]abc")).toBe("OB16[TBO]abc");
		expect(resolveFlightApiSource("Dharmlok", "OB16[Dharmlok]abc")).toBe("TBO");
	});

	it("strips vendor-specific search metadata", () => {
		const out = sanitizeFlightClientResponse({
			success: true,
			sources: { tbo: true, airiq: false, tripjack: true },
			providerStates: { tbo: "done", airiq: "loading", tripjack: "done" },
			stats: {
				tboFlightCount: 10,
				airiqFlightCount: 5,
				tripjackFlightCount: 3,
				totalFlightCount: 18,
			},
		});

		expect(out.sources).toBeUndefined();
		expect(out.providerStates).toBeUndefined();
		expect(out.stats?.flightCount).toBe(18);
		expect(out.stats?.tboFlightCount).toBeUndefined();
	});
});
