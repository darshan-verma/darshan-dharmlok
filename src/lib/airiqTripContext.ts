/**
 * Resolve AIRiQ TripType / returnMode for pricing, seat-map, and book — aligned with UAT runner.
 */

import type { FlightResult } from "@/types/tbo";
import type { AiriqReturnMode } from "@/lib/airiqBookPayload";
import { detectPricingReturnMode, isInternationalRoute } from "@/lib/airiqBookPayload";

export type AiriqProdTripType = "O" | "R" | "Y";

type AiriqFlightDetail = {
	Origin?: string;
	Destination?: string;
	ItinRef?: string | number;
};

type AiriqOriginalFlight = {
	Trackid?: string;
	FlightDetails?: AiriqFlightDetail[];
	Fares?: unknown[];
};

export type AiriqTripBookContext = {
	tripType: AiriqProdTripType;
	returnMode: AiriqReturnMode;
	isInternational: boolean;
	isBundledRoundTrip: boolean;
};

function flightDetailsFrom(
	flight: FlightResult | null | undefined
): AiriqFlightDetail[] {
	const original = (flight as { _airiqOriginal?: AiriqOriginalFlight })
		?._airiqOriginal;
	return original?.FlightDetails || [];
}

function segmentsForItinRef(
	flightDetails: AiriqFlightDetail[],
	itinRef: string | number
): AiriqFlightDetail[] {
	const ref = String(itinRef);
	return flightDetails.filter((f) => String(f.ItinRef ?? "0") === ref);
}

function legMatchesRoute(
	segments: AiriqFlightDetail[],
	from: string,
	to: string
): boolean {
	if (!segments.length) return false;
	const o = from.trim().toUpperCase();
	const t = to.trim().toUpperCase();
	return (
		String(segments[0]?.Origin || "").toUpperCase() === o &&
		String(segments[segments.length - 1]?.Destination || "").toUpperCase() === t
	);
}

/** Round-trip package: OB/IB via ItinRef 0/1 or legacy two-segment order. */
export function isReturnPackageByItinRef(
	flightDetails: AiriqFlightDetail[],
	origin: string,
	destination: string
): boolean {
	const o = origin.trim().toUpperCase();
	const d = destination.trim().toUpperCase();
	const obSegs = segmentsForItinRef(flightDetails, "0");
	const ibSegs = segmentsForItinRef(flightDetails, "1");
	if (obSegs.length && ibSegs.length) {
		return legMatchesRoute(obSegs, o, d) && legMatchesRoute(ibSegs, d, o);
	}
	if (flightDetails.length !== 2) return false;
	const out = flightDetails[0];
	const back = flightDetails[1];
	return (
		String(out?.Origin || "").toUpperCase() === o &&
		String(out?.Destination || "").toUpperCase() === d &&
		String(back?.Origin || "").toUpperCase() === d &&
		String(back?.Destination || "").toUpperCase() === o
	);
}

function inferOriginDestination(flight: FlightResult): {
	origin: string;
	destination: string;
} {
	const details = flightDetailsFrom(flight);
	if (details.length) {
		return {
			origin: details[0]?.Origin || "",
			destination: details[details.length - 1]?.Destination || "",
		};
	}
	const seg0 = flight.Segments?.[0]?.[0];
	return {
		origin: seg0?.Origin?.Airport?.AirportCode || "",
		destination: seg0?.Destination?.Airport?.AirportCode || "",
	};
}

function readStoredTripType(
	flight: FlightResult | null | undefined
): AiriqProdTripType | undefined {
	const t = (flight as { _airiqTripType?: string })?._airiqTripType;
	if (t === "O" || t === "R" || t === "Y") return t;
	return undefined;
}

function readStoredReturnMode(
	flight: FlightResult | null | undefined
): AiriqReturnMode | undefined {
	const m = (flight as { _airiqReturnMode?: AiriqReturnMode })?._airiqReturnMode;
	if (m === "oneway" || m === "paired" || m === "combined") return m;
	return undefined;
}

/** Bundled RT: multiple segments in one result without separate return index. */
export function isBundledAiriqRoundTrip(
	flight: FlightResult | null | undefined,
	origin?: string,
	destination?: string
): boolean {
	if (!flight) return false;
	if (flight.ReturnResultIndex) return false;
	const details = flightDetailsFrom(flight);
	if (details.length < 2) return false;
	const { origin: o, destination: d } =
		origin && destination
			? { origin, destination }
			: inferOriginDestination(flight);
	if (o && d) {
		return isReturnPackageByItinRef(details, o, d);
	}
	const itinRefs = new Set(details.map((f) => String(f.ItinRef ?? "0")));
	return itinRefs.size >= 2;
}

export function resolveAiriqTripBookContext(options: {
	flight: FlightResult | null | undefined;
	returnFlight?: FlightResult | null;
	searchJourneyType?: string;
}): AiriqTripBookContext {
	const { flight, returnFlight, searchJourneyType } = options;
	const storedTrip = readStoredTripType(flight);
	const storedMode = readStoredReturnMode(flight);
	const hasReturnObject = Boolean(
		returnFlight?._airiqOriginal?.FlightDetails?.length || flight?.ReturnResultIndex
	);
	const details = flightDetailsFrom(flight);
	const { origin, destination } = flight
		? inferOriginDestination(flight)
		: { origin: "", destination: "" };
	const bundled = isBundledAiriqRoundTrip(flight, origin, destination);

	let tripType: AiriqProdTripType = "O";
	if (storedTrip) {
		tripType = storedTrip;
	} else if (searchJourneyType === "5") {
		tripType = "Y";
	} else if (hasReturnObject || bundled || searchJourneyType === "2") {
		tripType = "R";
	}

	const returnMode =
		storedMode ??
		detectPricingReturnMode(
			tripType,
			Boolean(returnFlight?._airiqOriginal?.FlightDetails?.length),
			details
		);

	const airportCodes = [
		...details.flatMap((f) => [f.Origin, f.Destination]),
		...(returnFlight?._airiqOriginal?.FlightDetails || []).flatMap((f) => [
			f.Origin,
			f.Destination,
		]),
	].filter(Boolean) as string[];

	return {
		tripType,
		returnMode,
		isInternational: isInternationalRoute(airportCodes),
		isBundledRoundTrip: bundled,
	};
}

export function mapFlightDetailsForPricing(
	segments: Array<{
		FlightID: string;
		FlightNumber: string;
		Origin: string;
		Destination: string;
		DepartureDateTime: string;
		ArrivalDateTime: string;
		ItinRef?: string | number;
		ReferenceToken?: string;
		FareId?: string;
		Class?: string;
		FareBasisCode?: string;
		Cabin?: string;
	}>
) {
	return segments.map((segment) => ({
		FlightID: segment.FlightID,
		FlightNumber: segment.FlightNumber,
		Origin: segment.Origin,
		Destination: segment.Destination,
		DepartureDateTime: segment.DepartureDateTime,
		ArrivalDateTime: segment.ArrivalDateTime,
		...(segment.ReferenceToken
			? { ReferenceToken: segment.ReferenceToken }
			: {}),
		...(segment.FareId ? { FareId: segment.FareId } : {}),
		...(segment.Class ? { Class: segment.Class } : {}),
		...(segment.FareBasisCode
			? { FareBasisCode: segment.FareBasisCode }
			: {}),
		...(segment.Cabin ? { Cabin: segment.Cabin } : {}),
	}));
}
