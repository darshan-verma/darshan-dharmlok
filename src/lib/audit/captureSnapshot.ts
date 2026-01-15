/**
 * DOM Snapshot Audit System
 * Captures structured page state at critical user actions for legal audit trail
 */

export interface BookingSnapshot {
	timestamp: number;
	timezone: string;
	page:
		| "flight_results"
		| "flight_review"
		| "payment"
		| "hotel_results"
		| "hotel_review";
	user: {
		id?: string;
		ip?: string;
		userAgent?: string;
	};
	booking: {
		type: "flight" | "hotel";
		searchId?: string;
		traceId?: string;
		resultIndex?: string;
		bookingId?: string; // Set after booking confirmation
	};
	data: Record<string, unknown>;
}

/**
 * Capture a snapshot of the current booking state
 */
export function captureSnapshot(
	input: BookingSnapshot["data"],
	meta: Omit<BookingSnapshot, "data" | "timestamp" | "timezone">
): BookingSnapshot {
	return {
		...meta,
		timestamp: Date.now(),
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		data: input,
	};
}

/**
 * Strip sensitive data from snapshot before storage
 * Removes: card numbers, CVV, UPI, email, phone
 * Keeps: booking data, flight/hotel info, prices, dates
 */
export function stripSensitiveData(
	data: Record<string, unknown>
): Record<string, unknown> {
	const sensitivePatterns = [
		/card/i,
		/cvv/i,
		/cvc/i,
		/upi/i,
		/email/i,
		/phone/i,
		/mobile/i,
		/password/i,
		/ssn/i,
		/aadhaar/i,
		/pan/i,
	];

	const stripRecursive = (obj: unknown): unknown => {
		if (obj === null || obj === undefined) {
			return obj;
		}

		if (Array.isArray(obj)) {
			return obj.map(stripRecursive);
		}

		if (typeof obj === "object" && obj !== null) {
			const cleaned: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(obj)) {
				// Check if key matches sensitive patterns
				const isSensitive = sensitivePatterns.some((pattern) =>
					pattern.test(key)
				);

				if (isSensitive) {
					// Replace with masked value
					if (typeof value === "string" && value.length > 0) {
						cleaned[key] = "***REDACTED***";
					} else {
						cleaned[key] = value;
					}
				} else {
					// Recursively clean nested objects
					cleaned[key] = stripRecursive(value);
				}
			}
			return cleaned;
		}

		return obj;
	};

	return stripRecursive(data) as Record<string, unknown>;
}
