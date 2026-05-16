import type {
	TripjackAirSearchRequest,
	TripjackAirSearchResponse,
	TripjackAmendmentChargesRequest,
	TripjackAmendmentChargesResponse,
	TripjackAmendmentDetailsRequest,
	TripjackAmendmentDetailsResponse,
	TripjackBookRequest,
	TripjackBookResponse,
	TripjackBookingDetailRequest,
	TripjackBookingDetailResponse,
	TripjackConfirmBookRequest,
	TripjackFareValidateRequest,
	TripjackFareValidateResponse,
	TripjackFareRuleRequest,
	TripjackFareRuleResponse,
	TripjackReleasePnrRequest,
	TripjackReviewRequest,
	TripjackReviewResponse,
	TripjackSeatMapRequest,
	TripjackSeatMapResponse,
	TripjackSubmitAmendmentRequest,
	TripjackSubmitAmendmentResponse,
} from "@/types/tripjackFlight";
import type {
	TripjackAmendmentRequest,
	TripjackAmendmentResponse,
	TripjackBookingRequest,
	TripjackBookingDetailsResponse,
	TripjackBookingResponse,
	TripjackDeletedHotelsResponse,
	TripjackEmbeddedBookingRequest,
	TripjackEmbeddedBookingResponse,
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
	TripjackFetchCityRegionIdsResponse,
	TripjackFetchDeletedHotelMappingRequest,
	TripjackFetchDeletedHotelMappingResponse,
	TripjackFetchHotelContentRequest,
	TripjackFetchHotelContentResponse,
	TripjackFetchHotelCountriesResponse,
	TripjackFetchHotelMappingRequest,
	TripjackFetchHotelMappingResponse,
	TripjackFetchHotelMappingSyncRequest,
	TripjackFetchHotelMappingSyncResponse,
	TripjackStaticHotelsRequest,
	TripjackStaticHotelsResponse,
} from "@/types/tripjack";
import { extractTripjackProviderMessage } from "@/lib/tripjackError";
import {
	normalizeTripjackStaticDetail,
	type TripjackStaticDetailNormalizeResult,
} from "@/lib/tripjackStaticDetailNormalize";

export type { TripjackStaticDetailNormalizeResult };

const TRIPJACK_API_URL = process.env.TRIPJACK_API_URL || "";
/** When set, base URL for TripSafe (`/insurance/…`, `/oms/v1/insurance/…`, `/oms/v1/ins/…`). Falls back to `TRIPJACK_API_URL`. */
const TRIPSAFE_API_URL = process.env.TRIPSAFE_API_URL || "";
const TRIPJACK_CABS_API_URL = process.env.TRIPJACK_CABS_API_URL || "";
const TRIPJACK_STATIC_API_URL = process.env.TRIPJACK_STATIC_API_URL || "";
/** Flight Management System (`/fms/…`) — usually `https://apitest.tripjack.com`, not the HMS host. */
const TRIPJACK_FMS_API_URL = process.env.TRIPJACK_FMS_API_URL || "";
/** Order Management System (`/oms/…`) — usually `https://apitest.tripjack.com`, not the HMS host. */
const TRIPJACK_OMS_API_URL = process.env.TRIPJACK_OMS_API_URL || "";
const TRIPJACK_API_KEY = process.env.TRIPJACK_API_KEY || "";

function isTripsafeInsuranceEndpoint(endpoint: string): boolean {
	return (
		endpoint.startsWith("/insurance/") ||
		endpoint.startsWith("/oms/v1/insurance/") ||
		endpoint.startsWith("/oms/v1/ins/")
	);
}

function tripsafeTripjackBaseUrl(): string {
	const dedicated = TRIPSAFE_API_URL.trim();
	const fallback = TRIPJACK_API_URL.trim();
	return dedicated || fallback;
}

