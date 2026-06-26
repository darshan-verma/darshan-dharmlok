import type { FlightResult, TboBookBaggage } from "@/types/tbo";

/** First SSR selection for a passenger (`${index}-segment` or legacy numeric key). */
export function resolveSsrForPassenger<T>(
	record: Record<string, T | null> | undefined,
	passengerIndex: number,
): T | null | undefined {
	if (!record) return undefined;
	const legacy = record[String(passengerIndex)] ?? record[passengerIndex as unknown as string];
	if (legacy) return legacy;
	const prefix = `${passengerIndex}-`;
	for (const [key, value] of Object.entries(record)) {
		if (key.startsWith(prefix) && value) return value;
	}
	return null;
}

export function hasPassengerSsrSelection<T>(
	record: Record<string, T | null> | undefined,
	passengerIndex: number,
): boolean {
	return Boolean(resolveSsrForPassenger(record, passengerIndex));
}

export function mapBaggageOptionToTbo(option: {
	Code?: string;
	Description?: string | number;
	Weight?: number;
	Price?: number;
}): TboBookBaggage {
	return {
		Code: option.Code,
		Description:
			typeof option.Description === "string"
				? option.Description
				: String(option.Description ?? ""),
		Weight: option.Weight,
		Price: option.Price ?? 0,
	};
}

/** True when any segment touches a non-IN country (typical international booking). */
export function isTboInternationalFlight(
	flight: Pick<FlightResult, "Segments">,
): boolean {
	for (const journey of flight.Segments || []) {
		if (!Array.isArray(journey)) continue;
		for (const seg of journey) {
			const origin = seg?.Origin?.Airport?.CountryCode?.trim().toUpperCase();
			const dest = seg?.Destination?.Airport?.CountryCode?.trim().toUpperCase();
			if ((origin && origin !== "IN") || (dest && dest !== "IN")) {
				return true;
			}
		}
	}
	return false;
}

export interface MandatorySsrCheckInput {
	paxType: number;
	passengerIndex: number;
	isMealMandatory: boolean;
	isSeatMandatory: boolean;
	requireBaggage: boolean;
	hasMeal: boolean;
	hasSeat: boolean;
	hasBaggage: boolean;
	freeMealAvailable: boolean;
	freeSeatAvailable: boolean;
	freeBaggageAvailable: boolean;
}

export function validateMandatorySsrForPassenger(
	input: MandatorySsrCheckInput,
): string | null {
	const label = `Passenger ${input.passengerIndex + 1}`;
	if (input.isMealMandatory && !input.hasMeal && !input.freeMealAvailable) {
		return `${label}: meal selection is mandatory for this fare`;
	}
	if (
		input.isSeatMandatory &&
		input.paxType !== 3 &&
		!input.hasSeat &&
		!input.freeSeatAvailable
	) {
		return `${label}: seat selection is mandatory for this fare`;
	}
	if (
		input.requireBaggage &&
		input.paxType !== 3 &&
		!input.hasBaggage &&
		!input.freeBaggageAvailable
	) {
		return `${label}: baggage is required for this international LCC flight`;
	}
	return null;
}
