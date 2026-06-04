/** Tail logo PNG path for an IATA airline code (local public/ or S3 via env). */
function airlineImagesBase(): string {
	const configured = process.env.NEXT_PUBLIC_AIRLINE_IMAGES_BASE_URL?.trim();
	return configured || "/airline-images";
}

export function getAirlineLogoUrl(code: string): string {
	const base = airlineImagesBase().replace(/\/$/, "");
	const upper = code.trim().toUpperCase();
	const filename =
		!upper || upper === "MULTI" ? "multi.png" : `${upper}.png`;
	return `${base}/${filename}`;
}
