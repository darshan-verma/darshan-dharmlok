import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { reviewTripjackFlight } from "@/lib/tripjackClient";
import { TripjackApiError } from "@/lib/tripjackClient";
import { extractTripjackReviewFlight } from "@/lib/tripjackFlightBooking";
import { isTripjackConfigured } from "@/lib/tripjackFlightSearch";
import { logTravelActivity, getIpAddress, getUserAgent } from "@/lib/travelLogger";

/** TripJack review can exceed default serverless limits; extend on Vercel Pro+. */
export const maxDuration = 120;

export async function POST(request: NextRequest) {
	try {
		if (!isTripjackConfigured()) {
			return brandedFlightJson(
				{ error: "TripJack flight API is not configured" },
				{ status: 503 },
			);
		}
		const body = await request.json();
		const priceIds = Array.isArray(body?.priceIds)
			? body.priceIds.filter((x: unknown) => typeof x === "string" && x.trim())
			: [];

		if (!priceIds.length) {
			return brandedFlightJson(
				{ error: "priceIds is required and must be a non-empty array" },
				{ status: 400 },
			);
		}

		const data = await reviewTripjackFlight({ priceIds });
		const providerSuccess = data?.status?.success;
		const providerMessage = data?.status?.message;
		const providerError =
			data?.errors?.[0]?.message || data?.alerts?.[0]?.message || providerMessage;

		if (providerSuccess === false || data?.bookingId == null) {
			return brandedFlightJson(
				{
					error:
						providerError ||
						"TripJack review failed. Please refresh search and try again.",
					providerPayload: data,
				},
				{ status: 400 },
			);
		}
		if (
			!extractTripjackReviewFlight(data, priceIds[0] ?? "", {
				returnPriceId: priceIds[1],
				priceIds,
			})
		) {
			console.warn(
				"[TripJack review] bookingId present but tripInfos could not be normalized for UI",
				{ priceIdsCount: priceIds.length },
			);
		}
		logTravelActivity({
			logType: "flight",
			action: "selection",
			provider: "TripJack",
			traceId: data.bookingId || priceIds[0],
			ipAddress: getIpAddress(request),
			userAgent: getUserAgent(request),
			metadata: { priceIdsCount: priceIds.length },
		});
		return brandedFlightJson({ success: true, data });
	} catch (error) {
		if (error instanceof TripjackApiError) {
			return brandedFlightJson(
				{
					error: error.message,
					status: error.status,
					providerPayload: error.providerPayload,
				},
				{ status: error.status >= 400 && error.status < 600 ? error.status : 400 },
			);
		}
		const message = error instanceof Error ? error.message : "TripJack review failed";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}

