/**
 * AIRiQ book/pricing/seat-map payload builders — aligned with scripts/airiq-uat-runner.mjs.
 * Keep in sync when UAT runner booking logic changes.
 */

import type {
	AiriqItineraryFlightsInfo,
	AiriqPricingResponse,
} from "@/types/airiq";
import {
	formatAiriqBookTotalAmount,
	getGrossAmountFromPriceInfo,
	lookupSsrAmountFromPriceInfo,
	normalizePriceItenaryInfo,
} from "@/lib/airiqBookingHelpers";

type PriceItenaryInfoItem = NonNullable<
	AiriqPricingResponse["PriceItenaryInfo"]
>[number];

type FareDescriptionRow = {
	Paxtype?: string;
	BaseAmount?: string | number;
	GrossAmount?: string | number;
	NetAmount?: string | number;
};

type AiriqSearchFares = {
	Faredescription?: FareDescriptionRow[];
};

type AiriqFlightSegment = {
	FlightID?: string;
	FlightNumber?: string;
	Origin?: string;
	Destination?: string;
	DepartureDateTime?: string;
	ArrivalDateTime?: string;
	ItinRef?: string | number;
	SegRef?: string | number;
};

export type AiriqReturnMode = "oneway" | "paired" | "combined";

export interface AiriqPaxCounts {
	adults: number;
	children: number;
	infants: number;
}

export interface AiriqBookSsrSeatSelection {
	seatId: string;
	paxRefNumber: number;
	amount: number;
	segRef?: string;
	itinRef?: string;
	origin?: string;
	destination?: string;
}

export interface AiriqProdSsrData {
	baggage?: Record<string, { Id: string; Price: number } | null>;
	meals?: Record<string, { Id: string; Price: number } | null>;
	seats?: Record<string, { SeatID: string; Price: number } | null>;
	otherServices?: Record<string, { Id: string; Price: number } | null>;
}

export interface AiriqBookPayloadContext {
	tripType: string;
	returnMode?: AiriqReturnMode;
	isInternational?: boolean;
}

const DOMESTIC_AIRPORTS = new Set([
	"DEL", "BOM", "MAA", "CCU", "BLR", "HYD", "PNQ", "GOI", "COK", "AMD",
	"IXC", "JAI", "LKO", "PAT", "BHO", "NAG", "IXB", "GAU", "TRV", "IXM",
	"ATQ", "SXR", "JDH", "UDR", "VNS", "IXR", "RPR", "VGA", "IXA", "DIB",
	"IXS", "IMF", "HJR", "JLR", "BDQ", "GWL", "IDR", "NDC", "NMB", "ISK",
]);

export function parseAiriqAmount(value: unknown): number {
	if (value == null || value === "") return 0;
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	const cleaned = String(value).replace(/[^\d.]/g, "");
	const n = Number.parseFloat(cleaned);
	return Number.isNaN(n) ? 0 : n;
}

export function isDomesticAirport(code: string): boolean {
	return DOMESTIC_AIRPORTS.has(String(code || "").trim().toUpperCase());
}

export function isInternationalRoute(
	airportCodes: string[]
): boolean {
	return airportCodes.some((code) => !isDomesticAirport(code));
}

function paxMultiplierForFareRow(
	paxType: string | undefined,
	counts: AiriqPaxCounts
): number {
	const t = String(paxType || "ADT").toUpperCase();
	if (t === "CHD" || t === "CNN") return counts.children;
	if (t === "INF" || t === "IN") return counts.infants;
	return counts.adults;
}

/** Sum Faredescription rows with per-pax multipliers (UAT sumFareRows). */
export function sumFareRowsFromSearchFares(
	fares: AiriqSearchFares[] | undefined,
	counts: AiriqPaxCounts,
	fallback?: { baseAmount?: number; grossAmount?: number }
): {
	baseAmount: number;
	grossAmount: number;
	sampleBase?: string;
	sampleGross?: string;
} {
	let base = 0;
	let gross = 0;
	let sampleBase: string | undefined;
	let sampleGross: string | undefined;
	const rows = fares?.[0]?.Faredescription || [];

	for (const row of rows) {
		const m = paxMultiplierForFareRow(row.Paxtype, counts);
		if (m <= 0) continue;
		const rowBase = parseAiriqAmount(row.BaseAmount);
		const rowGross = parseAiriqAmount(row.GrossAmount ?? row.NetAmount);
		base += rowBase * m;
		gross += rowGross * m;
		if (sampleBase == null && row.BaseAmount != null) {
			sampleBase = String(row.BaseAmount);
		}
		if (sampleGross == null && (row.GrossAmount ?? row.NetAmount) != null) {
			sampleGross = String(row.GrossAmount ?? row.NetAmount);
		}
	}

	if (gross <= 0 && fallback?.grossAmount && fallback.grossAmount > 0) {
		gross = fallback.grossAmount;
		base = fallback.baseAmount ?? fallback.grossAmount;
	}

	return { baseAmount: base, grossAmount: gross, sampleBase, sampleGross };
}

