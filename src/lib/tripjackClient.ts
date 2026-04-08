import type {
	TripjackAmendmentRequest,
	TripjackAmendmentResponse,
	TripjackBookingRequest,
	TripjackBookingDetailsResponse,
	TripjackBookingResponse,
	TripjackDeletedHotelsResponse,
	TripjackEmbeddedBookingRequest,
	TripjackEmbeddedBookingResponse,
	TripjackErrorPayload,
	TripjackGetAmendmentChargesResponse,
	TripjackHotelBookRequest,
	TripjackHotelBookResponse,
	TripjackHotelBookingDetailsResponse,
	TripjackHotelCancelResponse,
	TripjackHotelConfirmBookRequest,
	TripjackHotelConfirmBookResponse,
	TripjackHotelListingRequest,
	TripjackHotelListingResponse,
	TripjackHotelPricingRequest,
	TripjackHotelPricingResponse,
	TripjackHotelReviewRequest,
	TripjackHotelReviewResponse,
	TripjackLatLongRequest,
	TripjackLatLongResponse,
	TripjackLocationSearchRequest,
	TripjackLocationSearchResponse,
	TripjackNationalityResponse,
	TripjackPaymentRequest,
	TripjackPaymentResponse,
	TripjackQuoteRequest,
	TripjackQuoteResponse,
	TripjackStaticHotelsRequest,
	TripjackStaticHotelsResponse,
} from "@/types/tripjack";
import {
	normalizeTripjackStaticDetail,
	type TripjackStaticDetailNormalizeResult,
} from "@/lib/tripjackStaticDetailNormalize";

export type { TripjackStaticDetailNormalizeResult };

const TRIPJACK_API_URL = process.env.TRIPJACK_API_URL || "";
const TRIPJACK_STATIC_API_URL = process.env.TRIPJACK_STATIC_API_URL || "";
const TRIPJACK_API_KEY = process.env.TRIPJACK_API_KEY || "";

export interface TripjackRequestConfig {
	endpoint: string;
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
	headers?: Record<string, string>;
}

export class TripjackApiError extends Error {
	status: number;
	endpoint: string;
	providerPayload: unknown;

	constructor(params: {
		message: string;
		status: number;
		endpoint: string;
		providerPayload: unknown;
	}) {
		super(params.message);
		this.name = "TripjackApiError";
		this.status = params.status;
		this.endpoint = params.endpoint;
		this.providerPayload = params.providerPayload;
	}
}

function ensureTripjackConfig(): void {
	if (!TRIPJACK_API_URL) {
		throw new Error("Missing TRIPJACK_API_URL environment variable");
	}

	if (!TRIPJACK_API_KEY) {
		throw new Error("Missing TRIPJACK_API_KEY environment variable");
	}
}

function buildTripjackUrl(endpoint: string): string {
	if (endpoint.startsWith("http")) {
		return endpoint;
	}

	const base = TRIPJACK_API_URL.replace(/\/$/, "");
	const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
	return `${base}${path}`;
}

const RETRYABLE_STATUS = new Set([503]);
const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function tripjackRequest<T = unknown>(
	config: TripjackRequestConfig,
): Promise<T> {
	ensureTripjackConfig();

	const { endpoint, method = "POST", body, headers = {} } = config;
	const url = buildTripjackUrl(endpoint);

	const requestOptions: RequestInit = {
		method,
		headers: {
			"Content-Type": "application/json",
			apikey: TRIPJACK_API_KEY,
			...headers,
		},
	};

	if (body && (method === "POST" || method === "PUT")) {
		requestOptions.body = JSON.stringify(body);
	}

	let lastError: TripjackApiError | null = null;

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		const response = await fetch(url, requestOptions);
		const rawBody = await response.text();

		let parsedBody: unknown;
		try {
			parsedBody = rawBody ? JSON.parse(rawBody) : null;
		} catch {
			parsedBody = rawBody;
		}

		if (response.ok) {
			return parsedBody as T;
		}

		const payload = parsedBody as TripjackErrorPayload;
		const providerMessage =
			payload?.message ||
			(typeof payload?.error === "string"
				? payload.error
				: payload?.error?.message) ||
			`TripJack API request failed with status ${response.status}`;

		lastError = new TripjackApiError({
			message: providerMessage,
			status: response.status,
			endpoint,
			providerPayload: parsedBody,
		});

		// 429 Rate Limited — honour Retry-After header, retry once
		if (response.status === 429) {
			const retryAfter = response.headers.get("Retry-After");
			const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
			if (attempt === 0) {
				console.warn(
					`[TripJack] 429 Rate Limited on ${endpoint}, waiting ${waitMs}ms`,
				);
				await sleep(waitMs);
				continue;
			}
			break;
		}

		// 503 Supplier Unavailable — exponential backoff, max 3 retries
		if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_RETRIES) {
			const delay = BACKOFF_MS[attempt] || 4000;
			console.warn(
				`[TripJack] ${response.status} on ${endpoint}, retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`,
			);
			await sleep(delay);
			continue;
		}

		// Non-retryable error — break immediately
		break;
	}

	throw lastError!;
}

