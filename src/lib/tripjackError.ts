import { TripjackApiError } from "@/lib/tripjackClient";

export interface TripjackResolvedError {
	status: number;
	message: string;
	providerError?: unknown;
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
