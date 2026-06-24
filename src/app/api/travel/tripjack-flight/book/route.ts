import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { bookTripjackFlight, TripjackApiError } from "@/lib/tripjackClient";
import { resolveTripjackBookError } from "@/lib/tripjackFlightBooking";
import type { TripjackBookRequest } from "@/types/tripjackFlight";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIpAddress, getUserAgent, logTravelActivity } from "@/lib/travelLogger";

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as Partial<TripjackBookRequest>;
		const bookingId =
			typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
		const travellerInfo = Array.isArray(body?.travellerInfo)
			? body.travellerInfo
			: [];

		if (!bookingId || !travellerInfo.length) {
			return brandedFlightJson(
				{ error: "bookingId and travellerInfo[] are required" },
				{ status: 400 },
			);
		}

		const payload: TripjackBookRequest = {
			bookingId,
			travellerInfo,
			contactInfo: body.contactInfo,
			deliveryInfo: body.deliveryInfo,
			gstInfo: body.gstInfo,
			paymentInfos: Array.isArray(body.paymentInfos) ? body.paymentInfos : undefined,
		};

		const data = await bookTripjackFlight(payload);
		const friendlyError = resolveTripjackBookError(data);
		if (friendlyError) {
			return brandedFlightJson({ error: friendlyError, data }, { status: 400 });
		}

		try {
			const session = await getServerSession(authOptions);
			logTravelActivity({
				userId: session?.user?.id,
				userEmail: session?.user?.email || undefined,
				userName: session?.user?.name || undefined,
				logType: "flight",
				action: "booking",
				provider: "TripJack",
				bookingCode: data.bookingId,
				traceId: bookingId,
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
				metadata: {
					mode: payload.paymentInfos?.length ? "instant" : "hold",
				},
			});
		} catch {
			// logging is non-blocking
		}

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
		const message = error instanceof Error ? error.message : "TripJack booking failed";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}

