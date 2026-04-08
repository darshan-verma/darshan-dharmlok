"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_THRESHOLD_MS = 3 * 60 * 1000; // warn at 3 minutes remaining

/**
 * Tracks a TripJack search session countdown.
 * Sessions last ~15 minutes (searchId is non-renewable).
 *
 * Returns:
 *   - remainingMs: ms left in the session (0 when expired)
 *   - isExpired: true when time is up
 *   - isWarning: true when < 3 minutes remaining
 *   - formattedTime: "MM:SS" display string
 *   - startSession: call when a new search/detail fetch completes
 *   - clearSession: call to reset (e.g. on new search)
 */
export function useSearchSession() {
	const [startedAt, setStartedAt] = useState<number | null>(null);
	const [remainingMs, setRemainingMs] = useState(SESSION_DURATION_MS);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const startSession = useCallback(() => {
		setStartedAt(Date.now());
		setRemainingMs(SESSION_DURATION_MS);
	}, []);

	const clearSession = useCallback(() => {
		setStartedAt(null);
		setRemainingMs(SESSION_DURATION_MS);
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!startedAt) return;

		const tick = () => {
			const elapsed = Date.now() - startedAt;
			const left = Math.max(0, SESSION_DURATION_MS - elapsed);
			setRemainingMs(left);
			if (left === 0 && intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};

		tick();
		intervalRef.current = setInterval(tick, 1000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [startedAt]);

	const isExpired = startedAt !== null && remainingMs === 0;
	const isWarning =
		startedAt !== null &&
		remainingMs > 0 &&
		remainingMs <= WARNING_THRESHOLD_MS;

	const totalSecs = Math.ceil(remainingMs / 1000);
	const minutes = Math.floor(totalSecs / 60);
	const seconds = totalSecs % 60;
	const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

	return {
		remainingMs,
		isExpired,
		isWarning,
		formattedTime,
		startSession,
		clearSession,
		isActive: startedAt !== null,
	};
}
