import { legsFromTripjackReviewTripInfos } from "@/lib/tripjackFlightBooking";
import type {
	TripjackReviewResponse,
	TripjackSsrCatalogItem,
	TripjackTravellerSsrEntry,
} from "@/types/tripjackFlight";
import type { BaggageOption } from "@/app/(frontend)/travel-portal/components/ssr/BaggageSelection";
import type { MealOption } from "@/app/(frontend)/travel-portal/components/ssr/MealSelection";
import type { SeatOption } from "@/app/(frontend)/travel-portal/components/ssr/SeatSelection";
import type { SpecialServiceOption } from "@/app/(frontend)/travel-portal/components/ssr/SpecialServiceSelection";
import type { PassengerDetail } from "@/types/tbo";

export interface TripjackFlatSegment {
	segmentKey: string;
	origin: string;
	dest: string;
	segmentIndex: number;
	ssrInfo?: import("@/types/tripjackFlight").TripjackSsrInfo;
}

export function tripjackFlatSegmentsFromReview(
	review: TripjackReviewResponse | null,
): TripjackFlatSegment[] {
	if (!review) return [];
	const legs = legsFromTripjackReviewTripInfos(review.tripInfos);
	const out: TripjackFlatSegment[] = [];
	let idx = 0;
	for (const leg of legs) {
		for (const seg of leg.sI || []) {
			const id = seg.id?.trim();
			if (!id) continue;
			out.push({
				segmentKey: id,
				origin: seg.da?.code || "",
				dest: seg.aa?.code || "",
				segmentIndex: idx,
				ssrInfo: seg.ssrInfo,
			});
			idx += 1;
		}
	}
	return out;
}

export function tripjackHasCatalogSsr(segments: TripjackFlatSegment[]): boolean {
	return segments.some(
		(s) =>
			(s.ssrInfo?.BAGGAGE?.length ?? 0) > 0 ||
			(s.ssrInfo?.MEAL?.length ?? 0) > 0 ||
			(s.ssrInfo?.SEAT?.length ?? 0) > 0,
	);
}

function selKey(pax: number, segmentIndex: number): string {
	return `${pax}-${segmentIndex}`;
}

/** All seated passengers have a physical seat on every segment (mandatory seat flows). */
export function tripjackPhysicalSeatsComplete(
	picks: TripjackSsrPickState,
	segments: TripjackFlatSegment[],
	seatedTravellers: number,
): boolean {
	if (!segments.length || seatedTravellers <= 0) return true;
	for (let p = 0; p < seatedTravellers; p++) {
		for (const seg of segments) {
			const k = selKey(p, seg.segmentIndex);
			if (!picks.physicalSeats[k]?.code) return false;
		}
	}
	return true;
}

/** Merge UAT-style auto seat picks into SSR pick state for book payload. */
export function tripjackMergeAutoSeatsIntoPicks(
	picks: TripjackSsrPickState,
	segments: TripjackFlatSegment[],
	seatByTraveller: Array<Array<{ key: string; code: string; amount?: number }>>,
): TripjackSsrPickState {
	const physicalSeats = { ...picks.physicalSeats };
	for (let p = 0; p < seatByTraveller.length; p++) {
		for (const seat of seatByTraveller[p] || []) {
			const seg = segments.find((s) => s.segmentKey === seat.key);
			if (!seg) continue;
			const k = selKey(p, seg.segmentIndex);
			if (physicalSeats[k]?.code) continue;
			physicalSeats[k] = {
				code: seat.code,
				amount: typeof seat.amount === "number" ? seat.amount : 0,
			};
		}
	}
	return { ...picks, physicalSeats };
}

export interface TripjackSsrPickState {
	baggage: Record<string, TripjackSsrCatalogItem | null>;
	meals: Record<string, TripjackSsrCatalogItem | null>;
	extraSeatServices: Record<string, TripjackSsrCatalogItem | null>;
	physicalSeats: Record<string, { code: string; amount: number } | null>;
}

export function emptyTripjackSsrPickState(): TripjackSsrPickState {
	return { baggage: {}, meals: {}, extraSeatServices: {}, physicalSeats: {} };
}

function toBaggageOption(
	item: TripjackSsrCatalogItem,
	origin: string,
	dest: string,
): BaggageOption {
	return {
		AirlineCode: "",
		FlightNumber: "",
		WayType: 0,
		Code: item.code,
		Description: 0,
		Weight: 0,
		Currency: "INR",
		Price: item.amount,
		Origin: origin,
		Destination: dest,
	};
}

