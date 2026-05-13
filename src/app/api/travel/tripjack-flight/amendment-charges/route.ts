import { NextRequest, NextResponse } from "next/server";
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
			return NextResponse.json(
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
			return NextResponse.json(
				{ error: "bookingId is required" },
				{ status: 400 },
			);
		}
		if (!remarks) {
			return NextResponse.json(
				{ error: "remarks is required (TripJack amendment API)" },
				{ status: 400 },
			);
		}
		if (!VALID_TYPES.includes(type as TripjackAmendmentType)) {
			return NextResponse.json(
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
			return NextResponse.json(
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
		const message =
			error instanceof Error ? error.message : "TripJack amendment-charges failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
