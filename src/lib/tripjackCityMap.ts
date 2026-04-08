/**
 * Mapping from TBO numeric city codes to TripJack city codes.
 * TripJack city codes follow the pattern: "CT" + IATA city code (e.g. CTDEL for Delhi).
 * Add more entries as TripJack city codes are confirmed.
 */
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

/**
 * Returns the TripJack city code for a given TBO city code, or null if not mapped.
 */
export function getTripjackCityCode(tboCityCode: string): string | null {
	return TBO_TO_TRIPJACK_CITY_CODES[tboCityCode] ?? null;
}
