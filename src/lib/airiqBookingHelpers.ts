import type { FlightResult } from "@/types/tbo";
import type {
	AiriqGetMultiClassFareResponse,
	AiriqPricingResponse,
} from "@/types/airiq";

type PriceItenaryInfoItem = NonNullable<
	AiriqPricingResponse["PriceItenaryInfo"]
>[number];

type AiriqOriginalFlight = {
	Trackid?: string;
	FlightDetails?: Array<{ MultiClass?: string; FlightID?: string }>;
};

/** Availability search flag: MultiClass "1" = upsell classes available (doc sample uses "0" when off). */
export function isAiriqMultiClassEnabled(
	flight: { _airiqOriginal?: AiriqOriginalFlight } | null | undefined
): boolean {
	const details = flight?._airiqOriginal?.FlightDetails;
	if (!details?.length) return false;
	return details.some((fd) => {
		const flag = fd.MultiClass;
		if (flag === undefined || flag === null || flag === "") return false;
		return parseAiriqBoolean(flag);
	});
}

export function getAiriqAvailabilityTrackid(
	flight: { _airiqOriginal?: AiriqOriginalFlight } | null | undefined,
	fallbackTraceId?: string
): string | null {
	const trackid = flight?._airiqOriginal?.Trackid?.trim();
	if (trackid) return trackid;
	return fallbackTraceId?.trim() || null;
}

/** Parse AIRiQ boolean fields (true, "true", 1, "1", etc.). */
export function parseAiriqBoolean(value: unknown): boolean {
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value === 1;
	if (typeof value === "string") {
		const n = value.trim().toLowerCase();
		return n === "true" || n === "1" || n === "yes" || n === "y";
	}
	return false;
}

function readAllowBlockFromRecord(
	record: Record<string, unknown> | undefined
): boolean | undefined {
	if (!record) return undefined;
	for (const key of ["AllowBlockPNR", "AllowBlockPnr", "allowBlockPNR"]) {
		if (key in record) {
			return parseAiriqBoolean(record[key]);
		}
	}
	return undefined;
}

function extractAllowBlockFromPriceInfo(
	priceInfo: PriceItenaryInfoItem
): boolean | undefined {
	const direct = readAllowBlockFromRecord(
		priceInfo as unknown as Record<string, unknown>
	);
	if (direct !== undefined) return direct;

	const availList = priceInfo.AvailabilityResponse;
	if (!availList?.length) return undefined;

	for (const avail of availList) {
		const availRecord = avail as Record<string, unknown>;
		const fromAvail = readAllowBlockFromRecord(availRecord);
		if (fromAvail !== undefined) return fromAvail;

		const fares = availRecord.Fares;
		if (Array.isArray(fares)) {
			for (const fare of fares) {
				const fromFare = readAllowBlockFromRecord(
					fare as Record<string, unknown>
				);
				if (fromFare !== undefined) return fromFare;
			}
		}

		const flights = availRecord.Flights;
		if (Array.isArray(flights)) {
			for (const flight of flights) {
				const fromFlight = readAllowBlockFromRecord(
					flight as Record<string, unknown>
				);
				if (fromFlight !== undefined) return fromFlight;
			}
		}
	}

	return undefined;
}

export function normalizePriceItenaryInfo(
	pricingData: AiriqPricingResponse
): PriceItenaryInfoItem[] {
	const raw = pricingData.PriceItenaryInfo;
	if (Array.isArray(raw)) return raw;
	if (raw) return [raw];
	return [];
}

/** Doc §8.3: BlockPNR may only be true when Pricing reports AllowBlockPNR = true. */
export function getAllowBlockPNRFromPricing(
	pricingData: AiriqPricingResponse
): boolean {
	for (const priceInfo of normalizePriceItenaryInfo(pricingData)) {
		if (extractAllowBlockFromPriceInfo(priceInfo) === true) {
			return true;
		}
	}
	return false;
}

function readFareMaskingFromRecord(
	record: Record<string, unknown> | undefined
): boolean | undefined {
	if (!record) return undefined;
	for (const key of ["FareMasking", "Faremasking", "fareMasking"]) {
		if (key in record) {
			return parseAiriqBoolean(record[key]);
		}
	}
	return undefined;
}

/** Doc §8.3: FareMasking from Pricing when present (IndiGo only). */
export function getFareMaskingFromPricing(
	pricingData: AiriqPricingResponse
): boolean | undefined {
	for (const priceInfo of normalizePriceItenaryInfo(pricingData)) {
		const direct = readFareMaskingFromRecord(
			priceInfo as unknown as Record<string, unknown>
		);
		if (direct !== undefined) return direct;

		for (const avail of priceInfo.AvailabilityResponse || []) {
			const fromAvail = readFareMaskingFromRecord(
				avail as Record<string, unknown>
			);
			if (fromAvail !== undefined) return fromAvail;
		}
	}
	return undefined;
}

