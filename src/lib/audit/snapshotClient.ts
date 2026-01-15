/**
 * Client-side helper for capturing booking snapshots
 */

import { captureSnapshot, type BookingSnapshot } from "./captureSnapshot";

/**
 * Send snapshot to API (non-blocking, fire-and-forget)
 */
export async function sendSnapshot(snapshot: BookingSnapshot): Promise<void> {
	try {
		await fetch("/api/audit/snapshot", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(snapshot),
		}).catch(() => {
			// Silently fail - don't block user flow
		});
	} catch (error) {
		// Silently fail - don't block user flow
		console.warn("Snapshot capture failed (non-blocking):", error);
	}
}

/**
 * Capture and send a snapshot (convenience function)
 */
export async function captureAndSendSnapshot(
	data: BookingSnapshot["data"],
	meta: Omit<BookingSnapshot, "data" | "timestamp" | "timezone">
): Promise<void> {
	const snapshot = captureSnapshot(data, meta);
	await sendSnapshot(snapshot);
}
