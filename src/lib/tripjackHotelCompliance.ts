/**
 * TripJack hotel review/pricing may expose compliance as either
 * `panRequired` / `passportRequired` or `isPanRequired` / `isPassportRequired`.
 */

export type TripjackHotelComplianceFlags = {
	panRequired: boolean;
	passportRequired: boolean;
	gstType: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
	if (v !== null && typeof v === "object" && !Array.isArray(v)) {
		return v as Record<string, unknown>;
	}
	return null;
}

function truthy(v: unknown): boolean {
	return v === true || v === "true" || v === 1 || v === "1";
}

/** Normalize supplier compliance flags from option / review payloads. */
export function tripjackHotelComplianceFlags(
	compliance: unknown,
): TripjackHotelComplianceFlags {
	const c = asRecord(compliance);
	if (!c) {
		return { panRequired: false, passportRequired: false, gstType: "NA" };
	}
	const panRequired = truthy(c.panRequired) || truthy(c.isPanRequired);
	const passportRequired =
		truthy(c.passportRequired) || truthy(c.isPassportRequired);
	const gstType =
		typeof c.gstType === "string" && c.gstType.trim()
			? c.gstType.trim()
			: "NA";
	return { panRequired, passportRequired, gstType };
}

export type TripjackHotelTravellerDocInput = {
	ti: string;
	pt: "ADULT" | "CHILD";
	fN: string;
	lN: string;
	pan?: string;
	pNum?: string;
};

/**
 * Build traveller payload fields for hotel book: send PAN only when
 * isPanRequired, passport (pNum) only when passport is required.
 */
export function tripjackHotelTravellerDocs(
	traveller: TripjackHotelTravellerDocInput,
	flags: Pick<TripjackHotelComplianceFlags, "panRequired" | "passportRequired">,
	opts?: { isLeadAdult?: boolean },
): TripjackHotelTravellerDocInput {
	const base: TripjackHotelTravellerDocInput = {
		ti: traveller.ti,
		pt: traveller.pt,
		fN: traveller.fN.trim(),
		lN: traveller.lN.trim(),
	};
	const isLeadAdult =
		opts?.isLeadAdult === true && traveller.pt === "ADULT";

	if (flags.panRequired && isLeadAdult && traveller.pan?.trim()) {
		base.pan = traveller.pan.trim().toUpperCase();
	}
	if (flags.passportRequired && traveller.pNum?.trim()) {
		base.pNum = traveller.pNum.trim().toUpperCase();
	}
	return base;
}
