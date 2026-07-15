import { describe, expect, it } from "vitest";
import {
	tripjackHotelComplianceFlags,
	tripjackHotelTravellerDocs,
} from "@/lib/tripjackHotelCompliance";

describe("tripjackHotelComplianceFlags", () => {
	it("reads isPanRequired / isPassportRequired aliases", () => {
		expect(
			tripjackHotelComplianceFlags({
				isPanRequired: true,
				isPassportRequired: false,
				gstType: "NA",
			}),
		).toEqual({
			panRequired: true,
			passportRequired: false,
			gstType: "NA",
		});
	});

	it("reads panRequired / passportRequired", () => {
		expect(
			tripjackHotelComplianceFlags({
				panRequired: false,
				passportRequired: true,
			}),
		).toEqual({
			panRequired: false,
			passportRequired: true,
			gstType: "NA",
		});
	});
});

describe("tripjackHotelTravellerDocs", () => {
	it("sends pan when pan required, not passport", () => {
		const out = tripjackHotelTravellerDocs(
			{
				ti: "Mr",
				pt: "ADULT",
				fN: "Test",
				lN: "User",
				pan: "ABCDE1234F",
				pNum: "Z1234567",
			},
			{ panRequired: true, passportRequired: false },
			{ isLeadAdult: true },
		);
		expect(out.pan).toBe("ABCDE1234F");
		expect(out.pNum).toBeUndefined();
	});

	it("sends passport when passport required, not pan", () => {
		const out = tripjackHotelTravellerDocs(
			{
				ti: "Mr",
				pt: "ADULT",
				fN: "Test",
				lN: "User",
				pan: "ABCDE1234F",
				pNum: "Z1234567",
			},
			{ panRequired: false, passportRequired: true },
			{ isLeadAdult: true },
		);
		expect(out.pNum).toBe("Z1234567");
		expect(out.pan).toBeUndefined();
	});
});
