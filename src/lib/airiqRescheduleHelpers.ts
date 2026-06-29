/**
 * AIRiQ reschedule route helpers — aligned with UAT runner §14.
 */

export type AiriqRescheduleFlightSegment = {
	Origin?: string;
	Destination?: string;
};

/** Split combined intl RT book legs into OB/IB endpoints for RescheduleAvail / CHECKFARE. */
export function resolveIntlConnectingRescheduleRoutes(
	allFlights: AiriqRescheduleFlightSegment[],
	origin: string,
	destination: string
): {
	obFlights: AiriqRescheduleFlightSegment[];
	ibFlights: AiriqRescheduleFlightSegment[];
	legOrigin: string;
	legDestination: string;
	returnLegOrigin: string;
	returnLegDestination: string;
} {
	const tripOrigin = String(origin || "").toUpperCase();
	const tripDestination = String(destination || "").toUpperCase();
	if (!allFlights.length) {
		return {
			obFlights: [],
			ibFlights: [],
			legOrigin: origin || "",
			legDestination: destination || "",
			returnLegOrigin: destination || "",
			returnLegDestination: origin || "",
		};
	}

	let obEndIndex = allFlights.length;
	for (let i = 0; i < allFlights.length; i++) {
		if (
			String(allFlights[i]?.Destination || "").toUpperCase() === tripOrigin
		) {
			obEndIndex = i;
			break;
		}
	}
	const obFlights = allFlights.slice(0, obEndIndex);
	const ibFlights = allFlights.slice(obEndIndex);
	const outbound = obFlights.length ? obFlights : allFlights;
	const inbound = ibFlights.length ? ibFlights : [];

	return {
		obFlights: outbound,
		ibFlights: inbound,
		legOrigin: outbound[0]?.Origin || origin || "",
		legDestination:
			outbound[outbound.length - 1]?.Destination || destination || "",
		returnLegOrigin: inbound[0]?.Origin || tripDestination || destination || "",
		returnLegDestination:
			inbound[inbound.length - 1]?.Destination || tripOrigin || origin || "",
	};
}

/** Domestic RT: reschedule each leg separately with TripType O. */
export function shouldSplitDomesticReturnReschedule(options: {
	tripType: string;
	isInternational?: boolean;
}): boolean {
	return options.tripType === "R" && !options.isInternational;
}

/** International RT reschedule uses TripType R; otherwise O per leg. */
export function resolveRescheduleTripType(options: {
	requestedTripType: string;
	isInternational?: boolean;
	perLeg?: boolean;
}): string {
	if (options.perLeg) return "O";
	if (
		options.requestedTripType === "R" &&
		options.isInternational
	) {
		return "R";
	}
	return options.requestedTripType === "Y" ? "Y" : "O";
}
