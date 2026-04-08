/**
 * TripJack /hms/v3/hotel/pricing sometimes returns reviewHash, options, etc.
 * under `data` or snake_case. Flatten so the client always sees top-level fields.
 */

export const TRIPJACK_HOTEL_PRICING_SESSION_KEY = "tripjack_hotel_pricing_ctx";

function isRecord(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

function firstString(...vals: unknown[]): string | undefined {
	for (const v of vals) {
		if (typeof v === "string" && v.trim()) return v.trim();
		if (typeof v === "number" && Number.isFinite(v)) return String(v);
	}
	return undefined;
}

/**
 * Merge nested layers into a single object for JSON responses to the browser.
 */
export function normalizeTripjackPricingResponse(raw: unknown): unknown {
	if (!isRecord(raw)) return raw;

	const layers: Record<string, unknown>[] = [raw];
	for (const key of ["data", "result", "payload", "response", "body"]) {
		const inner = raw[key];
		if (isRecord(inner)) layers.push(inner);
	}

	const pickStr = (...keys: string[]): string | undefined => {
		for (const layer of layers) {
			for (const k of keys) {
				const s = firstString(layer[k]);
				if (s) return s;
			}
		}
		return undefined;
	};

	const pickOptions = (): unknown => {
		for (const layer of layers) {
			const o = layer.options;
			if (Array.isArray(o) && o.length > 0) return o;
		}
		return raw.options;
	};

	const out: Record<string, unknown> = { ...raw };

	const hash = pickStr("reviewHash", "review_hash", "reviewhash");
	if (hash) out.reviewHash = hash;

	const corr = pickStr("correlationId", "correlation_id", "correlationID");
	if (corr) out.correlationId = corr;

	const hotelName = pickStr("hotelName", "hotel_name");
	if (hotelName && !firstString(out.hotelName)) out.hotelName = hotelName;

	const tjHotelId = pickStr("tjHotelId", "tj_hotel_id", "hid");
	if (tjHotelId && !firstString(out.tjHotelId)) out.tjHotelId = tjHotelId;

	const nat = pickStr("nationality");
	if (nat && !firstString(out.nationality)) out.nationality = nat;

	const opts = pickOptions();
	if (opts !== undefined) out.options = opts;

	for (const layer of layers) {
		if (!out.status && isRecord(layer.status)) out.status = layer.status;
	}

	return out;
}
