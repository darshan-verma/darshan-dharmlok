import { randomUUID } from "crypto";
import type { FlightResult } from "@/types/tbo";

const TTL_MS = 10 * 60 * 1000;
const MAX_SESSIONS = 400;

export type FlightSearchSessionPayload = {
	flights: FlightResult[];
	traceId: string;
	journeyType: string;
};

type EntryReady = FlightSearchSessionPayload & {
	createdAt: number;
	status: "ready";
};

type EntryPending = {
	createdAt: number;
	status: "pending";
	traceId: string;
	journeyType: string;
	flights: null;
};

type Entry = EntryReady | EntryPending;

const sessions = new Map<string, Entry>();

function prune(): void {
	const now = Date.now();
	for (const [id, e] of sessions) {
		if (now - e.createdAt > TTL_MS) sessions.delete(id);
	}
	while (sessions.size > MAX_SESSIONS) {
		let oldestId: string | null = null;
		let oldest = Infinity;
		for (const [id, e] of sessions) {
			if (e.createdAt < oldest) {
				oldest = e.createdAt;
				oldestId = id;
			}
		}
		if (oldestId) sessions.delete(oldestId);
		else break;
	}
}

export function createFlightSearchSession(
	payload: FlightSearchSessionPayload,
): string {
	prune();
	const id = randomUUID();
	sessions.set(id, { ...payload, status: "ready", createdAt: Date.now() });
	return id;
}

/** Session reserved while a background merge runs; GET /more returns pending until finalized. */
export function createPendingFlightSearchSession(meta: {
	traceId: string;
	journeyType: string;
}): string {
	prune();
	const id = randomUUID();
	sessions.set(id, {
		...meta,
		flights: null,
		status: "pending",
		createdAt: Date.now(),
	});
	return id;
}

export function finalizeFlightSearchSession(
	sessionId: string,
	payload: FlightSearchSessionPayload,
): boolean {
	prune();
	const e = sessions.get(sessionId);
	if (!e) return false;
	sessions.set(sessionId, {
		...payload,
		status: "ready",
		createdAt: e.createdAt,
	});
	return true;
}

export function getFlightSearchMergeStatus(sessionId: string): {
	ready: boolean;
	total?: number;
	traceId?: string;
	journeyType?: string;
} | null {
	prune();
	const entry = sessions.get(sessionId);
	if (!entry || Date.now() - entry.createdAt > TTL_MS) {
		if (entry) sessions.delete(sessionId);
		return null;
	}
	if (entry.status === "pending") {
		return {
			ready: false,
			traceId: entry.traceId,
			journeyType: entry.journeyType,
		};
	}
	return {
		ready: true,
		total: entry.flights.length,
		traceId: entry.traceId,
		journeyType: entry.journeyType,
	};
}

export function getFlightSearchSessionSlice(
	sessionId: string,
	offset: number,
	limit: number,
): { flights: FlightResult[]; total: number; traceId: string } | null {
	prune();
	const entry = sessions.get(sessionId);
	if (!entry || Date.now() - entry.createdAt > TTL_MS) {
		if (entry) sessions.delete(sessionId);
		return null;
	}
	if (entry.status !== "ready" || !entry.flights) {
		return null;
	}
	const safeOffset = Math.max(0, offset);
	const safeLimit = Math.max(0, limit);
	const flights = entry.flights.slice(safeOffset, safeOffset + safeLimit);
	return {
		flights,
		total: entry.flights.length,
		traceId: entry.traceId,
	};
}

export function isFlightSearchSessionPending(sessionId: string): boolean {
	prune();
	const entry = sessions.get(sessionId);
	if (!entry || Date.now() - entry.createdAt > TTL_MS) return false;
	return entry.status === "pending";
}
