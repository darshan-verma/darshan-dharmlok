import { NextRequest, NextResponse } from "next/server";
import { getSSR } from "@/lib/tboClient";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { TraceId, ResultIndex, EndUserIp } = body;

		if (!TraceId || !ResultIndex) {
			return NextResponse.json(
				{ error: "Missing required parameters" },
				{ status: 400 }
			);
		}

		const ssrResponse = await getSSR({
			TraceId,
			ResultIndex,
			EndUserIp: EndUserIp || "192.168.1.1",
		});

		return NextResponse.json(ssrResponse);
	} catch (error) {
		console.error("SSR API Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch SSR data" },
			{ status: 500 }
		);
	}
}
