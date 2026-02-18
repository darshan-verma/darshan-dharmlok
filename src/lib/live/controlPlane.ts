import prisma from "@/lib/prisma";
import { getLiveIngestBaseUrl } from "@/lib/live/config";
import { getLiveRedis } from "@/lib/live/redis";
import {
	generateStreamKey,
	getLiveManifestPath,
	hashStreamKey,
} from "@/lib/live/security";

type LiveStatus = "created" | "live" | "ended";
type LiveNotificationType = "created" | "live";

type LiveState = {
	broadcastId: string;
	instructorId: string;
	streamKeyHash: string;
	playbackPath: string;
	status: LiveStatus;
};

export type LiveNotification = {
	id: string;
	type: LiveNotificationType;
	broadcastId: string;
	title: string;
	message: string;
	createdAt: string;
};

function broadcastRedisKey(broadcastId: string): string {
	return `live:broadcast:${broadcastId}`;
}

function streamKeyRedisKey(streamKeyHash: string): string {
	return `live:stream-key:${streamKeyHash}`;
}

function liveNotificationsRedisKey(): string {
	return "live:notifications";
}

async function getInstructorName(instructorId: string): Promise<string> {
	const user = await prisma.user.findUnique({
		where: { id: instructorId },
		select: { name: true },
	});
	return user?.name?.trim() || "A creator";
}

async function publishLiveNotification(input: {
	type: LiveNotificationType;
	broadcastId: string;
	title: string;
	message: string;
}) {
	const redis = getLiveRedis();
	const notification: LiveNotification = {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
		type: input.type,
		broadcastId: input.broadcastId,
		title: input.title,
		message: input.message,
		createdAt: new Date().toISOString(),
	};
	await redis.lpush(liveNotificationsRedisKey(), JSON.stringify(notification));
	await redis.ltrim(liveNotificationsRedisKey(), 0, 99);
}

export async function createLiveBroadcast(input: {
	title: string;
	description?: string;
	instructorId: string;
}) {
	// Validate env config before writing DB records.
	const ingestBaseUrl = getLiveIngestBaseUrl();

	const streamKey = generateStreamKey();
	const streamKeyHash = hashStreamKey(streamKey);

	const session = await prisma.liveSession.create({
		data: {
			title: input.title,
			description: input.description,
			instructorId: input.instructorId,
			startTime: new Date(),
			durationMin: 0,
			status: "upcoming",
		},
		select: {
			id: true,
			title: true,
			description: true,
			status: true,
			startTime: true,
			instructorId: true,
		},
	});

	const playbackPath = getLiveManifestPath(session.id);
	const redis = getLiveRedis();
	const state: LiveState = {
		broadcastId: session.id,
		instructorId: input.instructorId,
		streamKeyHash,
		playbackPath,
		status: "created",
	};

	await redis.hset(broadcastRedisKey(session.id), {
		broadcastId: state.broadcastId,
		instructorId: state.instructorId,
		streamKeyHash: state.streamKeyHash,
		playbackPath: state.playbackPath,
		status: state.status,
	});
	await redis.set(streamKeyRedisKey(streamKeyHash), session.id);

	const instructorName = await getInstructorName(input.instructorId);
	await publishLiveNotification({
		type: "created",
		broadcastId: session.id,
		title: session.title,
		message: `${instructorName} scheduled a live stream: ${session.title}`,
	});

	return {
		broadcastId: session.id,
		title: session.title,
		description: session.description,
		startTime: session.startTime,
		status: "created",
		ingestUrl: `${ingestBaseUrl}/live`,
		streamKey,
		playbackPath,
	};
}

export async function getLiveState(broadcastId: string) {
	const redis = getLiveRedis();
	const raw = await redis.hgetall(broadcastRedisKey(broadcastId));
	if (!raw || !raw.broadcastId) {
		return null;
	}
	return {
		broadcastId: raw.broadcastId,
		instructorId: raw.instructorId,
		streamKeyHash: raw.streamKeyHash,
		playbackPath: raw.playbackPath,
		status: (raw.status as LiveStatus) || "created",
	};
}

export async function setLiveStatus(broadcastId: string, status: LiveStatus) {
	const previousState = await getLiveState(broadcastId);
	const redis = getLiveRedis();
	await redis.hset(broadcastRedisKey(broadcastId), { status });
	await prisma.liveSession.update({
		where: { id: broadcastId },
		data: {
			status:
				status === "live"
					? "live"
					: status === "ended"
						? "completed"
						: "upcoming",
		},
	});

	if (status === "live" && previousState?.status !== "live") {
		const session = await prisma.liveSession.findUnique({
			where: { id: broadcastId },
			select: { title: true, instructorId: true },
		});
		if (session) {
			const instructorName = await getInstructorName(session.instructorId);
			await publishLiveNotification({
				type: "live",
				broadcastId,
				title: session.title,
				message: `${instructorName} is now live: ${session.title}`,
			});
		}
	}
}

export async function resolveBroadcastByStreamKey(streamKey: string) {
	const streamKeyHash = hashStreamKey(streamKey);
	const redis = getLiveRedis();
	const broadcastId = await redis.get(streamKeyRedisKey(streamKeyHash));
	if (!broadcastId) {
		return null;
	}
	const state = await getLiveState(broadcastId);
	if (!state) {
		return null;
	}
	return state;
}

export async function getRecentLiveNotifications(limit = 20): Promise<LiveNotification[]> {
	const redis = getLiveRedis();
	const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, limit)) : 20;
	const rows = await redis.lrange(liveNotificationsRedisKey(), 0, safeLimit - 1);
	return rows
		.map((row) => {
			try {
				return JSON.parse(row) as LiveNotification;
			} catch {
				return null;
			}
		})
		.filter((item): item is LiveNotification => Boolean(item));
}
