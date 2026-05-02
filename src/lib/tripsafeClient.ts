import { tripjackRequest } from "@/lib/tripjackClient";
import type {
	TripsafeAmendmentConfirmRequest,
	TripsafeAmendmentConfirmResponse,
	TripsafeAmendmentRaiseRequest,
	TripsafeAmendmentRaiseResponse,
	TripsafeBookRequest,
	TripsafeBookResponse,
	TripsafeBookingDetailsRequest,
	TripsafeBookingDetailsResponse,
	TripsafeReviewRequest,
	TripsafeReviewResponse,
	TripsafeSearchRequest,
	TripsafeSearchResponse,
} from "@/types/tripsafe";

export async function searchTripsafeInsurance(
	payload: TripsafeSearchRequest,
): Promise<TripsafeSearchResponse> {
	return tripjackRequest<TripsafeSearchResponse>({
		endpoint: "/insurance/v1/searchquery-list",
		method: "POST",
		body: payload,
	});
}

export async function reviewTripsafeInsurance(
	payload: TripsafeReviewRequest,
): Promise<TripsafeReviewResponse> {
	return tripjackRequest<TripsafeReviewResponse>({
		endpoint: "/insurance/v1/review",
		method: "POST",
		body: payload,
	});
}

export async function bookTripsafeInsurance(
	payload: TripsafeBookRequest,
): Promise<TripsafeBookResponse> {
	return tripjackRequest<TripsafeBookResponse>({
		endpoint: "/oms/v1/insurance/book",
		method: "POST",
		body: payload,
	});
}

export async function getTripsafeInsuranceBookingDetails(
	payload: TripsafeBookingDetailsRequest,
): Promise<TripsafeBookingDetailsResponse> {
	return tripjackRequest<TripsafeBookingDetailsResponse>({
		endpoint: "/oms/v1/insurance/booking-details",
		method: "POST",
		body: payload,
	});
}

export async function raiseTripsafeInsuranceAmendment(
	payload: TripsafeAmendmentRaiseRequest,
): Promise<TripsafeAmendmentRaiseResponse> {
	return tripjackRequest<TripsafeAmendmentRaiseResponse>({
		endpoint: "/oms/v1/ins/amendment/raise",
		method: "POST",
		body: payload,
	});
}

export async function confirmTripsafeInsuranceCancellation(
	payload: TripsafeAmendmentConfirmRequest,
): Promise<TripsafeAmendmentConfirmResponse> {
	return tripjackRequest<TripsafeAmendmentConfirmResponse>({
		endpoint: "/oms/v1/ins/amendment/confirm-insurance-cancellation",
		method: "POST",
		body: payload,
	});
}