export async function getTripjackQuotes(
	payload: TripjackQuoteRequest,
): Promise<TripjackQuoteResponse> {
	return tripjackRequest<TripjackQuoteResponse>({
		endpoint: "/cabs/v2/quotes",
		method: "POST",
		body: payload,
	});
}

export async function createTripjackBooking(
	payload: TripjackBookingRequest,
): Promise<TripjackBookingResponse> {
	return tripjackRequest<TripjackBookingResponse>({
		endpoint: "/cabs/v2/booking",
		method: "POST",
		body: payload,
	});
}

export async function searchTripjackPlaces(
	payload: TripjackLocationSearchRequest,
): Promise<TripjackLocationSearchResponse> {
	return tripjackRequest<TripjackLocationSearchResponse>({
		endpoint: "/cabs/v1/google-places",
		method: "POST",
		body: payload,
	});
}

export async function getTripjackLatLong(
	payload: TripjackLatLongRequest,
): Promise<TripjackLatLongResponse> {
	return tripjackRequest<TripjackLatLongResponse>({
		endpoint: "/cabs/v1/get-lat-long",
		method: "POST",
		body: payload,
	});
}

export async function getTripjackBookingDetails(
	bookingIds: string,
): Promise<TripjackBookingDetailsResponse> {
	const encodedBookingIds = encodeURIComponent(bookingIds);
	return tripjackRequest<TripjackBookingDetailsResponse>({
		endpoint: `/cabs/v1/booking/details?bookingIds=${encodedBookingIds}`,
		method: "GET",
	});
}

export async function getTripjackAmendmentCharges(
	bookingId: string,
	type: string,
): Promise<TripjackGetAmendmentChargesResponse> {
	const encodedBookingId = encodeURIComponent(bookingId);
	const encodedType = encodeURIComponent(type);
	return tripjackRequest<TripjackGetAmendmentChargesResponse>({
		endpoint: `/cabs/v1/amendment?bookingId=${encodedBookingId}&type=${encodedType}`,
		method: "GET",
	});
}

export async function createTripjackAmendment(
	payload: TripjackAmendmentRequest,
): Promise<TripjackAmendmentResponse> {
	return tripjackRequest<TripjackAmendmentResponse>({
		endpoint: "/cabs/v1/amendment",
		method: "POST",
		body: payload,
	});
}

export async function createTripjackPayment(
	payload: TripjackPaymentRequest,
): Promise<TripjackPaymentResponse> {
	return tripjackRequest<TripjackPaymentResponse>({
		endpoint: "/cabs/v1/payment/create",
		method: "POST",
		body: payload,
	});
}

export async function createTripjackEmbeddedBooking(
	payload: TripjackEmbeddedBookingRequest,
): Promise<TripjackEmbeddedBookingResponse> {
	return tripjackRequest<TripjackEmbeddedBookingResponse>({
		endpoint: "/cabs/v2/embedded/booking",
		method: "POST",
		body: payload,
	});
}

export async function getTripjackHotelListing(
	payload: TripjackHotelListingRequest,
): Promise<TripjackHotelListingResponse> {
	return tripjackRequest<TripjackHotelListingResponse>({
		endpoint: "/hms/v3/hotel/listing",
		method: "POST",
		body: payload,
	});
}

export async function getTripjackHotelPricing(
	payload: TripjackHotelPricingRequest,
): Promise<TripjackHotelPricingResponse> {
	return tripjackRequest<TripjackHotelPricingResponse>({
		endpoint: "/hms/v3/hotel/pricing",
		method: "POST",
		body: payload,
	});
}

export async function reviewTripjackHotel(
	payload: TripjackHotelReviewRequest,
): Promise<TripjackHotelReviewResponse> {
	return tripjackRequest<TripjackHotelReviewResponse>({
		endpoint: "/hms/v3/hotel/review",
		method: "POST",
		body: payload,
	});
}