export function flightsFromPriceInfo(
	priceInfo: PriceItenaryInfoItem | undefined
): AiriqFlightSegment[] {
	if (!priceInfo) return [];
	return (
		priceInfo.AvailabilityResponse?.[0]?.Flights ||
		priceInfo.FlightDetails ||
		[]
	);
}

export function splitCombinedReturnPriceInfos(
	priceInfos: PriceItenaryInfoItem[]
): PriceItenaryInfoItem[] {
	if (priceInfos.length !== 1) return priceInfos;
	const pi = priceInfos[0];
	const flights = flightsFromPriceInfo(pi);
	if (flights.length < 2) return priceInfos;

	const groups = new Map<string, AiriqFlightSegment[]>();
	for (const f of flights) {
		const key = String(f.ItinRef ?? "0");
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(f);
	}
	if (groups.size < 2) return priceInfos;

	const avail0 = pi.AvailabilityResponse?.[0] || {};
	return [...groups.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([, legFlights]) => ({
			...pi,
			FlightDetails: legFlights as PriceItenaryInfoItem["FlightDetails"],
			AvailabilityResponse: [
				{
					...avail0,
					Flights: legFlights as NonNullable<
						PriceItenaryInfoItem["AvailabilityResponse"]
					>[number]["Flights"],
				},
			],
		})) as PriceItenaryInfoItem[];
}

export function detectReturnModeFromPricing(
	pricingData: AiriqPricingResponse,
	tripType: string,
	hasSeparateReturnFlight: boolean
): AiriqReturnMode {
	if (tripType !== "R" && tripType !== "Y") return "oneway";
	const priceInfos = normalizePriceItenaryInfo(pricingData);
	if (priceInfos.length >= 2 || hasSeparateReturnFlight) return "paired";
	if (priceInfos.length === 1) {
		const flights = flightsFromPriceInfo(priceInfos[0]);
		const itinRefs = new Set(
			flights.map((f) => String(f.ItinRef ?? "0"))
		);
		if (itinRefs.size >= 2) return "combined";
	}
	return "paired";
}

export function shouldSplitCombinedReturnPriceInfos(
	ctx: AiriqBookPayloadContext,
	priceInfos: PriceItenaryInfoItem[]
): boolean {
	if (
		(ctx.tripType !== "R" && ctx.tripType !== "Y") ||
		ctx.returnMode !== "combined"
	) {
		return false;
	}
	if (priceInfos.length !== 1) return false;
	if (ctx.isInternational) return false;
	const flights = flightsFromPriceInfo(priceInfos[0]);
	const itinRefs = new Set(flights.map((f) => String(f.ItinRef ?? "0")));
	return itinRefs.size >= 2;
}

export function getBookAmountFromPriceInfo(
	priceInfo: PriceItenaryInfoItem,
	options: {
		combinedSplitFromSingle?: boolean;
		legIndex?: number;
		legCount?: number;
	} = {}
): string {
	const { combinedSplitFromSingle, legIndex = 0, legCount = 1 } = options;
	if (combinedSplitFromSingle && legCount > 1 && legIndex > 0) {
		return formatAiriqBookTotalAmount(0, "0");
	}

	const top = parseAiriqAmount(priceInfo.GrossAmount);
	if (top > 0) {
		return formatAiriqBookTotalAmount(top, String(priceInfo.GrossAmount));
	}

	const { amount, rawSample } = getGrossAmountFromPriceInfo(priceInfo);
	return formatAiriqBookTotalAmount(amount, rawSample);
}

type SegmentMeta = {
	legIndex: number;
	segRef: string;
	itinRef: string;
	origin: string;
	destination: string;
	flatIndex: number;
};

