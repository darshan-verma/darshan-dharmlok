import { randomUUID } from "crypto";
import type {
	Fare,
	FlightResult,
	FlightSearchResponse,
	FlightSegmentDetail,
} from "@/types/tbo";
import type {
	TripjackAirSearchRequest,
	TripjackCabinClass,
	TripjackFareComponent,
	TripjackPaxFareDetail,
	TripjackAirSearchResponse,
	TripjackPriceListEntry,
	TripjackSegmentInfo,
	TripjackTripInfo,
	TripjackPft,
} from "@/types/tripjackFlight";
import { calculateNetPayable } from "@/lib/tboFareCalculations";

function toYyyyMmDd(dateStr: string): string {
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return dateStr.slice(0, 10);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function tboCabinToTripjack(cabin: string | undefined): TripjackCabinClass {
	const c = cabin || "1";
	const map: Record<string, TripjackCabinClass> = {
		"1": "ECONOMY",
		"2": "ECONOMY",
		"3": "PREMIUM_ECONOMY",
		"4": "BUSINESS",
		"5": "BUSINESS",
		"6": "FIRST",
	};
	return map[c] || "ECONOMY";
}

function boolFromApi(s: string | boolean | undefined): boolean {
	if (s === true) return true;
	if (s === false) return false;
	return String(s).toLowerCase() === "true";
}

/**
 * Map UI / TBO-style POST body to TripJack `air-search-all` payload.
 * Returns `null` when TripJack should be skipped (e.g. multi-city — not in current scope).
 */
export function buildTripjackAirSearchRequest(body: {
	AdultCount?: string;
	ChildCount?: string;
	InfantCount?: string;
	FlightCabinClass?: string;
	JourneyType?: string;
	DirectFlight?: string | boolean;
	OneStopFlight?: string | boolean;
	Origin?: string;
	Destination?: string;
	PreferredDepartureTime?: string;
	ReturnPreferredDepartureTime?: string;
	Segments?: Array<{
		Origin: string;
		Destination: string;
		PreferredDepartureTime?: string;
		DepartureDateTime?: string;
	}>;
	pft?: TripjackPft | "";
	preferredAirlines?: Array<{ code: string }>;
	PreferredAirlines?: string[] | null;
}): TripjackAirSearchRequest | null {
	const journey = body.JourneyType || "1";
	if (journey === "3") return null;

	const adult = body.AdultCount || "1";
	const child = body.ChildCount || "0";
	const infant = body.InfantCount || "0";

	const routeInfos: TripjackAirSearchRequest["searchQuery"]["routeInfos"] = [];

	if (journey === "2") {
		if (
			!body.Origin ||
			!body.Destination ||
			!body.PreferredDepartureTime ||
			!body.ReturnPreferredDepartureTime
		) {
			return null;
		}
		routeInfos.push({
			fromCityOrAirport: { code: body.Origin.toUpperCase() },
			toCityOrAirport: { code: body.Destination.toUpperCase() },
			travelDate: toYyyyMmDd(body.PreferredDepartureTime),
		});
		routeInfos.push({
			fromCityOrAirport: { code: body.Destination.toUpperCase() },
			toCityOrAirport: { code: body.Origin.toUpperCase() },
			travelDate: toYyyyMmDd(body.ReturnPreferredDepartureTime),
		});
	} else {
		if (
			!body.Origin ||
			!body.Destination ||
			!body.PreferredDepartureTime
		) {
			return null;
		}
		routeInfos.push({
			fromCityOrAirport: { code: body.Origin.toUpperCase() },
			toCityOrAirport: { code: body.Destination.toUpperCase() },
			travelDate: toYyyyMmDd(body.PreferredDepartureTime),
		});
	}

	const direct = body.DirectFlight != null
		? boolFromApi(body.DirectFlight)
		: false;
	const oneStop = body.OneStopFlight != null
		? boolFromApi(body.OneStopFlight)
		: false;

	// Match TripJack / Postman: direct-only is explicit true/false; "both" leg types omit flags (doc).
	type TripjackMods = NonNullable<
		TripjackAirSearchRequest["searchQuery"]["searchModifiers"]
	>;
	const searchModifiers: Partial<TripjackMods> = {};

	if (direct && !oneStop) {
		searchModifiers.isDirectFlight = true;
		searchModifiers.isConnectingFlight = false;
	} else if (!direct && oneStop) {
		searchModifiers.isDirectFlight = false;
		searchModifiers.isConnectingFlight = true;
	} else if (direct && oneStop) {
		searchModifiers.isDirectFlight = true;
		searchModifiers.isConnectingFlight = true;
	}

	const pftRaw = body.pft;
	if (pftRaw === "STUDENT" || pftRaw === "SENIOR_CITIZEN") {
		searchModifiers.pft = pftRaw;
	}

	const preferredFromBody = body.preferredAirlines;
	const preferredFromTbo = body.PreferredAirlines;
	let preferredAirline: Array<{ code: string }> | undefined;
	if (preferredFromBody?.length) {
		preferredAirline = preferredFromBody
			.slice(0, 10)
			.map((x) => ({ code: x.code.toUpperCase() }));
	} else if (preferredFromTbo?.length) {
		preferredAirline = preferredFromTbo
			.slice(0, 10)
			.map((code) => ({ code: code.toUpperCase() }));
	}

	return {
		searchQuery: {
			cabinClass: tboCabinToTripjack(body.FlightCabinClass),
			paxInfo: {
				ADULT: adult,
				CHILD: child,
				INFANT: infant,
			},
			routeInfos,
			...(Object.keys(searchModifiers).length > 0
				? { searchModifiers: searchModifiers as TripjackMods }
				: {}),
			...(preferredAirline?.length ? { preferredAirline } : {}),
		},
	};
}

export type TripjackPriceMeta = {
	traceId?: string;
	priceId?: string;
	fareIdentifier?: string;
	sri?: string;
	msri?: unknown[];
};

function normalizeMsri(msri: unknown): string[] {
	if (!Array.isArray(msri)) return [];
	return msri.map((x) => String(x));
}

/**
 * TripJack domestic round-trip: SPECIAL_RETURN onward/return price rows must pair per sri/msri (Case 2)
 * or both be Case 1 (empty msri, same airline). Other fare types pair freely.
 */
export function tripjackRoundTripFaresPairable(
	outbound: FlightResult,
	returnFlight: FlightResult,
): boolean {
	if (
		outbound.ApiSource !== "TRIPJACK" ||
		returnFlight.ApiSource !== "TRIPJACK"
	) {
		return true;
	}
	const o = (
		outbound as FlightResult & { _tripjackOriginal?: TripjackPriceMeta }
	)._tripjackOriginal;
	const r = (
		returnFlight as FlightResult & { _tripjackOriginal?: TripjackPriceMeta }
	)._tripjackOriginal;
	if (!o || !r) return false;

	const oSr = o.fareIdentifier === "SPECIAL_RETURN";
	const rSr = r.fareIdentifier === "SPECIAL_RETURN";
	if (oSr !== rSr) {
		return false;
	}
	if (!oSr) {
		return true;
	}

	const oMsri = normalizeMsri(o.msri);
	const rMsri = normalizeMsri(r.msri);
	const oSri = o.sri ? String(o.sri).trim() : "";
	const rSri = r.sri ? String(r.sri).trim() : "";

	// Case 1 (Without MSRI): both legs SPECIAL_RETURN; sri and msri empty — any open SR with same airline.
	const case1O = !oSri && oMsri.length === 0;
	const case1R = !rSri && rMsri.length === 0;
	// Case 2 (With MSRI): linked price rows — each sri appears in the other's msri.
	const case2O = !!oSri && oMsri.length > 0;
	const case2R = !!rSri && rMsri.length > 0;

	if (case1O && case1R) {
		return outbound.AirlineCode === returnFlight.AirlineCode;
	}
	if (case2O && case2R) {
		return oMsri.includes(rSri) && rMsri.includes(oSri);
	}
	// Mixing Case 1 with Case 2 or partial metadata is invalid for TripJack.
	return false;
}

function sumTafBreakup(afC: TripjackPaxFareDetail["afC"]): number {
	if (!afC?.TAF) return 0;
	return Object.values(afC.TAF).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
}

/** Sum per-pax TripJack `fd` into TBO-style totals (same logic as search results). */
export function aggregateFareFromFd(
	fd: TripjackPriceListEntry["fd"],
	adults: number,
	children: number,
	infants: number,
): {
	baseFare: number;
	tax: number;
	publishedFare: number;
	commission: number;
	tds: number;
	taxBreakup: Array<{ key: string; value: number }>;
} {
	let baseFare = 0;
	let tax = 0;
	let publishedFare = 0;
	let commission = 0;
	let tds = 0;
	const taxBreakup: Array<{ key: string; value: number }> = [];

	const take = (
		key: string,
		n: number,
		detail: TripjackPaxFareDetail | undefined,
	) => {
		if (!detail || n <= 0) return;
		const fc: TripjackFareComponent = detail.fC || {};
		const bf = fc.BF ?? 0;
		const taf = fc.TAF ?? 0;
		const tf = fc.TF ?? bf + taf;
		const ncm = fc.NCM ?? 0;
		baseFare += bf * n;
		tax += taf * n;
		publishedFare += tf * n;
		commission += ncm * n;
		const tafExtra = sumTafBreakup(detail.afC);
		if (tafExtra > 0 && taxBreakup.length < 20) {
			taxBreakup.push({ key: `${key}_TAF_DETAIL`, value: tafExtra * n });
		}
		const ncmBreak = detail.afC?.NCM;
		if (ncmBreak) {
			for (const [k, v] of Object.entries(ncmBreak)) {
				if (typeof v === "number" && v !== 0) {
					tds += k === "TDS" ? Math.abs(v) * n : 0;
				}
			}
		}
	};

	take("ADULT", adults, fd.ADULT);
	take("CHILD", children, fd.CHILD);
	take("INFANT", infants, fd.INFANT);

	return {
		baseFare,
		tax,
		publishedFare,
		commission,
		tds,
		taxBreakup,
	};
}

function mapTripjackSegmentToTbo(
	seg: TripjackSegmentInfo,
	index: number,
): FlightSegmentDetail {
	const depIso = new Date(seg.dt).toISOString();
	const arrIso = new Date(seg.at).toISOString();
	const terminal = (a: { terminal?: string }) => a.terminal || "";

	return {
		TripIndicator: 1,
		SegmentIndicator: index + 1,
		Airline: {
			AirlineCode: seg.fD?.aI?.code || "",
			AirlineName: seg.fD?.aI?.name || "",
			FlightNumber: String(seg.fD?.fN ?? ""),
			FareClass: "",
			OperatingCarrier: seg.fD?.aI?.code || "",
		},
		Origin: {
			Airport: {
				AirportCode: seg.da?.code || "",
				AirportName: seg.da?.name || seg.da?.code || "",
				Terminal: terminal(seg.da),
				CityCode: seg.da?.cityCode || seg.da?.code || "",
				CityName: seg.da?.city || "",
				CountryCode: seg.da?.countryCode || "",
				CountryName: seg.da?.country || "",
			},
			DepTime: depIso,
		},
		Destination: {
			Airport: {
				AirportCode: seg.aa?.code || "",
				AirportName: seg.aa?.name || seg.aa?.code || "",
				Terminal: terminal(seg.aa),
				CityCode: seg.aa?.cityCode || seg.aa?.code || "",
				CityName: seg.aa?.city || "",
				CountryCode: seg.aa?.countryCode || "",
				CountryName: seg.aa?.country || "",
			},
			ArrTime: arrIso,
		},
		Duration: seg.duration ?? 0,
		GroundTime: 0,
		Mile: 0,
		StopOver: (seg.stops ?? 0) > 0,
		DepartureTime: seg.dt,
		ArrivalTime: seg.at,
		FlightStatus: "",
		StopPoint: seg.so?.map((s) => s.code).join(",") || "",
		StopPointArrivalTime: "",
		StopPointDepartureTime: "",
		Craft: seg.fD?.eT || "",
		Remark: null,
		IsETicketEligible: true,
		FlightInfoIndex: seg.id || String(index),
		AirlineRemark: "",
		Baggage: seg.fD ? undefined : undefined,
		CabinBaggage: undefined,
		Status: "",
		FareClassification: undefined,
	};
}

function firstPaxBaggage(fd: TripjackPriceListEntry["fd"]): {
	baggage?: string;
	cabin?: string;
} {
	const order: Array<keyof typeof fd> = ["ADULT", "CHILD", "INFANT"];
	for (const k of order) {
		const d = fd[k as string] as TripjackPaxFareDetail | undefined;
		if (d?.bI?.iB) {
			return {
				baggage: d.bI.iB,
				cabin: d.bI.cB,
			};
		}
	}
	return {};
}

function tripInfoToFlightResults(
	trips: TripjackTripInfo[],
	traceId: string,
	adults: number,
	children: number,
	infants: number,
): FlightResult[] {
	const out: FlightResult[] = [];

	for (const trip of trips) {
		const segments = trip.sI || [];
		if (!segments.length) continue;

		const tboSegs: FlightSegmentDetail[] = segments.map((s, i) =>
			mapTripjackSegmentToTbo(s, i),
		);
		const first = segments[0];
		const isLcc = first.fD?.aI?.isLcc === true;

		const prices = trip.totalPriceList || [];
		for (const pl of prices) {
			if (!pl?.id || !pl.fd) continue;

			const agg = aggregateFareFromFd(pl.fd, adults, children, infants);
			const adultFare = pl.fd.ADULT;
			const rT = adultFare?.rT ?? 0;
			const isRefundable = rT === 1;
			const { baggage, cabin } = firstPaxBaggage(pl.fd);

			const segsForFare: FlightSegmentDetail[] = tboSegs.map((s) => ({
				...s,
				...(baggage ? { Baggage: baggage } : {}),
				...(cabin ? { CabinBaggage: cabin } : {}),
			}));

			const fare: Fare = {
				Currency: "INR",
				BaseFare: agg.baseFare,
				Tax: agg.tax,
				TaxBreakup: agg.taxBreakup,
				YQTax: 0,
				AdditionalTxnFeeOfrd: 0,
				AdditionalTxnFeePub: 0,
				PGCharge: 0,
				OtherCharges: 0,
				ChargeBU: [] as Fare["ChargeBU"],
				Discount: 0,
				PublishedFare: agg.publishedFare,
				CommissionEarned: agg.commission,
				PLBEarned: 0,
				IncentiveEarned: 0,
				OfferedFare: agg.publishedFare,
				TdsOnCommission: agg.tds,
				TdsOnPLB: 0,
				TdsOnIncentive: 0,
				ServiceFee: 0,
				TotalBaggageCharges: 0,
				TotalMealCharges: 0,
				TotalSeatCharges: 0,
				TotalSpecialServiceCharges: 0,
				NetPayable: 0,
			};

			fare.NetPayable = calculateNetPayable(fare);

			const breakdown: FlightResult["FareBreakdown"] = [];
			if (adults > 0 && pl.fd.ADULT) {
				const fc = pl.fd.ADULT.fC;
				breakdown.push({
					PassengerType: 1,
					PassengerCount: adults,
					BaseFare: (fc.BF ?? 0) * adults,
					Tax: (fc.TAF ?? 0) * adults,
				});
			}
			if (children > 0 && pl.fd.CHILD) {
				const fc = pl.fd.CHILD.fC;
				breakdown.push({
					PassengerType: 2,
					PassengerCount: children,
					BaseFare: (fc.BF ?? 0) * children,
					Tax: (fc.TAF ?? 0) * children,
				});
			}
			if (infants > 0 && pl.fd.INFANT) {
				const fc = pl.fd.INFANT.fC;
				breakdown.push({
					PassengerType: 3,
					PassengerCount: infants,
					BaseFare: (fc.BF ?? 0) * infants,
					Tax: (fc.TAF ?? 0) * infants,
				});
			}

			out.push({
				ResultIndex: pl.id,
				Source: 3,
				IsLCC: isLcc,
				IsRefundable: isRefundable,
				IsUpsellAllowed: false,
				AirlineCode: first.fD?.aI?.code || "",
				ValidatingAirlineCode: first.fD?.aI?.code || "",
				ValidatingAirline: first.fD?.aI?.name || "",
				AirlineRemark: pl.fareIdentifier || "",
				ApiSource: "TRIPJACK",
				Fare: fare,
				FareBreakdown: breakdown,
				Segments: [segsForFare],
				_tripjackOriginal: {
					traceId,
					priceId: pl.id,
					fareIdentifier: pl.fareIdentifier,
					sri: pl.sri,
					msri: pl.msri,
				},
			} as FlightResult);
		}
	}

	return out;
}

/**
 * Convert TripJack `air-search-all` JSON to TBO-shaped `FlightSearchResponse`.
 */
export function convertTripjackSearchToTboFormat(
	raw: TripjackAirSearchResponse,
	journeyType: string,
	traceId: string = randomUUID(),
	pax: { adults: number; children: number; infants: number } = {
		adults: 1,
		children: 0,
		infants: 0,
	},
): FlightSearchResponse {
	const tripInfos = raw?.searchResult?.tripInfos;
	if (!tripInfos) {
		return {
			Response: {
				TraceId: traceId,
				Results: [[]],
				Origin: "",
				Destination: "",
				FlightCabinClass: 1,
			},
		};
	}

	const { adults, children, infants } = pax;

	if (journeyType === "2") {
		const onward = tripInfoToFlightResults(
			tripInfos.ONWARD || [],
			traceId,
			adults,
			children,
			infants,
		);
		const ret = tripInfoToFlightResults(
			tripInfos.RETURN || [],
			traceId,
			adults,
			children,
			infants,
		);
		return {
			Response: {
				TraceId: traceId,
				Results: [onward, ret],
				Origin: "",
				Destination: "",
				FlightCabinClass: 1,
			},
		};
	}

	const onward = tripInfoToFlightResults(
		tripInfos.ONWARD || [],
		traceId,
		adults,
		children,
		infants,
	);
	return {
		Response: {
			TraceId: traceId,
			Results: [onward],
			Origin: "",
			Destination: "",
			FlightCabinClass: 1,
		},
	};
}

export function isTripjackConfigured(): boolean {
	const key = process.env.TRIPJACK_API_KEY?.trim();
	if (!key) return false;
	const fmsBase =
		process.env.TRIPJACK_FMS_API_URL?.trim() ||
		process.env.TRIPJACK_STATIC_API_URL?.trim() ||
		process.env.TRIPJACK_API_URL?.trim();
	return Boolean(fmsBase);
}
