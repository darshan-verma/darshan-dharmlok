/**
 * Whole-rupee display for travel (flights, hotels, cabs): exact integer amount,
 * Indian digit grouping, no decimals, no abbreviated figures (K/L/Cr).
 */
export function formatTravelPriceInr(
	amount: number | string | null | undefined,
): string {
	if (amount === null || amount === undefined || amount === "") {
		return "0";
	}
	const raw =
		typeof amount === "string"
			? Number.parseFloat(amount.replace(/,/g, "").replace(/^\s*₹\s?/u, ""))
			: Number(amount);
	if (!Number.isFinite(raw)) {
		return "0";
	}
	const rupees = Math.round(raw);
	return rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
