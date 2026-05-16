/**
 * Mapping from TBO numeric city codes to TripJack city codes.
 * TripJack city codes follow the pattern: "CT" + IATA city code (e.g. CTDEL for Delhi).
 * Add more entries as TripJack city codes are confirmed.
 */

/** Delhi NCR meta-city (TBO) — aggregates hotels across these TBO city codes */
export const DELHI_NCR_META_CITY_CODE = "418069";

/** TBO city codes that belong to Delhi NCR for hotel aggregation */
export const DELHI_NCR_TBO_CITY_CODES = [
	"130443",
	"119513",
	"130205",
	"145430",
	"118973",
	"118129",
	"147501",
] as const;

const TBO_TO_TRIPJACK_CITY_CODES: Record<string, string> = {
	"130443": "CTDEL", // Delhi
	"144306": "CTBOM", // Mumbai
	"111124": "CTBLR", // Bengaluru
	"122175": "CTJAI", // Jaipur
	"119805": "CTGOA", // Goa
	"100589": "CTAGR", // Agra
	"127655": "CTMAA", // Chennai (Madras)
	"113064": "CTCCU", // Kolkata (Calcutta)
	"120942": "CTHYD", // Hyderabad
	"117105": "CTPNQ", // Pune
	"101655": "CTAMD", // Ahmedabad
	"128779": "CTLKO", // Lucknow
	"119820": "CTGOI", // Goa (Panaji)
	"128595": "CTIXC", // Chandigarh
	"121605": "CTIXB", // Siliguri/Bagdogra
	"116694": "CTPAT", // Patna
	"135580": "CTRPR", // Raipur
	"113750": "CTKNU", // Kanpur
	"104785": "CTBHO", // Bhopal
	"101069": "CTIXU", // Agartala
};

for (const code of DELHI_NCR_TBO_CITY_CODES) {
	if (code !== "130443") {
		TBO_TO_TRIPJACK_CITY_CODES[code] = "CTDEL";
	}
}

/** When several TBO codes map to the same TripJack city, static sync stores this canonical TBO row */
const TRIPJACK_CITY_CODE_TO_CANONICAL_TBO: Partial<Record<string, string>> = {
	CTDEL: "130443",
};

/**
 * Returns the TripJack city code for a given TBO city code, or null if not mapped.
 */
export function getTripjackCityCode(tboCityCode: string): string | null {
	return TBO_TO_TRIPJACK_CITY_CODES[tboCityCode] ?? null;
}

/** ISO2 → common ISO3166-1 alpha-3 codes seen on TripJack static payloads / DB rows */
const ISO2_TO_ALPHA3: Record<string, string> = {
	IN: "IND",
	US: "USA",
	GB: "GBR",
	AE: "ARE",
	SG: "SGP",
	TH: "THA",
	MY: "MYS",
	ID: "IDN",
	LK: "LKA",
	NP: "NPL",
	BD: "BGD",
};

/**
 * Values to use in Prisma `countryCode: { in: … }` when matching TripjackHotel rows
 * to a TBO master country (TripJack often stores alpha-3 while TboCity uses alpha-2).
 */
export function tripjackInventoryCountryCodes(tboCountryCode: string): string[] {
	const raw = tboCountryCode.trim();
	if (!raw) return [];
	const u = raw.toUpperCase();
	const out = new Set<string>([raw, u, u.toLowerCase()]);
	const a3 = ISO2_TO_ALPHA3[u];
	if (a3) {
		out.add(a3);
		out.add(a3.toLowerCase());
	}
	return [...out];
}

/**
 * Resolves a TripJack catalog city code (e.g. CTDEL) to a canonical TBO city code for DB indexing.
 * Returns null when unknown — caller may keep the TripJack code or skip normalization.
 */
export function getCanonicalTboCityCodeForTripjackCityCode(
	tripjackCityCode: string,
): string | null {
	const trimmed = tripjackCityCode.trim();
	if (!trimmed) return null;
	const explicit = TRIPJACK_CITY_CODE_TO_CANONICAL_TBO[trimmed];
	if (explicit) return explicit;
	for (const [tbo, tj] of Object.entries(TBO_TO_TRIPJACK_CITY_CODES)) {
		if (tj === trimmed) return tbo;
	}
	return null;
}
