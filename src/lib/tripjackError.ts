import { TripjackApiError } from "@/lib/tripjackClient";

export interface TripjackResolvedError {
	status: number;
	message: string;
	providerError?: unknown;
}

const HOTEL_BOOK_ERROR_MESSAGES: Record<string, string> = {
	"1015": "Payment amount does not match the reviewed fare. Refresh the page and try again.",
	"1092": "Enter a valid PAN that matches the lead guest name.",
	"1163": "PAN is required for this hotel. Enter the lead guest PAN to continue.",
};

/** Parse TripJack v3 `{ errors: [{ errCode, message }] }` and legacy envelopes. */
export function extractTripjackProviderMessage(
	payload: unknown,
	httpStatus: number,
): string {
	if (!payload || typeof payload !== "object") {
		return `TripJack API request failed with status ${httpStatus}`;
	}

	const p = payload as Record<string, unknown>;
	const errors = p.errors;
	if (Array.isArray(errors) && errors.length > 0) {
		const first = errors[0];
		if (first && typeof first === "object") {
			const row = first as Record<string, unknown>;
			const errCode =
				typeof row.errCode === "string"
					? row.errCode
					: typeof row.code === "string"
						? row.code
						: undefined;
			if (errCode && HOTEL_BOOK_ERROR_MESSAGES[errCode]) {
				return HOTEL_BOOK_ERROR_MESSAGES[errCode];
			}
			const msg = row.message;
			if (typeof msg === "string" && msg.trim()) return msg.trim();
		}
	}

	if (typeof p.message === "string" && p.message.trim()) return p.message.trim();
	if (typeof p.error === "string" && p.error.trim()) return p.error.trim();
	if (p.error && typeof p.error === "object") {
		const nested = p.error as Record<string, unknown>;
		if (typeof nested.message === "string" && nested.message.trim()) {
			return nested.message.trim();
		}
	}

	return `TripJack API request failed with status ${httpStatus}`;
}

export function resolveTripjackError(
	error: unknown,
	fallbackMessage: string,
): TripjackResolvedError {
	if (error instanceof TripjackApiError) {
		return {
			status: error.status,
			message: error.message,
			providerError: error.providerPayload,
		};
	}

	const message = error instanceof Error ? error.message : fallbackMessage;
	const lowered = message.toLowerCase();

	const status =
		lowered.includes("unauthorized") || lowered.includes("apikey")
			? 401
			: lowered.includes("forbidden")
				? 403
				: lowered.includes("not found")
					? 404
					: lowered.includes("too many") || lowered.includes("rate")
						? 429
						: lowered.includes("missing") || lowered.includes("invalid")
							? 400
							: 500;

	return {
		status,
		message,
	};
}
