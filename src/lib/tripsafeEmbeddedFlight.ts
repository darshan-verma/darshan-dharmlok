/**
 * TripSafe embedded (flight-linked) insurance helper.
 *
 * Mirrors `resolveEmbeddedFlightContext` in `scripts/tripsafe-uat-client.mjs`:
 * runs a TripJack FMS air search and surfaces `priceIds` + itinerary dates so the
 * insurance search can be linked to a flight via `isq.ict: "API_EMB"` and `isq.isp.priceIds`.
 */
import { searchTripjackFlights } from "@/lib/tripjackClient";
import type {
	TripjackAirSearchRequest,
	TripjackCabinClass,
	TripjackTripInfo,
	TripjackTripInfos,
} from "@/types/tripjackFlight";

export type TripsafeEmbeddedJourneyType = "ONEWAY" | "RETURN";

export interface TripsafeEmbeddedFlightParams {
	from: string;
	to: string;
	/** Outbound date (YYYY-MM-DD). */
	departDate: string;
	/** Inbound date (YYYY-MM-DD) — required for RETURN. */
	returnDate?: string;
	journeyType: TripsafeEmbeddedJourneyType;
	adults?: number;
	children?: number;
	infants?: number;
	cabinClass?: TripjackCabinClass;
}

export interface TripsafeEmbeddedFlightOption {
	/** Value for `isq.isp.priceIds`. */
	priceId: string;
	/** Insurance start date aligned to the itinerary. */
	sd: string;
	/** Insurance end date aligned to the itinerary (ONEWAY → +90 days, per UAT runner). */
	ed: string;
	label: string;
	airline?: string;
	flightNo?: string;
	fare?: number;
}

export interface TripsafeEmbeddedFlightResult {
	journeyType: TripsafeEmbeddedJourneyType;
	options: TripsafeEmbeddedFlightOption[];
}

const MAX_OPTIONS = 20;

function addDays(dateStr: string, days: number): string {
	const d = new Date(`${dateStr}T00:00:00`);
	d.setDate(d.getDate() + days);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function segmentDate(seg: unknown): string {
	if (!seg || typeof seg !== "object") return "";
	const dt = (seg as { dt?: unknown }).dt;
	return typeof dt === "string" && dt.length >= 10 ? dt.slice(0, 10) : "";
}

function firstPriceEntry(trip: TripjackTripInfo) {
	const list = Array.isArray(trip.totalPriceList) ? trip.totalPriceList : [];
	return list.find((p) => p && typeof p.id === "string" && p.id.trim()) || null;
}

function priceFare(entry: { fd?: Record<string, { fC?: { TF?: number } }> } | null): number | undefined {
	if (!entry?.fd) return undefined;
	for (const pax of Object.values(entry.fd)) {
		const tf = pax?.fC?.TF;
		if (typeof tf === "number" && Number.isFinite(tf) && tf > 0) return tf;
	}
	return undefined;
}

function selectTrips(
	tripInfos: TripjackTripInfos | undefined,
	journeyType: TripsafeEmbeddedJourneyType,
): TripjackTripInfo[] {
	const onward = Array.isArray(tripInfos?.ONWARD) ? tripInfos!.ONWARD : [];
	const combo = Array.isArray(tripInfos?.COMBO) ? tripInfos!.COMBO : [];
	if (journeyType === "RETURN" && combo.length) return combo;
	return onward;
}

/**
 * Runs an FMS air search and returns selectable flight options carrying a `priceId`
 * plus insurance coverage dates aligned to the itinerary.
 */
export async function resolveTripsafeEmbeddedFlights(
	params: TripsafeEmbeddedFlightParams,
): Promise<TripsafeEmbeddedFlightResult> {
	const {
		from,
		to,
		departDate,
		returnDate,
		journeyType,
		adults = 1,
		children = 0,
		infants = 0,
		cabinClass = "ECONOMY",
	} = params;

	const routeInfos: TripjackAirSearchRequest["searchQuery"]["routeInfos"] = [
		{
			fromCityOrAirport: { code: from.trim().toUpperCase() },
			toCityOrAirport: { code: to.trim().toUpperCase() },
			travelDate: departDate,
		},
	];
	if (journeyType === "RETURN" && returnDate) {
		routeInfos.push({
			fromCityOrAirport: { code: to.trim().toUpperCase() },
			toCityOrAirport: { code: from.trim().toUpperCase() },
			travelDate: returnDate,
		});
	}

	const searchReq: TripjackAirSearchRequest = {
		searchQuery: {
			cabinClass,
			paxInfo: {
				ADULT: String(Math.max(1, adults)),
				CHILD: String(Math.max(0, children)),
				INFANT: String(Math.max(0, infants)),
			},
			routeInfos,
		},
	};

	const res = await searchTripjackFlights(searchReq);

	// FMS can answer HTTP 200 while embedding a provider failure (e.g. Access Denied,
	// IP allowlist, no-inventory). That would otherwise be silently reported as
	// "no flights", so surface it as a real error and log the raw shape for triage.
	const meta = res as unknown as {
		status?: { success?: boolean; httpStatus?: number; message?: string };
		errors?: Array<{ errCode?: string; code?: string; message?: string }>;
	};
	const tripInfos = res.searchResult?.tripInfos;
	const tripInfoCounts = tripInfos
		? Object.fromEntries(
				Object.entries(tripInfos).map(([k, v]) => [
					k,
					Array.isArray(v) ? v.length : typeof v,
				]),
			)
		: null;
	console.info("[TripSafe embedded flight] FMS response", {
		route: `${from}-${to}`,
		journeyType,
		hasSearchResult: Boolean(res.searchResult),
		tripInfoCounts,
		status: meta.status,
		firstError: meta.errors?.[0],
	});

	if (meta.status && meta.status.success === false) {
		const providerMsg =
			meta.errors?.[0]?.message ||
			meta.status.message ||
			"TripJack flight search was rejected";
		throw new Error(
			`Flight provider error: ${providerMsg}` +
				(meta.status.httpStatus ? ` (status ${meta.status.httpStatus})` : ""),
		);
	}

	const trips = selectTrips(tripInfos, journeyType);

	const options: TripsafeEmbeddedFlightOption[] = [];
	for (const trip of trips) {
		const price = firstPriceEntry(trip);
		if (!price?.id) continue;

		const segs = Array.isArray(trip.sI) ? trip.sI : [];
		const first = segs[0];
		const last = segs[segs.length - 1];
		const departure = segmentDate(first) || departDate;
		const ed =
			journeyType === "RETURN"
				? segmentDate(last) || returnDate || addDays(departure, 90)
				: addDays(departure, 90);

		const airline = first?.fD?.aI?.code;
		const flightNo = first?.fD?.fN;
		const fare = priceFare(price);
		const routeLabel = `${first?.da?.code || from}→${last?.aa?.code || to}`;
		const fareLabel = fare != null ? ` · ₹${Math.round(fare)}` : "";
		const label = `${[airline, flightNo].filter(Boolean).join(" ")} · ${routeLabel} · ${departure}${fareLabel}`.trim();

		options.push({
			priceId: price.id,
			sd: departure,
			ed,
			label,
			airline,
			flightNo,
			fare,
		});

		if (options.length >= MAX_OPTIONS) break;
	}

	return { journeyType, options };
}
