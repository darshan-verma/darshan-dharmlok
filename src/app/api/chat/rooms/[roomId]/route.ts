import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/**
 * PATCH /api/chat/rooms/[roomId]
 * Body: { name?: string; imageUrl?: string }
 * Only group admins can update.
 */
export async function PATCH(
	req: NextRequest,
	context: { params: Promise<{ roomId: string }> }
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { roomId } = await context.params;
	let body: { name?: unknown; imageUrl?: unknown } = {};
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
	}

	const name = typeof body.name === "string" ? body.name.trim() : undefined;
	const imageUrl =
		typeof body.imageUrl === "string" ? body.imageUrl.trim() : undefined;

	if (name === undefined && imageUrl === undefined) {
		return NextResponse.json(
			{ message: "Nothing to update" },
			{ status: 400 }
		);
	}
	if (name !== undefined && (name.length < 1 || name.length > 60)) {
		return NextResponse.json(
			{ message: "Group name must be 1–60 characters" },
			{ status: 400 }
		);
	}

	const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
	if (!room) {
		return NextResponse.json({ message: "Room not found" }, { status: 404 });
	}
	if (room.type !== "group") {
		return NextResponse.json(
			{ message: "Only group rooms can be updated" },
			{ status: 400 }
		);
	}

	const adminIds = room.adminIds ?? [];
	const isAdmin =
		adminIds.includes(session.user.id) || room.createdById === session.user.id;
	if (!isAdmin) {
		return NextResponse.json({ message: "Forbidden" }, { status: 403 });
	}

	const updated = await prisma.chatRoom.update({
		where: { id: roomId },
		data: {
			...(name !== undefined && { name }),
			...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
		},
	});

	return NextResponse.json({ room: updated });
}

