import { describe, expect, it } from "vitest";
import {
	buildTripjackCabBookingPayload,
	computeCabFareFromBreakup,
	resolveCabLuggageCount,
	resolveCabPaxCount,
} from "@/lib/tripjackCabBookingPayload";
import type {
	TripjackJourneyInfo,
	TripjackQuoteItem,
	TripjackQuotesGroup,
	TripjackRouteDetails,
} from "@/types/tripjack";

const group: TripjackQuotesGroup = {
	vehicleType: "Sedan",
	vehicleCategory: "Standard",
	label: "Standard Sedan",
	paxCapacity: "4",
	luggageCapacity: "2",
	quotes: [],
};

const quote: TripjackQuoteItem = {
	vendorId: 1,
	quotationId: "Q1",
	quoteChildId: "C1",
	fareBreakup: {
		onwardFare: 1463,
		totalFare: 1463,
		onwardTax: 33,
		totalTax: 33,
		tjManagementFee: 0,
	},
	paxCount: 1,
	luggageCount: 2,
};

const journeyInfo: TripjackJourneyInfo = {
	journeyType: "AIRPORT_TRANSFER",
	tripType: "ONEWAY",
	pickupDateTime: "2026-04-25 12:30",
};

const routeDetail: TripjackRouteDetails = {
	isDomestic: true,
	origin: {
		type: "location",
		displayAddress: "IGI Airport",
		lat: "28.55",
		long: "77.08",
		address: { city: "Delhi", country: "India", postalCode: "110037" },
	},
	destination: {
		type: "location",
		displayAddress: "Connaught Place",
		lat: "28.63",
		long: "77.21",
		address: { city: "New Delhi", country: "India", postalCode: "110001" },
	},
};

describe("computeCabFareFromBreakup", () => {
	it("uses onward+backward when present", () => {
		const fare = computeCabFareFromBreakup({
			onwardFare: 1000,
			backwardFare: 500,
			totalFare: 999,
			onwardTax: 50,
			backwardTax: 25,
			totalTax: 99,
		});
		expect(fare.netAmount).toBe(1500);
		expect(fare.taxes).toBe(75);
		expect(fare.grossAmount).toBe(1575);
	});
});

describe("resolveCabPaxCount", () => {
	it("prefers search passengers (UAT TC-AT-01 uses 3)", () => {
		expect(resolveCabPaxCount(3, quote, group)).toBe(3);
	});
});

describe("resolveCabLuggageCount", () => {
	it("falls back to group capacity then passengers", () => {
		const q = { ...quote, luggageCount: undefined };
		expect(resolveCabLuggageCount(3, q, group)).toBe(2);
		const g = { ...group, luggageCapacity: undefined };
		expect(resolveCabLuggageCount(3, q, g)).toBe(3);
	});
});

describe("buildTripjackCabBookingPayload", () => {
	it("matches UAT booking shape with two-decimal pricing", () => {
		const payload = buildTripjackCabBookingPayload({
			journeyInfo,
			routeDetail,
			group,
			quote,
			passengers: 3,
			passengerDetail: {
				firstName: "Aarav",
				lastName: "Sharma",
				email: "cab@dharmlok.com",
				phone: "+919888888888",
			},
			agentEmail: "agent@dharmlok.com",
			agentPhone: "+919888888888",
			agentId: 617306,
		});

		expect(payload.quotationInfo.paxCount).toBe(3);
		expect(payload.pricingInfo.netAmount).toBe("1463.00");
		expect(payload.pricingInfo.tjTaxAmount).toBe("33.00");
		expect(payload.pricingInfo.tjManagementFee).toBe("0.00");
		expect(payload.pricingInfo.grossAmount).toBe("1496.00");
		expect(payload.consent).toBe("yes");
	});
});