export interface TripjackRequestConfig {
	endpoint: string;
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
	headers?: Record<string, string>;
	/** Abort outgoing HTTP if TripJack does not respond in time (ms). */
	timeoutMs?: number;
	/** Optional caller signal (combined with timeout when both set). */
	signal?: AbortSignal;
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

function tripjackFmsBaseUrl(): string {
	return TRIPJACK_FMS_API_URL || TRIPJACK_STATIC_API_URL || TRIPJACK_API_URL;
}

function tripjackOmsBaseUrl(): string {
	return TRIPJACK_OMS_API_URL || TRIPJACK_STATIC_API_URL || TRIPJACK_API_URL;
}

function ensureTripjackConfig(endpoint: string): void {
	const isCabsEndpoint = endpoint.startsWith("/cabs/");
	const isFmsEndpoint = endpoint.startsWith("/fms/");
	const isOmsEndpoint = endpoint.startsWith("/oms/") && !isTripsafeInsuranceEndpoint(endpoint);
	const isTripsafeEndpoint = isTripsafeInsuranceEndpoint(endpoint);
	const hasPrimaryBase = isCabsEndpoint
		? Boolean(TRIPJACK_CABS_API_URL || TRIPJACK_API_URL)
		: isFmsEndpoint
			? Boolean(tripjackFmsBaseUrl())
			: isOmsEndpoint
				? Boolean(tripjackOmsBaseUrl())
				: isTripsafeEndpoint
					? Boolean(tripsafeTripjackBaseUrl())
					: Boolean(TRIPJACK_API_URL);

	if (!hasPrimaryBase) {
		throw new Error(
			isCabsEndpoint
				? "Missing TRIPJACK_CABS_API_URL or TRIPJACK_API_URL environment variable"
				: isFmsEndpoint
					? "Missing TRIPJACK_FMS_API_URL, TRIPJACK_STATIC_API_URL, or TRIPJACK_API_URL for flight search"
					: isOmsEndpoint
						? "Missing TRIPJACK_OMS_API_URL, TRIPJACK_STATIC_API_URL, or TRIPJACK_API_URL for booking"
						: isTripsafeEndpoint
							? "Missing TRIPSAFE_API_URL or TRIPJACK_API_URL environment variable"
							: "Missing TRIPJACK_API_URL environment variable",
		);
	}

	if (!TRIPJACK_API_KEY) {
		throw new Error("Missing TRIPJACK_API_KEY environment variable");
	}
}

function buildTripjackUrl(endpoint: string): string {
	if (endpoint.startsWith("http")) {
		return endpoint;
	}

	const isCabsEndpoint = endpoint.startsWith("/cabs/");
	const isFmsEndpoint = endpoint.startsWith("/fms/");
	const isOmsEndpoint = endpoint.startsWith("/oms/") && !isTripsafeInsuranceEndpoint(endpoint);
	const isTripsafeEndpoint = isTripsafeInsuranceEndpoint(endpoint);
	const baseUrl = isCabsEndpoint
		? TRIPJACK_CABS_API_URL || TRIPJACK_API_URL
		: isFmsEndpoint
			? tripjackFmsBaseUrl()
			: isOmsEndpoint
				? tripjackOmsBaseUrl()
				: isTripsafeEndpoint
					? tripsafeTripjackBaseUrl()
					: TRIPJACK_API_URL;
	const base = baseUrl.replace(/\/$/, "");
	const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
	return `${base}${path}`;
}

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function combineAbortSignals(
	user: AbortSignal | undefined,
	timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	const onUserAbort = () => controller.abort();
	if (user) {
		if (user.aborted) controller.abort();
		else user.addEventListener("abort", onUserAbort, { once: true });
	}
	return {
		signal: controller.signal,
		cleanup: () => {
			clearTimeout(timer);
			user?.removeEventListener("abort", onUserAbort);
		},
	};
}

export async function tripjackRequest<T = unknown>(
	config: TripjackRequestConfig,
): Promise<T> {
	const {
		endpoint,
		method = "POST",
		body,
		headers = {},
		timeoutMs: configTimeoutMs,
		signal: userSignal,
	} = config;
	ensureTripjackConfig(endpoint);
	const url = buildTripjackUrl(endpoint);

	const baseHeaders: Record<string, string> = {
		"Content-Type": "application/json",
		apikey: TRIPJACK_API_KEY,
		...headers,
	};

	const bodyPayload =
		body && (method === "POST" || method === "PUT")
			? JSON.stringify(body)
			: undefined;

	let lastError: TripjackApiError | null = null;

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		if (userSignal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		let timeoutCleanup: (() => void) | undefined;
		const signal =
			configTimeoutMs != null && configTimeoutMs > 0
				? (() => {
						const { signal: s, cleanup } = combineAbortSignals(
							userSignal,
							configTimeoutMs,
						);
						timeoutCleanup = cleanup;
						return s;
					})()
				: userSignal;

		const requestOptions: RequestInit = {
			method,
			headers: baseHeaders,
			...(bodyPayload !== undefined ? { body: bodyPayload } : {}),
			...(signal ? { signal } : {}),
		};

		let response: Response;
		try {
			response = await fetch(url, requestOptions);
		} catch (e) {
			timeoutCleanup?.();
			const isAbort =
				e instanceof Error &&
				(e.name === "AbortError" || e.message === "This operation was aborted");
			if (isAbort && attempt < MAX_RETRIES && !userSignal?.aborted) {
				const delay = BACKOFF_MS[attempt] || 4000;
				console.warn(
					`[TripJack] fetch aborted/timeout on ${endpoint}, retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`,
				);
				await sleep(delay);
				continue;
			}
			throw e;
		} finally {
			timeoutCleanup?.();
		}

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

		const providerMessage = extractTripjackProviderMessage(
			parsedBody,
			response.status,
		);

		// 403/401: almost always key, base URL, or IP allowlist — log body snippet when empty/non-JSON
		if (response.status === 403 || response.status === 401) {
			const snippet = rawBody
				? rawBody.length > 800
					? `${rawBody.slice(0, 800)}…`
					: rawBody
				: "(empty response body)";
			console.warn(
				`[TripJack] ${response.status} ${method} ${url} — body: ${snippet}`,
			);
		}

		lastError = new TripjackApiError({
			message: providerMessage,
			status: response.status,
			endpoint,
			providerPayload: parsedBody ?? (rawBody || null),
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

		// 502/503/504 — exponential backoff, max 3 retries
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

export async function searchTripjackFlights(
	payload: TripjackAirSearchRequest,
): Promise<TripjackAirSearchResponse> {
	return tripjackRequest<TripjackAirSearchResponse>({
		endpoint: "/fms/v1/air-search-all",
		method: "POST",
		body: payload,
	});
}

export async function getTripjackFareRule(
	payload: TripjackFareRuleRequest,
): Promise<TripjackFareRuleResponse> {
	return tripjackRequest<TripjackFareRuleResponse>({
		endpoint: "/fms/v2/farerule",
		method: "POST",
		body: payload,
	});
}

export async function reviewTripjackFlight(
	payload: TripjackReviewRequest,
): Promise<TripjackReviewResponse> {
	return tripjackRequest<TripjackReviewResponse>({
		endpoint: "/fms/v1/review",
		method: "POST",
		body: payload,
	});
}

export async function getTripjackSeatMap(
	payload: TripjackSeatMapRequest,
): Promise<TripjackSeatMapResponse> {
	return tripjackRequest<TripjackSeatMapResponse>({
		endpoint: "/fms/v1/seat",
		method: "POST",
		body: payload,
	});
}

export async function fareValidateTripjackFlight(
	payload: TripjackFareValidateRequest,
): Promise<TripjackFareValidateResponse> {
	/** TripJack doc: `POST /oms/v1/air/fare-validate` (confirm fare before ticketing a hold). */
	return confirmFareTripjackFlight(payload);
}

export async function bookTripjackFlight(
	payload: TripjackBookRequest,
): Promise<TripjackBookResponse> {
	return tripjackRequest<TripjackBookResponse>({
		endpoint: "/oms/v1/air/book",
		method: "POST",
		body: payload,
	});
}

export async function confirmFareTripjackFlight(
	payload: { bookingId: string },
): Promise<TripjackBookResponse> {
	return tripjackRequest<TripjackBookResponse>({
		endpoint: "/oms/v1/air/fare-validate",
		method: "POST",
		body: payload,
	});
}

export async function confirmBookTripjackFlight(
	payload: TripjackConfirmBookRequest,
): Promise<TripjackBookResponse> {
	return tripjackRequest<TripjackBookResponse>({
		endpoint: "/oms/v1/air/confirm-book",
		method: "POST",
		body: payload,
	});
}

export async function getTripjackFlightBookingDetails(
	payload: TripjackBookingDetailRequest,
): Promise<TripjackBookingDetailResponse> {
	return tripjackRequest<TripjackBookingDetailResponse>({
		endpoint: "/oms/v1/booking-details",
		method: "POST",
		body: payload,
	});
}

export async function releaseTripjackPnr(
	payload: TripjackReleasePnrRequest,
): Promise<TripjackBookResponse> {
	return tripjackRequest<TripjackBookResponse>({
		endpoint: "/oms/v1/air/unhold",
		method: "POST",
		body: payload,
	});
}

// ─── Flight Amendment / Cancellation ─────────────────────────────────────────

function tripjackAmendmentRequestBody(
	payload: TripjackAmendmentChargesRequest | TripjackSubmitAmendmentRequest,
): Record<string, unknown> {
	const body: Record<string, unknown> = {
		bookingId: payload.bookingId,
		type: payload.type,
		remarks: payload.remarks,
	};
	if (payload.trips?.length) body.trips = payload.trips;
	if (payload.travellers?.length) body.travellers = payload.travellers;
	return body;
}

export async function getFlightAmendmentCharges(
	payload: TripjackAmendmentChargesRequest,
): Promise<TripjackAmendmentChargesResponse> {
	return tripjackRequest<TripjackAmendmentChargesResponse>({
		endpoint: "/oms/v1/air/amendment/amendment-charges",
		method: "POST",
		body: tripjackAmendmentRequestBody(payload),
	});
}

export async function submitFlightAmendment(
	payload: TripjackSubmitAmendmentRequest,
): Promise<TripjackSubmitAmendmentResponse> {
	return tripjackRequest<TripjackSubmitAmendmentResponse>({
		endpoint: "/oms/v1/air/amendment/submit-amendment",
		method: "POST",
		body: tripjackAmendmentRequestBody(payload),
	});
}

export async function getFlightAmendmentDetails(
	payload: TripjackAmendmentDetailsRequest,
): Promise<TripjackAmendmentDetailsResponse> {
	return tripjackRequest<TripjackAmendmentDetailsResponse>({
		endpoint: "/oms/v1/air/amendment/amendment-details",
		method: "POST",
		body: { amendmentId: payload.amendmentId },
	});
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

const TRIPJACK_LISTING_PROVIDER_TIMEOUT_MS = 120_000;
/** HTTP layer slightly longer than TripJack `timeoutMs` so the supplier can finish. */
const TRIPJACK_LISTING_HTTP_TIMEOUT_MS = TRIPJACK_LISTING_PROVIDER_TIMEOUT_MS + 15_000;

export async function getTripjackHotelListing(
	payload: TripjackHotelListingRequest,
): Promise<TripjackHotelListingResponse> {
	const body: TripjackHotelListingRequest = {
		...payload,
		timeoutMs: payload.timeoutMs ?? TRIPJACK_LISTING_PROVIDER_TIMEOUT_MS,
	};
	return tripjackRequest<TripjackHotelListingResponse>({
		endpoint: "/hms/v3/hotel/listing",
		method: "POST",
		body,
		timeoutMs: Math.max(
			TRIPJACK_LISTING_HTTP_TIMEOUT_MS,
			(body.timeoutMs ?? 0) + 15_000,
		),
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

	const parseEmbeddedProviderError = (
		payload: unknown,
	): TripjackApiError | null => {
		if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
			return null;
		}
		const obj = payload as Record<string, unknown>;
		const status = obj.status;
		if (!status || typeof status !== "object" || Array.isArray(status))
			return null;

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

	const STATIC_DETAIL_HTTP_MS = 90_000;

	const fetchFromBase = async (base: string): Promise<unknown> => {
		const body = /^\d+$/.test(hid) ? { hid: Number(hid) } : { hid };
		const payload = await tripjackRequest<unknown>({
			endpoint: `${base}/hms/v3/hotel/static-detail`,
			method: "POST",
			body,
			timeoutMs: STATIC_DETAIL_HTTP_MS,
		});
		const embeddedError = parseEmbeddedProviderError(payload);
		if (embeddedError) throw embeddedError;
		return payload;
	};

	try {
		const raw = await fetchFromBase(staticBase);
		return normalizeTripjackStaticDetail(raw, hid);
	} catch (err) {
		// Static catalog host vs HMS host: 403/404 on one base often succeeds on the other
		// (keys, allowlists, or hotel coverage differ between TRIPJACK_STATIC_API_URL and TRIPJACK_API_URL).
		if (
			err instanceof TripjackApiError &&
			(err.status === 403 || err.status === 404) &&
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

function tripjackHmsStaticBaseUrl(): string {
	return (TRIPJACK_STATIC_API_URL || TRIPJACK_API_URL).replace(/\/$/, "");
}

/** v3 static content layer — same host as nationality-info / fetch-static-hotels. */
export async function fetchTripjackHotelContentMapping(
	payload: TripjackFetchHotelMappingRequest,
): Promise<TripjackFetchHotelMappingResponse> {
	const base = tripjackHmsStaticBaseUrl();
	return tripjackRequest<TripjackFetchHotelMappingResponse>({
		endpoint: `${base}/hms/v3/content/fetch-hotel-mapping`,
		method: "POST",
		body: payload,
		timeoutMs: 120_000,
	});
}

export async function fetchTripjackHotelContentBatch(
	payload: TripjackFetchHotelContentRequest,
): Promise<TripjackFetchHotelContentResponse> {
	const base = tripjackHmsStaticBaseUrl();
	return tripjackRequest<TripjackFetchHotelContentResponse>({
		endpoint: `${base}/hms/v3/content/fetch-hotel-content`,
		method: "POST",
		body: payload,
		timeoutMs: 120_000,
	});
}

export async function fetchTripjackHotelContentCountries(): Promise<TripjackFetchHotelCountriesResponse> {
	const base = tripjackHmsStaticBaseUrl();
	return tripjackRequest<TripjackFetchHotelCountriesResponse>({
		endpoint: `${base}/hms/v3/content/fetch-countries`,
		method: "GET",
		timeoutMs: 60_000,
	});
}

export async function fetchTripjackHotelCityRegionIds(params: {
	limit: number;
	cursor?: string;
}): Promise<TripjackFetchCityRegionIdsResponse> {
	const base = tripjackHmsStaticBaseUrl();
	const q = new URLSearchParams();
	q.set("limit", String(params.limit));
	if (params.cursor) q.set("cursor", params.cursor);
	return tripjackRequest<TripjackFetchCityRegionIdsResponse>({
		endpoint: `${base}/hms/v3/content/fetch-city-regionIds?${q.toString()}`,
		method: "GET",
		timeoutMs: 120_000,
	});
}

export async function fetchTripjackHotelMappingSync(
	payload: TripjackFetchHotelMappingSyncRequest,
	page?: number,
): Promise<TripjackFetchHotelMappingSyncResponse> {
	const base = tripjackHmsStaticBaseUrl();
	const suffix =
		page !== undefined && Number.isFinite(page)
			? `?page=${encodeURIComponent(String(page))}`
			: "";
	return tripjackRequest<TripjackFetchHotelMappingSyncResponse>({
		endpoint: `${base}/hms/v3/content/fetch-hotel-mapping-sync${suffix}`,
		method: "POST",
		body: payload,
		timeoutMs: 120_000,
	});
}

export async function fetchTripjackDeletedHotelMappingSync(
	payload: TripjackFetchDeletedHotelMappingRequest,
	page?: number,
): Promise<TripjackFetchDeletedHotelMappingResponse> {
	const base = tripjackHmsStaticBaseUrl();
	const suffix =
		page !== undefined && Number.isFinite(page)
			? `?page=${encodeURIComponent(String(page))}`
			: "";
	return tripjackRequest<TripjackFetchDeletedHotelMappingResponse>({
		endpoint: `${base}/hms/v3/content/fetch-deleted-hotel-mapping${suffix}`,
		method: "POST",
		body: payload,
		timeoutMs: 120_000,
	});
}
