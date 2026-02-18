import { NextRequest, NextResponse } from "next/server";
import { createLivePlaybackGrant, getCookieDomainForHost } from "@/lib/live/security";
import { getLiveState } from "@/lib/live/controlPlane";

function localPlaybackUrlFor(path: string): string {
	return `http://localhost:8080/${path.replace(/^\/+/, "")}`;
}

function canUseLocalFallback(hostname: string): boolean {
	const localHost = hostname === "localhost" || hostname === "127.0.0.1";
	return process.env.NODE_ENV !== "production" || localHost;
}

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;
		const state = await getLiveState(id);
		if (!state) {
			return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
		}
		if (state.status !== "live") {
			return NextResponse.json(
				{ error: "Broadcast is not live", status: state.status },
				{ status: 409 }
			);
		}

		let grant:
			| ReturnType<typeof createLivePlaybackGrant>
			| {
					manifestUrl: string;
					expiresInSeconds: number;
					expiresAt: string;
					cookies: Record<string, string>;
					devFallback: true;
			  };
		try {
			grant = createLivePlaybackGrant(state.playbackPath);
		} catch (signingError) {
			if (!canUseLocalFallback(request.nextUrl.hostname)) {
				throw signingError;
			}
			const fallbackExpiresInSeconds = 300;
			grant = {
				manifestUrl: localPlaybackUrlFor(state.playbackPath),
				expiresInSeconds: fallbackExpiresInSeconds,
				expiresAt: new Date(Date.now() + fallbackExpiresInSeconds * 1000).toISOString(),
				cookies: {},
				devFallback: true,
			};
		}
		const response = NextResponse.json({
			broadcastId: id,
			status: state.status,
			manifestUrl: grant.manifestUrl,
			expiresInSeconds: grant.expiresInSeconds,
			expiresAt: grant.expiresAt,
			streamType: "hls-live",
			devFallback: "devFallback" in grant ? true : false,
		});
		if (!("devFallback" in grant)) {
			const cookieDomain = getCookieDomainForHost(request.nextUrl.hostname);
			for (const [name, value] of Object.entries(grant.cookies)) {
				response.cookies.set({
					name,
					value,
					httpOnly: true,
					secure: true,
					sameSite: "none",
					path: "/",
					domain: cookieDomain,
					maxAge: grant.expiresInSeconds,
				});
			}
		}
		return response;
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to generate live playback grant",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
