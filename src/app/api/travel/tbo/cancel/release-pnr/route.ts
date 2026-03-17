import { NextRequest, NextResponse } from "next/server";
import { releasePNR } from "@/lib/tboClient";

/**
 * POST /api/travel/tbo/cancel/release-pnr
 * TBO Release PNR – release a hold booking (no ticket yet). Doc: tbo-cancel-doc.md ReleasePNRRequest.
 * TokenId is injected server-side.
 * Body: EndUserIp, BookingId, Source.
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		if (!body || typeof body !== "object") {
			return NextResponse.json(
				{ error: "Request body must be a JSON object" },
				{ status: 400 }
			);
		}

		const EndUserIp =
			typeof body.EndUserIp === "string" ? body.EndUserIp.trim() : "";
		if (!EndUserIp) {
			return NextResponse.json(
				{ error: "Missing required field: EndUserIp" },
				{ status: 400 }
			);
		}

		const BookingId =
			typeof body.BookingId === "number"
				? body.BookingId
				: parseInt(String(body.BookingId ?? ""), 10);
		if (Number.isNaN(BookingId) || BookingId <= 0) {
			return NextResponse.json(
				{ error: "Missing or invalid BookingId" },
				{ status: 400 }
			);
		}

		const Source = typeof body.Source === "string" ? body.Source.trim() : "";
		if (!Source) {
			return NextResponse.json(
				{ error: "Missing required field: Source" },
				{ status: 400 }
			);
		}

		const result = await releasePNR({
			EndUserIp,
			BookingId,
			Source,
		});

		if (result.ResponseStatus !== 1) {
			const msg =
				result.Error?.ErrorMessage ||
				"Release PNR request failed";
			return NextResponse.json(
				{
					error: msg,
					responseStatus: result.ResponseStatus,
					traceId: result.TraceId,
				},
				{ status: 400 }
			);
		}

		return NextResponse.json({
			responseStatus: result.ResponseStatus,
			traceId: result.TraceId,
		});
	} catch (error) {
		console.error("TBO Release PNR API error:", error);
		const message =
			error instanceof Error ? error.message : "Release PNR request failed";
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
