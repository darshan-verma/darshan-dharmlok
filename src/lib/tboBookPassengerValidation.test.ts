import { describe, expect, it } from "vitest";
import { validateTboBookPassengers } from "./tboBookPassengerValidation";
import type { TboBookPassenger } from "@/types/tbo";

function basePassenger(overrides: Partial<TboBookPassenger> = {}): TboBookPassenger {
	return {
		Title: "Mr",
		FirstName: "John",
		LastName: "Doe",
		PaxType: 1,
		Gender: 1,
		GSTCompanyAddress: "",
		GSTCompanyContactNumber: "",
		GSTCompanyName: "",
		GSTNumber: "",
		GSTCompanyEmail: "",
		AddressLine1: "123 Street",
		City: "Delhi",
		CountryCode: "IN",
		CountryName: "India",
		ContactNo: "9876543210",
		Email: "john@example.com",
		IsLeadPax: true,
		Fare: {
			Currency: "INR",
			BaseFare: 1000,
			Tax: 200,
			TransactionFee: 0,
			YQTax: 0,
			AdditionalTxnFeeOfrd: 0,
			AdditionalTxnFeePub: 0,
			AirTransFee: 0,
		},
		Nationality: "IN",
		...overrides,
	};
}

describe("validateTboBookPassengers", () => {
	it("accepts a valid passenger list", () => {
		expect(validateTboBookPassengers([basePassenger()])).toBeNull();
	});

	it("rejects invalid nationality", () => {
		const result = validateTboBookPassengers([
			basePassenger({ Nationality: "IND" }),
		]);
		expect(result?.error).toMatch(/Nationality/);
	});

	it("requires GST on lead pax when mandatory", () => {
		const result = validateTboBookPassengers([basePassenger()], {
			requireGstMandatory: true,
		});
		expect(result?.error).toMatch(/GST/);
	});

	it("requires child DOB", () => {
		const result = validateTboBookPassengers([
			basePassenger({ PaxType: 2, DateOfBirth: "", IsLeadPax: false }),
		]);
		expect(result?.error).toMatch(/DateOfBirth/);
	});
});