function buildSegmentMeta(
	priceInfos: PriceItenaryInfoItem[]
): SegmentMeta[] {
	const meta: SegmentMeta[] = [];
	let flatIndex = 0;
	priceInfos.forEach((pi, legIndex) => {
		const flights = flightsFromPriceInfo(pi);
		flights.forEach((f, i) => {
			meta.push({
				legIndex,
				segRef: String(f.SegRef ?? i + 1),
				itinRef: String(f.ItinRef ?? legIndex),
				origin: f.Origin || "",
				destination: f.Destination || "",
				flatIndex,
			});
			flatIndex += 1;
		});
	});
	return meta;
}

function parseSsrKey(key: string): { paxRef: number; segIdx: number } | null {
	const match = key.match(/^(\d+)-(\d+)$/);
	if (!match) {
		const paxOnly = key.match(/(\d+)/);
		return paxOnly
			? { paxRef: parseInt(paxOnly[1], 10) + 1, segIdx: 0 }
			: null;
	}
	return {
		paxRef: parseInt(match[1], 10) + 1,
		segIdx: parseInt(match[2], 10),
	};
}

function buildSeatSelectionsFromSsrData(
	ssrData: AiriqProdSsrData | undefined,
	segmentMeta: SegmentMeta[]
): AiriqBookSsrSeatSelection[] {
	const selections: AiriqBookSsrSeatSelection[] = [];
	if (!ssrData?.seats) return selections;

	for (const [key, seat] of Object.entries(ssrData.seats)) {
		if (!seat) continue;
		const parsed = parseSsrKey(key);
		if (!parsed) continue;
		const meta = segmentMeta[parsed.segIdx];
		if (!meta) continue;
		selections.push({
			seatId: seat.SeatID,
			paxRefNumber: parsed.paxRef,
			amount: seat.Price || 0,
			segRef: meta.segRef,
			itinRef: meta.itinRef,
			origin: meta.origin,
			destination: meta.destination,
		});
	}
	return selections;
}

function seatOnLeg(
	sel: AiriqBookSsrSeatSelection,
	_legIndex: number,
	legSegRefs: Set<string>,
	legItinRefs: Set<string>,
	legFlightKeys: Set<string>,
	legCount: number
): boolean {
	if (sel.itinRef && legItinRefs.has(String(sel.itinRef))) return true;
	if (
		sel.origin &&
		sel.destination &&
		legFlightKeys.has(`${sel.origin}|${sel.destination}`)
	) {
		return true;
	}
	return (
		legCount === 1 &&
		legSegRefs.size > 0 &&
		Boolean(sel.segRef && legSegRefs.has(String(sel.segRef)))
	);
}

