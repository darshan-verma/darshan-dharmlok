import { describe, it, expect } from "vitest";
import type { FlightResult } from "@/types/tbo";
import { resolveMulticitySearchView } from "./tripjackMulticityUi";

function stub(mode: "COMBO" | "DOMESTIC_LEGS", legIndex: number): FlightResult {
	return {
		ResultIndex: `${mode}-${legIndex}`,
		Source: 3,
		IsLCC: true,
		IsRefundable: true,
		AirlineCode: "6E",
		ValidatingAirlineCode: "6E",
		AirlineRemark: "",
		FareBreakdown: [],
		Segments: [[]],
		_tripjackMulticityMode: mode,
		_tripjackLegIndex: legIndex,
	};
}

describe("resolveMulticitySearchView", () => {
	it("returns domestic per-leg view when multiple DOMESTIC_LEGS buckets exist", () => {
		const view = resolveMulticitySearchView(
			[[stub("DOMESTIC_LEGS", 0)], [stub("DOMESTIC_LEGS", 1)]],
			"3",
		);
		expect(view.domesticLegs).toHaveLength(2);
		expect(view.displayFlights).toHaveLength(1);
	});

	it("returns COMBO flights from first combo bucket", () => {
		const view = resolveMulticitySearchView([[stub("COMBO", 0)]], "3");
		expect(view.domesticLegs).toBeNull();
		expect(view.displayFlights[0]._tripjackMulticityMode).toBe("COMBO");
	});
});
