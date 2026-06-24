import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getFlightAmendmentCharges, TripjackApiError } from "@/lib/tripjackClient";
import { isTripjackConfigured } from "@/lib/tripjackFlightSearch";
import {
	parseTripjackAmendmentTravellers,
	parseTripjackAmendmentTrips,
} from "@/lib/tripjackAmendmentRequestParse";
import type { TripjackAmendmentType } from "@/types/tripjackFlight";

const VALID_TYPES: TripjackAmendmentType[] = ["CANCELLATION", "DATECHANGE", "SECTORCANCEL"];

export async function POST(request: NextRequest) {
	try {
		if (!isTripjackConfigured()) {
			return brandedFlightJson(
				{ error: "TripJack flight API is not configured" },
				{ status: 503 },
			);
		}
		const body = await request.json();
		const bookingId =
			typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
		const type = typeof body?.type === "string" ? body.type : "";
		const remarks =
			typeof body?.remarks === "string" ? body.remarks.trim() : "";

		if (!bookingId) {
			return brandedFlightJson(
				{ error: "bookingId is required" },
				{ status: 400 },
			);
		}
		if (!remarks) {
			return brandedFlightJson(
				{ error: "remarks is required (TripJack amendment API)" },
				{ status: 400 },
			);
		}
		if (!VALID_TYPES.includes(type as TripjackAmendmentType)) {
			return brandedFlightJson(
				{ error: `type must be one of: ${VALID_TYPES.join(", ")}` },
				{ status: 400 },
			);
		}

		const trips = parseTripjackAmendmentTrips(body?.trips);
		const travellers = parseTripjackAmendmentTravellers(body?.travellers);

		const data = await getFlightAmendmentCharges({
			bookingId,
			type: type as TripjackAmendmentType,
			remarks,
			...(trips ? { trips } : {}),
			...(travellers ? { travellers } : {}),
		});

		if (data?.status?.success === false) {
			return brandedFlightJson(
				{
					error:
						data.errors?.[0]?.message ||
						data.status?.message ||
						"Failed to retrieve amendment charges",
					providerPayload: data,
				},
				{ status: 400 },
			);
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
		const message =
			error instanceof Error ? error.message : "TripJack amendment-charges failed";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}