export function buildItineraryFlightsInfoFromPricing(
	pricingData: AiriqPricingResponse,
	ssrData: AiriqProdSsrData | undefined,
	ctx: AiriqBookPayloadContext
): AiriqItineraryFlightsInfo[] {
	const rawPriceInfos = normalizePriceItenaryInfo(pricingData);
	let priceInfos = rawPriceInfos;
	if (shouldSplitCombinedReturnPriceInfos(ctx, priceInfos)) {
		priceInfos = splitCombinedReturnPriceInfos(priceInfos);
	}
	const combinedSplitFromSingle =
		rawPriceInfos.length === 1 && priceInfos.length > 1;
	const segmentMeta = buildSegmentMeta(priceInfos);
	const seatSelections = buildSeatSelectionsFromSsrData(ssrData, segmentMeta);
	const out: AiriqItineraryFlightsInfo[] = [];

	for (let legIndex = 0; legIndex < priceInfos.length; legIndex++) {
		const priceInfo = priceInfos[legIndex];
		const avail = priceInfo.AvailabilityResponse?.[0];
		const token =
			avail?.Token || priceInfo.Trackid || rawPriceInfos[0]?.Trackid || "";
		const flights = flightsFromPriceInfo(priceInfo);
		const payment = getBookAmountFromPriceInfo(priceInfo, {
			combinedSplitFromSingle,
			legIndex,
			legCount: priceInfos.length,
		});
		const baseFare = parseAiriqAmount(payment);

		const legSegRefs = new Set(
			flights.map((f) => String(f.SegRef)).filter(Boolean)
		);
		const legItinRefs = new Set(
			flights.map((f) => String(f.ItinRef ?? legIndex)).filter(Boolean)
		);
		const legFlightKeys = new Set(
			flights.map((f) => `${f.Origin}|${f.Destination}`)
		);

		const leg: AiriqItineraryFlightsInfo = {
			Token: token,
			FlightsInfo: flights.map((f) => ({
				FlightID: f.FlightID || "",
				FlightNumber: f.FlightNumber || "",
				Origin: f.Origin || "",
				Destination: f.Destination || "",
				DepartureDateTime: f.DepartureDateTime || "",
				ArrivalDateTime: f.ArrivalDateTime || "",
			})),
			PaymentMode: "T",
			SeatsSSRInfo: [],
			BaggSSRInfo: [],
			MealsSSRInfo: [],
			OtherSSRInfo: [],
			PaymentInfo: [{ TotalAmount: payment }],
		};

		let totalSsr = 0;

		if (ssrData?.meals) {
			for (const [key, meal] of Object.entries(ssrData.meals)) {
				if (!meal) continue;
				const parsed = parseSsrKey(key);
				if (!parsed) continue;
				const meta = segmentMeta[parsed.segIdx];
				if (!meta || meta.legIndex !== legIndex) continue;
				const mealAmount = lookupSsrAmountFromPriceInfo(
					priceInfo,
					"meal",
					meal.Id
				);
				totalSsr += mealAmount > 0 ? mealAmount : meal.Price || 0;
				leg.MealsSSRInfo!.push({
					MealID: meal.Id,
					PaxRefNumber: parsed.paxRef,
				});
			}
		}

		if (ssrData?.baggage) {
			for (const [key, bag] of Object.entries(ssrData.baggage)) {
				if (!bag) continue;
				const parsed = parseSsrKey(key);
				if (!parsed) continue;
				const meta = segmentMeta[parsed.segIdx];
				if (!meta || meta.legIndex !== legIndex) continue;
				const baggAmount = lookupSsrAmountFromPriceInfo(
					priceInfo,
					"baggage",
					bag.Id
				);
				totalSsr += baggAmount > 0 ? baggAmount : bag.Price || 0;
				leg.BaggSSRInfo!.push({
					BaggageID: bag.Id,
					PaxRefNumber: parsed.paxRef,
				});
			}
		}

		if (ssrData?.otherServices) {
			for (const [key, svc] of Object.entries(ssrData.otherServices)) {
				if (!svc) continue;
				const parsed = parseSsrKey(key);
				if (!parsed) continue;
				const meta = segmentMeta[parsed.segIdx];
				if (!meta || meta.legIndex !== legIndex) continue;
				const otherAmount = lookupSsrAmountFromPriceInfo(
					priceInfo,
					"other",
					svc.Id
				);
				totalSsr += otherAmount > 0 ? otherAmount : svc.Price || 0;
				leg.OtherSSRInfo!.push({
					OtherSSRID: svc.Id,
					PaxRefNumber: parsed.paxRef,
				});
			}
		}

		for (const sel of seatSelections) {
			if (
				!seatOnLeg(
					sel,
					legIndex,
					legSegRefs,
					legItinRefs,
					legFlightKeys,
					priceInfos.length
				)
			) {
				continue;
			}
			leg.SeatsSSRInfo!.push({
				SeatID: sel.seatId,
				PaxRefNumber: sel.paxRefNumber,
			});
			totalSsr += sel.amount;
		}

		const expectedTotal = baseFare + totalSsr;
		leg.PaymentInfo = [
			{ TotalAmount: formatAiriqBookTotalAmount(expectedTotal, payment) },
		];
		out.push(leg);
	}

	return out;
}

/** Outbound sector endpoints for combined return (intl: last OB segment). */
export function resolveCombinedReturnBaseEndpoints(
	pricingData: AiriqPricingResponse,
	itineraryFlightsInfo: AiriqItineraryFlightsInfo[]
): { baseOrigin: string; baseDestination: string } {
	const firstLeg = itineraryFlightsInfo[0]?.FlightsInfo || [];
	const priceInfo = normalizePriceItenaryInfo(pricingData)[0];
	const pricingFlights = flightsFromPriceInfo(priceInfo);
	const obFromPricing = pricingFlights.filter(
		(f) => String(f.ItinRef ?? "0") === "0"
	);

	if (obFromPricing.length) {
		return {
			baseOrigin: obFromPricing[0]?.Origin || "",
			baseDestination:
				obFromPricing[obFromPricing.length - 1]?.Destination || "",
		};
	}

	if (itineraryFlightsInfo.length > 1) {
		return {
			baseOrigin: firstLeg[0]?.Origin || "",
			baseDestination: firstLeg[firstLeg.length - 1]?.Destination || "",
		};
	}

	const baseOrigin = firstLeg[0]?.Origin || "";
	const baseOriginUpper = String(baseOrigin).toUpperCase();
	let obEndIndex = firstLeg.length;
	for (let i = 0; i < firstLeg.length; i++) {
		if (
			String(firstLeg[i]?.Destination || "").toUpperCase() === baseOriginUpper
		) {
			obEndIndex = i;
			break;
		}
	}
	const outbound = firstLeg.slice(0, obEndIndex);
	const segments = outbound.length ? outbound : firstLeg;
	return {
		baseOrigin: segments[0]?.Origin || baseOrigin,
		baseDestination: segments[segments.length - 1]?.Destination || "",
	};
}

