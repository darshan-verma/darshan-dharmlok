import type { Fare, FlightResult } from "@/types/tbo";
import { tripjackRoundTripFaresPairable } from "@/lib/tripjackFlightSearch";

/** Max flights kept per provider per leg before cross-provider merge (round-trip). */
export const TOP_PER_PROVIDER_LEG = Math.max(
	1,
	parseInt(process.env.FLIGHT_TOP_PER_PROVIDER_LEG || "50", 10) || 50,
);

/** Max flights in merged `Response.Results` after sort by NetPayable. */
export const MERGED_MAX_TOTAL = Math.max(
	1,
	parseInt(process.env.FLIGHT_MERGED_MAX_TOTAL || "100", 10) || 100,
);

type ApiSource = "TBO" | "AIRiQ" | "TRIPJACK";

function normalizeSource(f: FlightResult): ApiSource | "OTHER" {
	const s = f.ApiSource;
	if (s === "TBO" || s === "AIRiQ" || s === "TRIPJACK") return s;
	return "OTHER";
}

export function getNetPayable(flight: FlightResult): number {
	const fare = flight.Fare;
	if (!fare) return Number.POSITIVE_INFINITY;
	const n = fare.NetPayable;
	if (typeof n === "number" && !Number.isNaN(n)) return n;
	const o = Number(fare.OfferedFare);
	if (!Number.isNaN(o)) return o;
	const p = Number(fare.PublishedFare);
	if (!Number.isNaN(p)) return p;
	return Number.POSITIVE_INFINITY;
}

export function sortByNetPayable(flights: FlightResult[]): FlightResult[] {
	return [...flights].sort((a, b) => getNetPayable(a) - getNetPayable(b));
}

export function takeTopByNetPayable(
	flights: FlightResult[],
	k: number,
): FlightResult[] {
	if (k <= 0 || flights.length <= k) return sortByNetPayable(flights);
	return sortByNetPayable(flights).slice(0, k);
}

function combineRoundTripFares(f1: Fare, f2: Fare): Fare {
	return {
		...f1,
		BaseFare: Number(f1.BaseFare) + Number(f2.BaseFare),
		Tax: Number(f1.Tax) + Number(f2.Tax),
		YQTax: Number(f1.YQTax) + Number(f2.YQTax),
		AdditionalTxnFeeOfrd:
			Number(f1.AdditionalTxnFeeOfrd) + Number(f2.AdditionalTxnFeeOfrd),
		AdditionalTxnFeePub:
			Number(f1.AdditionalTxnFeePub) + Number(f2.AdditionalTxnFeePub),
		PGCharge: Number(f1.PGCharge) + Number(f2.PGCharge),
		OtherCharges: Number(f1.OtherCharges) + Number(f2.OtherCharges),
		Discount: Number(f1.Discount) + Number(f2.Discount),
		PublishedFare: Number(f1.PublishedFare) + Number(f2.PublishedFare),
		CommissionEarned:
			Number(f1.CommissionEarned) + Number(f2.CommissionEarned),
		PLBEarned: Number(f1.PLBEarned) + Number(f2.PLBEarned),
		IncentiveEarned:
			Number(f1.IncentiveEarned) + Number(f2.IncentiveEarned),
		OfferedFare: Number(f1.OfferedFare) + Number(f2.OfferedFare),
		TdsOnCommission:
			Number(f1.TdsOnCommission) + Number(f2.TdsOnCommission),
		TdsOnPLB: Number(f1.TdsOnPLB) + Number(f2.TdsOnPLB),
		TdsOnIncentive:
			Number(f1.TdsOnIncentive) + Number(f2.TdsOnIncentive),
		ServiceFee: Number(f1.ServiceFee) + Number(f2.ServiceFee),
		TotalBaggageCharges:
			Number(f1.TotalBaggageCharges) + Number(f2.TotalBaggageCharges),
		TotalMealCharges:
			Number(f1.TotalMealCharges) + Number(f2.TotalMealCharges),
		TotalSeatCharges:
			Number(f1.TotalSeatCharges) + Number(f2.TotalSeatCharges),
		TotalSpecialServiceCharges:
			Number(f1.TotalSpecialServiceCharges) +
			Number(f2.TotalSpecialServiceCharges),
		IGSTAmount: (Number(f1.IGSTAmount) || 0) + (Number(f2.IGSTAmount) || 0),
		CGSTAmount: (Number(f1.CGSTAmount) || 0) + (Number(f2.CGSTAmount) || 0),
		SGSTAmount: (Number(f1.SGSTAmount) || 0) + (Number(f2.SGSTAmount) || 0),
		CessAmount: (Number(f1.CessAmount) || 0) + (Number(f2.CessAmount) || 0),
		AirlineTransFee:
			(Number(f1.AirlineTransFee) || 0) + (Number(f2.AirlineTransFee) || 0),
	};
}

