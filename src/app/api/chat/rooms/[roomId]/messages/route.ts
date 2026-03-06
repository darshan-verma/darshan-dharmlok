import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

function isParticipant(room: { participantIds: string[] }, userId: string) {
	return room.participantIds.includes(userId);
}

/**
 * GET /api/chat/rooms/[roomId]/messages
 * Paginated messages. Query: cursor?, limit?
 */
export async function GET(
	req: NextRequest,
	context: { params: Promise<{ roomId: string }> }
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}
	const { roomId } = await context.params;
	const { searchParams } = new URL(req.url);
	const cursor = searchParams.get("cursor");
	const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

	try {
		const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
		if (!room) {
			return NextResponse.json({ message: "Room not found" }, { status: 404 });
		}
		if (!isParticipant(room, session.user.id)) {
			return NextResponse.json({ message: "Forbidden" }, { status: 403 });
		}
		const messages = await prisma.chatMessage.findMany({
			where: { chatRoomId: roomId },
			orderBy: { createdAt: "desc" },
			take: limit + 1,
			...(cursor && { cursor: { id: cursor }, skip: 1 }),
			include: {
				sender: {
					select: { id: true, name: true, image: true, profileImageUrl: true },
				},
			},
		});
		const hasMore = messages.length > limit;
		const list = hasMore ? messages.slice(0, limit) : messages;
		const nextCursor = hasMore ? list[list.length - 1].id : null;
		return NextResponse.json({
			messages: list.reverse(),
			nextCursor,
			hasMore,
		});
	} catch (error) {
		console.error("Error fetching messages:", error);
		return NextResponse.json(
			{ message: "Failed to fetch messages" },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/chat/rooms/[roomId]/messages
 * Body: { text, attachmentUrl?, attachmentType? }
 * Creates message and returns it. Socket broadcast will be done by socket server when we add it.
 */
export async function POST(
	req: NextRequest,
	context: { params: Promise<{ roomId: string }> }
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}
	const { roomId } = await context.params;
	try {
		const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
		if (!room) {
			return NextResponse.json({ message: "Room not found" }, { status: 404 });
		}
		if (!isParticipant(room, session.user.id)) {
			return NextResponse.json({ message: "Forbidden" }, { status: 403 });
		}
		const body = await req.json();
		const { text, attachmentUrl, attachmentType } = body;
		if (!text || typeof text !== "string") {
			return NextResponse.json(
				{ message: "Missing or invalid text" },
				{ status: 400 }
			);
		}
		const message = await prisma.chatMessage.create({
			data: {
				chatRoomId: roomId,
				senderId: session.user.id,
				text,
				...(attachmentUrl && { attachmentUrl, attachmentType: attachmentType || null }),
			},
			include: {
				sender: {
					select: { id: true, name: true, image: true, profileImageUrl: true },
				},
			},
		});
		// Update room updatedAt for list ordering
		await prisma.chatRoom.update({
			where: { id: roomId },
			data: { updatedAt: new Date() },
		});
		// Notify socket server to broadcast to chat room (fire-and-forget)
		const socketUrl = process.env.SOCKET_SERVER_URL;
		const emitSecret = process.env.SOCKET_EMIT_SECRET;
		if (socketUrl && emitSecret) {
			fetch(`${socketUrl.replace(/\/$/, "")}/emit`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${emitSecret}`,
				},
				body: JSON.stringify({ roomId, message }),
			}).catch((err) => console.error("[chat] socket emit failed:", err));
		}
		return NextResponse.json({ message });
	} catch (error) {
		console.error("Error creating message:", error);
		return NextResponse.json(
			{ message: "Failed to send message" },
			{ status: 500 }
		);
	}
}
