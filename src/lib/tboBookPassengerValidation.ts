import type { TboBookPassenger } from "@/types/tbo";
import {
	TBO_MAX_PASSENGERS,
	validateTboContactNumber,
	validateTboPassengerCounts,
} from "@/lib/tboFlightSearch";

export interface TboBookPassengerValidationOptions {
	/** When true, lead passenger must have non-empty GST fields (IsGSTMandatory). */
	requireGstMandatory?: boolean;
	/** Book and LCC Ticket require per-passenger Fare. Non-LCC Ticket (PNR-only) does not. */
	requireFare?: boolean;
}

export interface TboBookPassengerValidationFailure {
	error: string;
	status: 400;
}

function isLeadPassenger(p: TboBookPassenger, index: number): boolean {
	return p.IsLeadPax === true || index === 0;
}

function isGstMandatoryComplete(p: TboBookPassenger): boolean {
	return Boolean(
		p.GSTNumber?.trim() &&
			p.GSTCompanyName?.trim() &&
			p.GSTCompanyAddress?.trim() &&
			p.GSTCompanyContactNumber?.trim() &&
			p.GSTCompanyEmail?.trim(),
	);
}

export function validateTboBookPassengers(
	passengers: unknown,
	options: TboBookPassengerValidationOptions = {},
): TboBookPassengerValidationFailure | null {
	const { requireGstMandatory = false, requireFare = true } = options;

	if (!Array.isArray(passengers) || passengers.length === 0) {
		return {
			error: "Passengers must be a non-empty array",
			status: 400,
		};
	}

	if (passengers.length > TBO_MAX_PASSENGERS) {
		return {
			error: `Maximum ${TBO_MAX_PASSENGERS} passengers allowed per TBO booking`,
			status: 400,
		};
	}

	const adults = passengers.filter((p) => Number((p as TboBookPassenger).PaxType) === 1).length;
	const children = passengers.filter((p) => Number((p as TboBookPassenger).PaxType) === 2).length;
	const infants = passengers.filter((p) => Number((p as TboBookPassenger).PaxType) === 3).length;
	const paxCountError = validateTboPassengerCounts(adults, children, infants);
	if (paxCountError) {
		return { error: paxCountError, status: 400 };
	}

	for (let i = 0; i < passengers.length; i++) {
		const p = passengers[i] as TboBookPassenger;
		const label = `Passenger ${i + 1}`;

		if (!p?.Title || !p?.FirstName || !p?.LastName || p.PaxType == null || p.Gender == null) {
			return {
				error: `${label}: Title, FirstName, LastName, PaxType, Gender are required`,
				status: 400,
			};
		}

		if (
			p.GSTCompanyAddress == null ||
			p.GSTCompanyContactNumber == null ||
			p.GSTCompanyName == null ||
			p.GSTNumber == null ||
			p.GSTCompanyEmail == null
		) {
			return {
				error: `${label}: GST fields (GSTCompanyAddress, GSTCompanyContactNumber, GSTCompanyName, GSTNumber, GSTCompanyEmail) are required (use empty string if not applicable)`,
				status: 400,
			};
		}

		if (requireGstMandatory && isLeadPassenger(p, i) && !isGstMandatoryComplete(p)) {
			return {
				error: `${label}: GST details are mandatory for this booking`,
				status: 400,
			};
		}

		if (requireFare) {
			if (!p.Fare || typeof p.Fare !== "object") {
				return {
					error: `${label}: Fare object is required`,
					status: 400,
				};
			}
			const f = p.Fare;
			if (
				f.Currency == null ||
				f.BaseFare == null ||
				f.Tax == null ||
				f.TransactionFee == null ||
				f.YQTax == null ||
				f.AdditionalTxnFeeOfrd == null ||
				f.AdditionalTxnFeePub == null ||
				f.AirTransFee == null
			) {
				return {
					error: `${label}: Fare must include Currency, BaseFare, Tax, TransactionFee, YQTax, AdditionalTxnFeeOfrd, AdditionalTxnFeePub, AirTransFee`,
					status: 400,
				};
			}
		}

		if (
			!p.AddressLine1?.trim() ||
			!p.City?.trim() ||
			!p.CountryCode?.trim() ||
			!p.CountryName?.trim() ||
			!p.ContactNo?.trim() ||
			!p.Email?.trim()
		) {
			return {
				error: `${label}: AddressLine1, City, CountryCode, CountryName, ContactNo, Email are required`,
				status: 400,
			};
		}

		const contactError = validateTboContactNumber(p.ContactNo, `${label}: Contact number`);
		if (contactError) {
			return { error: contactError, status: 400 };
		}

		if (p.GSTCompanyContactNumber?.trim()) {
			const gstContactError = validateTboContactNumber(
				p.GSTCompanyContactNumber,
				`${label}: GST company contact number`,
			);
			if (gstContactError) {
				return { error: gstContactError, status: 400 };
			}
		}

		const nationality = (p.Nationality || "").trim().toUpperCase();
		if (!nationality || !/^[A-Z]{2}$/.test(nationality)) {
			return {
				error: `${label}: Nationality must be a 2-letter country code`,
				status: 400,
			};
		}

		if (typeof p.IsLeadPax !== "boolean") {
			return {
				error: `${label}: IsLeadPax must be boolean`,
				status: 400,
			};
		}

		const paxType = Number(p.PaxType);
		if ((paxType === 2 || paxType === 3) && !p.DateOfBirth?.trim()) {
			return {
				error: `${label}: DateOfBirth is mandatory for children and infants`,
				status: 400,
			};
		}
	}

	return null;
}
