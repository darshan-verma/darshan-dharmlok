/**
 * TripJack HMS listing / pricing / review require `nationality` as TripJack
 * `countryId` (from GET /hms/v3/nationality-info). Persist guest choice in sessionStorage.
 */

export const TRIPJACK_HOTEL_GUEST_NATIONALITY_KEY =
	"tripjack_hotel_guest_nationality_countryId";

/** India — common default for this portal */
export const TRIPJACK_DEFAULT_NATIONALITY_COUNTRY_ID = "106";

export function getTripjackGuestNationalityCountryId(): string {
	if (typeof window === "undefined") {
		return TRIPJACK_DEFAULT_NATIONALITY_COUNTRY_ID;
	}
	try {
		const v = sessionStorage.getItem(TRIPJACK_HOTEL_GUEST_NATIONALITY_KEY);
		if (v && /^\d+$/.test(v.trim())) return v.trim();
	} catch {
		/* private mode */
	}
	return TRIPJACK_DEFAULT_NATIONALITY_COUNTRY_ID;
}

export function setTripjackGuestNationalityCountryId(countryId: string): void {
	if (typeof window === "undefined") return;
	const id = countryId.trim();
	if (!/^\d+$/.test(id)) return;
	try {
		sessionStorage.setItem(TRIPJACK_HOTEL_GUEST_NATIONALITY_KEY, id);
	} catch {
		/* ignore */
	}
}
