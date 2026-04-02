import type {
	TripjackAmendmentRequest,
	TripjackAmendmentResponse,
	TripjackBookingRequest,
	TripjackBookingDetailsResponse,
	TripjackBookingResponse,
	TripjackEmbeddedBookingRequest,
	TripjackEmbeddedBookingResponse,
	TripjackErrorPayload,
	TripjackGetAmendmentChargesResponse,
	TripjackLatLongRequest,
	TripjackLatLongResponse,
	TripjackLocationSearchRequest,
	TripjackLocationSearchResponse,
	TripjackPaymentRequest,
	TripjackPaymentResponse,
	TripjackQuoteRequest,
	TripjackQuoteResponse,
} from "@/types/tripjack";

const TRIPJACK_API_URL = process.env.TRIPJACK_API_URL || "";
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

	const response = await fetch(url, requestOptions);
	const rawBody = await response.text();

	let parsedBody: unknown;
	try {
		parsedBody = rawBody ? JSON.parse(rawBody) : null;
	} catch {
		parsedBody = rawBody;
	}

	if (!response.ok) {
		const payload = parsedBody as TripjackErrorPayload;
		const providerMessage =
			payload?.message ||
			(typeof payload?.error === "string"
				? payload.error
				: payload?.error?.message) ||
			`TripJack API request failed with status ${response.status}`;
		throw new TripjackApiError({
			message: providerMessage,
			status: response.status,
			endpoint,
			providerPayload: parsedBody,
		});
	}

	return parsedBody as T;
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
