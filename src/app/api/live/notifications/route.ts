import { NextRequest, NextResponse } from "next/server";
import { getRecentLiveNotifications } from "@/lib/live/controlPlane";

export async function GET(request: NextRequest) {
	try {
		const limitRaw = request.nextUrl.searchParams.get("limit");
		const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 20;
		const notifications = await getRecentLiveNotifications(limit);
		return NextResponse.json({ notifications });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch live notifications",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
