import { NextRequest, NextResponse } from "next/server";
import { resolveBroadcastByStreamKey } from "@/lib/live/controlPlane";

// Designed for NGINX-RTMP on_publish auth hook.
export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			name?: string;
			streamKey?: string;
		};

		const streamKey = body.streamKey || body.name;
		if (!streamKey) {
			return NextResponse.json({ error: "Missing streamKey" }, { status: 400 });
		}

		const state = await resolveBroadcastByStreamKey(streamKey);
		if (!state) {
			return NextResponse.json({ allow: false }, { status: 403 });
		}
		if (state.status === "ended") {
			return NextResponse.json({ allow: false }, { status: 403 });
		}

		return NextResponse.json({
			allow: true,
			broadcastId: state.broadcastId,
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: "Ingest auth failed",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
