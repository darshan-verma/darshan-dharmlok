import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { setLiveStatus } from "@/lib/live/controlPlane";

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const token = await getToken({ req: request });
		if (!token?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { id } = await context.params;
		const session = await prisma.liveSession.findUnique({
			where: { id },
			select: { id: true, instructorId: true },
		});
		if (!session) {
			return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
		}
		if (session.instructorId !== token.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		await setLiveStatus(id, "live");
		return NextResponse.json({ ok: true, status: "live" });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to go live",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