export function isIndigoItinerary(flightNumbers: string[]): boolean {
	return flightNumbers.some((fn) => {
		const code = fn.trim().split(/\s+/)[0]?.toUpperCase() || "";
		return code === "6E" || code.startsWith("6E");
	});
}

export function resolveBlockPNRForBook(options: {
	preferBlockPNR: boolean;
	pricingData: AiriqPricingResponse;
}): {
	blockPNR: boolean;
	allowBlockPNR: boolean;
} {
	const allowBlockPNR = getAllowBlockPNRFromPricing(options.pricingData);
	const blockPNR = options.preferBlockPNR && allowBlockPNR;
	return { blockPNR, allowBlockPNR };
}

type FareDescriptionRow = {
	GrossAmount?: string | number;
	NetAmount?: string | number;
	Paxtype?: string;
};

/**
 * Gross fare for Book PaymentInfo.TotalAmount (doc §8 — must match Pricing).
 * Sums all Faredescription rows under AvailabilityResponse[].Fares[].
 */
export function getGrossAmountFromPriceInfo(priceInfo: PriceItenaryInfoItem): {
	amount: number;
	rawSample?: string;
} {
	const top = priceInfo.GrossAmount;
	if (top != null) {
		const n = Number(top);
		if (!Number.isNaN(n) && n > 0) {
			return { amount: n, rawSample: String(top) };
		}
	}

	let total = 0;
	let rawSample: string | undefined;

	for (const avail of priceInfo.AvailabilityResponse || []) {
		const fares = (
			avail as { Fares?: Array<{ Faredescription?: FareDescriptionRow[] }> }
		).Fares;
		for (const fare of fares || []) {
			for (const desc of fare.Faredescription || []) {
				const raw = desc.GrossAmount ?? desc.NetAmount;
				const n = Number(raw);
				if (!Number.isNaN(n) && n > 0) {
					total += n;
					if (rawSample === undefined && raw != null) {
						rawSample = String(raw);
					}
				}
			}
		}
	}

	return { amount: total, rawSample };
}

/** Match Pricing doc sample: integer string when fare has no decimals, else 2 dp. */
export function formatAiriqBookTotalAmount(
	amount: number,
	rawSample?: string
): string {
	const rounded = Math.round(amount * 100) / 100;
	const sample = rawSample?.trim();
	if (sample && /^\d+$/.test(sample)) {
		return String(Math.round(rounded));
	}
	if (sample && /^\d+\.\d{1,2}$/.test(sample)) {
		return rounded.toFixed(2);
	}
	if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
		return String(Math.round(rounded));
	}
	return rounded.toFixed(2);
}

export function getBookTotalAmountStringFromPriceInfo(
	priceInfo: PriceItenaryInfoItem
): string {
	const { amount, rawSample } = getGrossAmountFromPriceInfo(priceInfo);
	return formatAiriqBookTotalAmount(amount, rawSample);
}

/** Resolve SSR line amount from Pricing AvailabilityResponse (not UI estimates). */
export function lookupSsrAmountFromPriceInfo(
	priceInfo: PriceItenaryInfoItem,
	kind: "baggage" | "meal" | "seat" | "other",
	id: string
): number {
	const avail = priceInfo.AvailabilityResponse?.[0];
	if (!avail || !id) return 0;

	if (kind === "baggage") {
		const row = avail.Bagg?.find(
			(b) => b.BaggageID === id || (b as { Id?: string }).Id === id
		);
		return Number(row?.Amount || 0);
	}
	if (kind === "meal") {
		const row = avail.Meal?.find(
			(m) => m.MealID === id || (m as { Id?: string }).Id === id
		);
		return Number(row?.Amount || 0);
	}
	if (kind === "other") {
		const row = avail.OtherService?.find(
			(o) => o.OtherID === id || (o as { Id?: string }).Id === id
		);
		return Number(row?.Amount || 0);
	}

	return 0;
}

export function resolveFareMaskingForBook(options: {
	pricingData: AiriqPricingResponse;
	flightNumbers: string[];
}): boolean {
	const fromPricing = getFareMaskingFromPricing(options.pricingData);
	if (fromPricing !== undefined) return fromPricing;
	if (isIndigoItinerary(options.flightNumbers)) return false;
	return false;
}