export function resolveBookBaseEndpoints(
	pricingData: AiriqPricingResponse,
	itineraryFlightsInfo: AiriqItineraryFlightsInfo[],
	ctx: AiriqBookPayloadContext
): { baseOrigin: string; baseDestination: string } {
	const firstLeg = itineraryFlightsInfo[0]?.FlightsInfo || [];
	const lastLeg =
		itineraryFlightsInfo[itineraryFlightsInfo.length - 1]?.FlightsInfo || [];

	if (
		(ctx.tripType === "R" || ctx.tripType === "Y") &&
		ctx.returnMode === "combined"
	) {
		return resolveCombinedReturnBaseEndpoints(
			pricingData,
			itineraryFlightsInfo
		);
	}

	return {
		baseOrigin: firstLeg[0]?.Origin || "",
		baseDestination: lastLeg[lastLeg.length - 1]?.Destination || "",
	};
}

export function sumBookPaymentFromItinerary(
	itineraryFlightsInfo: AiriqItineraryFlightsInfo[]
): string {
	let total = 0;
	for (const leg of itineraryFlightsInfo) {
		for (const p of leg.PaymentInfo || []) {
			total += parseAiriqAmount(p.TotalAmount);
		}
	}
	return formatAiriqBookTotalAmount(total, undefined);
}

export function shouldUseCombinedRoundTripSeatMap(
	ctx: AiriqBookPayloadContext,
	priceInfos: PriceItenaryInfoItem[]
): boolean {
	return (
		ctx.tripType === "R" &&
		ctx.returnMode === "paired" &&
		!ctx.isInternational &&
		priceInfos.length >= 2
	);
}

export function resolveSeatMapTripType(
	tripType: string,
	flights: AiriqFlightSegment[]
): string {
	if (tripType !== "R") return tripType;
	const itinRefs = new Set(flights.map((f) => String(f.ItinRef ?? "0")));
	if (itinRefs.size >= 2) return "R";
	return "O";
}

export type AiriqSeatMapRequestPayload = {
	SegmentInfo: {
		BaseOrigin: string;
		BaseDestination: string;
		TripType: string;
	};
	FlightsInfo: Array<{
		FlightID: string;
		FlightNumber: string;
		Origin: string;
		Destination: string;
		DepartureDateTime: string;
		ArrivalDateTime: string;
	}>;
	TrackId: string;
};

export function buildCombinedRoundTripSeatMapPayload(
	priceInfos: PriceItenaryInfoItem[],
	origin: string
): AiriqSeatMapRequestPayload {
	const allFlights = priceInfos.flatMap((pi) => flightsFromPriceInfo(pi));
	return {
		SegmentInfo: {
			BaseOrigin: origin,
			BaseDestination: origin,
			TripType: "R",
		},
		FlightsInfo: allFlights.map((f) => ({
			FlightID: f.FlightID || "",
			FlightNumber: f.FlightNumber || "",
			Origin: f.Origin || "",
			Destination: f.Destination || "",
			DepartureDateTime: f.DepartureDateTime || "",
			ArrivalDateTime: f.ArrivalDateTime || "",
		})),
		TrackId: priceInfos[0]?.Trackid || "",
	};
}

export function buildSeatMapPayloadForPriceInfo(
	priceInfo: PriceItenaryInfoItem,
	options: {
		tripType: string;
		origin?: string;
		destination?: string;
	}
): AiriqSeatMapRequestPayload {
	const flights = flightsFromPriceInfo(priceInfo);
	const tripType = resolveSeatMapTripType(options.tripType, flights);
	return {
		SegmentInfo: {
			BaseOrigin: flights[0]?.Origin || options.origin || "",
			BaseDestination:
				flights[flights.length - 1]?.Destination ||
				options.destination ||
				"",
			TripType: tripType,
		},
		FlightsInfo: flights.map((f) => ({
			FlightID: f.FlightID || "",
			FlightNumber: f.FlightNumber || "",
			Origin: f.Origin || "",
			Destination: f.Destination || "",
			DepartureDateTime: f.DepartureDateTime || "",
			ArrivalDateTime: f.ArrivalDateTime || "",
		})),
		TrackId: priceInfo.Trackid || "",
	};
}

