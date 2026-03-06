import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/chat/rooms
 * List chat rooms for the current user (direct and group).
 * Returns last message for each room.
 */
export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}
	try {
		const rooms = await prisma.chatRoom.findMany({
			where: {
				participantIds: { has: session.user.id },
			},
			orderBy: { updatedAt: "desc" },
			include: {
				messages: {
					orderBy: { createdAt: "desc" },
					take: 1,
					include: { sender: { select: { id: true, name: true, image: true, profileImageUrl: true } } },
				},
			},
		});

		// Resolve participants for each room (id, name, image, profileImageUrl)
		const allParticipantIds = [...new Set(rooms.flatMap((r) => r.participantIds))];
		const participantsMap = new Map<string, { id: string; name: string | null; image: string | null; profileImageUrl: string | null }>();
		if (allParticipantIds.length > 0) {
			const users = await prisma.user.findMany({
				where: { id: { in: allParticipantIds } },
				select: { id: true, name: true, image: true, profileImageUrl: true },
			});
			users.forEach((u) => participantsMap.set(u.id, { id: u.id, name: u.name, image: u.image, profileImageUrl: u.profileImageUrl }));
		}

		const withLastMessage = rooms.map((room) => {
			const participants = room.participantIds
				.map((pid) => participantsMap.get(pid))
				.filter(Boolean) as { id: string; name: string | null; image: string | null; profileImageUrl: string | null }[];
			return {
				...room,
				lastMessage: room.messages[0] ?? null,
				messages: undefined,
				participants,
			};
		});
		return NextResponse.json({ rooms: withLastMessage });
	} catch (error) {
		console.error("Error fetching chat rooms:", error);
		return NextResponse.json(
			{ message: "Failed to fetch rooms" },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/chat/rooms
 * Body: { type: "direct" | "group", participantIds: string[], name?: string }
 * - direct: participantIds = [otherUserId]; finds or creates room with sorted [current, other]
 * - group: participantIds = [...], name optional
 */
export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}
	try {
		const body = await req.json();
		const { type, participantIds, name } = body;
		if (!type || !participantIds || !Array.isArray(participantIds)) {
			return NextResponse.json(
				{ message: "Missing type or participantIds" },
				{ status: 400 }
			);
		}
		const currentId = session.user.id;
		const ids = type === "direct"
			? [currentId, participantIds[0]].filter(Boolean).sort()
			: [currentId, ...participantIds.filter((id: string) => id !== currentId)];

		if (type === "direct") {
			if (ids.length !== 2) {
				return NextResponse.json(
					{ message: "Direct room requires one other participant" },
					{ status: 400 }
				);
			}
			const existingRooms = await prisma.chatRoom.findMany({
				where: {
					type: "direct",
					participantIds: { hasEvery: ids },
				},
			});
			const existing = existingRooms.find(
				(r) => r.participantIds.length === 2 && r.participantIds.every((id) => ids.includes(id))
			);
			if (existing) {
				return NextResponse.json({ room: existing });
			}
			const room = await prisma.chatRoom.create({
				data: { type: "direct", participantIds: ids },
			});
			return NextResponse.json({ room });
		}

		// group
		const room = await prisma.chatRoom.create({
			data: {
				type: "group",
				name: name || null,
				createdById: session.user.id,
				adminIds: [session.user.id],
				participantIds: ids,
			},
		});
		return NextResponse.json({ room });
	} catch (error) {
		console.error("Error creating chat room:", error);
		return NextResponse.json(
			{ message: "Failed to create room" },
			{ status: 500 }
		);
	}
}