function toMealOption(
	item: TripjackSsrCatalogItem,
	origin: string,
	dest: string,
): MealOption {
	return {
		AirlineCode: "",
		FlightNumber: "",
		WayType: 0,
		Code: item.code,
		Description: 0,
		AirlineDescription: item.desc,
		Quantity: 1,
		Currency: "INR",
		Price: item.amount,
		Origin: origin,
		Destination: dest,
	};
}

function toSeatOption(
	code: string,
	amount: number,
	origin: string,
	dest: string,
): SeatOption {
	return {
		AirlineCode: "",
		FlightNumber: "",
		CraftType: "",
		Origin: origin,
		Destination: dest,
		AvailablityType: 0,
		Description: 0,
		Code: code,
		RowNo: "",
		SeatNo: code,
		SeatType: 0,
		SeatWayType: 0,
		Compartment: 0,
		Deck: 0,
		Currency: "INR",
		Price: amount,
	};
}

/** Build TBO-shaped SSR maps for `PassengerDetails` / `FareBreakdown`. */
export function tripjackPicksToFareSsrShape(
	segments: TripjackFlatSegment[],
	picks: TripjackSsrPickState,
	adultCount: number,
	childCount: number,
	infantCount: number,
): {
	baggage: Record<string, BaggageOption | null>;
	meals: Record<string, MealOption | null>;
	seats: Record<string, SeatOption | null>;
	specialServices: Record<string, SpecialServiceOption[]>;
} {
	const total = adultCount + childCount + infantCount;
	const baggage: Record<string, BaggageOption | null> = {};
	const meals: Record<string, MealOption | null> = {};
	const seats: Record<string, SeatOption | null> = {};
	const specialServices: Record<string, SpecialServiceOption[]> = {};

	for (let p = 0; p < total; p++) {
		for (const seg of segments) {
			const k = selKey(p, seg.segmentIndex);
			const o = seg.origin;
			const d = seg.dest;
			const b = picks.baggage[k];
			if (b) baggage[k] = toBaggageOption(b, o, d);
			else baggage[k] = null;
			const m = picks.meals[k];
			if (m) meals[k] = toMealOption(m, o, d);
			else meals[k] = null;
			const seat = picks.physicalSeats[k];
			const ex = picks.extraSeatServices[k];
			if (seat) seats[k] = toSeatOption(seat.code, seat.amount, o, d);
			else if (ex) seats[k] = toSeatOption(ex.code, ex.amount, o, d);
			else seats[k] = null;
			specialServices[k] = [];
		}
	}

	return { baggage, meals, seats, specialServices };
}

export function tripjackSsrExtraTotal(picks: TripjackSsrPickState): number {
	let sum = 0;
	for (const v of Object.values(picks.baggage)) if (v) sum += v.amount;
	for (const v of Object.values(picks.meals)) if (v) sum += v.amount;
	for (const v of Object.values(picks.extraSeatServices)) if (v) sum += v.amount;
	for (const v of Object.values(picks.physicalSeats)) if (v) sum += v.amount;
	return sum;
}

/** SSR arrays for one traveller (TripJack book API). */
export function tripjackTravellerSsrForPax(
	segments: TripjackFlatSegment[],
	paxIndex: number,
	picks: TripjackSsrPickState,
): {
	ssrBaggageInfos?: TripjackTravellerSsrEntry[];
	ssrMealInfos?: TripjackTravellerSsrEntry[];
	ssrSeatInfos?: TripjackTravellerSsrEntry[];
} {
	const baggage: TripjackTravellerSsrEntry[] = [];
	const meals: TripjackTravellerSsrEntry[] = [];
	const seats: TripjackTravellerSsrEntry[] = [];

	for (const seg of segments) {
		const k = selKey(paxIndex, seg.segmentIndex);
		const b = picks.baggage[k];
		if (b) baggage.push({ key: seg.segmentKey, code: b.code });
		const m = picks.meals[k];
		if (m) meals.push({ key: seg.segmentKey, code: m.code });
		const phys = picks.physicalSeats[k];
		const ex = picks.extraSeatServices[k];
		if (phys) seats.push({ key: seg.segmentKey, code: phys.code });
		else if (ex) seats.push({ key: seg.segmentKey, code: ex.code });
	}

	return {
		...(baggage.length ? { ssrBaggageInfos: baggage } : {}),
		...(meals.length ? { ssrMealInfos: meals } : {}),
		...(seats.length ? { ssrSeatInfos: seats } : {}),
	};
}

