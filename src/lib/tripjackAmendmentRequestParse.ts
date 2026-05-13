import type {
	TripjackAmendmentTravellerRef,
	TripjackAmendmentTripRef,
} from "@/types/tripjackFlight";

export function parseTripjackAmendmentTrips(raw: unknown): TripjackAmendmentTripRef[] | undefined {
	if (!Array.isArray(raw) || !raw.length) return undefined;
	const out: TripjackAmendmentTripRef[] = [];
	for (const t of raw) {
		if (!t || typeof t !== "object") continue;
		const o = t as Record<string, unknown>;
		const src = typeof o.src === "string" ? o.src.trim() : "";
		const dest = typeof o.dest === "string" ? o.dest.trim() : "";
		const departureDate =
			typeof o.departureDate === "string"
				? o.departureDate.trim()
				: typeof o.departuredate === "string"
					? (o.departuredate as string).trim()
					: "";
		if (src && dest && departureDate) out.push({ src, dest, departureDate });
	}
	return out.length ? out : undefined;
}

export function parseTripjackAmendmentTravellers(
	raw: unknown,
): TripjackAmendmentTravellerRef[] | undefined {
	if (!Array.isArray(raw) || !raw.length) return undefined;
	const out: TripjackAmendmentTravellerRef[] = [];
	for (const t of raw) {
		if (!t || typeof t !== "object") continue;
		const o = t as Record<string, unknown>;
		const fn = typeof o.fn === "string" ? o.fn.trim() : "";
		if (!fn) continue;
		const ln = typeof o.ln === "string" ? o.ln.trim() : undefined;
		out.push(ln ? { fn, ln } : { fn });
	}
	return out.length ? out : undefined;
}
