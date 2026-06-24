import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getFlightAmendmentDetails, TripjackApiError } from "@/lib/tripjackClient";
import { isTripjackConfigured } from "@/lib/tripjackFlightSearch";

export async function POST(request: NextRequest) {
	try {
		if (!isTripjackConfigured()) {
			return brandedFlightJson(
				{ error: "TripJack flight API is not configured" },
				{ status: 503 },
			);
		}
		const body = await request.json();
		const amendmentId =
			typeof body?.amendmentId === "string" ? body.amendmentId.trim() : "";

		if (!amendmentId) {
			return brandedFlightJson(
				{ error: "amendmentId is required" },
				{ status: 400 },
			);
		}

		const data = await getFlightAmendmentDetails({ amendmentId });

		if (data?.status?.success === false) {
			return brandedFlightJson(
				{
					error:
						data.errors?.[0]?.message ||
						data.status?.message ||
						"Failed to retrieve amendment details",
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
			error instanceof Error ? error.message : "TripJack amendment-details failed";
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}
