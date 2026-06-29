import { describe, it, expect } from "vitest";
import {
	tripjackIsConfirmBookAlreadyProcessed,
	tripjackIsSeatMandatoryBookError,
	tripjackPickMandatorySeatsFromMap,
	tripjackResolveHoldConfirmAmount,
	tripjackReviewOrderAmount,
	tripjackSeatSelectionComplete,
} from "./tripjackBookFlow";
import type { TripjackFlatSegment } from "./tripjackSsr";
import type { TripjackReviewResponse, TripjackSeatMapResponse } from "@/types/tripjackFlight";

describe("tripjackBookFlow", () => {
	it("detects seat mandatory book error 8038", () => {
		expect(
			tripjackIsSeatMandatoryBookError({
				errors: [{ errCode: "8038", message: "Seat selection is mandatory" }],
			}),
		).toBe(true);
	});

	it("detects confirm-book already processed (2520)", () => {
		expect(
			tripjackIsConfirmBookAlreadyProcessed({
				errors: [{ errCode: "2520" }],
			}),
		).toBe(true);
	});

	it("computes review order amount with extras", () => {
		const review = {
			totalPriceInfo: {
				totalFareDetail: { fC: { TF: 5000 } },
			},
		} as TripjackReviewResponse;
		expect(tripjackReviewOrderAmount(review, 250)).toBe(5250);
	});

	it("resolves hold confirm amount preferring booking-details order amount", () => {
		const review = {
			totalPriceInfo: { totalFareDetail: { fC: { TF: 4000 } } },
		} as TripjackReviewResponse;
		const amount = tripjackResolveHoldConfirmAmount({
			review,
			ssrAndSeatExtras: 0,
			fareValidateReview: {
				totalPriceInfo: { totalFareDetail: { fC: { TF: 4100 } } },
			} as TripjackReviewResponse,
			orderAmountFromDetails: 4200,
			holdReadyAmount: 4250,
			fallbackAmount: 3900,
		});
		expect(amount).toBe(4250);
	});

	it("auto-picks mandatory seats per segment and traveller", () => {
		const segments: TripjackFlatSegment[] = [
			{ segmentKey: "seg1", origin: "DEL", dest: "BOM", segmentIndex: 0 },
		];
		const seatMap: TripjackSeatMapResponse = {
			tripSeatMap: {
				tripSeat: {
					seg1: {
						sInfo: [
							{ code: "1A", amount: 200, isBooked: false },
							{ code: "1B", amount: 200, isBooked: false },
						],
					},
				},
			},
		};
		const { seatByTraveller, seatExtras } = tripjackPickMandatorySeatsFromMap(
			seatMap,
			segments,
			2,
		);
		expect(tripjackSeatSelectionComplete(seatByTraveller, 2, 1)).toBe(true);
		expect(seatByTraveller[0][0].code).toBe("1A");
		expect(seatByTraveller[1][0].code).toBe("1B");
		expect(seatExtras).toBe(400);
	});
});
