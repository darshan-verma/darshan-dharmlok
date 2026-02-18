import { getLiveRedis } from "@/lib/live/redis";

type SignalRole = "host" | "viewer";

export type WebRtcOffer = {
	viewerId: string;
	sdp: string;
	type: RTCSdpType;
	createdAt: string;
};

function offersKey(broadcastId: string): string {
	return `live:webrtc:offers:${broadcastId}`;
}

function answerKey(broadcastId: string, viewerId: string): string {
	return `live:webrtc:answer:${broadcastId}:${viewerId}`;
}

function candidatesKey(
	broadcastId: string,
	viewerId: string,
	receiverRole: SignalRole
): string {
	return `live:webrtc:candidates:${receiverRole}:${broadcastId}:${viewerId}`;
}

export async function enqueueOffer(broadcastId: string, offer: WebRtcOffer) {
	const redis = getLiveRedis();
	await redis.rpush(offersKey(broadcastId), JSON.stringify(offer));
	await redis.expire(offersKey(broadcastId), 120);
}

export async function dequeueOffers(broadcastId: string): Promise<WebRtcOffer[]> {
	const redis = getLiveRedis();
	const key = offersKey(broadcastId);
	const rows = await redis.lrange(key, 0, -1);
	if (rows.length) {
		await redis.del(key);
	}
	return rows
		.map((row) => {
			try {
				return JSON.parse(row) as WebRtcOffer;
			} catch {
				return null;
			}
		})
		.filter((item): item is WebRtcOffer => Boolean(item));
}

export async function setAnswer(
	broadcastId: string,
	viewerId: string,
	answer: { sdp: string; type: RTCSdpType }
) {
	const redis = getLiveRedis();
	await redis.set(
		answerKey(broadcastId, viewerId),
		JSON.stringify({ ...answer, createdAt: new Date().toISOString() }),
		"EX",
		120
	);
}

export async function getAnswer(
	broadcastId: string,
	viewerId: string
): Promise<{ sdp: string; type: RTCSdpType } | null> {
	const redis = getLiveRedis();
	const key = answerKey(broadcastId, viewerId);
	const raw = await redis.get(key);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as { sdp: string; type: RTCSdpType };
	} catch {
		return null;
	}
}

export async function pushCandidate(input: {
	broadcastId: string;
	viewerId: string;
	fromRole: SignalRole;
	candidate: RTCIceCandidateInit;
}) {
	const redis = getLiveRedis();
	const receiverRole: SignalRole = input.fromRole === "host" ? "viewer" : "host";
	const key = candidatesKey(input.broadcastId, input.viewerId, receiverRole);
	await redis.rpush(
		key,
		JSON.stringify({
			candidate: input.candidate,
			createdAt: new Date().toISOString(),
		})
	);
	await redis.expire(key, 120);
}

export async function pullCandidates(input: {
	broadcastId: string;
	viewerId: string;
	receiverRole: SignalRole;
}): Promise<RTCIceCandidateInit[]> {
	const redis = getLiveRedis();
	const key = candidatesKey(input.broadcastId, input.viewerId, input.receiverRole);
	const rows = await redis.lrange(key, 0, -1);
	if (rows.length) {
		await redis.del(key);
	}
	return rows
		.map((row) => {
			try {
				const parsed = JSON.parse(row) as { candidate?: RTCIceCandidateInit };
				return parsed.candidate || null;
			} catch {
				return null;
			}
		})
		.filter((item): item is RTCIceCandidateInit => Boolean(item));
}
