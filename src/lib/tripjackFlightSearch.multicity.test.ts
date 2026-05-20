import { describe, it, expect } from "vitest";
import {
	convertTripjackSearchToTboFormat,
	groupOnwardTripInfosByRoutes,
} from "./tripjackFlightSearch";
import type { TripjackAirSearchResponse, TripjackTripInfo } from "@/types/tripjackFlight";

function trip(from: string, to: string, priceId: string): TripjackTripInfo {
	return {
		sI: [
			{
				id: "s1",
				da: { code: from },
				aa: { code: to },
				dt: "2026-08-01T10:00",
				at: "2026-08-01T12:00",
				fD: { aI: { code: "6E", name: "IndiGo", isLcc: true } },
			},
		],
		totalPriceList: [
			{
				id: priceId,
				fd: {
					ADULT: {
						fC: { BF: 3000, TAF: 500, TF: 3500, NF: 3400 },
						rT: 1,
					},
				},
			},
		],
	};
}

describe("TripJack multicity search conversion", () => {
	it("puts COMBO results in Results[0] for journey type 3", () => {
		const raw: TripjackAirSearchResponse = {
			searchResult: {
				tripInfos: {
					COMBO: [trip("DEL", "BOM", "combo-1")],
					ONWARD: [],
				},
			},
		};
		const res = convertTripjackSearchToTboFormat(raw, "3", "trace-1", {
			adults: 1,
			children: 0,
			infants: 0,
		});
		expect(res.Response.Results).toHaveLength(1);
		expect(res.Response.Results[0][0]._tripjackMulticityMode).toBe("COMBO");
	});

	it("groups domestic ONWARD trips per route into Results[n]", () => {
		const raw: TripjackAirSearchResponse = {
			searchResult: {
				tripInfos: {
					ONWARD: [
						trip("DEL", "BOM", "leg0-a"),
						trip("DEL", "BOM", "leg0-b"),
						trip("BOM", "BLR", "leg1-a"),
					],
				},
			},
		};
		const routes = [
			{ from: "DEL", to: "BOM" },
			{ from: "BOM", to: "BLR" },
		];
		const grouped = groupOnwardTripInfosByRoutes(raw.searchResult!.tripInfos!.ONWARD!, routes);
		expect(grouped[0]).toHaveLength(2);
		expect(grouped[1]).toHaveLength(1);

		const res = convertTripjackSearchToTboFormat(
			raw,
			"3",
			"trace-2",
			{ adults: 1, children: 0, infants: 0 },
			routes,
		);
		expect(res.Response.Results).toHaveLength(2);
		expect(res.Response.Results[0][0]._tripjackMulticityMode).toBe("DOMESTIC_LEGS");
		expect(res.Response.Results[0][0]._tripjackLegIndex).toBe(0);
		expect(res.Response.Results[1][0]._tripjackLegIndex).toBe(1);
	});
});