export async function getTripjackHotelStaticDetail(
	hid: string,
): Promise<TripjackStaticDetailNormalizeResult> {
	const staticBase = (TRIPJACK_STATIC_API_URL || TRIPJACK_API_URL).replace(
		/\/$/,
		"",
	);
	const apiBase = TRIPJACK_API_URL.replace(/\/$/, "");

	const parseEmbeddedProviderError = (payload: unknown): TripjackApiError | null => {
		if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
			return null;
		}
		const obj = payload as Record<string, unknown>;
		const status = obj.status;
		if (!status || typeof status !== "object" || Array.isArray(status)) return null;

		const statusObj = status as Record<string, unknown>;
		if (statusObj.success !== false) return null;

		const providerStatus =
			typeof statusObj.httpStatus === "number" ? statusObj.httpStatus : 502;
		const errors = Array.isArray(obj.errors) ? obj.errors : [];
		const firstError =
			errors.length > 0 && typeof errors[0] === "object" && errors[0] !== null
				? (errors[0] as Record<string, unknown>)
				: null;
		const providerMessage =
			(typeof firstError?.message === "string" && firstError.message) ||
			"TripJack static-detail provider error";

		return new TripjackApiError({
			message: providerMessage,
			status: providerStatus,
			endpoint: "/hms/v3/hotel/static-detail",
			providerPayload: payload,
		});
	};

	const fetchFromBase = async (base: string): Promise<unknown> => {
		const payload = await tripjackRequest<unknown>({
			endpoint: `${base}/hms/v3/hotel/static-detail`,
			method: "POST",
			body: { hid },
		});
		const embeddedError = parseEmbeddedProviderError(payload);
		if (embeddedError) throw embeddedError;
		return payload;
	};

	try {
		const raw = await fetchFromBase(staticBase);
		return normalizeTripjackStaticDetail(raw, hid);
	} catch (err) {
		// Some keys are authorized on apitest-hms but denied on apitest static host.
		// If static host fails with 403, retry once on the primary API host.
		if (
			err instanceof TripjackApiError &&
			err.status === 403 &&
			staticBase !== apiBase &&
			apiBase
		) {
			const raw = await fetchFromBase(apiBase);
			return normalizeTripjackStaticDetail(raw, hid);
		}
		throw err;
	}
}

// ─── Hotel Booking APIs ──────────────────────────────────────────────────────

export async function bookTripjackHotel(
	payload: TripjackHotelBookRequest,
): Promise<TripjackHotelBookResponse> {
	return tripjackRequest<TripjackHotelBookResponse>({
		endpoint: "/oms/v3/hotel/book",
		method: "POST",
		body: payload,
	});
}

export async function confirmTripjackHotelHold(
	payload: TripjackHotelConfirmBookRequest,
): Promise<TripjackHotelConfirmBookResponse> {
	return tripjackRequest<TripjackHotelConfirmBookResponse>({
		endpoint: "/oms/v3/hotel/confirm-book",
		method: "POST",
		body: payload,
	});
}

export async function getTripjackHotelBookingDetails(
	bookingId: string,
): Promise<TripjackHotelBookingDetailsResponse> {
	return tripjackRequest<TripjackHotelBookingDetailsResponse>({
		endpoint: "/oms/v3/hotel/booking-details",
		method: "POST",
		body: { bookingId },
	});
}

export async function cancelTripjackHotelBooking(
	bookingId: string,
): Promise<TripjackHotelCancelResponse> {
	return tripjackRequest<TripjackHotelCancelResponse>({
		endpoint: `/oms/v3/hotel/cancel-booking/${encodeURIComponent(bookingId)}`,
		method: "POST",
	});
}

export async function getTripjackNationalities(): Promise<TripjackNationalityResponse> {
	const base = (TRIPJACK_STATIC_API_URL || TRIPJACK_API_URL).replace(/\/$/, "");
	return tripjackRequest<TripjackNationalityResponse>({
		endpoint: `${base}/hms/v3/nationality-info`,
		method: "GET",
	});
}

export async function fetchTripjackStaticHotels(
	payload: TripjackStaticHotelsRequest,
): Promise<TripjackStaticHotelsResponse> {
	const base = (TRIPJACK_STATIC_API_URL || TRIPJACK_API_URL).replace(/\/$/, "");
	return tripjackRequest<TripjackStaticHotelsResponse>({
		endpoint: `${base}/hms/v3/fetch-static-hotels`,
		method: "POST",
		body: payload,
	});
}

export async function fetchTripjackDeletedHotels(payload: {
	lastUpdateTime: string;
	next?: string;
}): Promise<TripjackDeletedHotelsResponse> {
	const base = (TRIPJACK_STATIC_API_URL || TRIPJACK_API_URL).replace(/\/$/, "");
	return tripjackRequest<TripjackDeletedHotelsResponse>({
		endpoint: `${base}/hms/v3/fetch-static-hotels/deleted`,
		method: "POST",
		body: payload,
	});
}