/**
 * Pair outbound + return from the same provider bucket (already filtered by source).
 * Mirrors client logic in FlightSearch.tsx; TripJack SPECIAL_RETURN rules apply via
 * `tripjackRoundTripFaresPairable`.
 */
export function pairRoundTripLegs(
	outboundFlights: FlightResult[],
	returnFlights: FlightResult[],
): FlightResult[] {
	const paired: FlightResult[] = [];

	for (const outboundFlight of outboundFlights) {
		const returnFlight = returnFlights.find((rf) =>
			tripjackRoundTripFaresPairable(outboundFlight, rf),
		);
		if (!returnFlight) continue;
		if (!outboundFlight.Fare || !returnFlight.Fare) continue;
		if (!outboundFlight.Segments?.[0] || !returnFlight.Segments?.[0]) continue;

		const combinedFare = combineRoundTripFares(
			outboundFlight.Fare,
			returnFlight.Fare,
		);

		paired.push({
			...outboundFlight,
			ReturnResultIndex: returnFlight.ResultIndex,
			Fare: combinedFare,
			Segments: [outboundFlight.Segments[0], returnFlight.Segments[0]],
		});
	}

	return paired;
}

function groupFlightsBySource(
	flights: FlightResult[],
): Map<ApiSource | "OTHER", FlightResult[]> {
	const map = new Map<ApiSource | "OTHER", FlightResult[]>();
	for (const f of flights) {
		const key = normalizeSource(f);
		const list = map.get(key) ?? [];
		list.push(f);
		map.set(key, list);
	}
	return map;
}

/**
 * Round-trip: trim per provider per leg, pair within provider, merge all providers,
 * sort by combined NetPayable, cap at MERGED_MAX_TOTAL.
 * Returns a single leg array suitable for `Response.Results = [paired]`.
 */
export function mergeAndCapRoundTrip(
	results: FlightResult[][],
	topPerLeg = TOP_PER_PROVIDER_LEG,
	maxTotal = MERGED_MAX_TOTAL,
): FlightResult[] {
	const outboundAll = results[0] ?? [];
	const returnAll = results[1] ?? [];
	if (outboundAll.length === 0 || returnAll.length === 0) return [];

	const outBy = groupFlightsBySource(outboundAll);
	const retBy = groupFlightsBySource(returnAll);

	const sources = new Set([
		...outBy.keys(),
		...retBy.keys(),
	]);

	const allPaired: FlightResult[] = [];

	for (const src of sources) {
		const rawO = outBy.get(src) ?? [];
		const rawR = retBy.get(src) ?? [];
		if (rawO.length === 0 || rawR.length === 0) continue;

		const trimmedO = takeTopByNetPayable(rawO, topPerLeg);
		const trimmedR = takeTopByNetPayable(rawR, topPerLeg);
		allPaired.push(...pairRoundTripLegs(trimmedO, trimmedR));
	}

	return sortByNetPayable(allPaired).slice(0, maxTotal);
}

/**
 * One-way or multi-city: cap each `Results[i]` after providers are concatenated.
 */
export function capMergedResultsByLeg(
	results: FlightResult[][],
	maxPerLeg = MERGED_MAX_TOTAL,
): FlightResult[][] {
	return results.map((leg) => takeTopByNetPayable(leg, maxPerLeg));
}

export function countFlightsBySource(
	flights: FlightResult[],
): { tbo: number; airiq: number; tripjack: number; other: number } {
	const counts = { tbo: 0, airiq: 0, tripjack: 0, other: 0 };
	for (const f of flights) {
		switch (f.ApiSource) {
			case "TBO":
				counts.tbo++;
				break;
			case "AIRiQ":
				counts.airiq++;
				break;
			case "TRIPJACK":
				counts.tripjack++;
				break;
			default:
				counts.other++;
				break;
		}
	}
	return counts;
}
