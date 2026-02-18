import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { getMediasoupLiveManager } from "@/lib/live/mediasoupManager";

export const runtime = "nodejs";

type ParamsContext = { params: Promise<{ id: string }> };

async function ensureBroadcast(id: string) {
	const session = await prisma.liveSession.findUnique({
		where: { id },
		select: { id: true, instructorId: true, status: true },
	});
	return session;
}

async function ensureHostAccess(request: NextRequest, broadcastId: string) {
	const token = await getToken({ req: request });
	if (!token?.id) {
		return { ok: false as const, status: 401, error: "Unauthorized" };
	}
	const session = await ensureBroadcast(broadcastId);
	if (!session) {
		return { ok: false as const, status: 404, error: "Broadcast not found" };
	}
	if (session.instructorId !== token.id) {
		return { ok: false as const, status: 403, error: "Forbidden" };
	}
	return { ok: true as const, session };
}

export async function GET(_request: NextRequest, context: ParamsContext) {
	try {
		const { id } = await context.params;
		const session = await ensureBroadcast(id);
		if (!session) {
			return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
		}
		const manager = getMediasoupLiveManager();
		if (_request.nextUrl.searchParams.get("stats") === "1") {
			return NextResponse.json({
				broadcastId: id,
				status: session.status,
				viewerCount: manager.getViewerCount(id),
			});
		}
		if (session.status !== "live") {
			return NextResponse.json({ error: "Broadcast is not live" }, { status: 409 });
		}
		const rtpCapabilities = await manager.getRouterRtpCapabilities(id);
		return NextResponse.json({ broadcastId: id, rtpCapabilities });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to get mediasoup capabilities",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest, context: ParamsContext) {
	try {
		const { id } = await context.params;
		const body = (await request.json()) as {
			action?: string;
			viewerId?: string;
			dtlsParameters?: unknown;
			rtpParameters?: unknown;
			rtpCapabilities?: unknown;
			kind?: "audio" | "video";
		};
		const manager = getMediasoupLiveManager();

		if (body.action === "createHostTransport") {
			const access = await ensureHostAccess(request, id);
			if (!access.ok) {
				return NextResponse.json({ error: access.error }, { status: access.status });
			}
			const transport = await manager.createHostTransport(id);
			return NextResponse.json({ transport });
		}

		if (body.action === "connectHostTransport") {
			const access = await ensureHostAccess(request, id);
			if (!access.ok) {
				return NextResponse.json({ error: access.error }, { status: access.status });
			}
			await manager.connectHostTransport({
				broadcastId: id,
				dtlsParameters: body.dtlsParameters as never,
			});
			return NextResponse.json({ ok: true });
		}

		if (body.action === "produceHost") {
			const access = await ensureHostAccess(request, id);
			if (!access.ok) {
				return NextResponse.json({ error: access.error }, { status: access.status });
			}
			if (!body.kind || !body.rtpParameters) {
				return NextResponse.json({ error: "kind and rtpParameters are required" }, { status: 400 });
			}
			const producer = await manager.createHostProducer({
				broadcastId: id,
				kind: body.kind,
				rtpParameters: body.rtpParameters as never,
			});
			return NextResponse.json({ producer });
		}

		if (body.action === "createViewerTransport") {
			const session = await ensureBroadcast(id);
			if (!session) {
				return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
			}
			if (!body.viewerId) {
				return NextResponse.json({ error: "viewerId is required" }, { status: 400 });
			}
			const transport = await manager.createViewerTransport({
				broadcastId: id,
				viewerId: body.viewerId,
			});
			return NextResponse.json({ transport });
		}

		if (body.action === "connectViewerTransport") {
			if (!body.viewerId || !body.dtlsParameters) {
				return NextResponse.json(
					{ error: "viewerId and dtlsParameters are required" },
					{ status: 400 }
				);
			}
			await manager.connectViewerTransport({
				broadcastId: id,
				viewerId: body.viewerId,
				dtlsParameters: body.dtlsParameters as never,
			});
			return NextResponse.json({ ok: true });
		}

		if (body.action === "consumeViewer") {
			if (!body.viewerId || !body.rtpCapabilities || !body.kind) {
				return NextResponse.json(
					{ error: "viewerId, rtpCapabilities and kind are required" },
					{ status: 400 }
				);
			}
			const consumer = await manager.createViewerConsumer({
				broadcastId: id,
				viewerId: body.viewerId,
				rtpCapabilities: body.rtpCapabilities as never,
				kind: body.kind,
			});
			return NextResponse.json({ consumer });
		}

		return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed mediasoup action",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
