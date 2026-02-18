import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { pullCandidates, pushCandidate } from "@/lib/live/webrtcSignaling";

type Role = "host" | "viewer";

function asRole(value: string | null): Role | null {
	if (value === "host" || value === "viewer") return value;
	return null;
}

async function assertHostAccess(request: NextRequest, broadcastId: string) {
	const token = await getToken({ req: request });
	if (!token?.id) return { ok: false as const, status: 401, error: "Unauthorized" };
	const session = await prisma.liveSession.findUnique({
		where: { id: broadcastId },
		select: { instructorId: true },
	});
	if (!session) return { ok: false as const, status: 404, error: "Broadcast not found" };
	if (session.instructorId !== token.id) {
		return { ok: false as const, status: 403, error: "Forbidden" };
	}
	return { ok: true as const };
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			broadcastId?: string;
			viewerId?: string;
			fromRole?: Role;
			candidate?: RTCIceCandidateInit;
		};
		if (!body.broadcastId || !body.viewerId || !body.fromRole || !body.candidate) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		if (body.fromRole === "host") {
			const access = await assertHostAccess(request, body.broadcastId);
			if (!access.ok) {
				return NextResponse.json({ error: access.error }, { status: access.status });
			}
		}

		await pushCandidate({
			broadcastId: body.broadcastId,
			viewerId: body.viewerId,
			fromRole: body.fromRole,
			candidate: body.candidate,
		});
		return NextResponse.json({ ok: true });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to push candidate",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const broadcastId = request.nextUrl.searchParams.get("broadcastId");
		const viewerId = request.nextUrl.searchParams.get("viewerId");
		const receiverRole = asRole(request.nextUrl.searchParams.get("receiverRole"));
		if (!broadcastId || !viewerId || !receiverRole) {
			return NextResponse.json(
				{ error: "broadcastId, viewerId and receiverRole are required" },
				{ status: 400 }
			);
		}

		if (receiverRole === "host") {
			const access = await assertHostAccess(request, broadcastId);
			if (!access.ok) {
				return NextResponse.json({ error: access.error }, { status: access.status });
			}
		}

		const candidates = await pullCandidates({
			broadcastId,
			viewerId,
			receiverRole,
		});
		return NextResponse.json({ candidates });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to pull candidates",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