/**
 * Merge GetMultiClassFare result with Pricing so Book gets AvailabilityResponse.Token
 * and AllowBlockPNR / SSR lists from Pricing when available.
 */
export function mergeMulticlassFareWithPricing(
	multiclass: AiriqGetMultiClassFareResponse,
	pricingData: AiriqPricingResponse | null
): AiriqPricingResponse | null {
	if (!multiclass.Trackid || !multiclass.FlightDetails?.length) {
		return null;
	}

	const grossAmount = (multiclass.Fares?.[0]?.Faredescription || []).reduce(
		(sum, p) => sum + Number(p.GrossAmount || 0),
		0
	);

	const mcFlights = multiclass.FlightDetails.map((fd) => ({
		FlightID: fd.FlightID,
		FlightNumber: fd.FlightNumber,
		Origin: fd.Origin,
		Destination: fd.Destination,
		DepartureDateTime: fd.DepartureDateTime,
		ArrivalDateTime: fd.ArrivalDateTime,
	}));

	const pricingPi = pricingData
		? normalizePriceItenaryInfo(pricingData)[0]
		: undefined;
	const pricingAvail = pricingPi?.AvailabilityResponse?.[0];

	const availabilityResponse = pricingAvail
		? [
				{
					...pricingAvail,
					Token:
						(typeof pricingAvail.Token === "string" && pricingAvail.Token) ||
						multiclass.Trackid,
					Flights: mcFlights,
				},
		  ]
		: [
				{
					Token: multiclass.Trackid,
					Flights: mcFlights,
				},
		  ];

	return {
		PriceItenaryInfo: [
			{
				Trackid: multiclass.Trackid,
				GrossAmount: grossAmount,
				FlightDetails: multiclass.FlightDetails.map((fd) => ({
					FlightID: fd.FlightID,
					FlightNumber: fd.FlightNumber,
					Origin: fd.Origin,
					Destination: fd.Destination,
					DepartureDateTime: fd.DepartureDateTime,
					ArrivalDateTime: fd.ArrivalDateTime,
				})),
				AvailabilityResponse: availabilityResponse,
			},
		],
		ResponseStatus: multiclass.Status ?? pricingData?.ResponseStatus,
	};
}

function firstPriceItenaryInfo(
	pricing: AiriqPricingResponse | null | undefined,
): PriceItenaryInfoItem | undefined {
	const info = pricing?.PriceItenaryInfo;
	if (!info) return undefined;
	return Array.isArray(info) ? info[0] : info;
}

/** Passport required at book from search FareQuote flags or pricing MandatoryBookingDetails. */
export function deriveAiriqPassportFlags(
	flight: FlightResult | null | undefined,
	pricing: AiriqPricingResponse | null | undefined,
): { requirePassport: boolean } {
	const fromFlight = flight?.IsPassportRequiredAtBook === true;
	const fromPricing =
		firstPriceItenaryInfo(pricing)?.MandatoryBookingDetails?.PassportRequired === true;
	return { requirePassport: fromFlight || fromPricing };
}

/** Passport flags from AIRiQ availability/search item (before pricing). */
export function extractAiriqSearchPassportFlags(item: unknown): {
	isPassportRequiredAtBook: boolean;
	isPassportRequiredAtTicket: boolean;
} {
	let isPassportRequiredAtBook = false;
	let isPassportRequiredAtTicket = false;

	const visit = (record: unknown) => {
		if (!record || typeof record !== "object") return;
		const r = record as Record<string, unknown>;
		if ("IsPassportRequiredAtBook" in r) {
			isPassportRequiredAtBook =
				isPassportRequiredAtBook || parseAiriqBoolean(r.IsPassportRequiredAtBook);
		}
		if ("IsPassportRequiredAtTicket" in r) {
			isPassportRequiredAtTicket =
				isPassportRequiredAtTicket || parseAiriqBoolean(r.IsPassportRequiredAtTicket);
		}
		const mbd = r.MandatoryBookingDetails;
		if (mbd && typeof mbd === "object") {
			const passportRequired = (mbd as Record<string, unknown>).PassportRequired;
			if (passportRequired !== undefined) {
				isPassportRequiredAtBook =
					isPassportRequiredAtBook || parseAiriqBoolean(passportRequired);
			}
		}
	};

	visit(item);
	if (item && typeof item === "object") {
		const root = item as Record<string, unknown>;
		const fares = root.Fares;
		if (Array.isArray(fares)) fares.forEach(visit);
		const flightDetails = root.FlightDetails;
		if (Array.isArray(flightDetails)) flightDetails.forEach(visit);
	}

	return { isPassportRequiredAtBook, isPassportRequiredAtTicket };
}
