import { NextRequest, NextResponse } from "next/server";
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
			return NextResponse.json(
				{ error: "TripJack flight API is not configured" },
				{ status: 503 },
			);
		}
		const body = await request.json();
		const priceIds = Array.isArray(body?.priceIds)
			? body.priceIds.filter((x: unknown) => typeof x === "string" && x.trim())
			: [];

		if (!priceIds.length) {
			return NextResponse.json(
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
			return NextResponse.json(
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
		return NextResponse.json({ success: true, data });
	} catch (error) {
		if (error instanceof TripjackApiError) {
			return NextResponse.json(
				{
					error: error.message,
					status: error.status,
					providerPayload: error.providerPayload,
				},
				{ status: error.status >= 400 && error.status < 600 ? error.status : 400 },
			);
		}
		const message = error instanceof Error ? error.message : "TripJack review failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

