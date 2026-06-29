/**
 * TripJack flight book / hold / confirm flow — aligned with `scripts/tripjack-uat-runner.mjs`.
 */
import type { TripjackFlatSegment } from "@/lib/tripjackSsr";
import type {
	TripjackBookingDetailResponse,
	TripjackReviewResponse,
	TripjackSeatMapResponse,
} from "@/types/tripjackFlight";

export type TripjackSeatPick = { key: string; code: string; amount?: number };

/** Seats required for sR checks — infants are lap-held and do not consume a seat. */
export function tripjackSeatedPaxCount(adults: number, children: number): number {
	return adults + children;
}

export function tripjackParseFareAmount(raw: unknown): number {
	if (typeof raw === "number" && Number.isFinite(raw)) return raw;
	const n = parseFloat(String(raw ?? ""));
	return Number.isFinite(n) ? n : 0;
}

/** TripJack review uses `fC` (camelCase); some typings use `fc`. */
export function tripjackFareComponentFromReview(
	review: TripjackReviewResponse | null | undefined,
) {
	const td = review?.totalPriceInfo?.totalFareDetail;
	return td?.fC ?? td?.fc ?? null;
}

export function tripjackReviewOrderAmount(
	review: TripjackReviewResponse | null | undefined,
	extra = 0,
): number {
	const fc = tripjackFareComponentFromReview(review);
	const base = tripjackParseFareAmount(fc?.TF ?? fc?.NF ?? fc?.BF);
	return Math.round((base + extra) * 100) / 100;
}

export function tripjackIsSeatMandatoryBookError(
	bookJson: { errors?: Array<{ errCode?: string; message?: string }> } | null | undefined,
): boolean {
	const msg = (bookJson?.errors?.[0]?.message || "").toLowerCase();
	return (
		bookJson?.errors?.[0]?.errCode === "8038" ||
		msg.includes("seat selection is mandatory")
	);
}

/** Confirm-book 2520 — booking already confirmed / auto-ticketed (UAT runner proceeds to details). */
export function tripjackIsConfirmBookAlreadyProcessed(
	confirmRes: { errors?: Array<{ errCode?: string }> } | null | undefined,
): boolean {
	return String(confirmRes?.errors?.[0]?.errCode ?? "") === "2520";
}

export function tripjackSeatSelectionComplete(
	seatByTraveller: TripjackSeatPick[][],
	seatedTravellers: number,
	segmentCount: number,
): boolean {
	return (
		seatByTraveller.length >= seatedTravellers &&
		seatByTraveller.every((rows) => rows.length >= segmentCount)
	);
}

/** Auto-assign mandatory seats from seat map (UAT `pickMandatorySeats`). */
export function tripjackPickMandatorySeatsFromMap(
	seatMap: TripjackSeatMapResponse,
	segments: TripjackFlatSegment[],
	seatedTravellers: number,
): { seatByTraveller: TripjackSeatPick[][]; seatExtras: number } {
	const tripSeat = seatMap?.tripSeatMap?.tripSeat || {};
	const seatByTraveller: TripjackSeatPick[][] = Array.from(
		{ length: seatedTravellers },
		() => [],
	);
	let seatExtras = 0;

	for (const seg of segments) {
		const list = tripSeat[seg.segmentKey]?.sInfo || [];
		const usedCodes = new Set<string>();
		for (let p = 0; p < seatedTravellers; p++) {
			const seat = list.find((s) => {
				if (s.isBooked) return false;
				const code = s.code || s.seatNo;
				return code && !usedCodes.has(code);
			});
			if (!seat) continue;
			const code = seat.code || seat.seatNo || "";
			if (!code) continue;
			usedCodes.add(code);
			seatByTraveller[p].push({
				key: seg.segmentKey,
				code,
				amount: tripjackParseFareAmount(seat.amount),
			});
			seatExtras += tripjackParseFareAmount(seat.amount);
		}
	}

	return { seatByTraveller, seatExtras };
}

export function tripjackOrderAmountFromBookingDetails(
	data: TripjackBookingDetailResponse | null | undefined,
): number {
	return tripjackParseFareAmount(data?.order?.amount);
}

export function tripjackHoldStatusFromBookingDetails(
	data: TripjackBookingDetailResponse | null | undefined,
): string {
	return String(data?.order?.status ?? "").toUpperCase();
}

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

export type TripjackBookingDetailsClientResult = {
	ok: boolean;
	data?: TripjackBookingDetailResponse;
	pnr?: string;
	error?: string;
};

/** Poll booking-details until ON_HOLD or SUCCESS (UAT `waitForHoldReady`). */
export async function tripjackWaitForHoldReadyClient(
	fetchDetails: (bookingId: string) => Promise<TripjackBookingDetailsClientResult>,
	bookingId: string,
	maxMs = 45_000,
): Promise<{ status: string; amount: number } | null> {
	const start = Date.now();
	let last: TripjackBookingDetailsClientResult | null = null;

	while (Date.now() - start < maxMs) {
		const det = await fetchDetails(bookingId);
		last = det;
		if (!det.ok) {
			await sleep(2000);
			continue;
		}
		const status = tripjackHoldStatusFromBookingDetails(det.data);
		if (status === "ON_HOLD" || status === "SUCCESS") {
			return {
				status,
				amount: tripjackOrderAmountFromBookingDetails(det.data),
			};
		}
		await sleep(2500);
	}

	if (last?.ok && last.data) {
		return {
			status: tripjackHoldStatusFromBookingDetails(last.data),
			amount: tripjackOrderAmountFromBookingDetails(last.data),
		};
	}
	return null;
}

/**
 * Resolve confirm-book payment amount after hold book + fare-validate (UAT `runBookFlow`).
 */
export function tripjackResolveHoldConfirmAmount(params: {
	review: TripjackReviewResponse;
	ssrAndSeatExtras: number;
	fareValidateReview?: TripjackReviewResponse | null;
	orderAmountFromDetails?: number;
	holdReadyAmount?: number;
	fallbackAmount: number;
}): number {
	let payAmount = params.fallbackAmount;

	const reviewAmount = tripjackReviewOrderAmount(
		params.review,
		params.ssrAndSeatExtras,
	);
	if (reviewAmount > 0) payAmount = reviewAmount;

	if (params.fareValidateReview) {
		const fvAmount = tripjackReviewOrderAmount(
			params.fareValidateReview,
			params.ssrAndSeatExtras,
		);
		if (fvAmount > 0) payAmount = fvAmount;
	}

	if (params.orderAmountFromDetails != null && params.orderAmountFromDetails > 0) {
		payAmount = params.orderAmountFromDetails;
	}
	if (params.holdReadyAmount != null && params.holdReadyAmount > 0) {
		payAmount = params.holdReadyAmount;
	}

	return Math.round(payAmount * 100) / 100;
}

/** Prefer supplier total from review when present; otherwise UI-computed fallback. */
export function tripjackInstantBookAmount(
	review: TripjackReviewResponse | null | undefined,
	ssrAndSeatExtras: number,
	fallbackAmount: number,
): number {
	const fromReview = tripjackReviewOrderAmount(review, ssrAndSeatExtras);
	if (fromReview > 0) return fromReview;
	return Math.round(fallbackAmount * 100) / 100;
}

export function tripjackUsesHoldBooking(
	conditions: TripjackReviewResponse["conditions"] | null | undefined,
): boolean {
	return conditions?.isBA === true;
}

export function tripjackRequiresMandatorySeats(
	conditions: TripjackReviewResponse["conditions"] | null | undefined,
): boolean {
	return conditions?.isa === true;
}