export type AiriqPricingItineraryInput = {
	flightDetails: Array<{
		FlightID: string;
		FlightNumber: string;
		Origin: string;
		Destination: string;
		DepartureDateTime: string;
		ArrivalDateTime: string;
	}>;
	fares?: AiriqSearchFares[];
	fallback?: { baseAmount?: number; grossAmount?: number };
};

/** Build Pricing ItineraryInfo[] aligned with UAT buildPricingRequest. */
export function buildPricingItineraryInfo(
	inputs: {
		onward: AiriqPricingItineraryInput;
		return?: AiriqPricingItineraryInput | null;
	},
	counts: AiriqPaxCounts,
	ctx: { tripType: string; returnMode: AiriqReturnMode }
): Array<{
	FlightDetails: AiriqPricingItineraryInput["flightDetails"];
	BaseAmount: string;
	GrossAmount: string;
}> {
	const onwardFare = sumFareRowsFromSearchFares(
		inputs.onward.fares,
		counts,
		inputs.onward.fallback
	);

	if (ctx.tripType === "Y") {
		if (ctx.returnMode === "paired" && inputs.return) {
			const returnFare = sumFareRowsFromSearchFares(
				inputs.return.fares,
				counts,
				inputs.return.fallback
			);
			return [
				{
					FlightDetails: [
						...inputs.onward.flightDetails,
						...inputs.return.flightDetails,
					],
					BaseAmount: formatAiriqBookTotalAmount(
						onwardFare.baseAmount + returnFare.baseAmount,
						onwardFare.sampleBase
					),
					GrossAmount: formatAiriqBookTotalAmount(
						onwardFare.grossAmount + returnFare.grossAmount,
						onwardFare.sampleGross
					),
				},
			];
		}
		const fare = onwardFare;
		return [
			{
				FlightDetails: inputs.onward.flightDetails,
				BaseAmount: formatAiriqBookTotalAmount(
					fare.baseAmount,
					fare.sampleBase
				),
				GrossAmount: formatAiriqBookTotalAmount(
					fare.grossAmount,
					fare.sampleGross
				),
			},
		];
	}

	if (ctx.tripType === "R" && ctx.returnMode === "combined") {
		const fare = onwardFare;
		return [
			{
				FlightDetails: inputs.onward.flightDetails,
				BaseAmount: formatAiriqBookTotalAmount(
					fare.baseAmount,
					fare.sampleBase
				),
				GrossAmount: formatAiriqBookTotalAmount(
					fare.grossAmount,
					fare.sampleGross
				),
			},
		];
	}

	const onwardItin = {
		FlightDetails: inputs.onward.flightDetails,
		BaseAmount: formatAiriqBookTotalAmount(
			onwardFare.baseAmount,
			onwardFare.sampleBase
		),
		GrossAmount: formatAiriqBookTotalAmount(
			onwardFare.grossAmount,
			onwardFare.sampleGross
		),
	};

	if (ctx.tripType === "R" && inputs.return) {
		const returnFare = sumFareRowsFromSearchFares(
			inputs.return.fares,
			counts,
			inputs.return.fallback
		);
		return [
			onwardItin,
			{
				FlightDetails: inputs.return.flightDetails,
				BaseAmount: formatAiriqBookTotalAmount(
					returnFare.baseAmount,
					returnFare.sampleBase
				),
				GrossAmount: formatAiriqBookTotalAmount(
					returnFare.grossAmount,
					returnFare.sampleGross
				),
			},
		];
	}

	return [onwardItin];
}

export function detectPricingReturnMode(
	tripType: string,
	hasReturnFlightObject: boolean,
	onwardFlightDetails: AiriqFlightSegment[]
): AiriqReturnMode {
	if (tripType !== "R" && tripType !== "Y") return "oneway";
	if (hasReturnFlightObject) return "paired";
	const itinRefs = new Set(
		onwardFlightDetails.map((f) => String(f.ItinRef ?? "0"))
	);
	if (itinRefs.size >= 2) return "combined";
	return "paired";
}