/** Parse kg from TripJack baggage text (e.g. "5KG", "15kg"). */
export function tripjackParseKgFromDesc(desc: string): number {
	const m = (desc || "").match(/(\d+)\s*kg/i);
	return m ? parseInt(m[1], 10) : 0;
}

export function tripjackCatalogItemToBaggageOption(
	item: TripjackSsrCatalogItem,
	origin: string,
	dest: string,
): BaggageOption {
	const weight =
		tripjackParseKgFromDesc(item.desc) || tripjackParseKgFromDesc(item.code) || 0;
	return {
		AirlineCode: "",
		FlightNumber: "",
		WayType: 0,
		Code: item.code,
		Description: 0,
		Weight: weight,
		Currency: "INR",
		Price: item.amount,
		Origin: origin,
		Destination: dest,
	};
}

export function tripjackCatalogItemToMealOption(
	item: TripjackSsrCatalogItem,
	origin: string,
	dest: string,
): MealOption {
	return {
		AirlineCode: "",
		FlightNumber: "",
		WayType: 0,
		Code: item.code,
		Description: 0,
		AirlineDescription: item.desc,
		Quantity: 1,
		Currency: "INR",
		Price: item.amount,
		Origin: origin,
		Destination: dest,
	};
}

/** One row per segment index (may be empty) — matches TBO `BaggageSelection` / `MealSelection` indexing. */
export function tripjackBaggageDataFromSegments(
	segments: TripjackFlatSegment[],
): BaggageOption[][] {
	return segments.map((seg) =>
		(seg.ssrInfo?.BAGGAGE || []).map((it) =>
			tripjackCatalogItemToBaggageOption(it, seg.origin, seg.dest),
		),
	);
}

export function tripjackMealDataFromSegments(
	segments: TripjackFlatSegment[],
): MealOption[][] {
	return segments.map((seg) =>
		(seg.ssrInfo?.MEAL || []).map((it) =>
			tripjackCatalogItemToMealOption(it, seg.origin, seg.dest),
		),
	);
}

/** TBO-shaped rows for `SpecialServiceSelection`. */
export function tripjackSpecialServiceDataFromSegments(
	segments: TripjackFlatSegment[],
): Array<{ SegmentSpecialService?: Array<{ SSRService?: SpecialServiceOption[] }> }> {
	return segments.map((seg) => ({
		SegmentSpecialService: [
			{
				SSRService: (seg.ssrInfo?.SEAT || []).map((it) => ({
					Origin: seg.origin,
					Destination: seg.dest,
					DepartureTime: "",
					AirlineCode: "",
					FlightNumber: "",
					Code: it.code,
					ServiceType: 0,
					Text: it.desc,
					WayType: 0,
					Currency: "INR",
					Price: it.amount,
				})),
			},
		],
	}));
}

export function tripjackFindCatalogItem(
	segments: TripjackFlatSegment[],
	segmentArrayIndex: number,
	kind: "BAGGAGE" | "MEAL" | "SEAT",
	code: string,
): TripjackSsrCatalogItem | undefined {
	const seg = segments[segmentArrayIndex];
	return seg?.ssrInfo?.[kind]?.find((x) => x.code === code);
}

/** Minimal passengers so SSR components render before the form is filled. */
export function tripjackPlaceholderPassengers(
	adultCount: number,
	childCount: number,
	infantCount: number,
): PassengerDetail[] {
	const out: PassengerDetail[] = [];
	const base: Omit<PassengerDetail, "PaxType" | "IsLeadPax"> = {
		Title: "",
		FirstName: "",
		LastName: "",
		DateOfBirth: "",
		Gender: 1,
		AddressLine1: "",
		City: "",
		CountryCode: "IN",
		CountryName: "India",
		ContactNo: "",
		Email: "",
	};
	for (let i = 0; i < adultCount; i++) {
		out.push({ ...base, PaxType: 1, IsLeadPax: i === 0 });
	}
	for (let i = 0; i < childCount; i++) {
		out.push({ ...base, PaxType: 2, IsLeadPax: false });
	}
	for (let i = 0; i < infantCount; i++) {
		out.push({ ...base, PaxType: 3, IsLeadPax: false });
	}
	return out;
}
