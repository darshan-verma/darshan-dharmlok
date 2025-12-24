import { NextRequest, NextResponse } from "next/server";
import { getFareUpsell } from "@/lib/tboClient";

/**
 * POST /api/travel/fare-upsell
 * Proxy to TBO FareUpsell endpoint (server-side)
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		if (!body || !body.TraceId || !body.ResultIndex) {
			return NextResponse.json(
				{ success: false, error: "Missing TraceId or ResultIndex" },
				{ status: 400 }
			);
		}

		// Ensure EndUserIp is provided (TBO sometimes expects it)
		const params: {
			TraceId: string;
			ResultIndex: string;
			EndUserIp: string;
			ReturnResultIndex?: string;
			AdultCount?: number;
			ChildCount?: number;
			InfantCount?: number;
		} = {
			TraceId: body.TraceId,
			ResultIndex: body.ResultIndex,
			EndUserIp: body.EndUserIp || "192.168.1.1",
		};

		if (body.ReturnResultIndex)
			params.ReturnResultIndex = body.ReturnResultIndex;
		if (typeof body.AdultCount !== "undefined")
			params.AdultCount = body.AdultCount;
		if (typeof body.ChildCount !== "undefined")
			params.ChildCount = body.ChildCount;
		if (typeof body.InfantCount !== "undefined")
			params.InfantCount = body.InfantCount;

		const result = await getFareUpsell(params);

		return NextResponse.json({ success: true, data: result });
	} catch (error) {
		console.error("/api/travel/fare-upsell error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
