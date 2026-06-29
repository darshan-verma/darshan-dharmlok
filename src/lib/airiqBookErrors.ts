/** Client-safe AIRiQ book error classifiers (no server/API imports). */

export function isRebookBookError(bookError: string): boolean {
	return String(bookError || "").trim().toUpperCase() === "REBOOK";
}

export function isRetryableSeatBookError(bookError: string): boolean {
	const msg = String(bookError || "").toLowerCase();
	return (
		msg.includes("seat") &&
		(msg.includes("not available") ||
			msg.includes("unavailable") ||
			msg.includes("already been taken") ||
			msg.includes("invalid seat"))
	);
}
